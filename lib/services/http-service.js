
class HttpService {

    https;
    constructor(){
        this.https = require('https');
    }

    async get(url, options = {}){
        return await this.request(url, { ...options, method: 'GET' });
    }

    async post(url, options = {}){
        return await this.request(url, { ...options, method: 'POST' });
    }

    async put(url, options = {}){
        return await this.request(url, { ...options, method: 'PUT' });
    }

    async delete(url, options = {}){
        return await this.request(url, { ...options, method: 'DELETE' });
    }

    async request(url, options = {}){
        return await new Promise((resolve, reject) => {
            const req = this.https.request(url, options, defaultHttpResponseCallback(resolve));
            req.on('error', defaultHttpErrorCallback(reject));
            req.end();
        });
    }

}

const defaultHttpResponseCallback = (resolve) => ((res) => {
    let data = '';
    res.setEncoding("utf8");
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        resolve(data);
    });
});
const defaultHttpErrorCallback = (reject) => ((err) => {
    reject(err);
});

module.exports = HttpService;