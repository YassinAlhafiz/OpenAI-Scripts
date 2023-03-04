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
const inputFileName = args.i;

// State
let totalUsage = 0;
let history = [];
let context = [];
let tokenTracker = [];
let lastMessageUsage = 0;
let contextUsage = 0;

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
    const promptMessage = ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rUser, prompt);
    const completionMessage = ChatCompletionPrompts.createMessage(ChatCompletionPrompts.rChat, response);
    context.push(promptMessage);
    context.push(completionMessage);
    totalUsage += lastMessageUsage;
    
    // Get the usage for the last message
    const currentMessageUsage = OpenAiHelper.getTokenCount(JSON.stringify([promptMessage, completionMessage]));
    tokenTracker.push(currentMessageUsage);
    contextUsage += currentMessageUsage;

    // Untack old items
    while((context.length > historyMax && context.length !== 0) || contextUsage > (OpenAiHelper.tokenUsageMax * maxUsageThreshhold) ){
        history.push(context.shift());
        history.push(context.shift());
        const track = tokenTracker.shift();
        contextUsage -= track;
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

async function loadPreviousChat(fileName){

    console.log('Loading History...');
    
    // Check if the file ends with .json, if not then add it
    if(!fileName.endsWith('.json')){
        fileName += '.json';
    }

    // Check if the file exists
    if(!fs.existsSync(fileName)){
        throw 'File does not exist: ' + fileName;
    }

    // Read the file
    const fileRead = fs.readFileSync(fileName, 'utf8');
    const file = JSON.parse(fileRead);

    // Validate the file format
    if(!file.messages){
        throw 'Invalid file format. No messages found.';
    }
    else if(file.messages.length % 2 !== 0){
        throw 'Invalid file format. Messages are not paired.';
    }

    // Extract the messages
    const previousMessages = file.messages;

    // Itterate over the messages, 2 at a time and add them to the context
    for(let i = 0; i < file.messages.length; i += 2){
        const userMessage = file.messages[i];
        const chatMessage = file.messages[i + 1];
        
        // Get the token usage for the message
        const configTokenCount = 15;
        const tokenCount = OpenAiHelper.getTokenCount(JSON.stringify([
            ...context,
            userMessage, 
            chatMessage
        ]));

        // Create a fake completion object
        const completion = {
            usage: {
                total_tokens: tokenCount + configTokenCount,
            },
            choices: [
                {
                    message: {
                        content: chatMessage.content,
                    }
                }
            ]
        };
        
        // Print the user message
        console.log('------');
        console.log(`USER [~${contextUsage}]->`);
        console.log('------');
        console.log(userMessage.content);
        console.log('');

        
        // Add the messages to the context
        addToContext(userMessage.content, completion);

        // Print the chat message
        console.log('------');
        console.log(`CHAT`);
        console.log('------');
        console.log(chatMessage.content);
        console.log('');
    }
    
    console.log('~');
    console.log('');
    console.log(`[${previousMessages.length}] messages loaded.`);
    console.log(`[${history.length}] messages in history.`);
    console.log(`[${context.length}] messages in context.`);
    console.log('');
}

async function runChat(){

    try {

        // Check if an input file was provided
        if(inputFileName){
            await loadPreviousChat(inputFileName);
        }

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
            console.log(`[${history.length}] messages in history.`);
            console.log(`[${context.length}] messages in context.`);
            console.log('------');
            console.log(`USER [${contextUsage}]->`)
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

    } catch (e) {

        // Print error
        console.log('');
        console.error(`Error: [${e}]`);
        console.log('');
    }

    
    // Ask the user if they want to save the history
    const save = await getUserInput('Type "s" to Save History: ');
    if(save === 's'){
        saveHistory();
    }

    // Print exit
    console.log('');
    console.error(`Goodbye!`);
}

runChat();