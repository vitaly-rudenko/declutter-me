class NotionDatabase {
    /**
     * @param {{
     *     alias: string,
     *     userId: string,
     *     notionDatabaseId: string,
     * }} attributes
     */
    constructor({ alias, userId, notionDatabaseId }) {
        this._userId = userId;
        this._alias = alias;
        this._notionDatabaseId = notionDatabaseId;
    }

    get type() {
        return 'notion';
    }

    get alias() {
        return this._alias;
    }

    get userId() {
        return this._userId;
    }

    get notionDatabaseId() {
        return this._notionDatabaseId;
    }
}

module.exports = NotionDatabase;
