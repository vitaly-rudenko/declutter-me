import { Language } from '../Language.js';
import { RussianDateParser } from './RussianDateParser.js';

export class DateParserFactory {
    create(language) {
        if (language === Language.RUSSIAN) {
            return new RussianDateParser();
        }
    }
}
