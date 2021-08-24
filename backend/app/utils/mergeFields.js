/** @typedef {import('@vitalyrudenko/templater').Field} Field */

import { InputType } from '@vitalyrudenko/templater';

/**
 * @param {Field[]} fields1
 * @param {Field[]} fields2
 */
export function mergeFields(fields1, fields2) {
    const result = [...fields1];

    for (const field of fields2) {
        const index = result.findIndex(f => (
            f.name === field.name ||
            (f.inputType === InputType.DATABASE && field.inputType === InputType.DATABASE)
        ));

        if (index !== -1) {
            result.splice(index, 1);
        }

        result.push(field)
    }

    return result;
}