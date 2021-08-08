import yaml from 'js-yaml';
import { escapeMd } from '../utils/escapeMd.js';

export function exportCommand({ storage }) {
    /** @param {import('telegraf').Context} context */
    return async (context) => {
        const user = context.state.user;
        const notionAccount = context.state.notionAccount;

        const databases = await storage.findDatabasesByUserId(user.id);
        const templates = await storage.findTemplatesByUserId(user.id);

        const exportedData = {
            user: {
                id: user.id,
                language: user.language,
                timezoneOffsetMinutes: user.timezoneOffsetMinutes,
            },
            notionAccount: notionAccount && {
                token: notionAccount.token,
            },
            databases: databases.map((database) => ({
                alias: database.alias,
                notionDatabaseUrl: database.notionDatabaseUrl,
            })),
            templates: templates.map((template) => ({
                order: template.order,
                pattern: template.pattern,
                defaultFields: template.defaultFields.map((field) => ({
                    name: field.name,
                    inputType: field.inputType,
                    value: field.value,
                })),
            }))
        };

        await context.replyWithDocument({
            source: Buffer.from(yaml.dump(exportedData)),
            filename: `declutter-me-${Date.now()}.yml`,
        });
    };
}