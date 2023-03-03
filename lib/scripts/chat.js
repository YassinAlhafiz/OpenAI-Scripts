// Dependencies
const OpenAiHelper = require('../helpers/open-ai-helper.js');
const { ChatCompletionPrompts } = require('../helpers/prompt-helper.js');
const { configureEnvironment } = require('../helpers/function-helper.js');

// Configure
const fs = require('fs');
const promptUser = require("prompt-sync")({ sigint: true });
const args = configureEnvironment();
const openAiHelper = new OpenAiHelper();

// Constant
const maxUsageThreshhold = 0.85;
const historyMax = 100;
const maxTokens = 500;
const temperature = 0.8;
const historyLocation = '../../output/chat/';
const exitPrompt = '..';

// State
let totalUsage = 0;
let history = [];
let context = [];
let tokenTracker = [];
let tokenTrackerCount = 0;

function configMessages(){
    return [
        // ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rSystem, 'Try to be brief with your responses.'),
    ]
}

function canRunPrompt(prompt){
    return prompt.length > 0 && prompt !== exitPrompt;
}

function loop(prompt){
    return prompt !== exitPrompt;
}

function addToContext(prompt, completion){

    // Extract values
    const response = completion.choices[0].message.content;
    const messageUsage = completion.usage.total_tokens;
    
    // Track new items
    context.push(ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rUser, prompt));
    context.push(ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rChat, response));
    tokenTracker.push(messageUsage);
    tokenTrackerCount += messageUsage;
    totalUsage += messageUsage;

    // Untack old items
    if(context.length > historyMax || tokenTrackerCount > (OpenAiHelper.tokenUsageMax * maxUsageThreshhold)){
        history.push(context.shift());
        history.push(context.shift());
        const track = tokenTracker.shift();
        tokenTrackerCount -= track;
    }

    return [response, messageUsage];
}

function saveHistory(){
    const readable = promptUser('Readable Format? (y/n): ');

    const finalMessages = [...configMessages(), ...history, ...context];
    let fileName = promptUser('File Name (Leave Blank to Default): ');
    if(!fileName || fileName.length === 0){
        fileName = `chat-log-${new Date().toISOString().split('.')[0]}`; // Default the file name
    }
    fileName = fileName.replaceAll(' ', '-'); // Replace spaces with dashes
    fileName = fileName.replaceAll(':', '-'); // Replace colons with dashes

    if(readable !== 'n'){
        console.log('Writing to TXT...');
        const output = finalMessages.map(m => `[${m.role}]: ${m.content}`).join('\r\n\r\n');
        fs.writeFileSync(fileName + '.txt', output, 'utf8');
        console.log('');
        console.log('Saved to: [' + fileName + '.txt]');
        console.log('');
    }
    else{
        console.log('Writing to JSON...');
        const output = {
            messages: finalMessages,
        }
        fs.writeFileSync(fileName + '.json', JSON.stringify(output), 'utf8');
        console.log('');
        console.log('Saved to: [' + fileName + '.json]');
        console.log('');
    }
}

async function displayBufferedResponse(reponse){
    const bufferTimeout = 25;

    const resArray = reponse.split(' ');
    for(let i = 0; i < resArray.length; i++){
        const word = resArray[i];
        process.stdout.write(word + ' ');
        await new Promise(resolve => setTimeout(resolve, bufferTimeout));
    }
    console.log('');
}

async function runChat(){

    try {
        let prompt = '';
        while(loop(prompt)){

            let chatResponse = '';
            let messageUsage = 0;
            let completion;

            // Get the prompt from the User
            console.log('------');
            console.log('USER')
            console.log('------');
            prompt = promptUser('');
            console.log('');

            // Check if the prompt can be run
            if(canRunPrompt(prompt)){
                
                console.log('------');
                console.log(`CHAT (^ ${tokenTrackerCount})`)
                console.log('------');
                
                // Run the prompt
                const input = ChatCompletionPrompts.defaultPrompt(prompt, context, configMessages());
                const response = await openAiHelper.createChatCompletion(input, temperature, maxTokens);
                
                // Validate output
                if(response.error){
                    throw response.message;
                }
                else if(!response.data || response.data.choices.length === 0){
                    throw 'No response generated';
                }
                
                // Handle output
                completion = response.data;
                [chatResponse, messageUsage] = addToContext(prompt, completion);

                // Print output
                await displayBufferedResponse(chatResponse);
            }
            else{
                console.log('~');
                console.log('');
            }
            
            // Print Usage
            if(completion){
                console.log('');
                console.log(`<[+${messageUsage}] Tokens Used: ${totalUsage} ~ \$${OpenAiHelper.getCostPerTokens(totalUsage)}>`);
            }
        }

        // Ask the user if they want to save the history
        const save = promptUser('Type "s" to Save History: ');
        if(save === 's'){
            saveHistory();
        }

        // Print exit
        console.log('');
        console.error(`Goodbye!`);

    } catch (e) {

        // Print error
        console.log('');
        console.error(`Error: [${e}]`);
    }
}

runChat();