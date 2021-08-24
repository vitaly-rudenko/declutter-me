import { Markup } from 'telegraf';
import { formatPattern } from '../../utils/formatPattern.js';

// -- "delete" button clicked
export function templatesDeleteAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();

        const templates = await storage.findTemplatesByUserId(context.state.userId);

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.delete.chooseTemplate'),
                Markup.inlineKeyboard([
                    ...templates.map((template) => Markup.button.callback(
                        formatPattern(template.pattern),
                        `templates:delete:template:${template.getHash()}`
                    )),
                    Markup.button.callback(
                        context.state.localize('command.templates.delete.cancel'),
                        'templates:delete:cancel'
                    ),
                ], { columns: 1 })
            )
        ]);
    };
}

// -- template selected
export function templatesDeleteByHashAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();
        
        const templateHash = context.match[1];
        const template = await storage.findTemplateByHash(context.state.userId, templateHash);
        if (!template) return;

        await storage.deleteTemplateByPattern(context.state.userId, template.pattern);

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.templates.delete.deleted', { template: formatPattern(template.pattern) })),
        ]);
    };
}

// -- "cancel" button clicked
export function templatesDeleteCancelAction() {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.templates.delete.cancelled'))
        ]);
    };
}