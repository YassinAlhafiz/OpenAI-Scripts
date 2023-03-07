const FlowStep = require('./flow-step');

class CompletionFlowStep extends FlowStep {

    static get trim_tokenOverflowPolicy() { return 'trim' };
    static get error_tokenOverflowPolicy() { return 'error' };

    model;
    input; // Default - {}
    tokenOverflowPolicy; // Default - trim

    //Override
    parent = {
        validateStep: this.validateStep,
        print: this.print
    }

    constructor(config) {
        super(config);
        this.type = FlowStep.completionType;
        this.model = config.action.model;
        this.input = config.action.input ?? {};

        // Defaults to trim
        this.setTokenOverflowPolicy(config.action.tokenOverflowPolicy ?? CompletionFlowStep.trim_tokenOverflowPolicy);
    }

    validateStep = () => this.model && this.parent.validateStep();

    setTokenOverflowPolicy = (policy) => {
        switch (policy) {
            // List allowed values
            case CompletionFlowStep.trim_tokenOverflowPolicy:
            case CompletionFlowStep.error_tokenOverflowPolicy:
                break;        
            default:
                throw new Error(`Invalid token overflow policy: ${policy} in completion step: ${this.name}`);
        }

        this.tokenOverflowPolicy = policy;
    }

    print = (pref) => {
        this.parent.print(pref);
        console.log(pref + `Model: ${this.model}`);
        console.log(pref + `Input: ${JSON.stringify(this.input)}`);
        console.log(pref + `Token Overflow Policy: ${this.tokenOverflowPolicy}`);
    }
}

module.exports = CompletionFlowStep;