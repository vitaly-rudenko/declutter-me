const { Telegraf } = require('telegraf');
const { URL } = require('url');
const { Client } = require('@notionhq/client');

const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const NoteMatchers = require('./app/matchers/NoteMatchers');

require('dotenv').config();

const users = [
    { userId: 1 },
];
const telegramAccounts = [
    { userId: 1, telegramUserId: 56681133 },
];
const notionAccounts = [
    {
        userId: 1,
        token: 'secret_sUmg2sizdQDYmfGrQ0amjXSuOv4tHTevLn4PVgcopG6',
        notesDatabaseId: 'a64b650b4036407385272f3867de44f3',
        remindersDatabaseId: 'edfe4ac495d24ddd88cbe45e635d0418',
    },
];
const patterns = [{
    userId: 1,
    order: 1,
    type: 'note',
    pattern: [
        {
            type: 'variable',
            value: 'note'
        },
        {
            type: 'text',
            value: ' #'
        },
        {
            type: 'variable',
            value: 'tag'
        }
    ]
}];

const storage = {
    async createUser() {
        const user = { id: 1 };
        users.push(user);
        return user;
    },
    async createTelegramAccount(userId, telegramUserId) {
        const telegramAccount = { userId, telegramUserId };
        telegramAccounts.push(telegramAccount);
        return telegramAccount;
    },
    async findTelegramAccount(telegramUserId) {
        return telegramAccounts.find(account => account.telegramUserId === telegramUserId);
    },
    async createNotionAccount(userId, token) {
        const notionAccount = { userId, token };
        notionAccounts.push(notionAccount);
        return notionAccount;
    },
    async setNotesDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        notionAccount.notesDatabaseId = databaseId;
    },
    async setRemindersDatabaseId(userId, databaseId) {
        const notionAccount = await this.findNotionAccount(userId);
        notionAccount.remindersDatabaseId = databaseId;
    },
    async findNotionAccount(userId) {
        return notionAccounts.find(account => account.userId === userId);
    },
    async addPattern(userId, type, pattern) {
        const storedPattern = { userId, order: 1, type, pattern };
        patterns.push(storedPattern);
        return storedPattern;
    },
    async findPatterns(userId) {
        return patterns.filter(pattern => pattern.userId === userId).sort((a, b) => a.order - b.order);
    },
};

(async () => {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    bot.telegram.setMyCommands([
        { command: '/start', description: 'Start the bot' },
        { command: '/connect_notion', description: 'Connect Notion account' },
        { command: '/add_list', description: 'Add list database' },
        { command: '/set_notes', description: 'Set notes database' },
        { command: '/set_reminders', description: 'Set reminders database' },
        { command: '/add_pattern', description: 'Add pattern' },
    ]);

    bot.start(async (context) => {
        const user = await storage.createUser();
        await storage.createTelegramAccount(user.id, context.from.id);

        context.reply('Hi\\! 👋\nSend me your Notion integration token:\n`/connect_notion <token>`', { parse_mode: 'MarkdownV2' });
    });

    bot.command('/connect_notion', async (context) => {
        const token = context.message.text.split(' ')[1];

        const telegramAccount = await storage.findTelegramAccount(context.from.id);
        await storage.createNotionAccount(telegramAccount.userId, token);

        context.reply('Notion account has been connected ✅\n\\- `/add_list <alias> <URL>`\n\\- `/set_notes <URL>`\n\\- `/set_reminders <URL>`',
            { parse_mode: 'MarkdownV2' });
    });

    bot.command('/set_notes', async (context) => {
        const { userId } = await storage.findTelegramAccount(context.from.id);

        const url = context.message.text.split(' ')[1];
        const parsedUrl = new URL(url);

        const databaseId = parsedUrl.pathname.slice(1);
        await storage.setNotesDatabaseId(userId, databaseId)
    });

    bot.command('/set_reminders', async (context) => {
        const { userId } = await storage.findTelegramAccount(context.from.id);

        const url = context.message.text.split(' ')[1];
        const parsedUrl = new URL(url);

        const databaseId = parsedUrl.pathname.slice(1);
        await storage.setRemindersDatabaseId(userId, databaseId)
    });

    bot.command('/add_pattern', async (context) => {
        const { userId } = await storage.findTelegramAccount(context.from.id);

        const messageParts = context.message.text.split(' ');
        messageParts.shift();

        const type = messageParts.shift();
        const rawPattern = messageParts.join(' ');

        const pattern = new PatternBuilder().build(rawPattern);

        await storage.addPattern(userId, type, pattern);

        context.reply('Pattern has been added\\! 🗒\n\n```\n' + JSON.stringify(pattern, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    });

    bot.command('/get_patterns', async (context) => {

    });

    bot.on('message', async (context) => {
        const { userId } = await storage.findTelegramAccount(context.from.id);

        if (context.message.text.startsWith('/')) {
            return;
        }

        const patterns = await storage.findPatterns(userId);

        const patternMatcher = new PatternMatcher();
        const noteMatchers = new NoteMatchers();

        for (const pattern of patterns) {
            const matchers = pattern.type === 'note' ? noteMatchers : null;
            const result = patternMatcher.match(context.message.text, pattern.pattern, matchers);

            if (result.match) {
                context.reply('It\'s a match\\! 🎉\n\n```\n' + JSON.stringify(result.variables, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
                return;
            }
        }

        context.reply('What was it? 🤔');
    });

    const notion = new Client({
        auth: notionAccounts[0].token,
    });

    const notesPage = await notion.databases.query({
        database_id: notionAccounts[0].notesDatabaseId,
    });
    const remindersPage = await notion.databases.query({
        database_id: notionAccounts[0].remindersDatabaseId,
    });

    // console.log(JSON.stringify(notesPage, null, 4));
    // console.log(JSON.stringify(remindersPage, null, 4));

    await bot.launch({
        allowedUpdates: ['callback_query', 'message'],
        dropPendingUpdates: true,
    });

    console.log('Bot started!');
})();
