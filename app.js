const { Telegraf, Markup } = require('telegraf');
const { URL } = require('url');

const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const NoteMatchers = require('./app/notes/NoteMatchers');
const ListItemMatchers = require('./app/lists/ListItemMatchers');
const ReminderMatchers = require('./app/reminders/ReminderMatchers');
const InMemoryStorage = require('./app/storage/InMemoryStorage');
const Reminder = require('./app/reminders/Reminder');
const List = require('./app/lists/List');
const Template = require('./app/templates/Template');
const NotionNoteSerializer = require('./app/notes/NotionNoteSerializer');
const Note = require('./app/notes/Note');
const ListItem = require('./app/lists/ListItem');
const NotionListItemSerializer = require('./app/lists/NotionListItemSerializer');
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

    const userSessionManager = new UserSessionManager();
    const notionSessionManager = new NotionSessionManager({ storage });
    const reminderManager = new ReminderManager({ notionSessionManager, storage, bot });

    bot.telegram.setMyCommands([
        { command: '/start', description: 'Start the bot' },
        { command: '/info', description: 'Prints your information' },
        { command: '/notion', description: 'Configure Notion' },
        { command: '/list', description: 'Add list' },
        { command: '/template', description: 'Add template' },
        { command: '/sync', description: 'Sync with Notion' },
    ]);

    const withPhase = withPhaseFactory(userSessionManager);
    const withUser = withUserFactory(storage);
    const withNotion = withNotionFactory(notionSessionManager);

    bot.use(withTelegramAccount(storage));

    bot.start(async (ctx) => {
        if (ctx.state.telegramAccount) {
            await ctx.reply('You are ready to go!');
            return;
        }

        const user = await storage.createUser();
        await storage.createTelegramAccount(user.id, ctx.from.id);

        await ctx.reply('Hi! Use /notion to setup Notion integration.');
    });

    bot.command('info', withUser({ required: false }), withNotion({ required: false }), async (ctx) => {
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
            (templates.map(template => `    - ${template.type}: ${new PatternStringifier().stringify(template.pattern)}`).join('\n') || '    <none>') + '\n'
        );
    });

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply('Your Notion integration token:');
        userSessionManager.setPhase(ctx.state.userId, 'notion:token');
    });

    bot.command('list', withUser(), withNotion(), async (ctx) => {
        await ctx.reply('Link to your List database:');
        userSessionManager.setPhase(ctx.state.userId, 'list:link');
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
                Markup.button.callback('Note', 'template:note'),
                Markup.button.callback('List', 'template:list'),
                Markup.button.callback('Reminder', 'template:reminder'),
            ])
        );
        userSessionManager.setPhase(ctx.state.userId, 'template:type');
    });

    bot.action('template:note', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the template:');

        userSessionManager.setContext(ctx.state.userId, { type: 'note' });
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:reminder', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Got it! Now send me the template:');

        userSessionManager.setContext(ctx.state.userId, { type: 'reminder' });
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:list', withPhase('template:type', async (ctx) => {
        await ctx.answerCbQuery();

        userSessionManager.setContext(ctx.state.userId, { type: 'list' });

        const lists = await storage.findListsByUserId(ctx.state.userId);
        if (lists.length > 0) {
            await ctx.reply(
                'Got it! What list would you like to use by default?',
                Markup.inlineKeyboard([
                    ...lists.map(list => Markup.button.callback(list.alias, 'template:list:' + list.alias)),
                    Markup.button.callback('Skip', 'template:list:alias:skip'),
                ])
            );
    
            userSessionManager.setPhase(ctx.state.userId, 'template:list:alias');
        } else {
            await ctx.reply(`Okay! Now send me the template:`);
            userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
        }
    }));

    bot.action(/template:list:(.+)/, withPhase('template:list:alias', async (ctx) => {
        await ctx.answerCbQuery();
        
        const alias = ctx.match[1];

        userSessionManager.setContext(
            ctx.state.userId,
            {
                ...userSessionManager.getContext(ctx.state.userId),
                defaultVariables: { list: alias }
            }
        );

        await ctx.reply(`Default list: "${alias}".\nNow send me the template:`);
        userSessionManager.setPhase(ctx.state.userId, 'template:pattern');
    }));

    bot.action('template:list:alias:skip', withPhase('template:list:alias', async (ctx) => {
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
            await ctx.reply(`It\'s "${token}".\nLink to Notes database:`);
            userSessionManager.setPhase(ctx.state.userId, 'notion:notes');
        }),
        withPhase('notion:notes', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            await storage.setNotesDatabaseId(ctx.state.userId, databaseId);
            await ctx.reply(`It\'s "${databaseId}".\nLink to Reminders database:`);
            userSessionManager.setPhase(ctx.state.userId, 'notion:reminders');
        }),
        withPhase('notion:reminders', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            await storage.setRemindersDatabaseId(ctx.state.userId, databaseId);
            await ctx.reply(`It\'s "${databaseId}".\nGreat, your Notion integration is all set!`);
            userSessionManager.reset(ctx.state.userId);
        }),
        // Lists
        withPhase('list:link', async (ctx) => {
            const databaseId = databaseIdFromLink(ctx.message.text);
            userSessionManager.setContext(ctx.state.userId, databaseId);

            await ctx.reply(`It\'s "${databaseId}".\nAlias for the list:`);
            userSessionManager.setPhase(ctx.state.userId, 'list:alias');
        }),
        withPhase('list:alias', async (ctx) => {
            const alias = ctx.message.text;
            const databaseId = userSessionManager.getContext(ctx.state.userId);

            await storage.storeList(
                new List({
                    id: databaseId,
                    userId: ctx.state.userId,
                    alias,
                })
            );

            await ctx.reply(`List "${alias}" has been added!`);
            userSessionManager.reset(ctx.state.userId);
        }),
        // Patterns
        withPhase('template:pattern', async (ctx) => {
            const pattern = new PatternBuilder().build(ctx.message.text);

            await storage.storeTemplate(
                new Template({
                    userId: ctx.state.userId,
                    type: userSessionManager.getContext(ctx.state.userId).type,
                    pattern,
                    order: 1,
                })
            );

            userSessionManager.reset(ctx.state.userId);
            await ctx.reply('Template has been added!');
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
            const listItemMatchers = new ListItemMatchers();
            const reminderMatchers = new ReminderMatchers({ dateParser });

            for (const template of templates) {
                const matchers = template.type === 'note'
                    ? noteMatchers
                    : template.type === 'reminder'
                        ? reminderMatchers
                        : listItemMatchers;
    
                const result = patternMatcher.match(ctx.message.text, template.pattern, matchers);
                const variables = { ...template.defaultVariables, ...result.variables };
    
                if (result.match) {    
                    if (template.type === 'note') {
                        const note = new Note({
                            content: variables.note,
                            tags: variables.tag
                                ? Array.isArray(variables.tag)
                                    ? variables.tag
                                    : [variables.tag]
                                : []
                        });
        
                        await notion.pages.create(
                            new NotionNoteSerializer().serialize({
                                databaseId: notionAccount.notesDatabaseId,
                                note,
                            })
                        );
                    } else if (template.type === 'reminder') {
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
                    } else if (template.type === 'list') {
                        const listItem = new ListItem({ content: variables.item });

                        const alias = variables.list;
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
                            new NotionListItemSerializer().serialize({
                                listItem,
                                databaseId: list.id,
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

    function databaseIdFromLink(link) {
        return new URL(link).pathname.slice(1);
    }

    await bot.launch({
        allowedUpdates: ['callback_query', 'message'],
        dropPendingUpdates: true,
    });

    setInterval(async () => {
        await reminderManager.sendAll();
    }, 30_000);

    setInterval(async () => {
        await reminderManager.syncAll();
    }, 15 * 60_000);

    await reminderManager.syncAll();
    await reminderManager.sendAll();
})()
    .then(() => console.log('Started!'));

