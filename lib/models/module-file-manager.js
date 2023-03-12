const fs = require('fs');
var path = require('path');

class ModuleFileManager {

    static get defaultTranfomationPath() { return 'lib/default-input-scripts/transformations/'; }
    static get defaultCompletionPath() { return 'lib/default-input-scripts/completions/'; }
    static get defaultConditionPath() { return 'lib/default-input-scripts/conditions/'; }

    static loadConfig = (filePath) => {
        if(!ModuleFileManager.doesFileExsist(filePath)) {
            throw new Error(`File does not exsist: ${filePath}`);
        }

        if(!filePath.endsWith('.json')) {
            filePath += '.json';
        }

        const file = fs.readFileSync(filePath, 'utf8');

        // Attempt to parse the file
        const config = JSON.parse(file);

        return config;
    }

    static doesFileExsist = (filePath) => {
        try {
            // console.log(filePath);
            // console.log('');
            const exists = fs.existsSync(filePath)
            return exists;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    // Transformation
    
    static getTransformationFilePath = (name) => {
        const filePath = path.join(__dirname, '../../', ModuleFileManager.defaultTranfomationPath, name + '.js');
        return filePath;
    }
    
    static doesTransfomationExsist = (name) => {
        return ModuleFileManager.doesFileExsist(ModuleFileManager.getTransformationFilePath(name));
    }
    
    static importTransformation = (name) => {
        const {transform} = require(ModuleFileManager.getTransformationFilePath(name));
        return transform;
    }

    // Completion

    static getCompletionFilePath = (name) => {
        const filePath = path.join(__dirname, '../../', ModuleFileManager.defaultCompletionPath, name + '.js');
        return filePath;
    }
    
    static doesCompletionExsist = (name) => {
        return ModuleFileManager.doesFileExsist(ModuleFileManager.getCompletionFilePath(name));
    }
        
    static importCompletion = (name) => {
        return require(ModuleFileManager.getCompletionFilePath(name));
    }

    // Condition

    static getConditionFilePath = (name) => {
        const filePath = path.join(__dirname, '../../', ModuleFileManager.defaultConditionPath, name + '.js');
        return filePath;
    }

    static doesConditionExsist = (name) => {
        return ModuleFileManager.doesFileExsist(ModuleFileManager.doesConditionExsist(name));
    }

    static importCondition = (name) => {
        return require(ModuleFileManager.getConditionFilePath(name));
    }

}

module.exports = ModuleFileManager;