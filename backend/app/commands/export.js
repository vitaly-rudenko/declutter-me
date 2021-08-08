import yaml from 'js-yaml';
import { escapeMd } from '../utils/escapeMd.js';

export function exportCommand({ storage }) {
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

        await context.reply(
            `\`${escapeMd(yaml.dump(exportedData))}\``,
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    };
}