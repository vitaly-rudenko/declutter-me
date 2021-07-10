import en from './localization/en.json';
import ru from './localization/ru.json';
import uk from './localization/uk.json';

import { Language } from './Language';

function getMessages(language) {
    if (language === Language.ENGLISH) {
        return en;
    }

    if (language === Language.RUSSIAN) {
        return ru;
    }

    if (language === Language.UKRAINIAN) {
        return uk;
    }

    throw new Error('Invalid language: ' + language);
}

export const get = (messageKey, language) => {
    const path = messageKey.split('.');

    let result = getMessages(language);
    while (result && path.length > 0) {
        result = result[path.shift()];
    }

    return result ?? messageKey;
};

export const localize = (messageKey, replacements = null, language) => {
    let result = get(messageKey, language);

    if (Array.isArray(result)) {
        result = result.join('\n');
    }

    if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), value);
        }
    }

    return result;
};

