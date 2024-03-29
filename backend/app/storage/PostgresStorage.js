import pg from 'pg';
import { v4 as uuid } from 'uuid'
import { Field } from '@vitalyrudenko/templater';
import { NotionAccount } from '../notion/NotionAccount.js';
import { NotionDatabase } from '../notion/NotionDatabase.js';
import { TelegramAccount } from '../telegram/TelegramAccount.js';
import { Template } from '../templates/Template.js';
import { User } from '../users/User.js';

export class PostgresStorage {
    constructor(connectionString) {
        this._client = new pg.Client(connectionString);
    }

    async connect() {
        await this._client.connect();
    }

    /** @param {import('../users/User').User} user */
    async createUser(user) {
        const response = await this._client.query(`
            INSERT INTO users (id, language, timezone_offset_minutes, api_key)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [uuid(), user.language, user.timezoneOffsetMinutes, user.apiKey])
        
        return this.deserializeUser(response.rows[0]);
    }

    
    /** @param {import('../users/User').User} user */
    async updateUser(user) {
        const response = await this._client.query(`
            UPDATE users
            SET (language, timezone_offset_minutes, api_key) = ($2, $3, $4)
            WHERE id = $1
            RETURNING *;
        `, [user.id, user.language, user.timezoneOffsetMinutes, user.apiKey]);

        return this.deserializeUser(response.rows[0]);
    }

    async findUserById(userId) {
        const response = await this._client.query(`
            SELECT *
            FROM users
            WHERE id = $1
        `, [userId]);

        return this.deserializeUser(response.rows[0]);
    }

    async findUserByApiKey(apiKey) {
        const response = await this._client.query(`
            SELECT *
            FROM users
            WHERE api_key = $1
        `, [apiKey]);

        return this.deserializeUser(response.rows[0]);
    }

    deserializeUser(row) {
        if (!row) return null;
        return new User({
            id: row['id'],
            language: row['language'],
            timezoneOffsetMinutes: row['timezone_offset_minutes'],
            apiKey: row['api_key'],
        });
    }

    /** @param {import('../telegram/TelegramAccount').TelegramAccount} telegramAccount */
    async createTelegramAccount(telegramAccount) {
        const response = await this._client.query(`
            INSERT INTO telegram_accounts (user_id, telegram_user_id)
            VALUES ($1, $2)
            RETURNING *;
        `, [telegramAccount.userId, telegramAccount.telegramUserId]);

        return this.deserializeTelegramAccount(response.rows[0]);
    }

    async findTelegramAccountByTelegramUserId(telegramUserId) {
        const response = await this._client.query(`
            SELECT *
            FROM telegram_accounts
            WHERE telegram_user_id = $1;
        `, [telegramUserId]);

        return this.deserializeTelegramAccount(response.rows[0]);
    }

    deserializeTelegramAccount(row) {
        if (!row) return null;
        return new TelegramAccount({
            userId: row['user_id'],
            telegramUserId: Number(row['telegram_user_id']),
        });
    }

    /** @param {import('../notion/NotionAccount').NotionAccount} notionAccount */
    async upsertNotionAccount(notionAccount) {
        const response = await this._client.query(`
            INSERT INTO notion_accounts (user_id, token)
            VALUES ($1, $2)
            ON CONFLICT ON CONSTRAINT notion_accounts_pkey
            DO UPDATE
            SET token = $2
            RETURNING *;
        `, [notionAccount.userId, notionAccount.token]);

        return this.deserializeNotionAccount(response.rows[0]);
    }

    async findNotionAccountByUserId(userId) {
        const response = await this._client.query(`
            SELECT *
            FROM notion_accounts
            WHERE user_id = $1
        `, [userId]);

        return this.deserializeNotionAccount(response.rows[0]);
    }

    deserializeNotionAccount(row) {
        if (!row) return null;
        return new NotionAccount({
            userId: row['user_id'],
            token: row['token'],
        });
    }


    /** @param {import('../notion/NotionDatabase').NotionDatabase} notionDatabase */
    async storeDatabase(notionDatabase) {
        const response = await this._client.query(`
            INSERT INTO notion_databases (user_id, alias, notion_database_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [notionDatabase.userId, notionDatabase.alias, notionDatabase.notionDatabaseUrl]);

        return this.deserializeDatabase(response.rows[0]);
    }

    async deleteDatabaseByAlias(userId, alias) {
        await this._client.query(`
            DELETE FROM notion_databases
            WHERE alias = $1
            AND user_id = $2;
        `, [alias, userId]);
    }

    async deleteDatabasesByUserId(userId) {
        await this._client.query(`
            DELETE FROM notion_databases
            WHERE user_id = $1;
        `, [userId]);
    }

    async findDatabasesByUserId(userId) {
        const response = await this._client.query(`
            SELECT *
            FROM notion_databases
            WHERE user_id = $1;
        `, [userId]);

        return response.rows.map(row => this.deserializeDatabase(row))
    }

    async findDatabaseByAlias(userId, alias) {
        const response = await this._client.query(`
            SELECT *
            FROM notion_databases
            WHERE user_id = $1
            AND alias = $2;
        `, [userId, alias]);

        return this.deserializeDatabase(response.rows[0]);
    }

    deserializeDatabase(row) {
        if (!row) return null;
        return new NotionDatabase({
            userId: row['user_id'],
            alias: row['alias'],
            notionDatabaseUrl: row['notion_database_url'],
        });
    }

    /** @param {import('../templates/Template').Template} template */
    async storeTemplate(template) {
        const order = template.order ?? 1;
        const defaultFields = JSON.stringify(template.defaultFields.map(item => this.serializeField(item)))

        let response;
        try {
            await this._client.query('BEGIN;');

            if (template.order === null) {
                await this._client.query(`
                    UPDATE templates
                    SET "order" = "order" + 1
                    WHERE user_id = $1;
                `, [template.userId]);
            }

            response = await this._client.query(`
                INSERT INTO templates (user_id, pattern, "order", default_fields)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT ON CONSTRAINT templates_pkey
                DO UPDATE
                SET ("order", default_fields) = ($3, $4)
                RETURNING *;
            `, [
                template.userId,
                template.pattern,
                order,
                defaultFields,
            ]);

            await this._client.query('COMMIT;');
        } catch (error) {
            await this._client.query('ROLLBACK;');
            throw error;
        }

        return this.deserializeTemplate(response.rows[0]);
    }

    async getMaximumTemplateOrder(userId) {
        const response = await this._client.query(`
            SELECT MAX("order") AS max_order
            FROM templates
            WHERE user_id = $1;
        `, [userId]);

        return response?.rows?.[0]?.['max_order'] ?? 0;
    }

    async deleteTemplateByPattern(userId, pattern) {
        await this._client.query(`
            DELETE FROM templates
            WHERE pattern = $1
            AND user_id = $2;
        `, [pattern, userId]);
    }

    async deleteTemplatesByUserId(userId) {
        await this._client.query(`
            DELETE FROM templates
            WHERE user_id = $1;
        `, [userId]);
    }

    async findTemplatesByUserId(userId) {
        const response = await this._client.query(`
            SELECT *
            FROM templates
            WHERE user_id = $1
            ORDER BY "order" ASC;
        `, [userId]);

        return response.rows.map(row => this.deserializeTemplate(row));
    }

    async findTemplateByHash(userId, hash) {
        const response = await this._client.query(`
            SELECT *
            FROM templates
            WHERE user_id = $1 AND MD5(pattern) = $2
            LIMIT 1;
        `, [userId, hash]);

    return response.rows.length > 0
        ? this.deserializeTemplate(response.rows[0])
        : null;
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
        };
    }

    deserializeField(serializedField) {
        return new Field({
            value: serializedField.value,
            name: serializedField.name,
            inputType: serializedField.inputType,
        });
    }
}
