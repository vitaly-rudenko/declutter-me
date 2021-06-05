class NotionEntry {
    constructor({ databaseId, fields }) {
        this._databaseId = databaseId;
        this._fields = fields;
    }

    get databaseId() {
        return this._databaseId;
    }

    get fields() {
        return this._fields;
    }
}

module.exports = NotionEntry;
