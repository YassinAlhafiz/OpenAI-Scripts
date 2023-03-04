// Dependencies
const OpenAiHelper = require('../helpers/open-ai-helper.js');
const { ChatCompletionPrompts } = require('../helpers/prompt-helper.js');
const { configureEnvironment } = require('../helpers/function-helper.js');

// Configure
const fs = require('fs');
const promptUser = require("prompt-sync")({ sigint: true });
var readline = require('readline');
const args = configureEnvironment();
const openAiHelper = new OpenAiHelper();

// Constant
const maxUsageThreshhold = 0.85;
const historyMax = 100;
const maxTokens = 500;
const temperature = 0.8;
const exitPrompt = '..';

// Parameters
const multiline = args.m ?? false;

// State
let totalUsage = 0;
let history = [];
let context = [];
let tokenTracker = [];
let lastMessageUsage = 0;

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
    lastMessageUsage = completion.usage.total_tokens;
    
    // Track new items
    context.push(ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rUser, prompt));
    context.push(ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rChat, response));
    tokenTracker.push(lastMessageUsage);
    totalUsage += lastMessageUsage;

    // Untack old items
    if(context.length > historyMax || lastMessageUsage > (OpenAiHelper.tokenUsageMax * maxUsageThreshhold)){
        history.push(context.shift());
        history.push(context.shift());
        const track = tokenTracker.shift();
        lastMessageUsage -= track; // Remove the oldest usage from the total
    }

    return response;
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

async function getUserInput(input, multi = false){

    if(!multi){
        // Use the prompt-sync library
        return promptUser(input);
    }
    else{
        // Run a multiline prompt
        if(input.length > 0){
            console.log(input);
        }
    
        return new Promise((resolve, reject) => {

            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.prompt();
    
            const input = [];
            rl.on('line', function (cmd) {

                if(cmd !== exitPrompt || input.length === 0){
                    input.push(cmd);
                }
    
                // If the special character is used then exit the prompt
                if(cmd === exitPrompt){
                    rl.close();
                }
            });
            
            rl.on('close', function (cmd) {
                
                const output = input.join('\n');
                resolve(output);
            });
        });
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

        console.log(`Type "${exitPrompt}" to exit the chat.`);

        // If multiline is enabled then tell the user 
        if(multiline){
            console.log(`Multiline is enabled. Type "${exitPrompt}" on a new line to submit your message.`);
        }

        let prompt = '';
        while(loop(prompt)){

            let chatResponse = '';
            let completion;

            // Get the prompt from the User
            console.log('------');
            console.log(`USER [${lastMessageUsage}]->`)
            console.log('------');
            prompt = await getUserInput('', multiline);
            console.log('');

            // Check if the prompt can be run
            if(canRunPrompt(prompt)){
                
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
                chatResponse = addToContext(prompt, completion);

                // Print output
                console.log('------');
                console.log(`CHAT <-[${completion.usage.completion_tokens}]`);
                console.log('------');
                await displayBufferedResponse(chatResponse);
            }
            else{
                console.log('~');
                console.log('');
            }
            
            // Print Usage
            if(completion){
                console.log('');
                console.log(`<[+${lastMessageUsage}] Tokens Used: ${totalUsage} ~ \$${OpenAiHelper.getCostPerTokens(totalUsage)}>`);
            }
        }

        // Ask the user if they want to save the history
        const save = await getUserInput('Type "s" to Save History: ');
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