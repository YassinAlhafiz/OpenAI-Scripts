const FlowStep = require('./flow-step');
const ModuleFileManager = require('../module-file-manager');

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

    canRunStep = () => ModuleFileManager.doesTransfomationExsist(this.transformation);

    resolve = async (input) => {

        // Load in the transformation file
        const transform = ModuleFileManager.importTransformation(this.transformation);

        try {
            // Run the transformation
            const output = await transform(input);

            // Return the output
            return [output, this.nextStep];
        } catch (e) {
            // Return error
            return [e, FlowStep.errorFlag];
        }

    };

    print = (pref) => {
        this.parent.print(pref);
        console.log(pref + `Transformation: ${this.transformation}`);
        console.log(pref + `Input: ${JSON.stringify(this.input)}`);
    }
}

module.exports = TransformationFlowStep;