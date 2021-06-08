const RussianDateParser = require('./RussianDateParser');

class DateParserFactory {
    create(language) {
        if (language === 'russian') {
            return new RussianDateParser();
        }
    }
}

module.exports = DateParserFactory;
