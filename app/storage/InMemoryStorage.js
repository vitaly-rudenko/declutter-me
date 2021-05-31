const NotionAccount = require('../entities/NotionAccount');
const NotionList = require('../entities/NotionList');
const TelegramAccount = require('../entities/TelegramAccount');
const Template = require('../entities/Template');
const User = require('../entities/User');
const NotionAccountNotFound = require('./NotionAccountNotFound');

class InMemoryStorage {
    constructor() {
        this._id = 0;
        this._users = [];
        this._telegramAccounts = [];
        this._notionAccounts = [];
        this._notionLists = [];
        this._templates = [];
        this._closeReminders = [];
    }

    async createUser({ language, timezoneOffsetMinutes }) {
        this._id++;
        const user = new User({ userId: this._id, language, timezoneOffsetMinutes });
        this._users.push(user);
        return user;
    }

    async findUser(userId) {
        return this._users.find(u => u.userId === userId) || null;
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

    async setNotesDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        if (!notionAccount) {
            throw new NotionAccountNotFound();
        }

        notionAccount.setNotesDatabaseId(databaseId);
    }

    async setRemindersDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        if (!notionAccount) {
            throw new NotionAccountNotFound();
        }

        notionAccount.setRemindersDatabaseId(databaseId);
    }

    async createList(userId, databaseId, alias) {
        const notionList = new NotionList({ userId, databaseId, alias });
        this._notionLists.push(notionList);
        return notionList;
    }

    async findLists(userId) {
        return this._notionLists.filter(l => l.userId === userId);
    }

    async findList(userId, alias) {
        return this._notionLists.find(l => l.userId === userId && l.alias === alias) || null;
    }

    async addPattern(userId, type, pattern, defaultVariables = {}) {
        const templates = await this.findPatterns(userId);
        const maxOrder = templates.length > 0
            ? Math.max(...templates.map(p => p.order))
            : 0;

        const template = new Template({ userId, order: maxOrder + 1, type, pattern, defaultVariables });
        this._templates.push(template);
        return template;
    }

    async findPatterns(userId) {
        return this._templates.filter(t => t.userId === userId).sort((a, b) => a.order - b.order);
    }

    async storeCloseReminders(userId, reminders) {
        this._closeReminders[userId] = reminders;
    }

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
}

module.exports = InMemoryStorage;
