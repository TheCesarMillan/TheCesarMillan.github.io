'use strict';

const Alexa = require('alexa-sdk');
const story = 'Escape de la oficina.html';
const TableName = null // story.replace('.html','').replace(/\s/g, "-");
var $twine = null;
const linksRegex = /\[\[([^\|\]]*)\|?([^\]]*)\]\]/g;

module.exports.handler = (event, context, callback) => {
  console.log(`handler: ${JSON.stringify(event.request)}`);

  // read the Twine 2 (Harlowe) story into JSON
  var fs = require('fs');
  var contents = fs.readFileSync(story, 'utf8');
  var m = contents.match(/<tw-storydata [\s\S]*<\/tw-storydata>/g);
  var xml = m[0];
  // because Twine xml has an attribute with no value
  xml = xml.replace('hidden>', 'hidden="true">');
  var parseString = require('xml2js').parseString;
  parseString(xml, function(err, result) {
    $twine = result['tw-storydata']['tw-passagedata'];
  });

  // prepare alexa-sdk
  const alexa = Alexa.handler(event, context);
  // APP_ID is your skill id which can be found in the Amazon developer console
  // where you create the skill. Optionally set as a Lamba environment variable.
  alexa.appId = process.env.APP_ID;
  alexa.dynamoDBTableName = TableName;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var aplImage = "https://www.cmi3d.com/alexa/Escape_de_la_oficina/Imagenes/en_la_oficina.jpg"; //Image default for APL
var aplScale = "best-fill";
var aplTextTop = "Escape de <br> la oficina";
var aplTextBot = "Un juego por: @TheCesarMillan";
var aplFontSizeTop = "13vh";
var aplFontSizeBot = "4vh";
var aplPaddingTopTop = "30vh";
var roomTitle = "roomTitle";

const handlers = {
  'LaunchRequest': function() {
    console.log(`LaunchRequest`);
    if (this.event.session.attributes['room'] !== undefined) {
      var room = currentRoom(this.event);
      var speechOutput = `Hello, you were playing before and got to the room called ${room['$']['name']}. Would you like to resume? `;
      var reprompt = `Say, resume game, or, new game.`;
      speechOutput = speechOutput + reprompt;
      var cardTitle = `Restart`;
      var cardContent = speechOutput;
      var imageObj = undefined;
      console.log(`LaunchRequest: ${JSON.stringify({
        "speak": speechOutput,
        "listen": reprompt,
        "card" : {
          "title": cardTitle,
          "content": cardContent,
          "imageObj": imageObj
        }
      })}`);
      this.response.speak(speechOutput)
        .listen(reprompt)
        .cardRenderer('cardRenderer');
      this.emit(':responseReady');
    } else {
      this.emit('WhereAmI');
    }
  },
  'ResumeGame': function() {
    console.log(`ResumeGame:`);
    this.emit('WhereAmI');
  },
  'RestartGame': function() {
    console.log(`RestartGame:`);
    // clear session attributes
    this.event.session.attributes['room'] = undefined;
    this.event.session.attributes['visited'] = [];
    this.emit('WhereAmI');
  },
  'WhereAmI': function() {
    var speechOutput = "";
    if (this.event.session.attributes['room'] === undefined) {
      // you just started so you are in the first room
      this.event.session.attributes['room'] = $twine[0]['$']['pid'];
      speechOutput = `Bienvenido a ${story.replace('.html','')}. Vamos a comenzar el juego. `;
    }

    var room = currentRoom(this.event);
    console.log(`WhereAmI: in ${JSON.stringify(room)}`);

    // get displayable text
    // e.g "You are here. [[Go South|The Hall]]" -> "You are here. Go South"
    var displayableText = room['_'];
    linksRegex.lastIndex = 0;
    let m;
    while ((m = linksRegex.exec(displayableText)) !== null) {
      displayableText = displayableText.replace(m[0], m[1]);
      linksRegex.lastIndex = 0;
    }
    // strip html
    displayableText = displayableText.replace(/<\/?[^>]+(>|$)/g, "");
    displayableText = displayableText.replace("&amp;", "and");
    speechOutput = speechOutput + displayableText;

    // create reprompt from links: "You can go north or go south"
    var reprompt = "";
    linksRegex.lastIndex = 0;
    while ((m = linksRegex.exec(room['_'])) !== null) {
      if (m.index === linksRegex.lastIndex) {
        linksRegex.lastIndex++;
      }
      if (reprompt === "") {
        if (!m[1].toLowerCase().startsWith('if you')) {
          reprompt = "Puedes ir a";
        }
      } else {
        reprompt = `${reprompt} o`;
      }
      reprompt = `${reprompt} ${m[1]}`;
    }

    var firstSentence = displayableText.split('.')[0];
    var lastSentence = displayableText.replace('\n',' ').split('. ').pop();
    var reducedContent = `${firstSentence}. ${reprompt}.`;

    // say less if you've been here before
    if (this.event.session.attributes['visited'] === undefined) {
      this.event.session.attributes['visited'] = [];
    }
    if (this.event.session.attributes['visited'].includes(room['$']['pid'])) {
      console.log(`WhereAmI: player is revisiting`);
      speechOutput = reducedContent;
    } else {
      this.event.session.attributes['visited'].push(room['$']['pid']);
    }
    var roomTitle = room['$']['name'];
    console.log("roomTitle: " + roomTitle);

    var roomForAPL = this.event.session.attributes['room'];
    var cardTitle = firstSentence;
    var cardContent = (reprompt > '') ? reprompt : lastSentence;
    var imageObj = undefined;

    console.log(`WhereAmI: ${JSON.stringify({
      "speak": speechOutput,
      "listen": reprompt,
      "card" : {
        "title": "Title",
        "content": "CardContent",
        "imageObj": imageObj
      }
    })}`);
    linksRegex.lastIndex = 0;
    if (linksRegex.exec(room['_'])) {
      // room has links leading out, so listen for further user input
      this.response.speak(speechOutput)
        .listen(reprompt)
        .speak(speechOutput);
        if (this.event.context.System.device.supportedInterfaces['Alexa.Presentation.APL'] != undefined) {
            this.response._addDirective(aplDirective(roomForAPL,roomTitle));
        }
    } else {
      console.log(`WhereAmI: at the end of a branch. Game over.`);
      // clear session attributes

      if (roomForAPL == 12) {
        roomForAPL = "win";
      } else {
          roomForAPL = 'end';
      }
      this.event.session.attributes['room'] = undefined;
      this.event.session.attributes['visited'] = [];
      this.response.speak(speechOutput);
      if (this.event.context.System.device.supportedInterfaces['Alexa.Presentation.APL'] != undefined) {
            this.response._addDirective(aplDirective(roomForAPL,roomTitle));
        }
    }
    this.emit(':responseReady');
  },
  'Go': function() {
    console.log(`Go`);
    var slotValues = getSlotValues(this.event.request.intent.slots);
    followLink(this.event, [slotValues['direction']['resolved'], slotValues['direction']['synonym']]);
    this.emit('WhereAmI');
  },

  'AMAZON.HelpIntent': function() {
    var speechOutput = 'Este es un juego de aventura interactivo, el objetivo es escapar de la oficina sin que nadie te cache, para jugar solo escucha la historia y di hacia donde quieres ir. ';
    var reprompt = 'Si te sientes perdido sólo di: ¿Donde estoy.';
    speechOutput = speechOutput + reprompt;
    var cardTitle = 'Help.';
    var cardContent = speechOutput;
    var imageObj = undefined;
    var APL_directive =  ({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.0',
                document: require('./welcome.json'),
                datasources: {}
            });
    console.log(`HelpIntent: ${JSON.stringify({
      "speak": speechOutput,
      "listen": reprompt,
      "card" : {
        "title": "AMAZON.HelpIntent Title",
        "content": "AMAZON.HelpIntent Content",
        "imageObj": imageObj
      },
      "addDirective": APL_directive
    })}`);

    this.response.speak(speechOutput)
      .listen(reprompt);
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function() {
    this.emit('CompletelyExit');
  },
  'AMAZON.StopIntent': function() {
    this.emit('CompletelyExit');
  },
  'CompletelyExit': function() {
    var speechOutput = '¡Hasta luego!';
    if (TableName) {
      speechOutput = `Your progress has been saved. ${speechOutput}`;
    }
    var cardTitle = 'Fin de la sesion.';
    var cardContent = speechOutput;
    var imageObj = undefined;
    console.log(`CompletelyExit: ${JSON.stringify({
      "speak": speechOutput,
      "listen": null,
      "card" : {
        "title": cardTitle,
        "content": cardContent,
        "imageObj": imageObj
      }
    })}`);
    this.response.speak(speechOutput)
      .cardRenderer(cardTitle, cardContent, imageObj);
    this.emit(':responseReady');
  },
  'AMAZON.RepeatIntent': function() {
    console.log(`RepeatIntent`);
    this.emit('WhereAmI');
  },
  'Unhandled': function() {
    // handle any intent in interaction model with no handler code
    console.log(`Unhandled`);
    followLink(this.event, this.event.request.intent.name);
    this.emit('WhereAmI');
  },
  'SessionEndedRequest': function() {
    // "exit", timeout or error. Cannot send back a response
    console.log(`Session ended: ${this.event.request.reason}`);
  },
}; //Const Handlers

function aplDirective(roomForAPL, roomTitle){
     console.log("roomTitle at function: " + roomTitle);

  switch (roomForAPL) {
    case '1':
         aplImage = "https://www.cmi3d.com/alexa/Escape_de_la_oficina/Imagenes/en_la_oficina.jpg";
         aplScale = "fill";
         aplTextTop = "Escape de <br> la oficina";
         aplTextBot = "Un juego por: @TheCesarMillan";
         aplFontSizeTop = "15vh";
         aplFontSizeBot = "5vh";
         aplPaddingTopTop = "27vh";
      break;

      case 'win':
         aplImage = "https://www.cmi3d.com/alexa/Escape_de_la_oficina/Imagenes/win.jpg";
         aplScale = "best-fill";
         aplTextTop = "¡Felicidades!";
         aplTextBot = "has llegado al final del juego, <br> espero que lo hayas disfrutado";
         aplFontSizeTop = "14vh";
         aplFontSizeBot = "6vh";
         aplPaddingTopTop = "40vh";
      break;

    case 'end':
         aplImage = "https://www.cmi3d.com/alexa/Escape_de_la_oficina/Imagenes/fin_del_juego.jpg";
         aplScale = "best-fill";
         aplTextTop = "Fin del juego";
         aplTextBot = "¡Intentalo de nuevo!";
         aplFontSizeTop = "14vh";
         aplFontSizeBot = "6vh";
         aplPaddingTopTop = "40vh";
      break;

    default:
         aplImage = "https://www.cmi3d.com/alexa/Escape_de_la_oficina/Imagenes/"+ roomForAPL +".jpg";
         aplScale = "fill";
         aplTextTop = roomTitle;
         aplTextBot = "Un juego por: @TheCesarMillan";
         aplFontSizeTop = "15vh";
         aplFontSizeBot = "5vh";
         aplPaddingTopTop = "30vh";
  }
  var APL_directive =  ({
         type: 'Alexa.Presentation.APL.RenderDocument',
         version: '1.0',
         document: require('./main.json'),
         datasources: {
           "myDocumentData": {
                "APLimage": aplImage,
                "APLscale": aplScale,
                "APLTextTop": aplTextTop,
                "APLTextBot": aplTextBot,
                "APLFontSizeTop": aplFontSizeTop,
                "APLFontSizeBot": aplFontSizeBot,
                "APLPaddingTopTop": aplPaddingTopTop,
              }
            }
   });
  return APL_directive;
}

function currentRoom(event) {
  var currentRoomData = undefined;
  for (var i = 0; i < $twine.length; i++) {
    if ($twine[i]['$']['pid'] === event.session.attributes['room']) {
      currentRoomData = $twine[i];
      break;
    }
  }
  return currentRoomData;
}

function followLink(event, direction_or_array) {
  var directions = [];
  if (direction_or_array instanceof Array) {
    directions = direction_or_array;
  } else {
    directions = [direction_or_array];
  }
  var room = currentRoom(event);
  var result = undefined;
  directions.every(function(direction, index, _arr) {
    console.log(`followLink: try '${direction}' from ${room['$']['name']}`);
    var directionRegex = new RegExp(`.*${direction}.*`, 'i');
    let links;
    linksRegex.lastIndex = 0;
    while ((links = linksRegex.exec(room['_'])) !== null) {
      if (links.index === linksRegex.lastIndex) {
        linksRegex.lastIndex++;
      }
      result = links[1].match(directionRegex);
      var target = links[2] || links[1];
      console.log(`followLink: check ${links[1]} (${target}) for ${direction} => ${result} `);
      if (result) {
        console.log(`followLink: That would be ${target}`);
        for (var i = 0; i < $twine.length; i++) {
          if ($twine[i]['$']['name'].toLowerCase() === target.toLowerCase()) {
            event.session.attributes['room'] = $twine[i]['$']['pid'];
            break;
          }
        }
        break;
      }
    }
    return !result;
  });
}

//COOKBOOK HELPER FUNCTIONS

function getSlotValues(filledSlots) {
  //given event.request.intent.slots, a slots values object so you have
  //what synonym the person said - .synonym
  //what that resolved to - .resolved
  //and if it's a word that is in your slot values - .isValidated
  let slotValues = {};

  console.log('The filled slots: ' + JSON.stringify(filledSlots));
  Object.keys(filledSlots).forEach(function(item) {
    //console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));
    var name = filledSlots[item].name;
    //console.log("name: "+name);
    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {

      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case "ER_SUCCESS_MATCH":
          slotValues[name] = {
            "synonym": filledSlots[item].value,
            "resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            "isValidated": true
          };
          break;
        case "ER_SUCCESS_NO_MATCH":
          slotValues[name] = {
            "synonym": filledSlots[item].value,
            "resolved": filledSlots[item].value,
            "isValidated": false
          };
          break;
      }
    } else {
      slotValues[name] = {
        "synonym": filledSlots[item].value,
        "resolved": filledSlots[item].value,
        "isValidated": false
      };
    }
  }, this);
  //console.log("slot values: " + JSON.stringify(slotValues));
  return slotValues;
}
