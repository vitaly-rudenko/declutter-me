import { Language } from '../Language.js';
import { localize } from '../localize.js';
import { phases } from '../phases.js';

export function languageAction({ frontendDomain, userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        const language = context.match[1];

        userSessionManager.context(context.state.userId || context.from.id).language = language;
        userSessionManager.setPhase(context.state.userId || context.from.id, phases.start.timezone);

        await context.reply(
            localize('command.start.timezone', {
                timezoneCheckerLink: createTimezoneCheckerLink({ frontendDomain, language }),
            }, language),
            { disable_web_page_preview: true }
        );

        userSessionManager.setPhase(context.state.userId || context.from.id, phases.start.timezone);
    };
}

const linkLanguageMap = {
    [Language.ENGLISH]: 'en',
    [Language.RUSSIAN]: 'ru',
    [Language.UKRAINIAN]: 'uk',
};

export function createTimezoneCheckerLink({ frontendDomain, language }) {
    const linkLanguage = linkLanguageMap[language] ?? 'en';
    return `${frontendDomain}/#/${linkLanguage}/timezone`;
}
