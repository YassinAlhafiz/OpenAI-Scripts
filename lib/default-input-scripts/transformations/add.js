
const transform = async (input) => {
    
    const a = input.a;
    const b = input.b;

    if(typeof a !== 'number' || typeof b !== 'number') throw new Error('Missing input parameters.');

    return {sum: a + b};

};

module.exports = {transform};