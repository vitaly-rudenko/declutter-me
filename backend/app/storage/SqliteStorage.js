const Sqlite = require('better-sqlite3');
const Field = require('../fields/Field');
const NotionAccount = require('../notion/NotionAccount');
const NotionDatabase = require('../notion/NotionDatabase');
const TelegramAccount = require('../telegram/TelegramAccount');
const Template = require('../templates/Template');
const User = require('../users/User');

class SqliteStorage {
    constructor(filename) {
        this._sqlite = new Sqlite(filename);
    }

    setup() {
        this._sqlite.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                language TEXT,
                timezone_offset_minutes INTEGER
            );
        `).run();

        this._sqlite.prepare(`
            CREATE TABLE IF NOT EXISTS telegram_accounts (
                user_id INTEGER,
                telegram_user_id INTEGER
            );
        `).run();

        this._sqlite.prepare(`
            CREATE TABLE IF NOT EXISTS templates (
                user_id INTEGER,
                pattern TEXT,
                \`order\` INTEGER,
                default_fields TEXT
            );
        `).run();

        this._sqlite.prepare(`
            CREATE UNIQUE INDEX unique_index ON templates (user_id, pattern);
        `).run();

        this._sqlite.prepare(`
            CREATE TABLE IF NOT EXISTS notion_accounts (
                user_id INTEGER,
                token TEXT
            );
        `).run();

