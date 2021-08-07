import { Markup } from 'telegraf';
import { Language } from '../Language.js';
import { localize } from '../localize.js';
import { phases } from '../phases.js';

export function startCommand({ userSessionManager }) {
    return async (context) => {
        const languages = Object.values(Language).map(language => [
            language,
            localize('chooseLanguage', { language: localize(`language.${language}`, null, language) }, language)
        ]);

        await context.reply('🇬🇧 🇺🇦 🇷🇺', {
            reply_markup: Markup.inlineKeyboard(
                languages.map(([language, label]) => (
                    Markup.button.callback(label, `language:${language}`)
                )),
                { columns: 1 }
            ).reply_markup
        });

        userSessionManager.setPhase(context.state.userId || context.from.id, phases.start.language);
    };
}
