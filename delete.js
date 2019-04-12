/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

const ESLaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'LaunchRequest'
        && request.locale === `es-MX` );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`Bienvenido a skill de trivia de fórmula uno. Puedes decir 'dame un dato o ayuda ¿Que quieres hacer?'`)
      .withSimpleCard(SKILL_NAME, `Bienvenidos`)
      .reprompt(`Di, quiero un dato, para escuchar un dato de la fórmula uno `)
      .getResponse();
  },
};

const ESGetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'IntentRequest'
        && request.intent.name === 'ESGetNewFactHandler'
        && request.locale === `es-MX` );
  },
  handle(handlerInput) {
    const factArr = dataES;
    const factIndex = Math.floor(Math.random() * factArr.length);
    const randomFact = factArr[factIndex];
    const speechOutput = randomFact;


    return handlerInput.responseBuilder
      .speak(`¿Sabías que?:  ${speechOutput}`)
      .withSimpleCard(SKILL_NAME, randomFact)
      .getResponse();
  },
};

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

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Lo siento, ocurrió un error.')
      .reprompt('Lo siento, ocurrió un error 2.')
      .getResponse();
  },
};

const SKILL_NAME = 'Trivia de fórmula uno';
const GET_FACT_MESSAGE = '¿Sabías que?' ;
const HELP_MESSAGE = 'Puedes decir: dame un dato o ayuda, ¿Que quieres hacer?';
const HELP_REPROMPT = '¿Cómo te puedo ayudar?';
const STOP_MESSAGE = 'Hasta luego!';



const dataES = [
  `60,000 llantas son usadas en promedio en una temporada.`,
  `2.6 segundos es el tiempo que tarda un coche de F1 en ir de 0 a 100 km/h. Y en solo 4 segundos pueden ir de 0 a 160 Km/h y regresar a 0.`,
  `Durante una carrera la temperatura en la cabina puede alcanzar los 50° C.`,
]

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    ESLaunchRequestHandler,
    ESGetNewFactHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
