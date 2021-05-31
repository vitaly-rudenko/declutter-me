class InMemoryStorage {
    constructor() {
        this._id = 0;
        this._users = [];
        this._telegramAccounts = [];
        this._notionAccounts = [];
        this._lists = [];
        this._patterns = [];
        this._closeReminders = [];
    }

    async createUser({ language, timezoneOffsetMinutes }) {
        this._id++;
        const user = { userId: this._id, language, timezoneOffsetMinutes };
        this._users.push(user);
        return user;
    }

    async findUser(userId) {
        return this._users.find(user => user.userId === userId);
    }

    async getUsers() {
        return this._users;
    }

    async createTelegramAccount(userId, telegramUserId) {
        const telegramAccount = { userId, telegramUserId };
        this._telegramAccounts.push(telegramAccount);
        return telegramAccount;
    }

    async findTelegramAccount(telegramUserId) {
        return this._telegramAccounts.find(account => account.telegramUserId === telegramUserId);
    }

    async findTelegramAccountByUserId(userId) {
        return this._telegramAccounts.find(account => account.userId === userId);
    }

    async createNotionAccount(userId, token) {
        const notionAccount = { userId, token, notesDatabaseId: null, remindersDatabaseId: null };
        this._notionAccounts.push(notionAccount);
        return notionAccount;
    }

    async setNotesDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        notionAccount.notesDatabaseId = databaseId;
    }

    async setRemindersDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        notionAccount.remindersDatabaseId = databaseId;
    }

    async createList(userId, databaseId, alias) {
        const list = { userId, databaseId, alias };
        this._lists.push(list);
        return list;
    }

    async findLists(userId) {
        return this._lists.filter(list => list.userId === userId);
    }

    async findList(userId, alias) {
        return this._lists.find(list => list.userId === userId && list.alias === alias);
    }

    async findNotionAccount(userId) {
        return this._notionAccounts.find(account => account.userId === userId);
    }

    async addPattern(userId, type, pattern, defaultVariables) {
        const patterns = await this.findPatterns(userId);
        const maxOrder = patterns.length > 0
            ? Math.max(...patterns.map(p => p.order))
            : 0;

        const storedPattern = { userId, order: maxOrder + 1, type, pattern, defaultVariables };
        this._patterns.push(storedPattern);
        return storedPattern;
    }

    async findPatterns(userId) {
        return this._patterns.filter(pattern => pattern.userId === userId).sort((a, b) => a.order - b.order);
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
        this._closeReminders[userId].splice(this._closeReminders[userId].find(r => r.id === id), 1);
    }
}

module.exports = InMemoryStorage;
