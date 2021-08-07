export class NotionDatabase {
    /**
     * @param {{
     *     userId: string,
     *     alias: string,
     *     notionDatabaseUrl: string,
     * }} attributes
     */
    constructor({ userId, alias, notionDatabaseUrl }) {
        this._userId = userId;
        this._alias = alias;
        this._notionDatabaseUrl = notionDatabaseUrl;
    }

    get alias() {
        return this._alias;
    }

    get userId() {
        return this._userId;
    }

    get notionDatabaseUrl() {
        return this._notionDatabaseUrl;
    }

    get notionDatabaseId() {
        return new URL(this._notionDatabaseUrl).pathname.slice(1).split('/').pop().split('-').pop();
    }
}
