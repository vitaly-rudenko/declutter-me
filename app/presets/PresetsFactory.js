const Language = require('../Language');
const CommonPresets = require('./CommonPresets');
const RussianPresets = require('./RussianPresets');
const UkrainianPresets = require('./UkrainianPresets');

class PresetsFactory {
    create(language) {
        const commonPresets = new CommonPresets();
        const russianPresets = new RussianPresets();
        const ukrainianPresets = new UkrainianPresets();

        if (language === Language.RUSSIAN) {
            return [russianPresets, ukrainianPresets, commonPresets];
        }

        if (language === Language.UKRAINIAN) {
            return [ukrainianPresets, russianPresets, commonPresets];
        }

        return [commonPresets, russianPresets, ukrainianPresets];
    }
}

module.exports = PresetsFactory;
