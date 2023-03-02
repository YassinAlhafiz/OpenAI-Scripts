const { Configuration, OpenAIApi } = require("openai");
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
require('dotenv').config()
const arguments = yargs(hideBin(process.argv)).argv._

// Constants
const rSystem = 'system';
const rUser = 'system';
const rChat = 'assistant';
const tokenMax = 1000; // gpt-3.5-turbo: 5 Requests = $0.01 = 1cent

// Open api config
const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_API,
});
const openai = new OpenAIApi(configuration);

// Creates a message object
function createMessage(role, message) {
    return {
        role,
        content: message
    }
}

// Sends a complition based on the prompt
async function createChatCompletion(prompt) {

    const systemMessages = [
        createMessage(rSystem, 'You are a helpful assistant.')
    ];

    const context = [
        createMessage(rUser, 'Who won the world series in 2020?'),
        createMessage(rChat, 'The Los Angeles Dodgers won the World Series in 2020.'),
    ];

    const finalPrompt = [
        createMessage(rUser, 'Where was it played?'),
    ];

    // Create the open ai completion params
    const params = {
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        max_tokens: tokenMax,
        messages: [
            ...systemMessages, // Configure the chat

            ...context, // Provide context

            ...finalPrompt // The prompt
        ]
    };

    console.log('Sending request with input: ');
    console.log(JSON.stringify(params));

    const request = await openai.createChatCompletion(params);

    console.log('Request Completed: ');
    // console.log(request.data);

    const completion = request.data;

    // check for errors
    if (completion.usage) {
        console.log('----------');
        console.log('Prompt Tokens: ' + (completion.usage.prompt_tokens ?? 0));
        console.log('Completion Tokens: ' + (completion.usage.completion_tokens ?? 0));
        console.log('Total Tokens: ' + (completion.usage.total_tokens ?? 0));
    }

    if (completion.choices) {
        if (completion.choices.length > 0) {
            // Print output
            completion.choices.forEach(choice => {
                console.log('----------');
                console.log('Output: ');
                console.log(choice.message);
                console.log(`[Stop Reason: ${choice.finish_reason}]`);
            });
            console.log('----------');
        }
        else {
            console.log('----------');
            console.log('[No Output]')
        }
    }
}

const prompt = arguments[0];

// Run completion
createChatCompletion(prompt);
