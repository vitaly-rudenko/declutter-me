import { Field } from '@vitalyrudenko/templater';
import { Markup } from 'telegraf';
import { phases } from '../../phases.js';
import { formatTemplate } from '../../utils/formatTemplates.js';
import { mergeFields } from '../../utils/mergeFields.js';

// -- "add default fields" clicked
export function templatesAddDefaultFieldsAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        const templateHash = context.match[1];

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.defaultFields.send'),
                {
                    parse_mode: 'MarkdownV2',
                    reply_markup: Markup.inlineKeyboard([
                        Markup.button.callback(
                            context.state.localize('command.templates.defaultFields.cancel'),
                            'template:add-default-fields:cancel'
                        )
                    ]).reply_markup
                }
            )
        ]);

        userSessionManager.setPhase(context.state.userId, phases.template.addDefaultFields);
        userSessionManager.context(context.state.userId).templateHash = templateHash;
    };
}

// -- "cancel" button clicked
export function templatesAddDefaultFieldsCancelAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        userSessionManager.clear(context.state.userId);
        await context.deleteMessage();
    };
}

// -- default fields sent
export function templatesAddDefaultFieldsMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const defaultFields = context.message.text.split('\n')
            .map((field) => {
                const parts = field.split(': ');
                const name = parts.shift();
                const value = parts.join(': ');

                return new Field({
                    name,
                    value: value.split(/, ?/),
                });
            });
        
        const { templateHash } = userSessionManager.context(context.state.userId);
        const template = await storage.findTemplateByHash(context.state.userId, templateHash);
        if (!template) return;

        const updatedTemplate = await storage.storeTemplate(
            template.clone({
                defaultFields: mergeFields(template.defaultFields, defaultFields),
            })
        );

        const databases = await storage.findDatabasesByUserId(context.state.userId);
        await context.reply(
            formatTemplate(updatedTemplate, databases, context.state.localize),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true },
        );
        
        userSessionManager.clear(context.state.userId);
    };
}
