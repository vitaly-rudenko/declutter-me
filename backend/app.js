import dotenv from 'dotenv'
dotenv.config();

import { Telegraf, Markup } from 'telegraf';
import { URL } from 'url';
import { promises as fs } from 'fs';
import pako from 'pako';
import base64url from 'base64url';

import { phases } from './app/phases.js';
import { PatternBuilder, Field, InputType, RussianDateParser, PatternMatcher, EntryMatchers } from '@vitalyrudenko/templater';
import { Template } from './app/templates/Template.js';
import { NotionSessionManager } from './app/notion/NotionSessionManager.js';
import { UserSessionManager } from './app/users/UserSessionManager.js';

import { withTelegramAccount } from './app/telegram/middlewares/withTelegramAccount.js';
import { withPhaseFactory } from './app/telegram/middlewares/withPhaseFactory.js';
import { withUserFactory } from './app/telegram/middlewares/withUserFactory.js';
import { withNotionFactory } from './app/telegram/middlewares/withNotionFactory.js';
import { withLocalization } from './app/telegram/middlewares/withLocalization.js';

import { NotionDatabase } from './app/notion/NotionDatabase.js';
import { NotionEntrySerializer } from './app/notion/NotionEntrySerializer.js';
import { localize } from './app/localize.js';
import { Language } from './app/Language.js';
import { parseTimezoneOffsetMinutes } from './app/utils/parseTimezoneOffset.js';
import { NotionEntry } from './app/notion/NotionEntry.js';
import { NotionProperty } from './app/notion/NotionProperty.js';
import { PostgresStorage } from './app/storage/PostgresStorage.js';
import { User } from './app/users/User.js';
import { TelegramAccount } from './app/telegram/TelegramAccount.js';
import { NotionAccount } from './app/notion/NotionAccount.js';
import { escapeMd } from './app/utils/escapeMd.js';

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
    const linkLanguageMap = {
        [Language.ENGLISH]: 'en',
        [Language.RUSSIAN]: 'ru',
        [Language.UKRAINIAN]: 'uk',
    };

    const packageJson = JSON.parse(await fs.readFile('package.json', { encoding: 'utf-8' }));

    function createTemplateManagerLink({ templates, language }) {
        const linkLanguage = linkLanguageMap[language] ?? 'en';
        const searchParams = new URLSearchParams()
        searchParams.append('templates', encodeTemplates(templates.map(t => ({ pattern: t.pattern }))));
        
        return `${FRONTEND_DOMAIN}/#/${linkLanguage}/manager?${searchParams.toString()}`;
    }

    function createTemplateBuilderLink({ pattern = null, test = null, language }) {
        const linkLanguage = linkLanguageMap[language] ?? 'en';
        const searchParams = new URLSearchParams()
        if (pattern) searchParams.append('pattern', pattern);
        if (test) searchParams.append('test', test);

        let queryParams = searchParams.toString();
        if (queryParams) {
            queryParams = '?' + queryParams;
        }
        
        return `${FRONTEND_DOMAIN}/#/${linkLanguage}/builder${queryParams}`;
    }

    function createTimezoneCheckerLink({ language }) {
        const linkLanguage = linkLanguageMap[language] ?? 'en';
        return `${FRONTEND_DOMAIN}/#/${linkLanguage}/timezone`;
    }

    function getGuideLink({ language }) {
        if (language === Language.ENGLISH) return process.env.GUIDE_LINK_EN;
        if (language === Language.RUSSIAN) return process.env.GUIDE_LINK_RU;
        if (language === Language.UKRAINIAN) return process.env.GUIDE_LINK_UK;
        throw new Error(`Invalid language: ${language}`)
    }

    const storage = new PostgresStorage(process.env.DATABASE_URL);

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
                    timezoneCheckerLink: createTimezoneCheckerLink({ language }),
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

    bot.command('info', withUser({ required: false }), withNotion({ required: false }), async (ctx) => {
        const databases = ctx.state.userId ? await storage.findDatabasesByUserId(ctx.state.userId) : [];
        const templates = ctx.state.userId ? await storage.findTemplatesByUserId(ctx.state.userId) : [];

        await ctx.reply(
            ctx.state.localize('command.info.response', {
                name: escapeMd(ctx.from.first_name),
                language: ctx.state.user?.language
                    ? ctx.state.localize(`language.${ctx.state.user.language}`)
                    : ctx.state.localize('command.info.notProvided'),
                timezone: ctx.state.user?.timezoneOffsetMinutes
                    ? escapeMd(formatTimezone(ctx.state.user?.timezoneOffsetMinutes))
                    : ctx.state.localize('command.info.notProvided'),
                notionToken: escapeMd(ctx.state.notionAccount?.token ?? ctx.state.localize('command.info.notProvided')),
                databases: databases.length > 0
                    ? '\n' + databases.map(list => ctx.state.localize('command.info.database', {
                        notionDatabaseId: escapeMd(list.notionDatabaseId),
                        notionDatabaseUrl: list.notionDatabaseUrl,
                        alias: escapeMd(list.alias),
                    })).join('\n')
                    : ctx.state.localize('command.info.none'),
                templates: formatTemplates(templates, ctx.state.localize),
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    });

    bot.command('help', withUser(), async (ctx) => {
        await ctx.reply(
            ctx.state.localize('command.help', {
                guideLink: getGuideLink({ language: ctx.state.user?.language })
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    });

    bot.command('version', async (ctx) => {
        await ctx.reply(packageJson.version);
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

    bot.command('templates', withUser(), withNotion(), async (ctx) => {
        const TEMPLATES_REORDER_REGEX = /\/templates reorder\n(.+)/s;

        if (TEMPLATES_REORDER_REGEX.test(ctx.message.text)) {
            const [_, match] = ctx.message.text.match(TEMPLATES_REORDER_REGEX);

            const patterns = match.split('\n').filter(Boolean).map(p => p.replace(/\\n/g, '\n'));
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
                    }),
                    { parse_mode: 'MarkdownV2' }
                );
            } else {
                await ctx.reply(
                    ctx.state.localize('command.templates.reorder.success', {
                        templates: formatTemplates(updatedTemplates, ctx.state.localize)
                    }),
                    { parse_mode: 'MarkdownV2' }
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

    bot.action('templates:delete', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        const templates = await storage.findTemplatesByUserId(ctx.state.userId);

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(
                ctx.state.localize('command.templates.delete.chooseTemplate'),
                Markup.inlineKeyboard([
                    ...templates.map((template, i) => Markup.button.callback(
                        formatPattern(template.pattern),
                        `templates:delete:template:${i}`
                    )),
                    Markup.button.callback(
                        ctx.state.localize('command.templates.delete.cancel'),
                        'templates:delete:cancel'
                    ),
                ], { columns: 1 })
            )
        ]);
    });

    bot.action(/templates:delete:template:(.+)/, withUser(), withPhase(null, async (ctx) => {
        await ctx.answerCbQuery();
        
        const index = Number(ctx.match[1]);
        const templates = await storage.findTemplatesByUserId(ctx.state.userId);
        const template = templates[index];

        if (!template) {
            return;
        }

        await storage.deleteTemplateByPattern(ctx.state.userId, template.pattern);

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(ctx.state.localize('command.templates.delete.deleted', { template: formatPattern(template.pattern) })),
        ]);
    }));

    bot.action('templates:delete:cancel', withUser(), withNotion(), async (ctx) => {
        await ctx.answerCbQuery();

        await Promise.all([
            ctx.deleteMessage(),
            ctx.reply(ctx.state.localize('command.templates.delete.cancelled'))
        ]);
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
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
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
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
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
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
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
                const user = await storage.createUser(new User({ language, timezoneOffsetMinutes }));
                await storage.createTelegramAccount(new TelegramAccount({ userId: user.id, telegramUserId: ctx.from.id }));
            } else {
                await storage.updateUser(new User({ id: ctx.state.userId, language, timezoneOffsetMinutes }));
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
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            );
        }),
        withUser(),
        // Notion
        withPhase(phases.notion.token, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const token = ctx.message.text;

            await storage.createNotionAccount(new NotionAccount({ userId: ctx.state.userId, token }));
            await ctx.reply(ctx.state.localize('command.notion.allSet', { token }));

            userSessionManager.reset(ctx.state.userId);
        }),
        // Databases
        withPhase(phases.addDatabase.link, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const notionDatabaseUrl = ctx.message.text;
            if (!isValidNotionDatabaseUrl(notionDatabaseUrl)) {
                await ctx.reply(ctx.state.localize('command.databases.add.invalidLink'));
                return;
            }

            userSessionManager.context(ctx.state.userId).notionDatabaseUrl = notionDatabaseUrl;
            userSessionManager.setPhase(ctx.state.userId, phases.addDatabase.alias);
            await ctx.reply(ctx.state.localize('command.databases.add.alias'));
        }),
        withPhase(phases.addDatabase.alias, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const alias = databaseAlias(ctx.message.text);
            if (!alias) {
                await ctx.reply(ctx.state.localize('command.databases.add.invalidAlias'));
                return;
            }

            const { notionDatabaseUrl } = userSessionManager.context(ctx.state.userId);
            await storage.storeDatabase(
                new NotionDatabase({
                    userId: ctx.state.userId,
                    notionDatabaseUrl,
                    alias,
                })
            );

            userSessionManager.reset(ctx.state.userId);
            await ctx.reply(ctx.state.localize('command.databases.add.added', { alias }));
        }),
        // Patterns
        withPhase(phases.template.pattern, async (ctx) => {
            if (!('text' in ctx.message)) return;

            const { defaultFields } = userSessionManager.context(ctx.state.userId);

            await storage.storeTemplate(
                new Template({
                    pattern: ctx.message.text.replace(/\\n/g, '\n'),
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

            const { userId, user } = ctx.state;

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
                    pattern: escapeMd(formatPattern(template.pattern))
                })
            ).join('\n')
            : localize('output.templates.none');
    }

    function formatPattern(pattern) {
        return pattern.replace(/\n/g, '\\n')
    }

    function isValidNotionDatabaseUrl(link) {
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

    if (process.env.USE_WEBHOOKS === 'true') {
        const port = Number(process.env.PORT) || 80
        const domain = `${process.env.DOMAIN}:${port}`
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        console.log('Domain:', domain, 'Port:', port, 'Bot token:', botToken);

        bot.telegram.setWebhook(`${domain}/bot${botToken}`);
        bot.startWebhook(`/bot${botToken}`, null, port);
    } else {
        await bot.launch({
            allowedUpdates: ['callback_query', 'message'],
            dropPendingUpdates: true,
        });
    }
})()
    .then(() => console.log('Started!'));

