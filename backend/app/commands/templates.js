import { Markup } from 'telegraf';
import { formatTemplates } from '../utils/formatTemplates.js';

const TEMPLATES_REORDER_REGEX = /\/templates reorder\n(.+)/s;

export function manageTemplatesCommand({ storage }) {
    return async (context) => {
        const databases = await storage.findDatabasesByUserId(context.state.userId);

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
                        templates: formatTemplates(updatedTemplates, databases, context.state.localize)
                    }),
                    { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
                );
            } else {
                await context.reply(
                    context.state.localize('command.templates.reorder.success', {
                        templates: formatTemplates(updatedTemplates, databases, context.state.localize)
                    }),
                    { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
                );
            }

            return;
        }

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
