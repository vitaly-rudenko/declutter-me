const { Telegraf, Markup } = require('telegraf');
const { URL } = require('url');

const phases = require('./app/phases');
const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const InMemoryStorage = require('./app/storage/InMemoryStorage');
const Reminder = require('./app/reminders/Reminder');
const Template = require('./app/templates/Template');
const PatternStringifier = require('./app/PatternStringifier');
const NotionSessionManager = require('./app/notion/NotionSessionManager');
const UserSessionManager = require('./app/users/UserSessionManager');

const withTelegramAccount = require('./app/telegram/middlewares/withTelegramAccount');
const withPhaseFactory = require('./app/telegram/middlewares/withPhaseFactory');
const withUserFactory = require('./app/telegram/middlewares/withUserFactory');
const withNotionFactory = require('./app/telegram/middlewares/withNotionFactory');

require('dotenv').config();

const en = require('./assets/localization/en.json');
const NotionDatabase = require('./app/notion/NotionDatabase');
const EntryMatchers = require('./app/entries/EntryMatchers');
const NotionEntrySerializer = require('./app/notion/NotionEntrySerializer');
const NotionEntry = require('./app/notion/NotionEntry');
const Field = require('./app/fields/Field');
const CommonPresets = require('./app/presets/CommonPresets');
const RussianPresets = require('./app/presets/RussianPresets');
const UkrainianPresets = require('./app/presets/UkrainianPresets');

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

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 1,
        pattern: new PatternBuilder().build('купить [{Количество} (шт|штук|гр|грамм|кг|килограмм) ]{Товар}'),
        defaultFields: [
            new Field({ inputType: 'database', value: 'to_watch' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 2,
        pattern: new PatternBuilder().build('посмотреть {Название}[ #{Тип:tag}]'),
        defaultFields: [
            new Field({ inputType: 'database', value: 'shows' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 3,
        pattern: new PatternBuilder().build('(сделать|do|todo) {Задача}'),
        defaultFields: [
            new Field({ inputType: 'database', value: 'todo' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 4,
        pattern: new PatternBuilder().build('{Note}'),
        defaultFields: [
            new Field({ inputType: 'database', value: 'notes' })
        ]
    }));

    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'to_watch', notionDatabaseId: 'ca75e1d762c24d4893e2d682c1823797' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'shows', notionDatabaseId: '3af8dfb79d18428b86419bd7a211084a' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'reminders', notionDatabaseId: 'edfe4ac495d24ddd88cbe45e635d0418' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'notes', notionDatabaseId: 'a64b650b4036407385272f3867de44f3' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'todo', notionDatabaseId: '8c83e61c0fb848ef85d6644725296a15' }))

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

    bot.telegram.setMyCommands([
        { command: '/help', description: 'Get help' },
        { command: '/start', description: 'Start the bot' },
        { command: '/info', description: 'Prints your information' },
        { command: '/notion', description: 'Configure Notion' },
        { command: '/list', description: 'Add list' },
        { command: '/database', description: 'Add database' },
        { command: '/template', description: 'Add template' },
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
                    ? '\n' + templates.map(template => ctx.state.localize('command.info.template', { pattern: new PatternStringifier().stringify(template.pattern) })).join('\n')
                    : ctx.state.localize('command.info.none'),
            })
        );
    });

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply(ctx.state.localize('command.notion.yourToken'));
        userSessionManager.setPhase(ctx.state.userId, phases.notion.token);
    });

    bot.command('database', withUser(), withNotion(), async (ctx) => {
        await ctx.reply(ctx.state.localize('command.database.link'));
        userSessionManager.setPhase(ctx.state.userId, phases.database.link);
    });

    bot.command('template', withUser(), withNotion(), async (ctx) => {
        userSessionManager.context(ctx.state.userId).defaultFields = [];
        
        const databases = await storage.findDatabasesByUserId(ctx.state.userId);
        if (databases.length > 0) {
            await ctx.reply(
                'Got it! What database would you like to use by default?',
                Markup.inlineKeyboard([
                    Markup.button.callback(ctx.state.localize('command.template.skipDatabase'), 'template:skip-database'),
                    ...databases.map(database => Markup.button.callback(database.alias, 'template:database:' + database.alias)),
                ])
            );

            userSessionManager.setPhase(ctx.state.userId, phases.template.databaseAlias);
        } else {
            await ctx.reply(`Okay! Now send me the template:`);
            userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
        }
    });

    bot.action(/template:database:(.+)/, withPhase(phases.template.databaseAlias, async (ctx) => {
        await ctx.answerCbQuery();
        
        const databaseAlias = ctx.match[1];
        userSessionManager.context(ctx.state.userId)
            .defaultFields.push(new Field({ inputType: 'database', value: databaseAlias }));

        await ctx.reply(`Default database: "${databaseAlias}".\nNow send me the template:`);
        userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
    }));

    bot.action('template:skip-database', withPhase(phases.template.databaseAlias, async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Okay! Now send me the template:');
        userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
    }));

    bot.on('message',
        withUser(),
        // Notion
        withPhase(phases.notion.token, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const token = ctx.message.text;

            await storage.createNotionAccount(ctx.state.userId, token);
            await ctx.reply(ctx.state.localize('command.notion.allSet', { token }));

            userSessionManager.reset
        }),
        // Databases
        withPhase(phases.database.link, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const notionDatabaseId = notionDatabaseIdFromUrl(ctx.message.text);
            if (!notionDatabaseId) {
                await ctx.reply(ctx.state.localize('command.database.invalidLink'));
                return;
            }

            userSessionManager.context(ctx.state.userId).notionDatabaseId = notionDatabaseId;
            userSessionManager.setPhase(ctx.state.userId, phases.database.alias);
            await ctx.reply(ctx.state.localize('command.database.alias', { match: notionDatabaseId }));
        }),
        withPhase(phases.database.alias, async (ctx) => {
            if (!('text' in ctx.message)) return;

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
        withPhase(phases.template.pattern, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const pattern = new PatternBuilder().build(ctx.message.text);
            const { defaultFields } = userSessionManager.context(ctx.state.userId);

            await storage.storeTemplate(
                new Template({
                    pattern,
                    defaultFields,
                    userId: ctx.state.userId,
                })
            );

            userSessionManager.reset(ctx.state.userId);
            await ctx.reply('Template has been added!');
        }),
        // Handle message
        withNotion(),
        withPhase(null, async (ctx) => {
            if (!('text' in ctx.message)) return;
            if (ctx.message.text.startsWith('/')) return;
            
            const { userId, user, notion } = ctx.state;
    
            const templates = await storage.findTemplatesByUserId(userId);
    
            const dateParser = new RussianDateParser();
            const patternMatcher = new PatternMatcher();
            const entryMatchers = new EntryMatchers({ dateParser });

            for (const template of templates) {
                const result = patternMatcher.match(
                    ctx.message.text,
                    template.pattern,
                    {
                        matchers: entryMatchers,
                        presets: [
                            new UkrainianPresets(),
                            new RussianPresets(),
                            new CommonPresets(),
                        ]
                    }
                );

                if (!result.match) continue;

                /**
                 * @param {Field[]} fields1
                 * @param {Field[]} fields2
                 */
                function mergeFields(fields1, fields2) {
                    const result = [...fields1];

                    for (const field of fields2) {
                        const index = result.findIndex(f => f.name === field.name);
                        if (index !== -1) {
                            result.splice(index, 1);
                        }
                        result.push(field)
                    }

                    return result;
                }

                const fields = mergeFields(template.defaultFields, result.fields)

                const databaseAlias = fields.find(field => field.inputType === 'database')?.value;
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

                const notionEntry = new NotionEntry({
                    fields,
                });
                
                await notion.pages.create(
                    new NotionEntrySerializer({
                        dateParser,
                    }).serialize(
                        database.notionDatabaseId,
                        notionEntry,
                        user,
                    )
                );

                await ctx.reply(
                    'It\'s a match! 🎉\n\n' + JSON.stringify(
                        fields.map(field => ({
                            name: field.name,
                            inputType: field.inputType,
                            outputType: field.outputType,
                            value: field.value,
                        })),
                        null,
                        2
                    )
                );
                return;
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

