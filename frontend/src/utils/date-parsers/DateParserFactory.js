import { Language } from '../Language';
import { RussianDateParser } from './RussianDateParser';

class DateParserFactory {
    create(language) {
        if (language === Language.RUSSIAN) {
            return new RussianDateParser();
        }
    }
}

module.exports = DateParserFactory;
