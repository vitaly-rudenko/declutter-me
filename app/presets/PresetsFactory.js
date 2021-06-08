const EnglishPresets = require('./EnglishPresets');
const RussianPresets = require('./RussianPresets');
const UkrainianPresets = require('./UkrainianPresets');

class PresetsFactory {
    create(language) {
        if (language === 'english') {
            return new EnglishPresets();
        }

        if (language === 'russian') {
            return new RussianPresets();
        }

        if (language === 'ukrainian') {
            return new UkrainianPresets();
        }
    }
}

module.exports = PresetsFactory;
