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
const lists = [];

function stringifyPattern(pattern) {
    return pattern.map((token) => {
        if (token.type === 'variable') {
            if (token.bang) {
                return `{${token.value}!}`;
            } else {
                return `{${token.value}}`;
            }
        }

        if (token.type === 'optional') {
            return `[${stringifyPattern(token.value)}]`;
        }

        if (token.type === 'variational') {
            return `(${token.value.map(variation => stringifyPattern(variation)).join('|')})`;
        }

        return token.value;
    }).join('');
}

const storage = {
    async createUser() {
        const user = { userId: 1 };
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
    async createList(userId, databaseId, alias) {
        const list = { userId, databaseId, alias };
        lists.push(list);
        return list;
    },
    async findLists(userId) {
        return lists.filter(list => list.userId === userId);
    },
    async findList(userId, alias) {
        return lists.find(list => list.userId === userId && list.alias === alias);
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

    delete(key) {
        this._data.delete(key);
    }
}

(async () => {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const userPhases = new Cache(60 * 1000);
    const userPhaseContext = new Cache(60 * 1000);

    bot.telegram.setMyCommands([
        { command: '/start', description: 'Start the bot' },
        { command: '/info', description: 'Prints your information' },
        { command: '/notion', description: 'Configure Notion' },
        { command: '/list', description: 'Add list' },
        { command: '/pattern', description: 'Add pattern' },
    ]);

    const withTelegramAccount = () => {
        return async (ctx, next) => {
            ctx.state.telegramAccount = await storage.findTelegramAccount(ctx.from.id);

            if (ctx.state.telegramAccount) {
                ctx.state.userId = ctx.state.telegramAccount.userId;
            }

            return next();
        };
    };

    const withUser = ({ required = true } = {}) => {
        return async (ctx, next) => {
            if (!ctx.state.userId) {
                ctx.reply('Please use /start first 🙇');
                return;
            }

            ctx.state.user = await storage.findUser(ctx.state.userId);
            if (!ctx.state.user && required) {
                ctx.reply('Please use /start first 🙇');
                return;
            }

            return next();
        };
    };

    const withNotionAccount = ({ required = true } = {}) => {
        return async (ctx, next) => {
            ctx.state.notionAccount = await storage.findNotionAccount(ctx.state.userId);

            if (!ctx.state.notionAccount && required) {
                ctx.reply('Please use `/notion` first 🙇');
                return;
            }

            return next();
        };
    };

    const withPhase = (phase, middleware) => {
        return (ctx, next) => {
            if ((userPhases.get(ctx.state.userId) || null) === phase) {
                return middleware(ctx, next);
            } else {
                return next();
            }
        };
    }

    bot.use(withTelegramAccount());

    bot.start(async (ctx) => {
        if (ctx.state.telegramAccount) {
            await ctx.reply('You are ready to go!');
            return;
        }

        const user = await storage.createUser();
        await storage.createTelegramAccount(user.userId, ctx.from.id);

        await ctx.reply('Hi! Use /notion to setup Notion integration.');
    });

    bot.command('info',
        withUser({ required: false }),
        withNotionAccount({ required: false }),
        async (ctx) => {
            const lists = ctx.state.userId ? await storage.findLists(ctx.state.userId) : [];
            const patterns = ctx.state.userId ? await storage.findPatterns(ctx.state.userId) : [];

            await ctx.reply(
                `Hi, ${ctx.from.first_name}!\n` +
                `Your info:\n` +
                `  - Language: ${ctx.state.user?.language ?? '<not provided>'}\n` +
                `  - Timezone offset: ${ctx.state.user?.timezoneOffsetMinutes ?? '<not provided>'}\n` +
                `  - Notion token: ${ctx.state.notionAccount?.token ?? '<not provided>'}\n` +
                `  - Notes: ${ctx.state.notionAccount?.notesDatabaseId ?? '<not provided>'}\n` +
                `  - Reminders: ${ctx.state.notionAccount?.remindersDatabaseId ?? '<not provided>'}\n` +
                `  - Lists:\n` +
                (lists.map(list => `    - ${list.alias} (${list.databaseId})`).join('\n') || '    <none>') + '\n' +
                `  - Patterns:\n` +
                (patterns.map(pattern => `    - ${pattern.type}: ${stringifyPattern(pattern.pattern)}`).join('\n') || '    <none>') + '\n'
            );
        }
    );

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply('Your Notion integration token:');
        userPhases.set(ctx.state.userId, 'notion:token');
    });

    bot.command('list', withUser(), withNotionAccount(), async (ctx) => {
        await ctx.reply('Link to your List database:');
        userPhases.set(ctx.state.userId, 'list:link');
    });

    bot.command('pattern', withUser(), withNotionAccount(), async (ctx) => {
        await ctx.reply(
            'Choose pattern type:',
            Markup.inlineKeyboard([
                Markup.button.callback('Note', 'pattern:note'),
                Markup.button.callback('List', 'pattern:list'),
                Markup.button.callback('Reminder', 'pattern:reminder'),
            ])
        );
        userPhases.set(ctx.state.userId, 'pattern:type');
    });

    bot.action('pattern:note', withPhase('pattern:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the pattern:');

        userPhaseContext.set(ctx.state.userId, { type: 'note' });
        userPhases.set(ctx.state.userId, 'pattern:pattern');
    }));

    bot.action('pattern:reminder', withPhase('pattern:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the pattern:');

        userPhaseContext.set(ctx.state.userId, { type: 'reminder' });
        userPhases.set(ctx.state.userId, 'pattern:pattern');
    }));

    bot.action('pattern:list', withPhase('pattern:type', async (ctx) => {
        await ctx.answerCbQuery();

        userPhaseContext.set(ctx.state.userId, { type: 'list' });

        const lists = await storage.findLists(ctx.state.userId);
        if (lists.length > 0) {
            await ctx.reply(
                'Got it! What list would you like to use by default?',
                Markup.inlineKeyboard([
                    ...lists.map(list => Markup.button.callback(list.alias, 'pattern:list:' + list.alias)),
                    Markup.button.callback('Skip', 'pattern:list:alias:skip'),
                ])
            );
    
            userPhases.set(ctx.state.userId, 'pattern:list:alias');
        } else {
            await ctx.reply(`Okay! Now send me the pattern:`);
            userPhases.set(ctx.state.userId, 'pattern:pattern');
        }
    }));

    bot.action(/pattern:list:(.+)/, withPhase('pattern:list:alias', async (ctx) => {
        await ctx.answerCbQuery();
        
        const alias = ctx.match[1];
        userPhaseContext.get(ctx.state.userId).defaultVariables = { list: alias };

        await ctx.reply(`Default list: "${alias}".\nNow send me the pattern:`);
        userPhases.set(ctx.state.userId, 'pattern:pattern');
    }));

    bot.action('pattern:list:alias:skip', withPhase('pattern:list:alias', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply(`Okay! Now send me the pattern:`);
        userPhases.set(ctx.state.userId, 'pattern:pattern');
    }));

    bot.on('message',
        withUser(),
        // Notion
        withPhase('notion:token', async (ctx) => {
            const token = ctx.message.text;
            await storage.createNotionAccount(ctx.state.userId, token);
            await ctx.reply(`It\'s "${token}".\nLink to Notes database:`);
            userPhases.set(ctx.state.userId, 'notion:notes');
        }),
        withPhase('notion:notes', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            await storage.setNotesDatabaseId(ctx.state.userId, databaseId);
            await ctx.reply(`It\'s "${databaseId}".\nLink to Reminders database:`);
            userPhases.set(ctx.state.userId, 'notion:reminders');
        }),
        withPhase('notion:reminders', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            await storage.setRemindersDatabaseId(ctx.state.userId, databaseId);
            await ctx.reply(`It\'s "${databaseId}".\nGreat, your Notion integration is all set!`);
            userPhases.delete(ctx.state.userId);
        }),
        // Lists
        withPhase('list:link', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            userPhaseContext.set(ctx.state.userId, databaseId);

            await ctx.reply(`It\'s "${databaseId}".\nAlias for the list:`);
            userPhases.set(ctx.state.userId, 'list:alias');
        }),
        withPhase('list:alias', async (ctx) => {
            const alias = ctx.message.text;
            const databaseId = userPhaseContext.get(ctx.state.userId);

            await storage.createList(ctx.state.userId, databaseId, alias);
            await ctx.reply(`List "${alias}" has been added!`);
            userPhases.delete(ctx.state.userId);
        }),
        // Patterns
        withPhase('pattern:pattern', async (ctx) => {
            const pattern = new PatternBuilder().build(ctx.message.text);

            await storage.addPattern(ctx.state.userId, userPhaseContext.get(ctx.state.userId).type, pattern);
            await ctx.reply('Pattern has been added!');
            userPhases.delete(ctx.state.userId);
        }),
        // Handle message
        withNotionAccount(),
        withPhase(null, async (ctx) => {
            const { user: { userId, timezoneOffsetMinutes }, notionAccount } = ctx.state;
    
            if (ctx.message.text.startsWith('/')) {
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
    
                const result = patternMatcher.match(ctx.message.text, pattern.pattern, matchers);
    
                if (result.match) {    
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
                        const alias = result.variables.list;
                        const item = result.variables.item;

                        const list = await storage.findList(userId, alias);
                        if (!list) {
                            if (result.bang?.list) {
                                continue;
                            }
                            await ctx.reply(`Could not find the list: "${list}"`);
                            return;
                        }
                        
                        await notion.pages.create({
                            'parent': { 'database_id': list.databaseId },
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

                    await ctx.reply('It\'s a match! 🎉\n\n' + JSON.stringify(result.variables, null, 2));
                    
                    return;
                }
            }
    
            await ctx.reply('What was it? 🤔');
        })
    );

    bot.command('reset', async (ctx) => {
        users.splice();
        telegramAccounts.splice();
        notionAccounts.splice();
        patterns.splice();

        await ctx.reply('Done!');
    });

    function databaseIdFromLink(link) {
        return new URL(link).pathname.slice(1);
    }

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
