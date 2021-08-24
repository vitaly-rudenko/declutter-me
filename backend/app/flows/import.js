import got from 'got';
import yaml from 'js-yaml';
import { Field } from '@vitalyrudenko/templater';
import { NotionDatabase } from '../notion/NotionDatabase.js';
import { Template } from '../templates/Template.js';

export function importMessage({ bot, storage }) {
    /** @param {import('telegraf').Context} context */
    return async (context, next) => {
        if (!('document' in context.message)) return next();
        if (!context.message.document.file_name.endsWith('.yml')) return next();

        const fileUrl = await bot.telegram.getFileLink(context.message.document.file_id);
        const file = await got(fileUrl);
        const exportedData = yaml.load(file.body);

        const userId = context.state.userId;

        const databases = exportedData.databases
            .map((database) => new NotionDatabase({
                userId,
                alias: database.alias,
                notionDatabaseUrl: database.notionDatabaseUrl,
            }));
            
        const templates = exportedData.templates
            .map((template) => new Template({
                userId,
                pattern: template.pattern,
                order: template.order,
                defaultFields: template.defaultFields
                    .map((field) => new Field({
                        name: field.name,
                        value: field.value,
                        inputType: field.inputType,
                    }))
            }));

        await storage.deleteDatabasesByUserId(userId);
        await storage.deleteTemplatesByUserId(userId);

        for (const database of databases) {
            await storage.storeDatabase(database);
        }

        for (const template of templates) {
            await storage.storeTemplate(template);
        }

        await context.reply(context.state.localize('command.import.done'));
    };
}
