export class NotionDatabase {
    /**
     * @param {{
     *     userId: string,
     *     alias: string,
     *     notionDatabaseId: string,
     * }} attributes
     */
    constructor({ userId, alias, notionDatabaseId }) {
        this._userId = userId;
        this._alias = alias;
        this._notionDatabaseId = notionDatabaseId;
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
