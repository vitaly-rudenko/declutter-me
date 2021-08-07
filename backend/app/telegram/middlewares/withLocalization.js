import { Language } from '../../Language.js';
import { localize } from '../../localize.js';

const DEFAULT_LANGUAGE = Language.ENGLISH;

export const withLocalization = () => {
    /** @param {import('telegraf').Context} context @param {Function} next */
    return async (context, next) => {
        context.state.localize = (message, replacements) =>
            localize(message, replacements, context.state.user?.language ?? DEFAULT_LANGUAGE);

        await next();
    }
}
