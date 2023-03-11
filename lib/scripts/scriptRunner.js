const ModuleFileManager = require('../models/module-file-manager');
const InputScriptConfig = require('../models/input-script-config');
const FlowRunner = require('../models/flow-runner');
const { extractParam, configureEnvironment } = require('../helpers/function-helper.js');

// Configure dot env and yargs
const args = configureEnvironment();

// Extract input variables
const filePath = args._[0];

if(!filePath) {
    throw new Error('No file path provided');
}

// Extract the config vars
const verbose = extractParam(args, 'v', false);

// Load and parse the config
let scriptConfig;
try{
    const configJson = ModuleFileManager.loadConfig(filePath);
    scriptConfig = new InputScriptConfig(configJson);
}catch(e){
    console.log(e);
}

runScript = async () => {
    // Run the script
    let flowRunner;
    try{
        // Create a config
        const config = {
            verbose: verbose
        };
    
        // Extract the input
        const input = {...args, 'v': undefined, '_': undefined};
    
        flowRunner = new FlowRunner(scriptConfig, input, config);
    
        await flowRunner.run();
    }catch(e){
        console.log(e);
    }

    if(flowRunner){
        if(flowRunner.completed){
            console.log('---');
            console.log('Output');
            console.log('---');
            console.log(flowRunner.output);
            console.log('---');
        }
        else{
            console.log('Flow not completed');
        }
    }
    else{
        console.log('Flow runner not created');
    }
}

if(scriptConfig){
    runScript();
}
