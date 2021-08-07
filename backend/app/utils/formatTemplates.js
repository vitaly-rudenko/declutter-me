import { InputType } from '@vitalyrudenko/templater';
import { escapeMd } from './escapeMd.js';
import { formatPattern } from './formatPattern.js';

/** @param {import('../templates/Template').Template[]} templates */
export function formatTemplates(templates, localize) {
    return templates.length > 0
        ? templates.map(
            (template, i) => {
                const database = template.defaultFields.find(f => f.inputType === InputType.DATABASE);
                const index = i + 1;
                const pattern = escapeMd(formatPattern(template.pattern));

                if (database) {
                    return localize(
                        'output.templates.templateWithDatabase',
                        { index, pattern, database: escapeMd(database.value) }
                    );    
                }
                
                return localize('output.templates.template', { index, pattern });
            }
        ).join('\n')
        : localize('output.templates.none');
}