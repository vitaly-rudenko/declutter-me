import { Language } from '../Language.js';
import { RussianDateParser } from '@vitalyrudenko/templater';

export class DateParserFactory {
    create(language) {
        if (language === Language.RUSSIAN) {
            return new RussianDateParser();
        }
    }
}
