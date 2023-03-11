const FlowStep = require('./flow-step');
const ModuleFileManager = require('../module-file-manager');

class DefaultConditionType {

    static get numericGreaterThan() { return 'numeric-greater-than'; }
    static get stringEquals() { return 'string-equals'; }

    static isDefaultType(type) {
        switch (type) {
            case DefaultConditionType.numericGreaterThan:
            case DefaultConditionType.stringEquals:
                return true;
            default:
                return false;
        }
    }
}

class ConditionExpression {

    type; 
    input; // Defaulted - {}
    step;
    constructor(config) {
        this.type = config.condition;
        this.input = config.input ?? {};
        this.step = config.step;
    }

    validate = () => this.type && this.step && this.type;

    isEndCondition = () => this.step === FlowStep.endFlag;

    canRunCondition = () => {
        // Check if this is a default condition type
        if(DefaultConditionType.isDefaultType(this.type)) {
            return true;
        }
        else{
            // Try to find the condition file
            return ModuleFileManager.doesConditionExsist(this.type);
        }
    }

    print = (pref) => {
        console.log(pref + `Type: ${this.type}`);
        console.log(pref + `Input: ${JSON.stringify(this.input)}`);
        console.log(pref + `Step: "${this.step}"`);
    }
}

class ConditionFlowStep extends FlowStep {

    conditions;
    _hasEndCondition = false; // Computed later

    //Override
    parent = {
        validateStep: this.validateStep,
        isEndCandidate: this.isEndCandidate,
        print: this.print
    }

    constructor(config) {
        super(config);
        this.type = FlowStep.conditionType;
        
        this.parseConditions(config.action.steps ?? []);
    }

    validateStep = () => this.conditions && this.parent.validateStep();

    isEndCandidate = () => this._hasEndCondition || this.parent.isEndCandidate();

    canRunStep = () => {
        for (let i = 0; i < this.conditions.length; i++) {
            const condition = this.conditions[i];
            const canRun = condition.canRunCondition();
            if(!canRun){
                return false;
            }
        }

        return true;
    }

    parseConditions = (conditions) => {

        if(!Array.isArray(conditions)) {
            throw new Error(`Conditions must be an array in condition step: ${this.name}`);
        }

        const parsed = [];
        let hasEndCondition = false;
        for (let i = 0; i < conditions.length; i++) {
            const condition = new ConditionExpression(conditions[i]);
            
            if(!condition.validate()) {
                throw new Error(`Invalid condition: ${this.name} at index [${i}]`);
            }

            // Check if the condition is an end condition
            hasEndCondition = hasEndCondition || condition.isEndCondition();

            // Add the condition to the conditions
            parsed.push(condition);
        }

        if (parsed.length === 0) {
            throw new Error(`No conditions found in condition step: ${this.name}`);
        }
            
        // Set the conditions and end condition flag
        this.conditions = parsed;
        this._hasEndCondition = hasEndCondition;
    }

    print = (pref) => {
        this.parent.print(pref);
        console.log(pref + `Expressions:`);
        console.log(pref + '~~');
        for(let condition of Object.values(this.conditions)) {
            condition.print(pref + '\t');
            console.log(pref + '~~');
        }
    }
}

module.exports = ConditionFlowStep;
