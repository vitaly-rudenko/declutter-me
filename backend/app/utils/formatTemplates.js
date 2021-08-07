import { InputType } from '@vitalyrudenko/templater';
import { escapeMd } from './escapeMd.js';
import { formatPattern } from './formatPattern.js';

/** @param {import('../templates/Template').Template[]} templates */
export function formatTemplates(templates, databases, localize) {
    return templates.length > 0
        ? templates.map(
            (template, i) => {
                const databaseAlias = template.defaultFields.find(f => f.inputType === InputType.DATABASE)?.value;
                const index = i + 1;
                const pattern = escapeMd(formatPattern(template.pattern));

                if (databaseAlias) {
                    const database = databases.find(database => database.alias === databaseAlias);
                    
                    console.log(databaseAlias, '=>', database)
                    if (database) {
                        return localize(
                            'output.templates.templateWithDatabase',
                            {
                                index,
                                pattern,
                                databaseAlias: escapeMd(database.alias),
                                databaseUrl: database.notionDatabaseUrl,
                            }
                        );
                    } // TODO: add some icon for missing database
                }
                
                return localize('output.templates.template', { index, pattern });
            }
        ).join('\n')
        : localize('output.templates.none');
}