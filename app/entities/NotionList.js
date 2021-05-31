class NotionList {
    constructor({ userId, alias, databaseId }) {
        this._userId = userId;
        this._alias = alias;
        this._databaseId = databaseId;
    }

    get userId() {
        return this._userId;
    }

    get alias() {
        return this._alias;
    }

    get databaseId() {
        return this._databaseId;
    }
}

module.exports = NotionList;
