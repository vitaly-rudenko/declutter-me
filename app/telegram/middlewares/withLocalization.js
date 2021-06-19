const Language = require('../../Language');
const localize = require('../../localize');

const DEFAULT_LANGUAGE = Language.ENGLISH;

const withLocalization = () => {
    /** @param {import('telegraf').Context} context @param {Function} next */
    return (context, next) => {
        context.state.localize = (message, replacements) =>
            localize(message, replacements, context.state.user?.language ?? DEFAULT_LANGUAGE);

        next();
    }
}

module.exports = withLocalization;
