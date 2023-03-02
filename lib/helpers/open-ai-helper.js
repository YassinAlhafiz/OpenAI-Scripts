const { Configuration, OpenAIApi } = require("openai");

class OpenAiHelper{

    // For outputs
    // completion: gpt-3 (davinci): 5 Requests = $0.1 = 10cents -> 50 Requests/$ 
    // chat: gpt-3.5-turbo: 5 Requests = $0.01 = 1cent -> 500 Requests/$
    static get tokenMax(){ return 200; } 
    static get defaultTemperature(){ return 0.8; } 

    // Models
    static get gpt3Model(){ return 'davinci'; }
    static get chatModel(){ return 'gpt-3.5-turbo'; }

    // main open ai api
    openai;

    constructor(){

        // Configure the model
        const configuration = new Configuration({
            apiKey: process.env.OPEN_AI_API,
        });

        this.openai = new OpenAIApi(configuration);
    }

    static getCostPerTokens(tokens, chat = false){
        const cost = chat ? 0.002 : 0.02; // Model cost
        return ((tokens / 1000.0) * cost).toFixed(6);;
    }

    static validateCompletionPrompt(prompt){
        const valid = typeof prompt === 'string' && prompt.length > 0;

        // Print input
        console.log('----------');
        console.log('Input: ');
        console.log('----------');

        if(valid){
            // Print input
            console.log(prompt);
        }
        else{
            console.log('Invalid chat prompt');
        }

        return valid;
    }

    static validateChatPrompt(messages){
        const valid = Array.isArray(messages) && messages.length > 0;

        // Print input
        console.log('----------');
        console.log('Input: ');
        console.log('----------');

        if(valid){
            // Print input
            messages.forEach(message => {
                console.log(`[${message.role}]: ${message.content}`);
            });
        }
        else{
            console.log('Invalid chat prompt');
        }

        return valid;
    }

    static printCompletionOutput(completion, chat = false){
        // check for errors
        // TODO
        
        // Print choices
        if (completion.choices) {
            if (completion.choices.length > 0) {
                // Print output
                completion.choices.forEach(choice => {
                    console.log('----------');
                    console.log('Output: ');
                    console.log('----------');

                    if(chat){
                        console.log({output: `[${choice.message.role}]: ${choice.message.content}`});
                    }
                    else{
                        console.log({output: choice.text});
                    }

                    console.log(`[Stop Reason: ${choice.finish_reason}]`);
                    console.log('----------');
                });
            }
            else {
                console.log('----------');
                console.log('[No Output]');
                console.log('----------');
            }
        }

        // Print usage
        if (completion.usage) {

            const totalCost = OpenAiHelper.getCostPerTokens(completion.usage.total_tokens ?? 0, chat)

            console.log('Usage: ');
            console.log('----------');
            console.log(`Prompt Tokens: [${(completion.usage.prompt_tokens ?? 0)}]`);
            console.log(`Completion Tokens: [${(completion.usage.completion_tokens ?? 0)}]`);
            console.log(`Total Tokens: [${(completion.usage.total_tokens ?? 0)}]`);
            console.log(`Total Cost: [\$${totalCost}] ~ [${(totalCost * 100).toFixed(4)} cents]`);
            console.log('----------');
        }
    }

    // Runs a text completion
    async createTextCompletion(prompt, temp = OpenAiHelper.defaultTemperature, maxTokens = OpenAiHelper.tokenMax){

        // Validate the prompt
        if(!OpenAiHelper.validateCompletionPrompt(prompt)){
            return;
        }

        // Create the open ai completion params
        // TODO: Account for all params
        const params = {
            model: OpenAiHelper.gpt3Model,
            temperature: temp,
            max_tokens: maxTokens, // For output
            prompt: prompt
        };

        // Send the request
        const request = await this.openai.createCompletion(params);

        // Print the output
        OpenAiHelper.printCompletionOutput(request.data);
    }

    // Runs a chat completion
    async createChatCompletion(messages, temp = OpenAiHelper.defaultTemperature, maxTokens = OpenAiHelper.tokenMax){

        // Validate the prompt
        if(!OpenAiHelper.validateChatPrompt(messages)){
            return;
        }

        // Create the open ai completion params
        const params = {
            model: OpenAiHelper.chatModel,
            temperature: temp,
            max_tokens: maxTokens, // For output
            messages: messages
        };

        // Send the request
        const request = await this.openai.createChatCompletion(params);

        // Print the output
        OpenAiHelper.printCompletionOutput(request.data, true);
    }
}

module.exports = OpenAiHelper;