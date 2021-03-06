import crypto from 'crypto';

export class Template {
    /**
     * @param {{
     *     userId: string,
     *     pattern: string,
     *     order?: number | null,
     *     defaultFields?: import('@vitalyrudenko/templater').Field[]
     * }} attributes
     */
    constructor({ userId, pattern, order = null, defaultFields = [] }) {
        this._userId = userId;
        this._order = order;
        this._pattern = pattern;
        this._defaultFields = defaultFields;
    }

    clone(override = {}) {
        return new Template({
            userId: this._userId,
            order: this._order,
            pattern: this._pattern,
            defaultFields: this._defaultFields,
            ...override,
        });
    }

    getHash() {
        return crypto.createHash('md5').update(this._pattern).digest('hex');
    }

    get userId() {
        return this._userId;
    }

    get order() {
        return this._order;
    }

    get pattern() {
        return this._pattern;
    }

    get defaultFields() {
        return this._defaultFields;
    }
}
