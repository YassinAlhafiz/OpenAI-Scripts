const FlowStep = require('./flow-step');

class TransformationFlowStep extends FlowStep {

    transformation;
    input; // Default - {}

    //Override
    parent = {
        validateStep: this.validateStep,
        print: this.print
    }

    constructor(config) {
        super(config);
        this.type = FlowStep.transformationType;
        this.transformation = config.action.transformation;
        this.input = config.action.input ?? {};
    }

    validateStep = () => this.transformation && this.input && this.parent.validateStep();

    print = (pref) => {
        this.parent.print(pref);
        console.log(pref + `Transformation: ${this.transformation}`);
        console.log(pref + `Input: ${JSON.stringify(this.input)}`);
    }
}

module.exports = TransformationFlowStep;