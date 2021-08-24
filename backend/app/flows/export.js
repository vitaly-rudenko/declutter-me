import yaml from 'js-yaml';

export function exportCommand({ storage }) {
    /** @param {import('telegraf').Context} context */
    return async (context) => {
        const databases = await storage.findDatabasesByUserId(context.state.userId);
        const templates = await storage.findTemplatesByUserId(context.state.userId);

        const exportedData = {
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
