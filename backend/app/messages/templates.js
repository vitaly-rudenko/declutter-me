import { Field, InputType } from '@vitalyrudenko/templater';
import { Markup } from 'telegraf';
import { Template } from '../templates/Template.js';
import { formatTemplate } from '../utils/formatTemplates.js';
import { mergeFields } from '../utils/mergeFields.js';

export function templatePatternMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const { defaultFields } = userSessionManager.context(context.state.userId);

        const pattern = context.message.text.replace(/\\n/g, '\n');

        const template = await storage.storeTemplate(
            new Template({
                pattern,
                defaultFields,
                userId: context.state.userId,
            })
        );

        userSessionManager.clear(context.state.userId);

        await context.reply(
            context.state.localize('command.templates.add.added'),
            Markup.inlineKeyboard([
                Markup.button.callback(
                    context.state.localize('command.templates.defaultFields.add'),
                    `template:add-default-fields:${template.getHash()}`
                ),
            ])
        );
    };
}

export function templateDefaultFieldsMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const defaultFields = context.message.text.split('\n')
            .map((field) => {
                const parts = field.split(':');
                const name = parts.shift();
                const value = parts.join(':');

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
