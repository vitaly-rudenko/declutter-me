require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const { URL } = require('url');
const pako = require('pako');
const base64url = require('base64url');

const phases = require('./app/phases');
const PatternBuilder = require('./app/PatternBuilder');
const PatternMatcher = require('./app/PatternMatcher');
const RussianDateParser = require('./app/date-parsers/RussianDateParser');
const InMemoryStorage = require('./app/storage/InMemoryStorage');
const Template = require('./app/templates/Template');
const NotionSessionManager = require('./app/notion/NotionSessionManager');
const UserSessionManager = require('./app/users/UserSessionManager');

const withTelegramAccount = require('./app/telegram/middlewares/withTelegramAccount');
const withPhaseFactory = require('./app/telegram/middlewares/withPhaseFactory');
const withUserFactory = require('./app/telegram/middlewares/withUserFactory');
const withNotionFactory = require('./app/telegram/middlewares/withNotionFactory');
const withLocalization = require('./app/telegram/middlewares/withLocalization');

const NotionDatabase = require('./app/notion/NotionDatabase');
const EntryMatchers = require('./app/entries/EntryMatchers');
const NotionEntrySerializer = require('./app/notion/NotionEntrySerializer');
const Field = require('./app/fields/Field');
const localize = require('./app/localize');
const Language = require('./app/Language');
const parseTimezoneOffsetMinutes = require('./app/utils/parseTimezoneOffset');
const NotionEntry = require('./app/notion/NotionEntry');
const NotionProperty = require('./app/notion/NotionProperty');
const InputType = require('./app/InputType');

const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN;

function encodeTemplates(templates) {
    return base64url.fromBase64(
        Buffer.from(
            pako.deflate(
                JSON.stringify(templates)
            )
        ).toString('base64')
    );
}

