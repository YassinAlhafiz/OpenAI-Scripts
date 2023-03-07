const fs = require('fs');

class ModuleFileManager {

    static get defaultTranfomationPath() { return 'lib/default-input-scripts/transformations/'; }
    static get defaultCompletionPath() { return 'lib/default-input-scripts/completions/'; }
    static get defaultConditionPath() { return 'lib/default-input-scripts/conditions/'; }

    static loadConfig = (path) => {
        if(!ModuleFileManager.doesFileExsist(path)) {
            throw new Error(`File does not exsist: ${path}`);
        }

        if(!path.endsWith('.json')) {
            path += '.json';
        }

        try{
            const file = fs.readFileSync(path, 'utf8');

            // Attempt to parse the file
            const config = JSON.parse(file);

            return config;
        }catch(e){
            console.log(e);
        }

        return null;
    }

    static doesFileExsist = (path) => {
        try {
            const exists = fs.existsSync(path)
            return exists;
        } catch (e) {
            // console.log(e);
            return false;
        }
    }

    static doesTransfomationExsist = (name) => {
        const path = `./lib/transformations/${name}.js`;
        return ModuleFileManager.doesFileExsist(path);

    }

}

module.exports = ModuleFileManager;