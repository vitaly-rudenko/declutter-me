const NotionReminderSerializer = require('./NotionReminderSerializer');

class ReminderManager {
    /**
     * @param {{
     *     notionSessionManager: import('../notion-accounts/NotionSessionManager'),
     *     storage: import('../storage/InMemoryStorage'),
     *     bot: import('telegraf').Telegraf,
     * }} dependencies
     */
    constructor({ notionSessionManager, storage, bot }) {
        this._notionSessionManager = notionSessionManager;
        this._storage = storage;
        this._bot = bot;
    }

    async syncAll() {
        const users = await this._storage.getUsers();
        for (const user of users) {
            await this.sync(user.id);
        }
    }

    async sync(userId) {
        const reminders = await this._fetch(userId);
        const closeReminders = reminders.filter(reminder => this.isClose(reminder));

        await this._storage.storeCloseReminders(userId, closeReminders);
    }

    async _fetch(userId) {
        const [notion, notionAccount] = await this._notionSessionManager.get(userId);
        const pages = await notion.databases.query({
            'database_id': notionAccount.remindersDatabaseId,
        });

        return pages.results
            .map(page => new NotionReminderSerializer().deserialize(page))
            .filter(Boolean);
    }

    isClose(reminder) {
        return !reminder.reminded && reminder.date.getTime() <= (Date.now() + 5 * 60 * 60_000);
    }

    async sendAll() {
        const users = await this._storage.getUsers();
        for (const user of users) {
            await this.send(user.id);
        }
    }

    async send(userId) {
        const telegramAccount = await this._storage.findTelegramAccountByUserId(userId);
        const reminders = await this._storage.getCloseReminders(userId);
        const remindersToSend = reminders.filter(r => r.date <= Date.now());
        
        for (const reminder of remindersToSend) {
            await this._markReminderAsDone(userId, reminder.id);
            await this._storage.removeCloseReminder(userId, reminder.id);
            await this._bot.telegram.sendMessage(telegramAccount.telegramUserId, reminder.content);
        }
    }

    async _markReminderAsDone(userId, reminderId) {
        const [notion] = await this._notionSessionManager.get(userId);

        await notion.pages.update({
            'page_id': reminderId,
            'properties': {
                'Reminded': {
                    'type': 'checkbox',
                    'checkbox': true
                }
            }
        });
    }
}

module.exports = ReminderManager;
