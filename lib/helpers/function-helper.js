// Deals with multiple params with the same name
const extractParam = (args, p) => { 
    const output = args[p];
    if(Array.isArray(output ?? '')){
        return output[output.length - 1]; // Get last element
    }

    return output;
}

module.exports = { extractParam };