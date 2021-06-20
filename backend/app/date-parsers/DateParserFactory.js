const Language = require('../Language');
const RussianDateParser = require('./RussianDateParser');

class DateParserFactory {
    create(language) {
        if (language === Language.RUSSIAN) {
            return new RussianDateParser();
        }
    }
}

module.exports = DateParserFactory;