(async () => {
    const { markdownEscapes } = await import('markdown-escapes');

    function escapeMd(string) {
        for (const escape of markdownEscapes) {
            string = string.replace(new RegExp(`(\\${escape})`, 'g'), `\\$1`);
        }
        return string;
    }

    const linkLanguageMap = {
        [Language.ENGLISH]: 'en',
        [Language.RUSSIAN]: 'ru',
        [Language.UKRAINIAN]: 'uk',
    };

    function createTemplateManagerLink({ templates, language }) {
        const linkLanguage = linkLanguageMap[language] ?? 'en';

        const link = new URL(`${FRONTEND_DOMAIN}/${linkLanguage}/manager`);
        link.searchParams.set('templates', encodeTemplates(templates.map(t => ({ pattern: t.pattern }))));
        
        return link.toString();
    }

    function createTemplateBuilderLink({ pattern = null, test = null, language }) {
        const linkLanguage = linkLanguageMap[language] ?? 'en';

        const link = new URL(`${FRONTEND_DOMAIN}/${linkLanguage}/builder`);
        if (pattern) link.searchParams.set('pattern', pattern);
        if (test) link.searchParams.set('test', test);
        
        return link.toString();
    }

    function getGuideLink({ language }) {
        if (language === Language.ENGLISH) return process.env.GUIDE_LINK_EN;
        if (language === Language.RUSSIAN) return process.env.GUIDE_LINK_RU;
        if (language === Language.UKRAINIAN) return process.env.GUIDE_LINK_UK;
        throw new Error(`Invalid language: ${language}`)
    }

    const storage = new InMemoryStorage();
    const user = await storage.createUser({ language: Language.RUSSIAN, timezoneOffsetMinutes: 3 * 60 });
    await storage.createTelegramAccount(user.id, 56681133);
    await storage.createNotionAccount(user.id, 'secret_sUmg2sizdQDYmfGrQ0amjXSuOv4tHTevLn4PVgcopG6');

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 1,
        pattern: 'купить [{количество:number} (шт[ук[и]]|гр[ам[м]]|кг|кило[грам[м]]) ]{товар:text}',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'shopping' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 2,
        pattern: 'посмотреть {название:text}[ #{тип:word}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'to_watch' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 3,
        pattern: '(сделать|задача) {задача:text}',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'todo' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 4,
        pattern: 'контакт {имя:word} {фамилия:word}[ {телефон:phone}][ {эл. почта:email}][ {сайт:url}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'contacts' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 5,
        pattern: '[#{:database} ][заметка ]{заметка:text}[ #{теги:word}][ #{теги:word}][ #{теги:word}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'notes' })
        ]
    }));

    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'to_watch', notionDatabaseId: '3af8dfb79d18428b86419bd7a211084a' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'notes', notionDatabaseId: 'a64b650b4036407385272f3867de44f3' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'backup_notes', notionDatabaseId: '6ea2673f45fe428aa758da2aaf1316d7' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'todo', notionDatabaseId: '8c83e61c0fb848ef85d6644725296a15' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'contacts', notionDatabaseId: 'ce850d3910b24a64b5cf4f6da28738bf' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'shopping', notionDatabaseId: 'ca75e1d762c24d4893e2d682c1823797' }))

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

    bot.telegram.setMyCommands(
        ['databases', 'templates', 'info', 'notion', 'help', 'start']
            .map(command => ({
                command: `/${command}`,
                description: localize(`help.command.${command}`, null, Language.ENGLISH)
            }))
    );

    const withPhase = withPhaseFactory(userSessionManager);
    const withUser = withUserFactory(storage);
    const withNotion = withNotionFactory(notionSessionManager);

    bot.use(async (context, next) => {
        if (context.chat.type === 'private') {
            next();
        }
    });

    bot.use(withTelegramAccount(storage));
    bot.use(withLocalization());

    bot.start(async (ctx) => {
        const languages = Object.values(Language).map(language => [
            language,
            localize('chooseLanguage', { language: localize(`language.${language}`, null, language) }, language)
        ]);

        await ctx.reply('🇬🇧 🇺🇦 🇷🇺', {
            reply_markup: Markup.inlineKeyboard(
                languages.map(([language, label]) => (
                    Markup.button.callback(label, `language:${language}`)
                )),
                { columns: 1 }
            ).reply_markup
        });

        userSessionManager.setPhase(ctx.state.userId || ctx.from.id, phases.start.language);
    });

    bot.action(
        /language:(.+)/,
        withPhase(phases.start.language, async (ctx) => {
            await ctx.answerCbQuery();

            const language = ctx.match[1];

            userSessionManager.context(ctx.state.userId || ctx.from.id).language = language;
            userSessionManager.setPhase(ctx.state.userId || ctx.from.id, phases.start.timezone);

            await ctx.reply(
                localize('command.start.timezone', {
                    timezoneCheckerLink: process.env.TIMEZONE_CHECKER_LINK,
                }, language),
                { disable_web_page_preview: true }
            );

            userSessionManager.setPhase(ctx.state.userId || ctx.from.id, phases.start.timezone);
        }),
    );

    // TODO: uncomment when Notion supports deletion
    // bot.action(
    //     /undo:notion:(.+)/,
    //     withUser(),
    //     withPhase(null, async (ctx) => {
    //         await ctx.answerCbQuery();

    //         /** @type {import('@notionhq/client').Client} */
    //         const notion = ctx.state.notion;
    //         const pageId = ctx.match[1];

    //         notion.pages.delete(pageId)

    //         await ctx.editMessageText(
    //             ctx.callbackQuery.message.text
    //                 + '\n' + ctx.state.localize('match.undoSuccessful'),
    //         );
    //     }),
    // )

    bot.command('reset', async (ctx) => {
        await storage.cleanUp();
        await ctx.reply('🧹');
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
                    ? '\n' + databases.map(list => ctx.state.localize('command.info.database', {
                        notionDatabaseId: list.notionDatabaseId,
                        alias: list.alias
                    })).join('\n')
                    : ctx.state.localize('command.info.none'),
                templates: formatTemplates(templates, ctx.state.localize),
            })
        );
    });

    bot.command('help', withUser(), async (ctx) => {
        await ctx.reply(
            ctx.state.localize('command.help', {
                guideLink: getGuideLink({ language: ctx.state.user?.language })
            }),
            { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
    });

    bot.command('notion', withUser(), async (ctx) => {
        await ctx.reply(ctx.state.localize('command.notion.yourToken'));
        userSessionManager.setPhase(ctx.state.userId, phases.notion.token);
    });

    bot.command('databases', withUser(), withNotion(), async (ctx) => {
        await ctx.reply(
            ctx.state.localize('command.databases.chooseAction'),
            Markup.inlineKeyboard([
                Markup.button.callback(ctx.state.localize('command.databases.actions.add'), 'databases:add'),
                // Markup.button.callback(ctx.state.localize('command.databases.actions.edit'), 'databases:edit'),
                Markup.button.callback(ctx.state.localize('command.databases.actions.delete'), 'databases:delete'),
            ], { columns: 1 })
        );
    });

    bot.command('templates', withUser(), withNotion(), async (ctx) => {
        const TEMPLATES_REORDER_REGEX = /\/templates reorder\n(.+)/s;

        if (TEMPLATES_REORDER_REGEX.test(ctx.message.text)) {
            const [_, match] = ctx.message.text.match(TEMPLATES_REORDER_REGEX);

            const patterns = match.split('\n').filter(Boolean);
            const templates = await storage.findTemplatesByUserId(ctx.state.userId);

            let partialSuccess = false;
            let order = 0;
            for (const pattern of patterns) {
                const existingTemplate = templates.find(t => t.pattern === pattern);
                if (!existingTemplate) {
                    partialSuccess = true;
                    continue;
                }

                order++;
                await storage.storeTemplate(existingTemplate.clone({ order }))
            }

            for (const template of templates) {
                if (patterns.includes(template.pattern)) continue;
                partialSuccess = true;

                order++;
                await storage.storeTemplate(template.clone({ order }))
            }

            const updatedTemplates = await storage.findTemplatesByUserId(ctx.state.userId);

            if (partialSuccess) {
                await ctx.reply(
                    ctx.state.localize('command.templates.reorder.partialSuccess', {
                        templates: formatTemplates(updatedTemplates, ctx.state.localize)
                    })
                );
            } else {
                await ctx.reply(
                    ctx.state.localize('command.templates.reorder.success', {
                        templates: formatTemplates(updatedTemplates, ctx.state.localize)
                    })
                );
            }

            return;
        }

        await ctx.reply(
            ctx.state.localize('command.templates.chooseAction'),
            Markup.inlineKeyboard([
                Markup.button.callback(ctx.state.localize('command.templates.actions.add'), 'templates:add'),
                Markup.button.callback(ctx.state.localize('command.templates.actions.reorder'), 'templates:reorder'),
                // Markup.button.callback(ctx.state.localize('command.templates.actions.edit'), 'templates:edit'),
                Markup.button.callback(ctx.state.localize('command.templates.actions.delete'), 'templates:delete'),
            ], { columns: 1 })
        );
    });

    bot.action('databases:add', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(ctx.state.localize('command.databases.add.link'))
        ]);

        userSessionManager.setPhase(ctx.state.userId, phases.addDatabase.link);
    });

    bot.action('databases:delete', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        const databases = await storage.findDatabasesByUserId(ctx.state.userId);

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(
                ctx.state.localize('command.databases.delete.chooseDatabase'),
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(
                        database.alias,
                        `databases:delete:database-alias:${database.alias}`
                    )),
                    Markup.button.callback(
                        ctx.state.localize('command.databases.delete.cancel'),
                        'databases:delete:cancel'
                    ),
                ], { columns: 2 })
            )
        ]);
    });

    bot.action('databases:delete:cancel', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(ctx.state.localize('command.databases.delete.cancelled'))
        ]);
    });

    bot.action(/databases:delete:database-alias:(.+)/, withUser(), withPhase(null, async (ctx) => {
        await ctx.answerCbQuery();
        
        const databaseAlias = ctx.match[1];
        await storage.deleteDatabaseByAlias(databaseAlias);

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(ctx.state.localize('command.databases.delete.deleted', { database: databaseAlias })),
        ]);
    }));

    bot.action('templates:add', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();

        userSessionManager.context(ctx.state.userId).defaultFields = [];
        
        const databases = await storage.findDatabasesByUserId(ctx.state.userId);
        if (databases.length > 0) {
            await ctx.reply(
                ctx.state.localize('command.templates.add.chooseDatabase'),
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(database.alias, 'template:add:database-alias:' + database.alias)),
                    Markup.button.callback(ctx.state.localize('command.templates.add.skipDatabase'), 'template:add:skip-database'),
                ], { columns: 2 })
            );
            userSessionManager.setPhase(ctx.state.userId, phases.template.database);
        } else {
            await ctx.reply(ctx.state.localize('command.templates.add.sendTemplate'));
            userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
        }
    });

    bot.action('templates:reorder', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        const templates = await storage.findTemplatesByUserId(ctx.state.userId);
        const link = createTemplateManagerLink({ templates, language: ctx.state.user?.language });

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(
                ctx.state.localize('command.templates.reorder.link', {
                    link,
                    linkLabel: escapeMd(link),
                }),
                { parse_mode: 'Markdown', disable_web_page_preview: true }
            )
        ]);
    });

    bot.action(/template:add:database-alias:(.+)/, withUser(), withPhase(phases.template.database, async (ctx) => {
        await ctx.answerCbQuery();
        
        const databaseAlias = ctx.match[1];
        userSessionManager.context(ctx.state.userId)
            .defaultFields.push(new Field({ inputType: InputType.DATABASE, value: databaseAlias }));

        const templateBuilderLink = createTemplateBuilderLink({ language: ctx.state.user?.language });
        
        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(
                ctx.state.localize('command.templates.add.databaseChosen', {
                    database: escapeMd(databaseAlias),
                    templateBuilderLink,
                    guideLink: getGuideLink({ language: ctx.state.user?.language }),
                }),
                { parse_mode: 'Markdown', disable_web_page_preview: true }
            ),
        ]);

        userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
    }));

    bot.action('template:add:skip-database', withUser(), withPhase(phases.template.database, async (ctx) => {
        await ctx.answerCbQuery();

        const templateBuilderLink = createTemplateBuilderLink({ language: ctx.state.user?.language });

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(
                ctx.state.localize('command.templates.add.sendTemplate', {
                    templateBuilderLink,
                    guideLink: getGuideLink({ language: ctx.state.user?.language }),
                }),
                { parse_mode: 'Markdown', disable_web_page_preview: true }
            )
        ]);

        userSessionManager.setPhase(ctx.state.userId, phases.template.pattern);
    }));

    bot.on('message',
        // Start
        withPhase(phases.start.timezone, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const { language } = userSessionManager.context(ctx.state.userId || ctx.from.id);

            const timezoneOffsetMinutes = parseTimezoneOffsetMinutes(ctx.message.text);
            if (timezoneOffsetMinutes === null) {
                await ctx.reply(localize('command.start.invalidTimezone', null, language));
                return;
            }

            if (!ctx.state.telegramAccount) {
                const user = await storage.createUser({ language, timezoneOffsetMinutes });
                await storage.createTelegramAccount(user.id, ctx.from.id);
            } else {
                await storage.updateUser(ctx.state.userId, { language, timezoneOffsetMinutes });
            }

            userSessionManager.reset(ctx.state.userId || ctx.from.id);

            await ctx.reply(localize(
                'command.start.finished',
                {
                    language: localize(`language.${language}`, null, language),
                    timezone: formatTimezone(timezoneOffsetMinutes),
                },
                language
            ));

            await ctx.reply(
                localize('command.help', {
                    guideLink: getGuideLink({ language })
                }, language),
                { parse_mode: 'Markdown', disable_web_page_preview: true }
            );
        }),
        withUser(),
        // Notion
        withPhase(phases.notion.token, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const token = ctx.message.text;

            await storage.createNotionAccount(ctx.state.userId, token);
            await ctx.reply(ctx.state.localize('command.notion.allSet', { token }));

            userSessionManager.reset(ctx.state.userId);
        }),
        // Databases
        withPhase(phases.addDatabase.link, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const notionDatabaseId = notionDatabaseIdFromUrl(ctx.message.text);
            if (!notionDatabaseId) {
                await ctx.reply(ctx.state.localize('command.databases.add.invalidLink'));
                return;
            }

            userSessionManager.context(ctx.state.userId).notionDatabaseId = notionDatabaseId;
            userSessionManager.setPhase(ctx.state.userId, phases.addDatabase.alias);
            await ctx.reply(ctx.state.localize('command.databases.add.alias', { match: notionDatabaseId }));
        }),
        withPhase(phases.addDatabase.alias, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const alias = databaseAlias(ctx.message.text);
            if (!alias) {
                await ctx.reply(ctx.state.localize('command.databases.add.invalidAlias'));
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
            await ctx.reply(ctx.state.localize('command.databases.add.added', { alias }));
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
            await ctx.reply(ctx.state.localize('command.templates.add.added'));
        }),
        // Handle message
        withNotion(),
        withPhase(null, async (ctx) => {
            if (!('text' in ctx.message)) return;
            if (ctx.message.text.startsWith('/')) return;

            const { userId } = ctx.state;

            /** @type {import('@notionhq/client').Client} */
            const notion = ctx.state.notion;
    
            const templates = await storage.findTemplatesByUserId(userId);
    
            const dateParser = new RussianDateParser();
            const patternMatcher = new PatternMatcher();
            const entryMatchers = new EntryMatchers({ dateParser });

            for (const template of templates) {
                const result = patternMatcher.match(
                    ctx.message.text,
                    new PatternBuilder().build(template.pattern),
                    entryMatchers,
                );

                if (!result) continue;
                const message = await ctx.reply(ctx.state.localize('match.checking'));

                /**
                 * @param {Field[]} fields1
                 * @param {Field[]} fields2
                 */
                function mergeFields(fields1, fields2) {
                    const result = [...fields1];

                    for (const field of fields2) {
                        const index = result.findIndex(f => (
                            f.name === field.name ||
                            (f.inputType === InputType.DATABASE && field.inputType === InputType.DATABASE)
                        ));

                        if (index !== -1) {
                            result.splice(index, 1);
                        }

                        result.push(field)
                    }

                    return result;
                }

                const fields = mergeFields(template.defaultFields, result.fields)

                const databaseField = fields.find(field => field.inputType === InputType.DATABASE)
                if (!databaseField) {
                    await bot.telegram.editMessageText(
                        message.chat.id,
                        message.message_id,
                        null,
                        ctx.state.localize('match.noDatabaseSpecified')
                    );
                    return;
                }

                const databaseAlias = databaseField.value;
                const database = await storage.findDatabaseByAlias(userId, databaseAlias);
                if (!database) {
                    if (databaseField.bang) continue;
                    await bot.telegram.editMessageText(
                        message.chat.id,
                        message.message_id,
                        null,
                        ctx.state.localize('match.databaseNotFound', { database: databaseAlias })
                    );
                    return;
                }

                let pageId;
                try {
                    const notionDatabase = await notion.databases.retrieve({ database_id: database.notionDatabaseId });
                    const entry = new NotionEntry({
                        databaseId: database.notionDatabaseId,
                        fields,
                        properties: Object.entries(notionDatabase.properties)
                            .map(([name, options]) => new NotionProperty({
                                type: options.type,
                                name,
                            }))
                    });
                    
                    const page = await notion.pages.create(
                        new NotionEntrySerializer({
                            dateParser,
                        }).serialize(
                            entry,
                            user,
                        )
                    );

                    pageId = page.id;
                } catch (error) {
                    try {
                        await bot.telegram.editMessageText(
                            message.chat.id,
                            message.message_id,
                            null,
                            ctx.state.localize('match.failed', { error: error.message })
                        );
                    } catch (error) {}

                    throw error;
                }

                await bot.telegram.editMessageText(
                    message.chat.id,
                    message.message_id,
                    null,
                    ctx.state.localize('match.patternMatched', {
                        fields: fields.map(field => ctx.state.localize(
                            'match.patternMatchField',
                            {
                                name: field.inputType === InputType.DATABASE
                                    ? ctx.state.localize('match.patternMatchDatabaseFieldName')
                                    : field.name,
                                value: Array.isArray(field.value) ? field.value.join(', '): field.value
                            }
                        )).join('\n')
                    }),
                    // TODO: uncomment when Notion supports deletion
                    // Markup.inlineKeyboard([
                    //     Markup.button.callback(ctx.state.localize('match.undo'), `undo:notion:${pageId}`)
                    // ]),
                );
                return;
            }
    
            await ctx.reply(ctx.state.localize('match.noPatternMatched'));
        })
    );

    bot.catch(async (error) => {
        await logError(error);
    });

    function formatTemplates(templates, localize) {
        return templates.length > 0
            ? '\n' + templates.map(
                template => localize('output.templates.template', {
                    order: template.order,
                    pattern: template.pattern
                })
            ).join('\n')
            : localize('output.templates.none');
    }

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

        return (timezoneOffsetMinutes >= 0 ? '+' : '-') + String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
    }

    await bot.launch({
        allowedUpdates: ['callback_query', 'message'],
        dropPendingUpdates: true,
    });
})()
    .then(() => console.log('Started!'));