        this._sqlite.prepare(`
            CREATE TABLE IF NOT EXISTS notion_databases (
                user_id INTEGER,
                alias TEXT,
                notion_database_id TEXT
            );
        `).run();
    }

    /** @param {import('../users/User')} user */
    async createUser(user) {
        return this.deserializeUser(
            this._sqlite
                .prepare(`
                    INSERT INTO users (language, timezone_offset_minutes)
                    VALUES (?, ?)
                    RETURNING *;
                `)
                .get(user.language, user.timezoneOffsetMinutes)
        );
    }

    
    /** @param {import('../users/User')} user */
    async updateUser(user) {
        return this.deserializeUser(
            this._sqlite
                .prepare(`
                    UPDATE users
                    SET language = ?
                    AND timezone_offset_minutes = ?
                    WHERE id = ?
                    RETURNING *;
                `)
                .get(user.language, user.timezoneOffsetMinutes, user.id)
        );
    }

    async findUserById(userId) {
        return this.deserializeUser(
            this._sqlite
                .prepare(`
                    SELECT *
                    FROM users
                    WHERE id = ?
                `)
                .get(userId)
        );
    }

    deserializeUser(row) {
        if (!row) return null;
        return new User({
            id: row['id'],
            language: row['language'],
            timezoneOffsetMinutes: row['timezone_offset_minutes'],
        });
    }

    /** @param {import('../telegram/TelegramAccount')} telegramAccount */
    async createTelegramAccount(telegramAccount) {
        return this.deserializeTelegramAccount(
            this._sqlite
                .prepare(`
                    INSERT INTO telegram_accounts (user_id, telegram_user_id)
                    VALUES (?, ?)
                    RETURNING *;
                `)
                .get(telegramAccount.userId, telegramAccount.telegramUserId)
        );
    }

    async findTelegramAccountByTelegramUserId(telegramUserId) {
        return this.deserializeTelegramAccount(
            this._sqlite
                .prepare(`
                    SELECT *
                    FROM telegram_accounts
                    WHERE telegram_user_id = ?;
                `)
                .get(telegramUserId)
        );
    }

    deserializeTelegramAccount(row) {
        if (!row) return null;
        return new TelegramAccount({
            userId: row['user_id'],
            telegramUserId: row['telegram_user_id'],
        });
    }

    /** @param {import('../notion/NotionAccount')} notionAccount */
    async createNotionAccount(notionAccount) {
        return this.deserializeNotionAccount(
            this._sqlite
                .prepare(`
                    INSERT INTO notion_accounts (user_id, token)
                    VALUES (?, ?)
                    RETURNING *;
                `)
                .get(notionAccount.userId, notionAccount.token)
        );
    }

    async findNotionAccountByUserId(userId) {
        return this.deserializeNotionAccount(
            this._sqlite
                .prepare(`
                    SELECT *
                    FROM notion_accounts
                    WHERE user_id = ?
                `)
                .get(userId)
        );
    }

    deserializeNotionAccount(row) {
        if (!row) return null;
        return new NotionAccount({
            userId: row['user_id'],
            token: row['token'],
        });
    }


    /** @param {import('../notion/NotionDatabase')} notionDatabase */
    async storeDatabase(notionDatabase) {
        return this.deserializeDatabase(
            this._sqlite
                .prepare(`
                    INSERT INTO notion_databases (user_id, alias, notion_database_id)
                    VALUES (?, ?, ?)
                    RETURNING *;
                `)
                .get(notionDatabase.userId, notionDatabase.alias, notionDatabase.notionDatabaseId)
        );
    }

    async deleteDatabaseByAlias(userId, alias) {
        this._sqlite
            .prepare(`
                DELETE FROM notion_databases
                WHERE alias = ?
                AND user_id = ?;
            `)
            .run(alias, userId)
    }

    async findDatabasesByUserId(userId) {
        return this._sqlite
            .prepare(`
                SELECT *
                FROM notion_databases
                WHERE user_id = ?;
            `)
            .all(userId)
            .map(item => this.deserializeDatabase(item))
    }

    async findDatabaseByAlias(userId, alias) {
        return this.deserializeDatabase(
            this._sqlite
                .prepare(`
                    SELECT *
                    FROM notion_databases
                    WHERE user_id = ?
                    AND alias = ?;
                `)
                .get(userId, alias)
        );
    }

    deserializeDatabase(row) {
        if (!row) return null;
        return new NotionDatabase({
            userId: row['user_id'],
            alias: row['alias'],
            notionDatabaseId: row['notion_database_id'],
        });
    }

    /** @param {import('../templates/Template')} template */
    async storeTemplate(template) {
        const order = template.order ?? (this.getMaximumTemplateOrder(template.userId) + 1)
        const defaultFields = JSON.stringify(template.defaultFields.map(item => this.serializeField(item)))

        return this.deserializeTemplate(
            this._sqlite
                .prepare(`
                    INSERT INTO templates (user_id, pattern, \`order\`, default_fields)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT
                    DO UPDATE
                    SET (\`order\`, default_fields) = (?, ?)
                    RETURNING *;
                `)
                .get(
                    template.userId,
                    template.pattern,
                    order,
                    defaultFields,
                    order,
                    defaultFields,
                )
        );
    }

    getMaximumTemplateOrder(userId) {
        return (
            this._sqlite
                .prepare(`
                    SELECT MAX(\`order\`) AS max_order
                    FROM templates
                    WHERE user_id = ?;
                `)
                .get(userId) ?? { 'max_order': 0 }
        )['max_order'];
    }

    async deleteTemplateByPattern(userId, pattern) {
        this._sqlite
            .prepare(`
                DELETE FROM templates
                WHERE pattern = ?
                AND user_id = ?;
            `)
            .run(pattern, userId)
    }

    async findTemplatesByUserId(userId) {
        return this._sqlite
            .prepare(`
                SELECT *
                FROM templates
                WHERE user_id = ?;
            `)
            .all(userId)
            .map(item => this.deserializeTemplate(item))
    }

    deserializeTemplate(row) {
        if (!row) return null;
        return new Template({
            userId: row['user_id'],
            pattern: row['pattern'],
            order: row['order'],
            defaultFields: JSON.parse(row['default_fields'])
                .map(item => this.deserializeField(item)),
        });
    }

    serializeField(field) {
        return {
            value: field.value,
            name: field.name,
            inputType: field.inputType,
            bang: field.bang,
        };
    }

    deserializeField(serializedField) {
        return new Field({
            value: serializedField.value,
            name: serializedField.name,
            inputType: serializedField.inputType,
            bang: serializedField.bang,
        });
    }
}

module.exports = SqliteStorage;
