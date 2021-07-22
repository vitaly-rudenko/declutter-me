import { fuzzyEquals } from '@vitalyrudenko/templater';

export class NotionEntry {
    /** @param {{
     *     databaseId: string,
     *     fields: import('../fields/Field').Field[],
     *     properties: import('./NotionProperty').NotionProperty[],
     * }} attributes */
    constructor({ databaseId, fields, properties }) {
        this._databaseId = databaseId;
        this._fields = fields;
        this._properties = properties;
    }

    getProperty(field) {
        return this._properties.find(p => fuzzyEquals(p.name, field.name)) || null;
    }

    get databaseId() {
        return this._databaseId;
    }

    get fields() {
        return this._fields;
    }
}
