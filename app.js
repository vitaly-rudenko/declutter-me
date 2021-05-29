const { Telegraf, Scenes, Composer, Markup, session } = require('telegraf');
const { URL } = require('url');
const { Client } = require('@notionhq/client');

const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const NoteMatchers = require('./app/matchers/NoteMatchers');
const ListMatchers = require('./app/matchers/ListMatchers');
const ReminderMatchers = require('./app/matchers/ReminderMatchers');

require('dotenv').config();

const users = [
    { userId: 1, language: 'russian', timezoneOffsetMinutes: 3 * 60 },
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
    type: 'list',
    pattern: new PatternBuilder().build('купить {item}'),
    defaultVariables: { list: 'shopping' }
}, {
    userId: 1,
    order: 2,
    type: 'reminder',
    pattern: new PatternBuilder().build('[напомни ]({reminder} {date}|{date} {reminder})'),
}, {
    userId: 1,
    order: 3,
    type: 'list',
    pattern: new PatternBuilder().build('#{list} {item}'),
}, {
    userId: 1,
    order: 4,
    type: 'list',
    pattern: new PatternBuilder().build('{item} #{list!}'),
}, {
    userId: 1,
    order: 5,
    type: 'note',
    pattern: new PatternBuilder().build('{note}[ #{tag}][ #{tag}][ #{tag}]'),
}];

