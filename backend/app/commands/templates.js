import { Markup } from 'telegraf';
import { formatTemplates } from '../utils/formatTemplates.js';

export function manageTemplatesCommand({ storage }) {
    return async (context) => {
        const TEMPLATES_REORDER_REGEX = /\/templates reorder\n(.+)/s;

        if (TEMPLATES_REORDER_REGEX.test(context.message.text)) {
            const [_, match] = context.message.text.match(TEMPLATES_REORDER_REGEX);

            const patterns = match.split('\n').filter(Boolean).map(p => p.replace(/\\n/g, '\n'));
            const templates = await storage.findTemplatesByUserId(context.state.userId);

            let partialSuccess = false;
            let order = 0;
            for (const pattern of patterns) {
                const existingTemplate = templates.find(t => t.pattern === pattern);
                if (!existingTemplate) {
                    partialSuccess = true;
                    continue;
                }

                order++;
                await storage.storeTemplate(existingTemplate.clone({ order }))
            }

            for (const template of templates) {
                if (patterns.includes(template.pattern)) continue;
                partialSuccess = true;

                order++;
                await storage.storeTemplate(template.clone({ order }))
            }

            const updatedTemplates = await storage.findTemplatesByUserId(context.state.userId);

            if (partialSuccess) {
                await context.reply(
                    context.state.localize('command.templates.reorder.partialSuccess', {
                        templates: formatTemplates(updatedTemplates, context.state.localize)
                    }),
                    { parse_mode: 'MarkdownV2' }
                );
            } else {
                await context.reply(
                    context.state.localize('command.templates.reorder.success', {
                        templates: formatTemplates(updatedTemplates, context.state.localize)
                    }),
                    { parse_mode: 'MarkdownV2' }
                );
            }

            return;
        }

        const templates = await storage.findTemplatesByUserId(context.state.userId);

        await context.reply(
            context.state.localize('command.templates.chooseAction', {
                templates: formatTemplates(templates, context.state.localize),
            }),
            {
                parse_mode: 'MarkdownV2',
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback(context.state.localize('command.templates.actions.add'), 'templates:add'),
                    Markup.button.callback(context.state.localize('command.templates.actions.reorder'), 'templates:reorder'),
                    // Markup.button.callback(ctx.state.localize('command.templates.actions.edit'), 'templates:edit'),
                    Markup.button.callback(context.state.localize('command.templates.actions.delete'), 'templates:delete'),
                ], { columns: 1 }).reply_markup
            }
        );
    };
}
