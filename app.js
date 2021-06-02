const { Telegraf, Scenes, Composer, Markup, session } = require('telegraf');
const { URL } = require('url');
const { Client } = require('@notionhq/client');

const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const NoteMatchers = require('./app/matchers/NoteMatchers');
const ListMatchers = require('./app/lists/ListMatchers');
const ReminderMatchers = require('./app/matchers/ReminderMatchers');
const InMemoryStorage = require('./app/storage/InMemoryStorage');
const Cache = require('./app/utils/Cache');
const Reminder = require('./app/reminders/Reminder');
const List = require('./app/lists/List');
const Template = require('./app/templates/Template');

require('dotenv').config();

(async () => {
    const storage = new InMemoryStorage();
    const user = await storage.createUser({ language: 'russian', timezoneOffsetMinutes: 3 * 60 });
    await storage.createTelegramAccount(user.id, 56681133);
    await storage.createNotionAccount(user.id, 'secret_sUmg2sizdQDYmfGrQ0amjXSuOv4tHTevLn4PVgcopG6');
    await storage.setNotesDatabaseId(user.id, 'a64b650b4036407385272f3867de44f3');
    await storage.setRemindersDatabaseId(user.id, 'edfe4ac495d24ddd88cbe45e635d0418');
    await storage.storeTemplate(new Template({ userId: user.id, order: 1, type: 'reminder', pattern: new PatternBuilder().build('[напомни[ть][ мне] ]{reminder} {date}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 2, type: 'reminder', pattern: new PatternBuilder().build('{date} [напомни[ть][ мне] ]{reminder}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 3, type: 'list', pattern: new PatternBuilder().build('купить {item}'), defaultVariables: { list: 'shopping' } }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 4, type: 'list', pattern: new PatternBuilder().build('#{list} {item}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 5, type: 'list', pattern: new PatternBuilder().build('{item} #{list!}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 6, type: 'note', pattern: new PatternBuilder().build('{note}[ #{tag}][ #{tag}][ #{tag}]') }));
    await storage.storeList(new List({ id: 'ca75e1d762c24d4893e2d682c1823797', alias: 'shopping', userId: user.id }));
    await storage.storeList(new List({ id: '3af8dfb79d18428b86419bd7a211084a', alias: 'recipes', userId: user.id }));

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const userPhases = new Cache(60 * 60_000);
    const userPhaseContext = new Cache(60 * 60_000);
    const notions = new Cache(10 * 60_000);

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

            ctx.state.user = await storage.findUserById(ctx.state.userId);
            if (!ctx.state.user && required) {
                ctx.reply('Please use /start first 🙇');
                return;
            }

            return next();
        };
    };

    const withNotion = ({ required = true } = {}) => {
        return async (ctx, next) => {
            try {
                const [notion, notionAccount] = await getNotion(ctx.state.userId);
    
                ctx.state.notion = notion;
                ctx.state.notionAccount = notionAccount;
            } catch (error) {
                if (error instanceof NotionAccountNotFound) {
                    if (required) {
                        await ctx.reply('Please use `/notion` first 🙇');
                        return;
                    }
                }
                
                throw error;
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
        await storage.createTelegramAccount(user.id, ctx.from.id);

        await ctx.reply('Hi! Use /notion to setup Notion integration.');
    });

    bot.command('info',
        withUser({ required: false }),
        withNotion({ required: false }),
        async (ctx) => {
            const lists = ctx.state.userId ? await storage.findListsByUserId(ctx.state.userId) : [];
            const templates = ctx.state.userId ? await storage.findTemplatesByUserId(ctx.state.userId) : [];

            await ctx.reply(
                `Hi, ${ctx.from.first_name}!\n` +
                `Your info:\n` +
                `  - Language: ${ctx.state.user?.language ?? '<not provided>'}\n` +
                `  - Timezone offset: ${ctx.state.user?.timezoneOffsetMinutes ?? '<not provided>'}\n` +
                `  - Notion token: ${ctx.state.notionAccount?.token ?? '<not provided>'}\n` +
                `  - Notes: ${ctx.state.notionAccount?.notesDatabaseId ?? '<not provided>'}\n` +
                `  - Reminders: ${ctx.state.notionAccount?.remindersDatabaseId ?? '<not provided>'}\n` +
                `  - Lists:\n` +
                (lists.map(list => `    - ${list.alias} (${list.id})`).join('\n') || '    <none>') + '\n' +
                `  - Templates:\n` +
                (templates.map(template => `    - ${template.type}: ${stringifyPattern(template.pattern)}`).join('\n') || '    <none>') + '\n'
            );
        }
    );

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply('Your Notion integration token:');
        userPhases.set(ctx.state.userId, 'notion:token');
    });

    bot.command('list', withUser(), withNotion(), async (ctx) => {
        await ctx.reply('Link to your List database:');
        userPhases.set(ctx.state.userId, 'list:link');
    });

    bot.command('pattern', withUser(), withNotion(), async (ctx) => {
        await ctx.reply(
            'Choose pattern type:',
            Markup.inlineKeyboard([
                Markup.button.callback('Note', 'template:note'),
                Markup.button.callback('List', 'template:list'),
                Markup.button.callback('Reminder', 'template:reminder'),
            ])
        );
        userPhases.set(ctx.state.userId, 'template:type');
    });

    bot.action('template:note', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the template:');

        userPhaseContext.set(ctx.state.userId, { type: 'note' });
        userPhases.set(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:reminder', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the template:');

        userPhaseContext.set(ctx.state.userId, { type: 'reminder' });
        userPhases.set(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:list', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();

        userPhaseContext.set(ctx.state.userId, { type: 'list' });

        const lists = await storage.findListsByUserId(ctx.state.userId);
        if (lists.length > 0) {
            await ctx.reply(
                'Got it! What list would you like to use by default?',
                Markup.inlineKeyboard([
                    ...lists.map(list => Markup.button.callback(list.alias, 'template:list:' + list.alias)),
                    Markup.button.callback('Skip', 'template:list:alias:skip'),
                ])
            );
    
            userPhases.set(ctx.state.userId, 'template:list:alias');
        } else {
            await ctx.reply(`Okay! Now send me the template:`);
            userPhases.set(ctx.state.userId, 'template:pattern');
        }
    }));

    bot.action(/template:list:(.+)/, withPhase('template:list:alias', async (ctx) => {
        await ctx.answerCbQuery();
        
        const alias = ctx.match[1];
        userPhaseContext.get(ctx.state.userId).defaultVariables = { list: alias };

        await ctx.reply(`Default list: "${alias}".\nNow send me the template:`);
        userPhases.set(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:list:alias:skip', withPhase('template:list:alias', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply(`Okay! Now send me the template:`);
        userPhases.set(ctx.state.userId, 'template:pattern');
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

            await storage.storeList(
                new List({
                    id: databaseId,
                    userId: ctx.state.userId,
                    alias,
                })
            );

            await ctx.reply(`List "${alias}" has been added!`);
            userPhases.delete(ctx.state.userId);
        }),
        // Patterns
        withPhase('template:pattern', async (ctx) => {
            const pattern = new PatternBuilder().build(ctx.message.text);

            await storage.storeTemplate(
                new Template({
                    userId: ctx.state.userId,
                    type: userPhaseContext.get(ctx.state.userId).type,
                    pattern,
                    order: 1,
                })
            );

            await ctx.reply('Pattern has been added!');
            userPhases.delete(ctx.state.userId);
        }),
        // Handle message
        withNotion(),
        withPhase(null, async (ctx) => {
            const { userId, user: { timezoneOffsetMinutes }, notionAccount, notion } = ctx.state;
    
            if (ctx.message.text.startsWith('/')) {
                return;
            }
    
            const templates = await storage.findTemplatesByUserId(userId);
    
            const dateParser = new RussianDateParser();
            const patternMatcher = new PatternMatcher();
            const noteMatchers = new NoteMatchers();
            const listMatchers = new ListMatchers();
            const reminderMatchers = new ReminderMatchers({ dateParser });

            for (const template of templates) {
                const matchers = template.type === 'note'
                    ? noteMatchers
                    : template.type === 'reminder'
                        ? reminderMatchers
                        : listMatchers;
    
                const result = patternMatcher.match(ctx.message.text, template.pattern, matchers);
                const variables = { ...template.defaultVariables, ...result.variables };
    
                if (result.match) {    
                    if (template.type === 'note') {
                        const note = variables.note;
                        const tags = variables.tag
                            ? Array.isArray(variables.tag)
                                ? variables.tag
                                : [variables.tag]
                            : [];
        
                        await notion.pages.create(
                            createNotePage({
                                databaseId: notionAccount.notesDatabaseId,
                                note,
                                tags,
                            })
                        );
                    } else if (template.type === 'reminder') {
                        const date = dateParser.parse(variables.date);
                        const reminder = variables.reminder;

                        const reminderPage = await notion.pages.create(
                            createReminderPage({
                                databaseId: notionAccount.remindersDatabaseId,
                                date,
                                reminder,
                                timezoneOffsetMinutes,
                            })
                        );

                        const parsedReminder = parseReminderPage(reminderPage);
                        if (parsedReminder && isCloseReminder(parsedReminder)) {
                            await storage.addCloseReminder(userId, parsedReminder);
                        }
                    } else if (template.type === 'list') {
                        const alias = variables.list;
                        const item = variables.item;

                        if (!alias) {
                            await ctx.reply('Please add a default list for this pattern');
                            return;
                        }

                        const list = await storage.findListByAlias({ alias, userId });
                        if (!list) {
                            if (result.bang?.list) continue;
                            await ctx.reply(`Could not find the list: "${alias}"`);
                            return;
                        }
                        
                        await notion.pages.create(
                            createListItemPage({
                                databaseId: list.id,
                                item,
                            })
                        );
                    }

                    await ctx.reply('It\'s a match! 🎉\n\n' + JSON.stringify(variables, null, 2));
                    
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

    setInterval(async () => {
        await sendAllReminders();
    }, 30_000);

    setInterval(async () => {
        await syncAllReminders();
    }, 5 * 60_000);

    await syncAllReminders();
    await sendAllReminders();

    async function sendAllReminders() {
        const users = await storage.getUsers();
        for (const user of users) {
            await sendReminders(user.id);
        }
    }

    async function sendReminders(userId) {
        const telegramAccount = await storage.findTelegramAccountByUserId(userId);
        const reminders = await storage.getCloseReminders(userId);
        const remindersToSend = reminders.filter(r => r.date <= Date.now());
        
        for (const reminder of remindersToSend) {
            await markReminderAsDone(userId, reminder.id);
            await storage.removeCloseReminder(userId, reminder.id);
            await bot.telegram.sendMessage(telegramAccount.telegramUserId, reminder.content);
        }
    }

    async function syncAllReminders() {
        const users = await storage.getUsers();
        for (const user of users) {
            await syncReminders(user.id);
        }
    }

    async function syncReminders(userId) {
        const reminders = await fetchReminders(userId);
        const closeReminders = reminders.filter(isCloseReminder);

        await storage.storeCloseReminders(userId, closeReminders);
    }

    function isCloseReminder(reminder) {
        const inAnHour = Date.now() + 5 * 60 * 60_000;
        return !reminder.reminded && reminder.date.getTime() <= inAnHour;
    }

    async function fetchReminders(userId) {
        const [notion, notionAccount] = await getNotion(userId);
        const pages = await notion.databases.query({
            'database_id': notionAccount.remindersDatabaseId,
        });

        return pages.results.map(parseReminderPage).filter(Boolean);
    }

    async function markReminderAsDone(userId, id) {
        const [notion] = await getNotion(userId);

        await notion.pages.update({
            'page_id': id,
            'properties': {
                'Reminded': {
                    'checkbox': true
                }
            }
        });
    }

    /** @returns {[import('@notionhq/client').Client]} */
    async function getNotion(userId) {
        if (notions.get(userId)) {
            return notions.get(userId);
        }

        const notionAccount = await storage.findNotionAccount(userId);
        if (!notionAccount) {
            throw new NotionAccountNotFound();
        }

        const notion = new Client({ auth: notionAccount.token });

        notions.set(userId, [notion, notionAccount]);
        return [notion, notionAccount];
    }
})();

class NotionAccountNotFound extends Error {
    constructor() {
        super('Notion account not found');
    }
}

function createNotePage({ databaseId, note, tags }) {
    return {
        'parent': { 'database_id': databaseId },
        'properties': {
            'Note': {
                'title': [{
                    'type': 'text',
                    'text': {
                        'content': note,
                    }
                }]
            },
            ...tags.length > 0 && {
                'Tags': {
                    'multi_select': tags.map(tag => ({ name: tag })),
                },
            }
        }
    };
}

function createReminderPage({ databaseId, reminder, date, timezoneOffsetMinutes }) {
    return {
        'parent': { 'database_id': databaseId },
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
    };
}

function createListItemPage({ databaseId, item }) {
    return {
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
    };
}

function parseReminderPage(page) {
    const rawContent = page.properties['Reminder'].title[0]?.text.content
    const rawDate = page.properties['Date']?.date.start
    const rawReminded = page.properties['Reminded'].checkbox

    if (rawContent === undefined || rawDate === undefined || rawReminded === undefined) {
        return null;
    }

    return new Reminder({
        id: page.id,
        content: page.properties['Reminder'].title[0].text.content,
        date: new Date(),
        reminded: page.properties['Reminded'].checkbox,
    });
}

function formatUtcDateWithTimezone(date, timezoneOffsetMinutes) {
    const dateWithTimezone = new Date(date.getTime() + timezoneOffsetMinutes * 60_000);

    const timezoneHours = Math.trunc(timezoneOffsetMinutes / 60);
    const timezoneMinutes = (timezoneOffsetMinutes - timezoneHours * 60);

    const timezone = String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
    
    return dateWithTimezone.toISOString().slice(0, -1) + (timezoneOffsetMinutes >= 0 ? '+' : '-') + timezone;
}

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
