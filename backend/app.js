import dotenv from 'dotenv'

if (process.env.USE_NATIVE_ENV !== 'true') {
    console.log('Using .env file')
    dotenv.config();
}

import { Telegraf } from 'telegraf';
import express from 'express';

import { phases } from './app/phases.js';
import { NotionSessionManager } from './app/notion/NotionSessionManager.js';
import { UserSessionManager } from './app/users/UserSessionManager.js';

import { withTelegramAccount } from './app/telegram/middlewares/withTelegramAccount.js';
import { withPhaseFactory } from './app/telegram/middlewares/withPhaseFactory.js';
import { withUserFactory } from './app/telegram/middlewares/withUserFactory.js';
import { withNotionFactory } from './app/telegram/middlewares/withNotionFactory.js';
import { withLocalization } from './app/telegram/middlewares/withLocalization.js';

import { localize } from './app/localize.js';
import { Language } from './app/Language.js';
import { PostgresStorage } from './app/storage/PostgresStorage.js';
import { Cache } from './app/storage/Cache.js';
import { startLanguageAction, startCommand, startTimezoneMessage, startUpdateAction } from './app/flows/start.js';
import { notionCommand, notionUpdateTokenAction, notionTokenMessage } from './app/flows/notion.js';
import { databasesAddLinkMessage, databasesAddAliasMessage, databasesAddAction } from './app/flows/databases/add-database.js';
import { databasesCommand } from './app/flows/databases/list-databases.js';
import { databasesDeleteAction, databasesDeleteByAliasAction, databasesDeleteCancelAction } from './app/flows/databases/delete-database.js';
import { templatesReorderAction, templatesReorderCommand } from './app/flows/templates/reorder-templates.js';
import { templatesDeleteCancelAction, templatesDeleteAction, templatesDeleteByHashAction } from './app/flows/templates/delete-template.js';
import { templatesAddDefaultFieldsCancelAction, templatesAddDefaultFieldsAction, templatesAddDefaultFieldsMessage } from './app/flows/templates/add-default-fields.js';
import { templatesAddAction, templatesAddWithDatabaseAction, templatesAddWithoutDatabaseAction, templatesAddPatternMessage } from './app/flows/templates/add-template.js';
import { templatesCommand } from './app/flows/templates/list-templates.js';
import { matchMessage, matchNotionUndoAction } from './app/flows/match.js';
import { exportCommand } from './app/flows/export.js';
import { helpCommand } from './app/flows/help.js';
import { importMessage } from './app/flows/import.js';
import { versionCommand } from './app/flows/version.js';
import { apiCommand } from './app/flows/api.js';
import { match } from './app/match.js';
import { NotionAccountNotFound } from './app/errors/NotionAccountNotFound.js';

const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN;

