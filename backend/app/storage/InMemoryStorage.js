const NotionAccount = require('../notion/NotionAccount');
const Reminder = require('../reminders/Reminder');
const TelegramAccount = require('../telegram/TelegramAccount');
const Template = require('../templates/Template');
const User = require('../users/User');

class InMemoryStorage {
    constructor() {
        this._id = 0;

        /** @type {User[]} */
        this._users = [];
        /** @type {import('../notion/NotionDatabase')[]} */
        this._databases = [];
        /** @type {TelegramAccount[]} */
        this._telegramAccounts = [];
        /** @type {NotionAccount[]} */
        this._notionAccounts = [];
        /** @type {Template[]} */
        this._templates = [];
        /** @type {Reminder[][]} */
        this._closeReminders = [];
    }

    async createUser({ language, timezoneOffsetMinutes }) {
        this._id++;
        const user = new User({ id: this._id, language, timezoneOffsetMinutes });
        this._users.push(user);
        return user;
    }

    async updateUser(userId, { language, timezoneOffsetMinutes }) {
        const index = this._users.findIndex(u => u.id === userId);
        if (index === -1) {
            throw new Error(`User "${userId}" not found!`);
        }

        this._users[index] = this._users[index].clone({
            language,
            timezoneOffsetMinutes,
        });
    }

    async findUserById(id) {
        return this._users.find(u => u.id === id) || null;
    }

    async getUsers() {
        return this._users;
    }

    async createTelegramAccount(userId, telegramUserId) {
        const telegramAccount = new TelegramAccount({ userId, telegramUserId });
        this._telegramAccounts.push(telegramAccount);
        return telegramAccount;
    }

    async deleteTemplateByPattern(pattern) {
        const index = this._templates.findIndex(t => t.pattern === pattern);
        if (index === -1) return;

        this._templates.splice(index, 1);
    }

    async findTelegramAccount(telegramUserId) {
        return this._telegramAccounts.find(a => a.telegramUserId === telegramUserId) || null;
    }

    async findTelegramAccountByUserId(userId) {
        return this._telegramAccounts.find(a => a.userId === userId) || null;
    }

    async createNotionAccount(userId, token) {
        const notionAccount = new NotionAccount({ userId, token });
        this._notionAccounts.push(notionAccount);
        return notionAccount;
    }

    async findNotionAccount(userId) {
        return this._notionAccounts.find(a => a.userId === userId) || null;
    }

    // TODO: there should be a default database for reminders to sync them properly

    /** @param {import('../notion/NotionDatabase')} database */
    async storeDatabase(database) {
        if (this._databases.some(d => d.userId === database.userId && d.alias === database.alias)) {
            throw new Error('Database alias already exists!');
        }

        this._databases.push(database);
        return database;
    }

    async deleteDatabaseByAlias(alias) {
        const index = this._databases.findIndex(d => d.alias === alias);
        if (index === -1) return;

        this._databases.splice(index, 1);
    }

    async findDatabasesByUserId(userId) {
        return this._databases.filter(d => d.userId === userId);
    }

    async findDatabaseByAlias(userId, alias) {
        return this._databases.find(d => d.userId === userId && d.alias === alias) || null;
    }

    /** @param {import('../templates/Template')} template */
    async storeTemplate(template) {
        const existingTemplateIndex = this._templates.findIndex(t => t.pattern === template.pattern);
        if (existingTemplateIndex !== -1) {
            this._templates.splice(existingTemplateIndex, 1);
        }

        if (!template.order) {
            const templates = this._templates.filter(t => t.userId === template.userId);
            template = template.clone({
                order: templates.length === 0
                    ? 1
                    : (Math.max(...templates.map(t => t.order)) + 1)
            });
        }

        this._templates.push(template);
        return template;
    }

    async findTemplatesByUserId(userId) {
        return this._templates.filter(t => t.userId === userId).sort((a, b) => a.order - b.order);
    }

    async storeCloseReminders(userId, reminders) {
        this._closeReminders[userId] = reminders;
    }

    /** @returns {Promise<Reminder[]>} */
    async getCloseReminders(userId) {
        return this._closeReminders[userId] || [];
    }

    async addCloseReminder(userId, reminder) {
        if (!this._closeReminders[userId]) {
            this._closeReminders[userId] = [];
        }

        this._closeReminders[userId].push(reminder);
    }

    async removeCloseReminder(userId, id) {
        if (!this._closeReminders[userId]) return;
        
        const index = this._closeReminders[userId].findIndex(r => r.id === id);
        if (index === -1) return;

        this._closeReminders[userId].splice(index, 1);
    }

    async cleanUp() {
        this._id = 0;
        this._users = [];
        this._telegramAccounts = [];
        this._notionAccounts = [];
        this._databases = [];
        this._templates = [];
        this._closeReminders = [];
    }
}

module.exports = InMemoryStorage;
