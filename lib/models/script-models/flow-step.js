
class FlowStep {

    static get transformationType() { return 'transform' };
    static get completionType() { return 'complete' };
    static get conditionType() { return 'condition' };
    static get endFlag() { return ':end' };
    static get errorFlag() { return ':error' };

    name;
    description; // Optional
    nextStep;
    type;
    save; // Optional
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.nextStep = config['next-step'];
        this.save = config.save;
    }

    // OVERRIDE
    validateStep = () => this.validateName() && this.type && this.nextStep;

    // OVERRIDE
    canRunStep = () => false;

    // OVERRIDE
    isEndCandidate = () => this.nextStep === FlowStep.endFlag;

    print = (pref) => {
        console.log(pref + `Name: ${this.name}`);
        console.log(pref + `Description: ${this.description}`);
        console.log(pref + `Type: ${this.type}`);
        console.log(pref + `Next Step: "${this.nextStep}"`);
        console.log(pref + `Save: ${JSON.stringify(this.save)}`);
    }

    // Validates the name
    validateName = () => this.name && this.name !== FlowStep.endFlag &&
        this.name !== FlowStep.errorFlag;
    
}

module.exports = FlowStep;