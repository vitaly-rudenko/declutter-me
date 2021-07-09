const { Client } = require('@notionhq/client/build/src');
const NotionAccountNotFound = require('../errors/NotionAccountNotFound');
const Cache = require('../storage/Cache');

class NotionSessionManager {
    /** @param {{ storage: import('../storage/SqliteStorage') }} dependencies */
    constructor({ storage }) {
        this._notions = new Cache(10 * 60_000);
        this._storage = storage;
    }

    async get(userId) {
        if (this._notions.get(userId)) {
            return this._notions.get(userId);
        }

        const notionAccount = await this._storage.findNotionAccountByUserId(userId);
        if (!notionAccount) {
            throw new NotionAccountNotFound();
        }

        const notion = new Client({ auth: notionAccount.token });

        this._notions.set(userId, [notion, notionAccount]);
        return [notion, notionAccount];
    }
}

module.exports = NotionSessionManager;
