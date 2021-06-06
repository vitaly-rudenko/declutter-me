const { Telegraf, Markup } = require('telegraf');
const { URL } = require('url');

const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const ReminderMatchers = require('./app/reminders/ReminderMatchers');
const InMemoryStorage = require('./app/storage/InMemoryStorage');
const Reminder = require('./app/reminders/Reminder');
const Template = require('./app/templates/Template');
const NotionReminderSerializer = require('./app/reminders/NotionReminderSerializer');
const PatternStringifier = require('./app/PatternStringifier');
const NotionSessionManager = require('./app/notion/NotionSessionManager');
const UserSessionManager = require('./app/users/UserSessionManager');

const withTelegramAccount = require('./app/telegram/middlewares/withTelegramAccount');
const withPhaseFactory = require('./app/telegram/middlewares/withPhaseFactory');
const withUserFactory = require('./app/telegram/middlewares/withUserFactory');
const withNotionFactory = require('./app/telegram/middlewares/withNotionFactory');
const ReminderManager = require('./app/reminders/ReminderManager');

require('dotenv').config();

const en = require('./assets/localization/en.json');
const NotionDatabase = require('./app/notion/NotionDatabase');
const Entry = require('./app/entries/Entry');
const NotionEntrySerializer = require('./app/entries/NotionEntrySerializer');
const EntryMatchers = require('./app/entries/EntryMatchers');
const localize = (message, replacements = null) => {
    const path = message.split('.');

    let result = en;
    while (result && path.length > 0) {
        result = result[path.shift()];
    }

    if (!result) {
        if (replacements) {
            return `${message}\n${JSON.stringify(replacements, null, 4)}`;
        } else {
            return message;
        }
    }

    if (Array.isArray(result)) {
        result = result.join('\n');
    }

    if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), value);
        }
    }

    return result;
};

