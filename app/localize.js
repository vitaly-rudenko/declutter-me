const en = require('../assets/localization/en.json');
const Language = require('./Language');

function getMessages(language) {
    if (language === Language.ENGLISH) {
        return en;
    }

    throw new Error('Invalid language: ' + language);
}

const localize = (message, replacements = null, language) => {
    const path = message.split('.');

    let result = getMessages(language);
    while (result && path.length > 0) {
        result = result[path.shift()];
    }

    if (!result) {
        if (replacements) {
            return `${message}\n${JSON.stringify(replacements, null, 4)}`;
        } else {
            return message;
        }
    }

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

module.exports = localize;
