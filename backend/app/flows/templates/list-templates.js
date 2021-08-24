import { Markup } from 'telegraf';
import { formatTemplates } from '../../utils/formatTemplates.js';

// -- /templates command
export function templatesCommand({ storage }) {
    return async (context) => {
        const databases = await storage.findDatabasesByUserId(context.state.userId);
        const templates = await storage.findTemplatesByUserId(context.state.userId);

        await context.reply(
            context.state.localize('command.templates.chooseAction', {
                templates: formatTemplates(templates, databases, context.state.localize),
            }),
            {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback(context.state.localize('command.templates.actions.add'), 'templates:add'),
                    templates.length > 0 && Markup.button.callback(context.state.localize('command.templates.actions.reorder'), 'templates:reorder'),
                    // templates.length > 0 && Markup.button.callback(ctx.state.localize('command.templates.actions.edit'), 'templates:edit'),
                    templates.length > 0 && Markup.button.callback(context.state.localize('command.templates.actions.delete'), 'templates:delete'),
                ].filter(Boolean), { columns: 1 }).reply_markup
            }
        );
    };
}
