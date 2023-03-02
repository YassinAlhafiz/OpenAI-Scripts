
// Import modules
const OpenAiHelper = require('./helpers/open-ai-helper.js');
const { TextCompletionPrompts, ChatCompletionPrompts } = require('./helpers/prompt-helper.js');

// Configure dot env
require('dotenv').config()

// Extract the argurments
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const inputArgurments = yargs(hideBin(process.argv)).argv;;

// Static variables
const defaultMode = 'text';

// Extract input variables
const mode = inputArgurments.mode ?? defaultMode; // Uses default mode if not specified
const input = inputArgurments._.join(' ');

console.log('Mode: ' + mode);
console.log('Prompt: ' + input);

// Configure OpenAi Helper
const openAiHelper = new OpenAiHelper();

async function complete(p, mode){

    let prompt = p;
    let chat = false;
    let temp = OpenAiHelper.defaultTemperature;
    let maxTokens = OpenAiHelper.tokenMax;

    // Set params based on mode
    switch(mode){
        // Text Prompts
        case 'text':
            break;
        case 'testText':
            prompt = TextCompletionPrompts.testPrompt();
            break;

        // Chat Prompts
        case 'chat':
            chat = true;
            prompt = ChatCompletionPrompts.defaultPrompt(prompt);
            break;
        case 'testChat':
            chat = true;
            prompt = ChatCompletionPrompts.testPrompt();
            break;
        default:
            console.log('Invalid mode');
            return;
    }

    if(chat){
        // Run chat completion
        await openAiHelper.createChatCompletion(prompt, temp, maxTokens);
    }
    else{
        // TODO: Run text completion
        console.log('TODO');
    }
}

// Run the completion
complete(input, mode);