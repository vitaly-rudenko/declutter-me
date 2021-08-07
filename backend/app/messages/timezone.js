import { localize } from '../localize.js';
import { TelegramAccount } from '../telegram/TelegramAccount.js';
import { User } from '../users/User.js';
import { formatTimezone } from '../utils/formatTimezone.js';
import { createGuideLink } from '../utils/createGuideLink.js';

export function timezoneMessage({ storage, userSessionManager, notionSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;
        
        const userId = context.state.userId || context.from.id;
        const { language } = userSessionManager.context(userId);

        const timezoneOffsetMinutes = parseTimezoneOffsetMinutes(context.message.text);
        if (timezoneOffsetMinutes === null) {
            await context.reply(localize('command.start.invalidTimezone', null, language));
            return;
        }

        if (!context.state.telegramAccount) {
            const user = await storage.createUser(new User({ language, timezoneOffsetMinutes }));
            await storage.createTelegramAccount(new TelegramAccount({ userId: user.id, telegramUserId: context.from.id }));
        } else {
            await storage.updateUser(new User({ id: context.state.userId, language, timezoneOffsetMinutes }));
        }

        notionSessionManager.clear(userId)
        userSessionManager.clear(userId);

        await context.reply(localize(
            'command.start.finished',
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
