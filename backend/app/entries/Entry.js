class Entry {
    /** @param {{ fields: import('../fields/Field')[] }} attributes */
    constructor({ fields }) {
        this._fields = fields;
    }

    get fields() {
        return this._fields;
    }
}

module.exports = Entry;
