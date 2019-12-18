//Lambda
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const randomIntroArray =[
      '. Veo que acabas de hacer popó, empezamos con el pie derecho. ',
      '. Parece que acabas de hacer popó, eso me gusta. ',
    ];
    const randomIntroIndex = Math.floor(Math.random() * randomIntroArray.length);
    const randomIntro = randomIntroArray[randomIntroIndex];
    return handlerInput.responseBuilder
      .speak('Bienvenido al despacho del '+ SKILL_NAME  + randomIntro + DISCLAMER + ' Una vez dicho esto, hablemos de tu popó. ¿De que color hiciste?')
      .withSimpleCard(SKILL_NAME)
      .addDirective({
              type: 'Alexa.Presentation.APL.RenderDocument',
              version: '1.0',
              document: require('./main.json'),
              datasources: {
                "bodyTemplate7Data": {
                  "title":  SKILL_NAME,
                  "backgroundImage": {
                    "sources":[
                      {
                      "url":"https://cdna.artstation.com/p/assets/images/images/011/324/158/large/emilia-pakkila-background-bossroom-at.jpg?1528989057"
                      }
                    ]
                  }
                }
              }
            })
      .reprompt('Vamos, no seas tímido. ¿De qué color fué tu popó?')
      .getResponse();
  },
};

//------------------------------------------------------------------------------
//---------------------------    Color Handler   --------------------------------
//------------------------------------------------------------------------------


const PoopColorHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
        && request.intent.name === 'PoopColorIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    var poopColor = request.intent.slots.Color.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    var colorID = request.intent.slots.Color.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('poopColor: '+ poopColor +'\n');
    console.log('colorID: '+ colorID +'\n');

    const database = {
      'poopColorCatalog': [
        { 'color':'El color blanco está de moda, pero no para tu popó, eso significaría que el ducto de la bilis podría estar bloqueado y eso no está chido. ' },//Blanco
        { 'color':'Si no estas consumiendo regaliz, sumplementos de hierro o medicamentos puede que estes sangrando en la parte superior del intestino. Yo que tu me checo.' },//Negro
        { 'color':'Espero que estés comiendo cosas rojas, porque si no. Pueden ser hemorroides o que te esté sangrando la parte baja del intestino. ' },//Rojo
        { 'color':'Estas comiendo muchas grasas, o no las estas absorbiendo correctamente, eso o que tengas hipersensibilidad al gluten. ' },//Amarillo
        { 'color':'Ámo el café. su aroma y  su sabor... a y si haces popó color café todo esta bien, excelente diría yo. Ese es su color normal. ' },//Café
        { 'color':'¿Qué tan verde es verde?. Muy verde o un poco verde. ' },//Verde
        { 'color':'Todo está bien, con que sea un poco verde, como el color de tus ojos, no hay problema. ' },//Un poco verde
        { 'color':'Estaban baratas las espinacas... ¿verdad? porque o comiste mucho verde, o la comida está pasando muy rápido por tu intestino. ' },//Muy verde
      ]
    };

    const textureQuestion = '¿parecía una salchicha, eran pedacitos o agüada?';

    var speechOutput = '';
    if (colorID == 5) {
      speechOutput = database.poopColorCatalog[colorID].color;
    }
    else {
      speechOutput = database.poopColorCatalog[colorID].color + 'Ahora cuentame de su textura, '+ textureQuestion;
    }

    console.log('speechOutput: '+ speechOutput +'\n');

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(SKILL_NAME, speechOutput)
      .reprompt('Y... ¿cómo lucía la popó?, ' + textureQuestion)
      .getResponse();
  },
};

//------------------------------------------------------------------------------
//------------------------    Textura Handler   --------------------------------
//------------------------------------------------------------------------------


const PoopTextureHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
        && request.intent.name === 'PoopTextureIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    var poopTexture = request.intent.slots.Texture.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    console.log('poopTexture: '+ poopTexture +'\n');
    var speechOutput = '';
    switch (poopTexture) {
      case 'salchicha':
          speechOutput = 'Me encantan las salchichas, en especial las del estadio de los Charros. Volviendo a tu popó con forma de salchicha, era ¿grumosa, agrietada, o lisa y suave?';
        break;
      case 'grumoso':
          speechOutput = 'Alguien está constipado y no soy yo, no deberia de pasarte seguido, pero no estas tan mal.';
        break;
      case 'agrietado':
          speechOutput = '¡wow! acabas de hacer el gold standar de las popós, ¡felicidades!.';
        break;
      case 'liso':
          speechOutput = 'Los médicos consideran esto una popó normal que debería de pasar cada tres dias.';
        break;
      case 'pedacitos':
          speechOutput = '¿Cómo nueces, o mas bien cómo bolitas?';
        break;
      case 'nueces':
          speechOutput = 'mis poderosas habilidades de detective me dicen que estas constipado. ¿qué pasó mijo?. ';
        break;
      case 'bolitas':
          speechOutput = '¿qué onda? no te gusta la fibra o qué, deberias de agregar mas verduras y cereales a tu dieta.';
        break;
      case 'suave':
          speechOutput = 'Parece que tienes lo que los expertos llaman: Correle que te alcanzo. Tienes o estas por tener diarrea. o consigues un corcho, o vas tu médico, tu decides.';
          break;
    }
    console.log('speechOutput: '+ speechOutput +'\n');

    const randomOutroArray =[
      'Nos vemos la próxima vez que le pegues un regañadón al baño',
      'Hasta luego!',
      'Recuerda que el escusado es una ventana a nuestra salud. Hasta la próxima!',
      'La próxima vez que vayas al baño en vez de ver tu celular, dale una checada a tu popó y me cuentas que tal.'
    ];
    const randomOutroIndex = Math.floor(Math.random() * randomOutroArray.length);
    const randomOutro = randomOutroArray[randomOutroIndex];

    if (poopTexture == 'pedacitos') {
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .withSimpleCard(SKILL_NAME, speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    } else if (poopTexture == 'salchicha') {
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .withSimpleCard(SKILL_NAME, speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(speechOutput + '... váya, parece que mi trabajo aqui está tan hecho como tu popó. '+randomOutro)
        .withSimpleCard(SKILL_NAME, speechOutput)
        .getResponse();
    }
  },
};

//------------------------------------------------------------------------------
//---------------------------    Help Handler   --------------------------------
//------------------------------------------------------------------------------

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

//------------------------------------------------------------------------------
//---------------------------    Exit Handler   --------------------------------
//------------------------------------------------------------------------------

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .withShouldEndSession(true)
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

//------------------------------------------------------------------------------
//------------------------    Session end Handler   ----------------------------
//------------------------------------------------------------------------------


const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Se ha terminado la sesión por las siguientes causas: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

//------------------------------------------------------------------------------
//--------------------------    Error Handler   --------------------------------
//------------------------------------------------------------------------------

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('<say-as interpret-as="interjection">épale ocurrió un error</say-as>')
      .reprompt('Te estoy diciendo que ocurrió un error. Avísale a mi desarrollador, porfa.')
      .getResponse();
  },
};


const SKILL_NAME = 'Detective popó';
const GET_FACT_MESSAGE = '';
const HELP_MESSAGE = 'Una popó puede ser tan variada como quien la hace, pero hay varios indicadores generales que hablan de la salud de tu obra artística, yo te preguntaré varias cosas y trataré de interpretar qué es lo que te está diciendo tu popó';
const HELP_REPROMPT = 'No seas tímido, puedes comenzar diciendome ¿de qué color fué tu popó? ';
const STOP_MESSAGE = 'Adios!, me hablas cuando vuelvas a hacer un picasso';
const DISCLAMER = 'Recuerda que esta skill es solo una guía, en realidad no soy detective y mucho menos un médico. Si tienes problemas de salud ve con un médico de verdad.';
const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    PoopColorHandler,
    PoopTextureHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
.lambda();
