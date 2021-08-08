import { Markup } from 'telegraf';
import { escapeMd } from '../utils/escapeMd.js';
import { formatDatabases } from '../utils/formatDatabases.js';
import { formatTemplates } from '../utils/formatTemplates.js';
import { formatTimezone } from '../utils/formatTimezone.js';

export function infoCommand({ storage }) {
    /** @param {import('telegraf').Context} context */
    return async (context) => {
        const databases = context.state.userId ? await storage.findDatabasesByUserId(context.state.userId) : [];
        const templates = context.state.userId ? await storage.findTemplatesByUserId(context.state.userId) : [];

        await context.reply(
            context.state.localize('command.info.main', {
                language: context.state.user?.language
                    ? context.state.localize(`language.${context.state.user.language}`)
                    : context.state.localize('command.info.notProvided'),
                timezone: context.state.user?.timezoneOffsetMinutes
                    ? escapeMd(formatTimezone(context.state.user?.timezoneOffsetMinutes))
                    : context.state.localize('command.info.notProvided'),
                notionToken: escapeMd(context.state.notionAccount?.token ?? context.state.localize('command.info.notProvided')),
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );

        await context.reply(
            context.state.localize('command.info.databases', {
                databases: formatDatabases(databases, context.state.localize),
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );

        await context.reply(
            context.state.localize('command.info.templates', {
                templates: formatTemplates(templates, databases, context.state.localize),
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    };
}
