import { Markup } from 'telegraf';
import { v4 as uuid } from 'uuid';
import { Locale } from '../Locale.js';
import { linkLanguageMap } from '../linkLanguageMap.js';
import { phases } from '../phases.js';
import { User } from '../users/User.js';
import { createGuideLink } from '../utils/createGuideLink.js';
import { formatTimezone } from '../utils/formatTimezone.js';
import { escapeMd } from '@vitalyrudenko/telegramify'

// -- /start
export function startCommand({ userSessionManager }) {
    return async (context) => {
        if (!context.state.user) {
            await updateUserInfo(context, { userSessionManager });
            return;
        }

        const { language, timezoneOffsetMinutes } = context.state.user;

        await context.reply(
            context.state.localize('command.start.chooseAction', {
                language: escapeMd(context.state.localize(`language.${language}`)),
                timezone: escapeMd(formatTimezone(timezoneOffsetMinutes)),
            }),
            {
                parse_mode: 'MarkdownV2',
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback(context.state.localize('command.start.actions.update'), 'start:update'),
                ]).reply_markup,
            },
        );
    };
}

// -- "update" button clicked
export function startUpdateAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            updateUserInfo(context, { userSessionManager })
        ]);
    };
}

async function updateUserInfo(context, { userSessionManager }) {
    const { localize } = context

    const languages = Object.values(Locale).map(language => [
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
}

// -- language selected
export function startLanguageAction({ frontendDomain, userSessionManager }) {
    return async (context) => {
        const { localize } = context.state

        await context.answerCbQuery();

        const language = context.match[1];

        userSessionManager.context(context.state.userId || context.from.id).language = language;
        userSessionManager.setPhase(context.state.userId || context.from.id, phases.start.timezone);

        await context.reply(
            localize('command.start.update.sendTimezone', {
                timezoneCheckerLink: createTimezoneCheckerLink({ frontendDomain, language }),
            }, language),
            { disable_web_page_preview: true }
        );

        userSessionManager.setPhase(context.state.userId || context.from.id, phases.start.timezone);
    };
}

export function createTimezoneCheckerLink({ frontendDomain, language }) {
    const linkLanguage = linkLanguageMap[language] ?? 'en';
    return `${frontendDomain}/#/${linkLanguage}/timezone`;
}

// -- timezone sent
export function startTimezoneMessage({ storage, userSessionManager, notionSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;
        const { localize } = context.state
        
        const userId = context.state.userId || context.from.id;
        const { language } = userSessionManager.context(userId);

        const timezoneOffsetMinutes = parseTimezoneOffsetMinutes(context.message.text);
        if (timezoneOffsetMinutes === null) {
            await context.reply(localize('command.start.update.invalidTimezone', null, language));
            return;
        }

        const { user } = context.state
        if (!user) {
            await storage.createUser(new User({ id: userId, language, timezoneOffsetMinutes, apiKey: uuid() }));
        } else {
            await storage.updateUser(new User({ id: user.id, language, timezoneOffsetMinutes, apiKey: user.apiKey }));
        }

        notionSessionManager.clear(userId)
        userSessionManager.clear(userId);

        await context.reply(localize(
            'command.start.update.done',
            {
                language: localize(`language.${language}`, null, language),
                timezone: formatTimezone(timezoneOffsetMinutes),
            },
            language
        ));

        await context.reply(
            localize('command.help', {
                guideLink: createGuideLink({ language })
            }, language),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    };
}

export function parseTimezoneOffsetMinutes(value) {
    if (value === 'UTC' || value === 'GMT') {
        return 0;
    }

    if (value.startsWith('GMT')) {
        value = value.slice('GMT'.length);
    }

    if (value.startsWith('UTC')) {
        value = value.slice('UTC'.length);
    }

    const [hours, minutes] = value.split(':').map(Number);

    if (!Number.isInteger(hours)) {
        return null;
    }

    const sign = hours >= 0 ? 1 : -1;

    return hours * 60 + sign * (Number.isInteger(minutes) ? minutes : 0);
}
