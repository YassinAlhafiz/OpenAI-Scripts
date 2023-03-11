const FlowStep = require('./script-models/flow-step.js');

class FlowRunnerError {

    static get defaultErrorReason() { return 'error'; }
    static get errorFlagReason() { return 'errorFlagEncountered'; }

    reason;
    message;
    lastStep;
    lastOutput;

    constructor(message, reason, lastStep, lastOutput) {
        this.message = message;
        this.reason = reason;
        this.lastStep = lastStep;
        this.lastOutput = lastOutput;
    }

}

class FlowContext {

    input;
    memory;
    output;
    lastStep;
    currentStep;

    constructor(input) {
        this.input = input;
        this.memory = {};
        this.output = null;
        this.lastStep = null;
        this.currentStep = null;
    }

    reset = (startStep) => {
        this.memory = {};
        this.output = null;
        this.lastStep = null;
        this.currentStep = startStep;
    }

    // uses json path to select from the context
    select = (selector) => {
        const obj = {
            context: {
                input: this.input,
                memory: this.memory,
                output: this.output,
                lastStep: this.lastStep
            }
        }

        try{
            var jp = require('jsonpath');
            const response = jp.query(obj, selector);
            return Array.isArray(response) && response.length == 1 ? response[0] : response;
        }catch(e){
            throw this.error('Invalid selector: ' + selector, e);
        }
    }

    // Updates the context and returns the next step
    processStepOutput = (stepRunner) => {

        // Confirm that the step has finished
        if(!stepRunner.hasFinished) {
            throw new Error('Step did not finish: ' + stepRunner.step.name);
        }

        // Update the memory
        this.updateMemory(stepRunner);

        // Update the current step
        this.currentStep = this.getNextStep(stepRunner);
    }

    updateMemory = (stepRunner) => {

        // Update the output in the context and lastStep
        this.output = stepRunner.stepOutput;
        this.lastStep = stepRunner.step.name;

        // Check if the step has a memory update
        if(!stepRunner.needMemoryUpdate) return;

        // Update the memory
        const save = stepRunner.step.save;
        for(const key of Object.keys(save)) {
            const selection = save[key];
            const value = this.select(selection);
            this.memory[key] = value;
        }
    }

    getNextStep = (stepRunner) => {
        return stepRunner.nextStep;
    }

    error = (message, reason = null) => {
        return new FlowRunnerError(
            message, 
            reason ?? FlowRunnerError.defaultErrorReason, 
            this.lastStep,
            this.output
        );
    }
}

// Runs the steps defined by the input config
// Maintains a refrence to the context to allow steps to select from memory and write to memory
// After running the flow, returns the selected output
class FlowRunner {

    get hasFinished() { return this.completed && this.flowOutput; }

    script;
    context;
    flowOutput;
    completed;
    config;

    constructor(script, input, config = {}) {
        this.script = script;
        this.config = config;
        this.flowOutput = null;
        this.completed = false;
        this.context = new FlowContext(input);
    }

    run = async (startStep = null) => {
        if(!startStep) {
            startStep = this.script.startStep;
        }

        this.completed = false;
        this.context.reset(startStep);
        while(this.context.currentStep != FlowStep.endFlag) {

            let currentStep = this.context.currentStep;
            if(!currentStep){
                throw this.context.error('No step provided');
            } else if(currentStep == FlowStep.errorFlag) {
                throw this.context.error(
                    'Error flag encountered after step: ' + this.context.lastStep, 
                    FlowRunnerError.errorFlagReason
                );
            }

            // Retreive the step
            const step = this.script.steps[currentStep];
            if(!step) {
                throw this.context.error('Step not found: ' + currentStep);
            }

            // Parse the step into a step runner, and run it
            const stepRunner = new StepRunner(step, this.context);
            await stepRunner.run();

            // Get the next step and process the output
            this.context.processStepOutput(stepRunner);
            

        }

        this.setFlowOutput();
        this.completed = true;
        return this.flowOutput;
    }

    setFlowOutput = () => {
        let selector = this.script.outputSelector;
        this.output = this.context.select(selector);
    }

}

class StepRunner {

    get hasFinished() { return this.completed && this.stepOutput && this.nextStep; }
    get needMemoryUpdate() { return this.step.save }

    step;
    context;
    stepOutput;
    completed;
    nextStep;

    constructor(step, context) {
        this.step = step;
        this.context = context;
        this.completed = false;
        this.stepOutput = null;
        this.nextStep = null;
    }

    run = async () => {
        switch (this.step.type) {
            case FlowStep.transformationType:
                await this.runTransformation();
                break;        
            case FlowStep.completionType:
                await this.runCompletion();
                break;        
            case FlowStep.conditionType:
                await this.runCondition();
                break;        
            default:
                throw this.context.error('Invalid step type for step: ' + this.step.name);
        }

        this.completed = true;
        return this.stepOutput;
    }

    runTransformation = async () => {
        // Select the input
        const stepInput = this.selectInput(this.step.input);
        try{
            [this.stepOutput, this.nextStep] = await this.step.resolve(stepInput);
        }catch(e){
            throw this.context.error('Error running step: ' + this.step.name, e);
        }
    }
    
    runCompletion = async () => {
        throw new Error('runCompletion Not implemented');
    }
    
    runCondition = async () => {
        throw new Error('runCondition Not implemented');
    }

    selectInput = (input) => {
        const stepInput = {};
        for(const key of Object.keys(input)) {
            const selection = input[key];
            const value = this.context.select(selection);
            stepInput[key] = value;
        }
        return stepInput;
    }

}

module.exports = FlowRunner;