(async () => {
    const storage = new InMemoryStorage();
    const user = await storage.createUser({ language: 'russian', timezoneOffsetMinutes: 3 * 60 });
    await storage.createTelegramAccount(user.id, 56681133);
    await storage.createNotionAccount(user.id, 'secret_sUmg2sizdQDYmfGrQ0amjXSuOv4tHTevLn4PVgcopG6');
    await storage.storeTemplate(new Template({ userId: user.id, order: 1, type: 'reminder', pattern: new PatternBuilder().build('[напомни[ть][ мне] ]{reminder} {date}'), defaultVariables: { database: 'reminders' } }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 2, type: 'reminder', pattern: new PatternBuilder().build('{date} [напомни[ть][ мне] ]{reminder}'), defaultVariables: { database: 'reminders' } }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 3, type: 'entry', pattern: new PatternBuilder().build('купить {content}'), defaultVariables: { database: 'shopping' } }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 4, type: 'entry', pattern: new PatternBuilder().build('#{database} {content}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 5, type: 'entry', pattern: new PatternBuilder().build('{content} #{database!}') }));
    await storage.storeTemplate(new Template({ userId: user.id, order: 6, type: 'entry', pattern: new PatternBuilder().build('{content}[ #{tag}][ #{tag}][ #{tag}]'), defaultVariables: { database: 'notes' } }));
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'shopping', notionDatabaseId: 'ca75e1d762c24d4893e2d682c1823797' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'recipes', notionDatabaseId: '3af8dfb79d18428b86419bd7a211084a' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'reminders', notionDatabaseId: 'edfe4ac495d24ddd88cbe45e635d0418' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'notes', notionDatabaseId: 'a64b650b4036407385272f3867de44f3' }))

    const debugChatId = process.env.DEBUG_CHAT_ID;

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    process.on('unhandledRejection', async (error) => {
        await logError(error);
    });

    async function logError(error) {
        console.error('Unexpected error:', error);

        try {
            await bot.telegram.sendMessage(
                debugChatId,
                `❗️Unexpected error at ${new Date().toISOString()}❗️\n${error.name}: ${error.message}\n\nStack:\n${error.stack}`
            );
        } catch (error) {
            console.warn('Could not post log to debug chat:', error);
        }
    }

    const userSessionManager = new UserSessionManager();
    const notionSessionManager = new NotionSessionManager({ storage });
    const reminderManager = new ReminderManager({ notionSessionManager, storage, bot });

    bot.telegram.setMyCommands([
        { command: '/help', description: 'Get help' },
        { command: '/start', description: 'Start the bot' },
        { command: '/info', description: 'Prints your information' },
        { command: '/notion', description: 'Configure Notion' },
        { command: '/list', description: 'Add list' },
        { command: '/database', description: 'Add database' },
        { command: '/template', description: 'Add template' },
        { command: '/sync', description: 'Sync with Notion' },
    ]);

    const withPhase = withPhaseFactory(userSessionManager);
    const withUser = withUserFactory(storage);
    const withNotion = withNotionFactory(notionSessionManager);

    bot.use(async (context, next) => {
        if (context.chat.type === 'private') {
            next();
        }
    });

    bot.use(withTelegramAccount(storage));
    bot.use((ctx, next) => {
        ctx.state.localize = localize;
        next();
    });

    bot.start(async (ctx) => {
        if (ctx.state.telegramAccount) {
            await ctx.reply(ctx.state.localize('command.start.readyToGo'));
            return;
        }

        const user = await storage.createUser();
        await storage.createTelegramAccount(user.id, ctx.from.id);

        await ctx.reply(ctx.state.localize('command.start.useNotionCommand'));
    });

    bot.command('info', withUser({ required: false }), withNotion({ required: false }), async (ctx) => {
        const databases = ctx.state.userId ? await storage.findDatabasesByUserId(ctx.state.userId) : [];
        const templates = ctx.state.userId ? await storage.findTemplatesByUserId(ctx.state.userId) : [];

        await ctx.reply(
            ctx.state.localize('command.info.response', {
                name: ctx.from.first_name,
                language: ctx.state.user?.language
                    ? ctx.state.localize(`language.${ctx.state.user.language}`)
                    : ctx.state.localize('command.info.notProvided'),
                timezone: ctx.state.user?.timezoneOffsetMinutes
                    ? formatTimezone(ctx.state.user?.timezoneOffsetMinutes)
                    : ctx.state.localize('command.info.notProvided'),
                notionToken: ctx.state.notionAccount?.token ?? ctx.state.localize('command.info.notProvided'),
                databases: databases.length > 0
                    ? '\n' + databases.map(list => ctx.state.localize('command.info.database', { notionDatabaseId: list.notionDatabaseId, alias: list.alias })).join('\n')
                    : ctx.state.localize('command.info.none'),
                templates: templates.length > 0
                    ? '\n' + templates.map(template => ctx.state.localize('command.info.template', { type: template.type, pattern: new PatternStringifier().stringify(template.pattern) })).join('\n')
                    : ctx.state.localize('command.info.none'),
            })
        );
    });

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply(ctx.state.localize('command.notion.yourToken'));
        userSessionManager.setPhase(ctx.state.userId, 'notion:token');
    });

    bot.command('database', withUser(), withNotion(), async (ctx) => {
        await ctx.reply(ctx.state.localize('command.database.link'));
        userSessionManager.setPhase(ctx.state.userId, 'database:link');
    });

    bot.command('sync', withUser(), withNotion(), async (ctx) => {
        const message = await ctx.reply('Syncing...');

        await reminderManager.sync(ctx.state.userId);

        const closeReminders = await storage.getCloseReminders(ctx.state.userId);
        await bot.telegram.editMessageText(ctx.from.id, message.message_id, null, `Synced! You have ${closeReminders.length} close reminders.`);

        await reminderManager.send(ctx.state.userId);
    });

    bot.command('template', withUser(), withNotion(), async (ctx) => {
        await ctx.reply(
            'Choose template type:',
            Markup.inlineKeyboard([
                Markup.button.callback('Entry', 'template:entry'),
                Markup.button.callback('Reminder', 'template:reminder'),
            ])
        );
        userSessionManager.setPhase(ctx.state.userId, 'template:type');
    });

    bot.action('template:reminder', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the template:');

        userSessionManager.context(ctx.state.userId).type = 'reminder';
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:entry', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();

        userSessionManager.context(ctx.state.userId).type = 'entry';

        const databases = await storage.findDatabasesByUserId(ctx.state.userId);
        if (databases.length > 0) {
            await ctx.reply(
                'Got it! What database would you like to use by default?',
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(database.alias, 'template:list:' + database.alias)),
                    Markup.button.callback('Skip', 'template:list:alias:skip'),
                ])
            );
    
            userSessionManager.setPhase(ctx.state.userId, 'template:database:alias');
        } else {
            await ctx.reply(`Okay! Now send me the template:`);
            userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
        }
    }));

    bot.action(/template:database:(.+)/, withPhase('template:database:alias', async (ctx) => {
        await ctx.answerCbQuery();
        
        const databaseAlias = ctx.match[1];
        userSessionManager.context(ctx.state.userId).defaultVariables = { database: databaseAlias };

        await ctx.reply(`Default database: "${databaseAlias}".\nNow send me the template:`);
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:database:alias:skip', withPhase('template:database:alias', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply(`Okay! Now send me the template:`);
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.on('message',
        withUser(),
        // Notion
        withPhase('notion:token', async (ctx) => {
            const token = ctx.message.text;

            await storage.createNotionAccount(ctx.state.userId, token);
            await ctx.reply(ctx.state.localize('command.notion.allSet', { token }));

            userSessionManager.reset
        }),
        // Databases
        withPhase('database:link', async (ctx) => {
            const notionDatabaseId = notionDatabaseIdFromUrl(ctx.message.text);
            if (!notionDatabaseId) {
                await ctx.reply(ctx.state.localize('command.database.invalidLink'));
                return;
            }

            userSessionManager.context(ctx.state.userId).notionDatabaseId = notionDatabaseId;
            userSessionManager.setPhase(ctx.state.userId, 'database:alias');
            await ctx.reply(ctx.state.localize('command.database.alias', { match: notionDatabaseId }));
        }),
        withPhase('database:alias', async (ctx) => {
            const alias = databaseAlias(ctx.message.text);
            if (!alias) {
                await ctx.reply(ctx.state.localize('command.database.invalidAlias'));
                return;
            }

            const { notionDatabaseId } = userSessionManager.context(ctx.state.userId);
            await storage.storeDatabase(
                new NotionDatabase({
                    userId: ctx.state.userId,
                    notionDatabaseId,
                    alias,
                })
            );

            userSessionManager.reset(ctx.state.userId);
            await ctx.reply(ctx.state.localize('command.databases.added', { alias }));
        }),
        // Patterns
        withPhase('template:pattern', async (ctx) => {
            const pattern = new PatternBuilder().build(ctx.message.text);
            const { type, defaultVariables } = userSessionManager.context(ctx.state.userId);

            await storage.storeTemplate(
                new Template({
                    type,
                    pattern,
                    defaultVariables,
                    userId: ctx.state.userId,
                })
            );

            userSessionManager.reset(ctx.state.userId);
            await ctx.reply('Template has been added!');
        }),
        // Handle message
        withNotion(),
        withPhase(null, async (ctx) => {
            const { userId, user: { timezoneOffsetMinutes }, notionAccount, notion } = ctx.state;

            if (!ctx.message.text || ctx.message.text.startsWith('/')) {
                return;
            }
    
            const templates = await storage.findTemplatesByUserId(userId);
    
            const dateParser = new RussianDateParser();
            const patternMatcher = new PatternMatcher();
            const entryMatchers = new EntryMatchers();
            const reminderMatchers = new ReminderMatchers({ dateParser });

            for (const template of templates) {
                const matchers = template.type === 'entry'
                    ? entryMatchers
                    : reminderMatchers;
    
                const result = patternMatcher.match(ctx.message.text, template.pattern, matchers);
                const variables = { ...template.defaultVariables, ...result.variables };
    
                if (result.match) {    
                    if (template.type === 'reminder') {
                        const reminder = new Reminder({
                            content: variables.reminder,
                            date: dateParser.parse(variables.date),
                        });

                        const reminderPage = await notion.pages.create(
                            new NotionReminderSerializer().serialize({
                                databaseId: notionAccount.remindersDatabaseId,
                                timezoneOffsetMinutes,
                                reminder,
                            })
                        );

                        const parsedReminder = new NotionReminderSerializer().deserialize(reminderPage);
                        if (parsedReminder && reminderManager.isClose(parsedReminder)) {
                            await storage.addCloseReminder(userId, parsedReminder);
                        }
                    } else if (template.type === 'entry') {
                        const entry = new Entry({
                            content: variables.content,
                            tags: variables.tag
                            ? Array.isArray(variables.tag)
                                ? variables.tag
                                : [variables.tag]
                            : []
                        });

                        const databaseAlias = variables.database;
                        if (!databaseAlias) {
                            await ctx.reply('Please add a default database for this pattern');
                            return;
                        }

                        const database = await storage.findDatabaseByAlias(userId, databaseAlias);
                        if (!database) {
                            if (result.bang?.database) continue;
                            await ctx.reply(`Could not find the database: "${databaseAlias}"`);
                            return;
                        }
                        
                        await notion.pages.create(
                            new NotionEntrySerializer().serialize({
                                databaseId: database.notionDatabaseId,
                                entry,
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
        await storage.cleanUp();
        await ctx.reply('Done!');
    });

    bot.catch(async (error) => {
        await logError(error);
    });

    function notionDatabaseIdFromUrl(link) {
        try {
            return new URL(link).pathname.slice(1);
        } catch (error) {
            return null;
        }
    }

    function databaseAlias(value) {
        value = value.trim().toLowerCase();

        if (!value || /\s/.test(value)) {
            return null;
        }

        return value;
    }

    function formatTimezone(timezoneOffsetMinutes) {
        const offset = Math.abs(timezoneOffsetMinutes);

        const timezoneHours = Math.trunc(offset / 60);
        const timezoneMinutes = (offset - timezoneHours * 60);
    
        return (offset >= 0 ? '+' : '-') + String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
    }

    await bot.launch({
        allowedUpdates: ['callback_query', 'message'],
        dropPendingUpdates: true,
    });

    // setInterval(async () => {
    //     await reminderManager.sendAll();
    // }, 30_000);

    // setInterval(async () => {
    //     await reminderManager.syncAll();
    // }, 15 * 60_000);

    // await reminderManager.syncAll();
    // await reminderManager.sendAll();
})()
    .then(() => console.log('Started!'));

