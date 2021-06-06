class DateParser {
    constructor({ russianDateParser }) {
        this._russianDateParser = russianDateParser;
    }

    /**
     * @param {string} input
     * @param {{ language: string, futureOnly: boolean }} options
     */
    parse(input, { language, futureOnly }) {
        if (language === 'russian') {
            return this._russianDateParser.parse(input, { futureOnly });
        }
    }
}

module.exports = DateParser;
