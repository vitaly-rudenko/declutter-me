import { Language } from '../../Language';
import { localize } from '../../localize';

const DEFAULT_LANGUAGE = Language.ENGLISH;

export const withLocalization = () => {
    /** @param {import('telegraf').Context} context @param {Function} next */
    return (context, next) => {
        context.state.localize = (message, replacements) =>
            localize(message, replacements, context.state.user?.language ?? DEFAULT_LANGUAGE);

        next();
    }
}
