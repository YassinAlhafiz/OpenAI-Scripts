const ModuleFileManager = require('../models/module-file-manager');
const InputScriptConfig = require('../models/input-script-config');
const { extractParam, configureEnvironment } = require('../helpers/function-helper.js');

// Configure dot env and yargs
const args = configureEnvironment();

// Extract input variables
const filePath = args._[0];

if(!filePath) {
    throw new Error('No file path provided');
}

// Load and parse the config
try{
    const configJson = ModuleFileManager.loadConfig(filePath);
    const scriptConfig = new InputScriptConfig(configJson);
    scriptConfig.print();
}catch(e){
    console.log(e);
}
