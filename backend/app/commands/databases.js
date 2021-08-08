import { Markup } from 'telegraf';
import { formatDatabases } from '../utils/formatDatabases.js';

export function manageDatabasesCommand({ storage }) {
    return async (context) => {
        const databases = await storage.findDatabasesByUserId(context.state.userId);

        await context.reply(
            context.state.localize('command.databases.chooseAction', {
                databases: formatDatabases(databases, context.state.localize),
            }),
            {
                parse_mode: 'MarkdownV2',
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback(context.state.localize('command.databases.actions.add'), 'databases:add'),
                    // databases.length > 0 && Markup.button.callback(ctx.state.localize('command.databases.actions.edit'), 'databases:edit'),
                    databases.length > 0 && Markup.button.callback(context.state.localize('command.databases.actions.delete'), 'databases:delete'),
                ].filter(Boolean), { columns: 1 }).reply_markup,
            }
        );
    };
}
