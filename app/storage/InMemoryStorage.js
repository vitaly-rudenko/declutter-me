const NotionAccount = require('../notion/NotionAccount');
const List = require('../lists/List');
const Reminder = require('../reminders/Reminder');
const TelegramAccount = require('../telegram/TelegramAccount');
const Template = require('../templates/Template');
const User = require('../users/User');
const NotionAccountNotFound = require('../errors/NotionAccountNotFound');

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
        /** @type {List[]} */
        this._lists = [];
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

    /** @param {import('../notion/NotionDatabase')} database */
    async storeDatabase(database) {
        if (this._databases.some(d => d.userId === database.userId && d.alias === database.alias)) {
            throw new Error('Database alias already exists!');
        }

        this._databases.push(database);
        return database;
    }

    async findDatabasesByUserId(userId) {
        return this._databases.filter(d => d.userId === userId);
    }

    async findDatabaseByAlias({ userId, alias }) {
        return this._databases.find(d => d.userId === userId && d.alias === alias) || null;
    }

    /** @param {import('../templates/Template')} template */
    async storeTemplate(template) {
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
        this._lists = [];
        this._templates = [];
        this._closeReminders = [];
    }
}

module.exports = InMemoryStorage;
