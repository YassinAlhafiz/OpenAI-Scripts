
class TextCompletionPrompts{
    
    // Test Prompt
    static testPrompt(){
        return 'Hello, what is your name?';
    }
}

class ChatCompletionPrompts{

    // Constants
    // Defined roles by openai
    static get rSystem(){ return 'system' }; // Configures the chat
    static get rUser(){ return 'user' }; // Provides prompt context
    static get rChat(){ return 'assistant' }; // Provides output context

    // Creates a message object
    static createMessage(role, message) {
        return {
            role,
            content: message
        }
    }

    static constructPrompt(systemMessages, context, finalPrompt){
        return [
            ...systemMessages, // Configure the chat
            ...context, // Provide context
            ...finalPrompt // The prompt
        ];
    }

    // Default Chat Prompt
    static defaultPrompt(p, context = [], system = []){
        if(p.length <= 0){
            return [];
        }

        const systemMessages = [
            this.createMessage(this.rSystem, 'You are a helpful assistant.'),
            ...system
        ];
    
        const finalPrompt = [
            this.createMessage(this.rUser, p),
        ];

        return this.constructPrompt(systemMessages, context, finalPrompt);
    }

    // Translation Chat Prompt
    static translationPrompt(p, language = 'French'){
        if(p.length <= 0){
            return [];
        }

        const systemMessages = [
            this.createMessage(this.rSystem, 'You are a helpful assistant.'),
            this.createMessage(this.rSystem, `You only respond with ${language} translations of the input prompt.`)
        ];
    
        const context = [];
    
        const finalPrompt = [
            this.createMessage(this.rUser, p),
        ];

        return this.constructPrompt(systemMessages, context, finalPrompt);
    }

    // Text Summary Chat Prompt
    static summaryPrompt(p){
        if(p.length <= 0){
            return [];
        }

        const systemMessages = [
            this.createMessage(this.rSystem, 'You only output a summary of the input prompt.'),
            this.createMessage(this.rSystem, `Your output should be in a bullet point format.`),
            this.createMessage(this.rSystem, `The list must be 10 points long.`),
        ];
    
        const context = [];
    
        const finalPrompt = [
            this.createMessage(this.rUser, p),
        ];

        return this.constructPrompt(systemMessages, context, finalPrompt);
    }

    // Test Prompt
    static testPrompt(){
        const systemMessages = [
            this.createMessage(this.rSystem, 'You are a helpful assistant.')
        ];
    
        const context = [
            this.createMessage(this.rUser, 'Who won the world series in 2020?'),
            this.createMessage(this.rChat, 'The Los Angeles Dodgers won the World Series in 2020.'),
        ];
    
        const finalPrompt = [
            this.createMessage(this.rUser, 'Where was it played?'),
        ];

        return this.constructPrompt(systemMessages, context, finalPrompt);
    }
}

module.exports = { TextCompletionPrompts, ChatCompletionPrompts };