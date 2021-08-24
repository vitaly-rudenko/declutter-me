import fs from 'fs'
import { Language } from './Language.js';

const cachedLocalizations = {}
function loadLocalization(name) {
    if (!cachedLocalizations[name]) {
        cachedLocalizations[name] = JSON.parse(fs.readFileSync(`./assets/localization/${name}.json`, { encoding: 'utf-8' }));
    }

    return cachedLocalizations[name];
}

function getMessages(language) {
    if (language === Language.ENGLISH) {
        return loadLocalization('en');
    }

    if (language === Language.RUSSIAN) {
        return loadLocalization('ru');
    }

    if (language === Language.UKRAINIAN) {
        return loadLocalization('uk');
    }

    throw new Error('Invalid language: ' + language);
}

export function get(messageKey, language) {
    const path = messageKey.split('.');

    let result = getMessages(language);
    while (result && path.length > 0) {
        result = result[path.shift()];
    }

    if (!result) {
        console.log(`Could not find localization key for "${messageKey}"`)
    }

    return result ?? messageKey;
};

export function localize(messageKey, replacements = null, language) {
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