(async () => {
    const storage = new PostgresStorage(process.env.DATABASE_URL);
    await storage.connect();

    const debugChatId = process.env.DEBUG_CHAT_ID;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

    const bot = new Telegraf(telegramBotToken);

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
        ['databases', 'templates', 'notion', 'help', 'start', 'export', 'api', 'version']
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
            await next();
        }
    });

    bot.command('version', versionCommand());

    bot.use(withTelegramAccount(storage));
    bot.use(withLocalization());

    bot.start(withUser({ required: false, skipAccountCheck: true }), startCommand({ userSessionManager }));
    bot.action('start:update', withUser(), startUpdateAction({ userSessionManager }));
    bot.action(/language:(.+)/, withPhase(phases.start.language, startLanguageAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));

    bot.command('help', withUser(), helpCommand());

    bot.command('notion', withUser(), withNotion({ required: false }), notionCommand({ userSessionManager }));
    bot.action('notion:update', withUser(), notionUpdateTokenAction({ userSessionManager }));
    
    bot.command('databases', withUser(), withNotion(), databasesCommand({ storage }));
    bot.action('databases:add', withUser(), withNotion(), databasesAddAction({ userSessionManager }));
    bot.action('databases:delete', withUser(), withNotion(), databasesDeleteAction({ storage }));
    bot.action(/databases:delete:(.+)/, withUser(), withPhase(null, databasesDeleteByAliasAction({ storage })));
    bot.action('databases:delete:cancel', withUser(), withNotion(), databasesDeleteCancelAction());

    bot.command('templates', withUser(), withNotion(), templatesReorderCommand({ storage }), templatesCommand({ storage }));
    bot.action('templates:add', withUser(), withNotion(), templatesAddAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager, storage }));
    bot.action('templates:delete', withUser(), withNotion(), templatesDeleteAction({ storage }));
    bot.action(/templates:delete:template:(.+)/, withUser(), withPhase(null, templatesDeleteByHashAction({ storage })));
    bot.action('templates:delete:cancel', withUser(), withNotion(), templatesDeleteCancelAction());
    bot.action('templates:reorder', withUser(), withNotion(), templatesReorderAction({ frontendDomain: FRONTEND_DOMAIN, storage }));
    bot.action(/template:add:database:(.+)/, withUser(), withPhase(phases.template.database, templatesAddWithDatabaseAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));
    bot.action('template:add:skip-database', withUser(), withPhase(phases.template.database, templatesAddWithoutDatabaseAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));
    bot.action('template:add-default-fields:cancel', withUser(), templatesAddDefaultFieldsCancelAction({ userSessionManager }));
    bot.action(/template:add-default-fields:(.+)/, withUser(), templatesAddDefaultFieldsAction({ userSessionManager }));

    bot.command('export', withUser(), withNotion(), exportCommand({ storage }));
    bot.command('api', withUser(), apiCommand({ storage }));

    bot.on('message',
        async (context, next) => {
            if ('text' in context.message && context.message.text.startsWith('/')) return;
            await next();
        },
        // Start
        withPhase(phases.start.timezone, startTimezoneMessage({ storage, userSessionManager, notionSessionManager })),
        withUser(),
        // Notion
        withPhase(phases.notion.sendToken, notionTokenMessage({ storage, userSessionManager, notionSessionManager })),
        // Databases
        withPhase(phases.addDatabase.link, databasesAddLinkMessage({ userSessionManager })),
        withPhase(phases.addDatabase.alias, databasesAddAliasMessage({ storage, userSessionManager })),
        // Templates
        withPhase(phases.template.pattern, templatesAddPatternMessage({ storage, userSessionManager })),
        withPhase(phases.template.addDefaultFields, templatesAddDefaultFieldsMessage({ storage, userSessionManager })),
        // Import
        importMessage({ bot, storage }),
        // Handle message
        withNotion(),
        withPhase(null, matchMessage({ bot, storage })),
    );
    bot.action(/undo:notion:(.+)/, withUser(), withNotion(), withPhase(null, matchNotionUndoAction()));

    bot.catch((error) => logError(error));

    await bot.telegram.deleteWebhook();

    const domain = process.env.DOMAIN;
    const port = Number(process.env.PORT) || 3001;
    const webhookUrl = `${domain}/bot${telegramBotToken}`;

    await bot.telegram.setWebhook(webhookUrl, { allowed_updates: ['message', 'callback_query'] });

    const handledUpdates = new Cache(60_000);

    const app = express();
    app.use(express.json());

    app.post(`/bot${telegramBotToken}`, async (req, res, next) => {
        const updateId = req.body['update_id']
        if (!updateId) {
            console.log('Invalid update:', req.body);
            res.sendStatus(500);
            return;
        }

        if (handledUpdates.has(updateId)) {
            console.log('Update is already handled:', req.body);
            res.sendStatus(200);
            return;
        }

        handledUpdates.set(updateId);
        console.log('Update received:', req.body);

        try {
            await bot.handleUpdate(req.body, res);
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/messages', async (req, res, next) => {
        try {
            const apiKey = req.get('api-key')
            if (!apiKey) {
                return res.status(422).json({ error: { code: 'API_KEY_NOT_PROVIDED' } });
            }

            const text = req.body.text
            if (!text) {
                return res.status(422).json({ error: { code: 'TEXT_NOT_PROVIDED' } });
            }
    
            const user = await storage.findUserByApiKey(apiKey);
            if (!user) {
                return res.status(401).json({ error: { code: 'API_KEY_NOT_FOUND' } });
            }
    
            let notion;
            try {
                ([notion] = await notionSessionManager.get(user.id));
            } catch (error) {
                if (error instanceof NotionAccountNotFound) {
                    return res.status(400).json({ error: { code: 'NOTION_ACCOUNT_NOT_CONFIGURED' } });
                }

                throw error;
            }
    
            const result = await match({
                user,
                notion,
                storage,
                text,
            });
    
            if (!result.match) {
                return res.status(404).json({ match: null });
            }
    
            res.json({
                match: {
                    fields: result.match.fields.map(field => ({
                        name: field.name,
                        inputType: field.inputType,
                        value: field.value,
                    })),
                    database: {
                        alias: result.match.database.alias,
                        notionDatabaseUrl: result.match.database.notionDatabaseUrl,
                    },
                    notionPage: {
                        id: result.match.notion.pageId,
                        url: result.match.notion.pageUrl,
                    },
                    combination: result.match.combination,
                }
            });
        } catch (error) {
            res.status(500).json({
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error.message,
                }
            });
        }
    })

    await new Promise(resolve => app.listen(port, () => resolve()));

    console.log(
        `Webhook 0.0.0.0:${port} is listening at ${webhookUrl}:`,
        await bot.telegram.getWebhookInfo()
    );
})();
