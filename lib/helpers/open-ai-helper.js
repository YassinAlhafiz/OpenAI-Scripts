const { Configuration, OpenAIApi } = require("openai");
const {encode, decode} = require('gpt-3-encoder')

class OpenAiHelper{

    // For outputs
    static get tokenUsageMax(){ return 4090; } 
    static get tokenMax(){ return 50; } 
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

    static getTokenCount(prompt){
        return encode(prompt).length;
    }

    static getCostPerTokens(tokens, chat = false){
        const cost = chat ? 0.002 : 0.02; // Model cost
        return ((tokens / 1000.0) * cost).toFixed(6);;
    }

    static validatePrompt(prompt, chat = false){
        return chat ? this.validateChatPrompt(prompt) : this.validateCompletionPrompt(prompt);
    }

    static validateCompletionPrompt(prompt){
        return typeof prompt === 'string' && prompt.length > 0;
    }

    static validateChatPrompt(messages){
        return Array.isArray(messages) && messages.length > 0;
    }

    static printCompletionInput(input, chat = false){
        // Print input
        console.log('----------');
        console.log('Input: ');
        console.log('----------');

        if(chat){
            // Print input
            input.forEach(message => {
                console.log(`[${message.role}]: ${message.content}`);
            });
        }
        else{
            console.log(input);
        }
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

        
        let completion;
        try{
            // Validate the prompt
            if(!OpenAiHelper.validateCompletionPrompt(prompt)){
                throw 'Invalid text prompt';
            }

            // Check for max tokens
            const tokenCount = OpenAiHelper.getTokenCount(prompt);
            if(tokenCount + maxTokens > OpenAiHelper.tokenUsageMax){
                throw `Max tokens exceeded: ${tokenCount} Prompt + ${maxTokens} Completion > ${OpenAiHelper.tokenUsageMax}`;
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

            // Set the output
            completion = request.data;

        }catch(e){
            return {
                error: true,
                message: e,
            };
        }
        
        return {
            error: false,
            message: 'Success',
            data: completion
        };
    }

    // Runs a chat completion
    async createChatCompletion(messages, temp = OpenAiHelper.defaultTemperature, maxTokens = OpenAiHelper.tokenMax){

        let completion;
        try{

            // Validate the prompt
            if(!OpenAiHelper.validateChatPrompt(messages)){
                throw 'Invalid chat prompt';
            }

            // Check for max tokens
            const tokenCount = OpenAiHelper.getTokenCount(JSON.stringify(messages));
            if(tokenCount + maxTokens > OpenAiHelper.tokenUsageMax){
                throw `Max tokens exceeded: ${tokenCount} Prompt + ${maxTokens} Completion > ${OpenAiHelper.tokenUsageMax}`;
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

            // Set the output
            completion = request.data;

        }catch(e){
            return {
                error: true,
                message: e,
            };
        }
        
        return {
            error: false,
            message: 'Success',
            data: completion
        };
    }
}

module.exports = OpenAiHelper;