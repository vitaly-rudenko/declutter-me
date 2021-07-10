import { Language } from '../Language';
import { RussianDateParser } from './RussianDateParser';

export class DateParserFactory {
    create(language) {
        if (language === Language.RUSSIAN) {
            return new RussianDateParser();
        }
    }
}
