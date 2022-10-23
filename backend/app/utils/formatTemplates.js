import { InputType } from '@vitalyrudenko/templater';
import { escapeMd } from '@vitalyrudenko/telegramify';
import { formatPattern } from './formatPattern.js';

/** @param {import('../templates/Template').Template[]} templates */
export function formatTemplates(templates, databases, localize) {
    return templates.length > 0
        ? templates
            .map((template, i) => formatTemplate(template, databases, localize, i + 1))
            .join('\n')
        : localize('output.templates.none');
}

/** @param {import('../templates/Template').Template} template */
export function formatTemplate(template, databases, localize, index = template.order) {
    const databaseAlias = template.defaultFields.find(f => f.inputType === InputType.DATABASE)?.value;
    const pattern = escapeMd(formatPattern(template.pattern));

    const response = [
        localize('output.templates.template', { index, pattern })
    ];

    if (databaseAlias) {
        const database = databases.find(database => database.alias === databaseAlias);
        
        if (database) {
            response.push(
                localize(
                    'output.templates.database',
                    { alias: escapeMd(database.alias), url: database.notionDatabaseUrl }
                )
            );
        } // TODO: add some icon for missing database
    }

    for (const field of template.defaultFields) {
        if (field.inputType === InputType.DATABASE) continue;
        const value = Array.isArray(field.value) ? field.value.join(', ') : field.value;

        response.push(
            localize(
                'output.templates.field',
                {
                    name: escapeMd(field.name),
                    value: escapeMd(value),
                }
            )
        );
    }
    
    return response.join('\n');
}