const storage = {
    async createUser() {
        const user = { id: 1 };
        users.push(user);
        return user;
    },
    async findUser(userId) {
        return users.find(user => user.userId === userId);
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

class Cache {
    constructor(ttlMs) {
        this._ttlMs = ttlMs;
        this._data = new Map();

        setInterval(() => {
            const entries = [...this._data.entries()];

            for (let i = entries.length - 1; i >= 0; i--) {
                const [key, [updatedAt]] = entries[i];

                if (Date.now() - updatedAt >= ttlMs) {
                    this._data.delete(key);
                }
            }
        }, ttlMs);
    }

    set(key, value) {
        this._data.set(key, [Date.now(), value]);
    }

    get(key) {
        if (!this._data.has(key)) {
            return undefined;
        }

        return this._data.get(key)[1];
    }
}

(async () => {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const userPhases = new Cache(60 * 1000);

    bot.telegram.setMyCommands([
        { command: '/start', description: 'Start the bot' },
        { command: '/notion', description: 'Configure Notion' },
        { command: '/patterns', description: 'Patterns menu' },
    ]);

    bot.use(async (context, next) => {
        context.telegramAccount = await storage.findTelegramAccount(context.from.id);
        return next();
    });

    bot.action('/notion', async (context) => {
        const { userId } = context.telegramAccount;

        userPhases.set(userId, )
    });

    bot.start(async (context) => {
        const user = await storage.createUser();
        await storage.createTelegramAccount(user.id, context.from.id);

        await context.reply('Hi\\! 👋\nSend me your Notion integration token:\n`/connect_notion <token>`', { parse_mode: 'MarkdownV2' });
    });

    bot.command('/connect_notion', async (context) => {
        const token = context.message.text.split(' ')[1];

        const telegramAccount = context.telegramAccount;
        await storage.createNotionAccount(telegramAccount.userId, token);

        await context.reply('Notion account has been connected ✅\n\\- `/add_list <alias> <URL>`\n\\- `/set_notes <URL>`\n\\- `/set_reminders <URL>`',
            { parse_mode: 'MarkdownV2' });
    });

    bot.command('/set_notes_database', async (context) => {
        const { userId } = context.telegramAccount;

        const url = context.message.text.split(' ')[1];
        const parsedUrl = new URL(url);

        const databaseId = parsedUrl.pathname.slice(1);
        await storage.setNotesDatabaseId(userId, databaseId);

        await context.reply('Database for notes has been set! 📔');
    });

    bot.command('/set_reminders_database', async (context) => {
        const { userId } = context.telegramAccount;

        const url = context.message.text.split(' ')[1];
        const parsedUrl = new URL(url);

        const databaseId = parsedUrl.pathname.slice(1);
        await storage.setRemindersDatabaseId(userId, databaseId);

        await context.reply('Database for reminders has been set! 📅');
    });

    bot.command('/add_note_pattern', async (context) => {
        const { userId } = context.telegramAccount;

        const messageParts = context.message.text.split(' ');
        messageParts.shift();
        const defaultVariables = JSON.parse(messageParts.shift());

        const rawPattern = messageParts.join(' ');

        const pattern = new PatternBuilder().build(rawPattern);

        await storage.addPattern(userId, 'note', pattern, defaultVariables);

        await context.reply('Pattern has been added\\! 🗒\n\n```\n' + JSON.stringify(pattern, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    });

    bot.command('/add_reminder_pattern', async (context) => {
        const { userId } = context.telegramAccount;

        const messageParts = context.message.text.split(' ');
        messageParts.shift();

        const rawPattern = messageParts.join(' ');

        const pattern = new PatternBuilder().build(rawPattern);

        await storage.addPattern(userId, 'reminder', pattern);

        await context.reply('Pattern has been added\\! 🗒\n\n```\n' + JSON.stringify(pattern, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    });

    bot.command('/get_patterns', async (context) => {
        const { userId } = context.telegramAccount;

        const patterns = await storage.findPatterns(userId);

        await context.reply('Your patterns:\n\n```\n' + JSON.stringify(patterns, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    });

    bot.on('message', async (context) => {
        const { userId } = context.telegramAccount;
        const { timezoneOffsetMinutes } = await storage.findUser(userId);
        const notionAccount = await storage.findNotionAccount(userId);

        if (context.message.text.startsWith('/')) {
            return;
        }

        const patterns = await storage.findPatterns(userId);

        const dateParser = new RussianDateParser();
        const patternMatcher = new PatternMatcher();
        const noteMatchers = new NoteMatchers();
        const listMatchers = new ListMatchers();
        const reminderMatchers = new ReminderMatchers({ dateParser });

        for (const pattern of patterns) {
            const matchers = pattern.type === 'note'
                ? noteMatchers
                : pattern.type === 'reminder'
                    ? reminderMatchers
                    : listMatchers;

            const result = patternMatcher.match(context.message.text, pattern.pattern, matchers);

            console.log(context.message.text, '+', pattern.pattern, '+', matchers);

            if (result.match) {
                await context.reply('It\'s a match\\! 🎉\n\n```\n' + JSON.stringify(result.variables, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });

                const notion = new Client({ auth: notionAccount.token });

                if (pattern.type === 'note') {
                    const name = result.variables.note;
                    const tags = result.variables.tag
                        ? Array.isArray(result.variables.tag)
                            ? result.variables.tag
                            : [result.variables.tag]
                        : [];
    
                    await notion.pages.create({
                        'parent': { 'database_id': notionAccount.notesDatabaseId },
                        'properties': {
                            'Note': {
                                'title': [{
                                    'type': 'text',
                                    'text': {
                                        'content': name,
                                    }
                                }]
                            },
                            ...tags.length > 0 && {
                                'Tags': {
                                    'multi_select': tags.map(tag => ({ name: tag })),
                                },
                            }
                        }
                    });
                } else if (pattern.type === 'reminder') {
                    const date = dateParser.parse(result.variables.date);
                    const reminder = result.variables.reminder;

                    await notion.pages.create({
                        'parent': { 'database_id': notionAccount.remindersDatabaseId },
                        'properties': {
                            'Reminder': {
                                'title': [{
                                    'type': 'text',
                                    'text': {
                                        'content': reminder,
                                    }
                                }]
                            },
                            'Date': {
                                'date': {
                                    'start': formatUtcDateWithTimezone(date, timezoneOffsetMinutes),
                                }
                            }
                        }
                    });
                } else if (pattern.type === 'list') {
                    const list = result.variables.list;
                    const item = result.variables.item;

                    const { databaseId } = await storage.findList(list);

                    await notion.pages.create({
                        'parent': { 'database_id': databaseId },
                        'properties': {
                            'Item': {
                                'title': [{
                                    'type': 'text',
                                    'text': {
                                        'content': item,
                                    }
                                }]
                            }
                        }
                    });
                }
                
                return;
            }
        }

        await context.reply('What was it? 🤔');
    });

    await bot.launch({
        allowedUpdates: ['callback_query', 'message'],
        dropPendingUpdates: true,
    });

    console.log('Bot started!');
})();

function formatUtcDateWithTimezone(date, timezoneOffsetMinutes) {
    const dateWithTimezone = new Date(date.getTime() + timezoneOffsetMinutes * 60 * 1000);

    const timezoneHours = Math.trunc(timezoneOffsetMinutes / 60);
    const timezoneMinutes = (timezoneOffsetMinutes - timezoneHours * 60);

    const timezone = String(timezoneHours).padStart(2, '0')
        + ':' + String(timezoneMinutes).padStart(2, '0');
    
    return dateWithTimezone.toISOString().slice(0, -1) + (timezoneOffsetMinutes >= 0 ? '+' : '-') + timezone;
}
