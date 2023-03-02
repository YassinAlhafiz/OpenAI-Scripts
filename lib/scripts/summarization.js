
// Import modules
const OpenAiHelper = require('../helpers/open-ai-helper.js');
const CheerioHelper = require('../helpers/cheerio-helper.js');
const HttpService = require('../services/http-service.js');
const { extractParam, configureEnvironment } = require('../helpers/function-helper.js');
const { ChatCompletionPrompts } = require('../helpers/prompt-helper.js');

// Constants
const trimPercentile = 0.9;
const summaryMaxTokens = 1000;
const summaryCompletionTokens = 300;

// Configure dot env and yargs
const args = configureEnvironment();

// Extract input variables
const dry = extractParam(args, 'd') ?? false;
const input = args._.join(' ');

// Configure OpenAi Helper and HttpService
const openAiHelper = new OpenAiHelper();
const http = new HttpService();

// Determine if the prompt is text or a web url
function isWebUrl(s){
    try { 
        return Boolean(new URL(s)); 
    }
    catch(e){}
    return false; 
}

// Resolve the url and return the text within the body
async function resolveUrl(url){

    try{

        const response = await http.get(url);
        
        // get the body
        const body = JSON.stringify(response);

        if(body.length > 0){
            const cheerio = new CheerioHelper(url, body);
            const output = cheerio.getTextFromBody();

            return output;
        }

    }catch(e){
        console.error(e);
    }

    return null;
}

// Run the summarization completion
async function summarizeText(prompt){

    // Set the params
    let temp = OpenAiHelper.defaultTemperature;
    let maxTokens = summaryCompletionTokens;
    
    // Run the completion
    const summaryInput = ChatCompletionPrompts.summaryPrompt(prompt);
    return await openAiHelper.createChatCompletion(summaryInput, temp, maxTokens);

}

// Run sumization
async function summary(prompt, dry){

    // Print input
    console.log(`Input: [${prompt}]`);

    // Check if the input is a web url
    const isUrl = isWebUrl(prompt);
    if(isUrl){
        console.log('Url Mode: [True]');
        prompt = await resolveUrl(prompt);

        if(!prompt){
            console.log('----------');
            console.error('Error: [Unable to resolve url]');
            console.log('----------');
            return;
        }
    }

    
    // Trim the prompt
    let trimCount = 0;
    let promptTokens = OpenAiHelper.getTokenCount(prompt);
    while(promptTokens > summaryMaxTokens){
        trimCount++;

        // Remove 10% of the prompt
        const trim = Math.floor(prompt.length * trimPercentile);
        prompt = prompt.substring(0, trim);

        // Get the token count
        promptTokens = OpenAiHelper.getTokenCount(prompt);
    }

    console.log('----------');
    console.log('Summarize: ');
    console.log('----------');
    console.log(prompt);
    console.log('----------');
    // Print token usage
    if(trimCount > 0){
        const trimAmount = (Math.pow(trimPercentile, trimCount) * 100).toFixed(2);
        console.log(`Trimmed to [${trimAmount}%] of original prompt`);
    }
    console.log(`Tokens: <${promptTokens}>`);
    
    if(dry){
        return;
    }

    // Run the completion
    const response = await summarizeText(prompt);

    // Validate the output
    if(!response || response.error){
        console.log('----------');
        console.error(`Error: [${response.message}]`);
        console.log('----------');
        return;
    }

    // Print summary
    console.log('----------');
    console.log('Output: ');
    console.log('----------');
    
    if(response.data.choices.length > 0){
        response.data.choices.forEach((choice, index) => {
            console.log(choice.message.content.replaceAll('\n', '\n\n'));
            console.log('----------');
        });
    }
    else{
        console.log('No summary found');
        console.log('----------');
    }

    // Usage
    const tokensUsed = response.data.usage.total_tokens;
    const cost = OpenAiHelper.getCostPerTokens(tokensUsed, true);
    console.log(`Usage: [${tokensUsed} tokens] ~ [\$${cost}] ~ [${(cost * 100).toFixed(4)} cents]`);
}

// Run the completion
summary(input, dry);