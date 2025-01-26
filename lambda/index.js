const Alexa = require('ask-sdk-core');
const request = require('sync-request');
const { DEEPSEEK_API_KEY } = require('./config');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Cognitive Answers. Ask me anything by saying hello.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'Please ask your question.';
        const catchAllValue = handlerInput.requestEnvelope.request.intent.slots.catchAll.value;
        
        if (catchAllValue) {
            try {
                const response = request('POST', 'https://api.deepseek.com/v1/chat/completions', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    },
                    body: JSON.stringify({  
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant that provides accurate and concise answers."},
                            {"role": "user", "content": catchAllValue}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 500
                    })
                });

                if (response.statusCode === 200) {
                    const responseBody = JSON.parse(response.getBody('utf8'));
                    speakOutput = responseBody.choices[0].message.content;
                } else {
                    speakOutput = 'Sorry, I encountered an error processing your request.';
                }
            } catch (error) {
                console.error('Error:', error);
                speakOutput = "I'm having trouble connecting to the service. Please try again.";
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Would you like to ask something else? Just say hello.')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can ask me any question! Try saying hello followed by your question.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I didn\'t catch that. Please try asking again.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Error:', error);
        return handlerInput.responseBuilder
            .speak('Sorry, I encountered an error. Please try again.')
            .reprompt('Please try asking again.')
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('cognitive-answers/v1.0')
    .lambda();