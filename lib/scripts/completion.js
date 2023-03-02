
// Import modules
const OpenAiHelper = require('../helpers/open-ai-helper.js');
const { TextCompletionPrompts, ChatCompletionPrompts } = require('../helpers/prompt-helper.js');

// Configure dot env
require('dotenv').config()

// Extract the argurments
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const inputArgurments = yargs(hideBin(process.argv)).argv;;

// Static variables
const defaultMode = 'chat';

// Extract input variables
const mode = inputArgurments.mode ?? defaultMode; // Uses default mode if not specified
const tokens = inputArgurments.t ; // Uses default tokens if not specified
const tokenOverride = inputArgurments.T; // If set maintains the token override
const input = inputArgurments._.join(' ');

console.log(`Mode: [${mode}]`);
console.log(`Prompt: "${input}"`);
if(tokenOverride || tokens){ 
    console.log('Tokens: ' + (tokenOverride ?? tokens));
}

// Configure OpenAi Helper
const openAiHelper = new OpenAiHelper();

async function complete(p, mode){

    let prompt = p;
    let chat = false;
    let temp = OpenAiHelper.defaultTemperature;
    let maxTokens = tokens ?? OpenAiHelper.tokenMax; // Subject to be overriden if --T flag is not passed in

    // Set params based on mode
    switch(mode){
        // Text Prompts
        case 'text':
            break;
        case 'testText':
            maxTokens = 10;
            prompt = TextCompletionPrompts.testPrompt();
            break;

        // Chat Prompts
        case 'chat':
            chat = true;
            prompt = ChatCompletionPrompts.defaultPrompt(prompt);
            break;
        case 'testChat':
            chat = true;
            maxTokens = 30;
            prompt = ChatCompletionPrompts.testPrompt();
            break;
        default:
            console.log('Invalid mode');
            return;
    }

    // Manages token override
    console.log('----------');
    console.log(`Token Max: [${tokenOverride ?? maxTokens}]`);
    if(tokenOverride){
        maxTokens = tokenOverride;
        console.log('Override Tokens: [True]');
    }

    if(chat){
        // Run chat completion
        await openAiHelper.createChatCompletion(prompt, temp, maxTokens);
    }
    else{
        // TODO: Run text completion
        await openAiHelper.createTextCompletion(prompt, temp, maxTokens);
    }
}

// Run the completion
complete(input, mode);