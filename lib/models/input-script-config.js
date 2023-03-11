const TransformationFlowStep = require('./script-models/transformation-flow-step');
const CompletionFlowStep = require('./script-models/completion-flow-step');
const FlowStep = require('./script-models/flow-step');
const ConditionFlowStep = require('./script-models/condition-flow-step');

class InputScriptConfig {

    name;
    description; // Optional
    startStep;
    outputSelector; // Optional
    steps;
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.startStep = config['start-step'];
        this.outputSelector = config['output-selector'];

        this.parseSteps(config.steps);

        if(!this.validateConfig()) {
            throw new Error('Invalid configuration');
        }

        if(!this.doesFlowEnd(this.startStep)) {
            throw new Error(`Flow does not end: ${this.startStep}`);
        }
    }

    validateConfig = () => this.steps &&
        this.startStep && this.name;

    // Attempts to traverse the tree of steps to see if it ends
    // Recurrsive helper for DFS
    doesFlowEnd = (startStep, visited = {}) => {

        if(startStep === FlowStep.endFlag) {
            return true;
        }

        const step = this.steps[startStep];
        if(!step) {
            throw new Error(`Step does not exist: ${startStep}`);
        }
        visited[startStep] = true;
        
        if(step.type === FlowStep.conditionType) {
            // Branching steps
            const conditionSteps = [step.nextStep, ...step.conditions.map(c => c.step)];
            for(let conditionStep of conditionSteps) {
                if(visited[conditionStep] != true) { // Prevent loops
                    const ends = this.doesFlowEnd(conditionStep, visited);
                    if(ends){
                        return true;
                    }
                }
            }
        }
        else if(visited[step.nextStep] != true){
            // Non-branching steps
            return this.doesFlowEnd(step.nextStep, visited); // Follow the chain
        }

        return false; // Does not end
    }
    
    parseSteps = (steps) => {

        // Validate the input
        if(!Array.isArray(steps)) {
            throw new Error('Steps must be an array');
        }

        // Clear the steps
        this.steps = {};

        let hasEndStep = false;
        let containsStartStep = false;        
        //Itterate over the steps
        for(let step of steps) {
            // Parse the step
            const parsed = this.parseStep(step);
            
            // Check if the step is the start step
            if(!containsStartStep && parsed.name === this.startStep) {
                containsStartStep = true;
            }

            // Check if the step is an end step
            if(!hasEndStep && parsed.isEndCandidate()) {
                hasEndStep = true;
            }

            // Add the step to the steps
            this.steps[parsed.name] = parsed;
        }

        // Check if the start step exists
        if(!containsStartStep) {
            throw new Error(`Start step does not exist: "${this.startStep}"`);
        }

        // Check if the end step exists
        if(!hasEndStep) {
            throw new Error('End step does not exist in "steps"');
        }
    }

    parseStep = (step) => {
        // Verify the step type
        let parsed;
        switch(step.type) {
            case FlowStep.transformationType:
                parsed = new TransformationFlowStep(step);
                break;
            case FlowStep.completionType:
                parsed = new CompletionFlowStep(step);
                break;
            case FlowStep.conditionType:
                parsed = new ConditionFlowStep(step);
                break;
            default:
                throw new Error(`Invalid step type: ${step.type} for step: ${step.name}`);
        }

        const isValid = parsed.validateStep();
        if(!isValid) {
            throw new Error(`Invalid step: ${step.name}`);
        }

        // Check if the step can be run
        if(!parsed.canRunStep()) {
            throw new Error(`Step [${step.name}] cannot run since ${parsed.type} action file cannot be found`);
        }

        // Check if the step name is unique
        if(this.steps[parsed.name]) {
            throw new Error(`Duplicate step name: ${parsed.name}`);
        }

        return parsed;
    }

    print = () => {
        console.log(`Name: ${this.name}`);
        console.log(`Description: ${this.description}`);
        console.log(`Start Step: ${this.startStep}`);
        console.log(`Output Selector: ${this.outputSelector ?? 'Default'}`);
        console.log(`Steps:`);
        console.log('--');
        for(let step of Object.values(this.steps)) {
            step.print('\t');
            console.log('--');
        }
    }

}

module.exports = InputScriptConfig;