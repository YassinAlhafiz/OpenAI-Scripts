// Deals with multiple params with the same name
const extractParam = (args, p) => { 
    const output = args[p];
    if(Array.isArray(output ?? '')){
        return output[output.length - 1]; // Get last element
    }

    return output;
}

// Confirues the .env file and the yargs
const configureEnvironment = () => { 
    // Configure dot env
    require('dotenv').config()

    // Extract the argurments
    const yargs = require('yargs/yargs')
    const { hideBin } = require('yargs/helpers')
    const args = yargs(hideBin(process.argv)).argv;

    return args;
}

module.exports = { extractParam, configureEnvironment };