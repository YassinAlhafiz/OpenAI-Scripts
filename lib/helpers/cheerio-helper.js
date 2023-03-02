
class CheerioHelper {

    $;
    url
    constructor(url, html){
        this.url = url;
        this.$ = require('cheerio').load(html);
    }

    getTextFromBody(){
        let $ = this.$;
        let output = '';

        // Grab all the h1, h2, and p elements
        $('h1,h2,p').each((i, el) => {
            // Append the element text to the output
            output += $(el).text() + '\n';
        });

        return output;
    }
}

module.exports = CheerioHelper;