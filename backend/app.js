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
import { infoCommand } from './app/commands/info.js';
import { helpCommand } from './app/commands/help.js';
import { notionCommand } from './app/commands/notion.js';
import { manageDatabasesCommand } from './app/commands/databases.js';
import { addDatabaseAction, cancelDeleteDatabaseAction, deleteDatabaseAction, deleteDatabaseByAliasAction } from './app/actions/databases.js';
import { manageTemplatesCommand } from './app/commands/templates.js';
import { addDefaultFieldsToTemplateAction, addTemplateAction, addTemplateWithDatabaseAction, addTemplateWithoutDatabase, cancelAddDefaultFieldsToTemplateAction, cancelDeleteTemplateAction, deleteTemplateAction, deleteTemplateByHashAction, reorderTemplatesAction } from './app/actions/templates.js';
import { timezoneMessage } from './app/messages/timezone.js';
import { notionMessage } from './app/messages/notion.js';
import { databaseAliasMessage, databaseLinkMessage } from './app/messages/databases.js';
import { templateDefaultFieldsMessage, templatePatternMessage } from './app/messages/templates.js';
import { matchMessage } from './app/messages/match.js';
import { languageAction } from './app/actions/language.js';
import { undoNotionAction } from './app/actions/notion.js';
import { startCommand } from './app/commands/start.js';
import { versionCommand } from './app/commands/version.js';

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
        ['databases', 'templates', 'info', 'notion', 'help', 'start', 'version']
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

    bot.start(startCommand({ userSessionManager }));
    bot.action(/language:(.+)/, withPhase(phases.start.language, languageAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));

    bot.command('info', withUser({ required: false }), withNotion({ required: false }), infoCommand({ storage }));
    bot.command('help', withUser(), helpCommand());
    bot.command('notion', withUser(), notionCommand({ userSessionManager }));
    
    bot.command('databases', withUser(), withNotion(), manageDatabasesCommand({ storage }));
    bot.action('databases:add', withUser(), withNotion(), addDatabaseAction({ userSessionManager }));
    bot.action('databases:delete', withUser(), withNotion(), deleteDatabaseAction({ storage }));
    bot.action(/databases:delete:(.+)/, withUser(), withPhase(null, deleteDatabaseByAliasAction({ storage })));
    bot.action('databases:delete:cancel', withUser(), withNotion(), cancelDeleteDatabaseAction());

    bot.command('templates', withUser(), withNotion(), manageTemplatesCommand({ storage }));
    bot.action('templates:add', withUser(), withNotion(), addTemplateAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager, storage }));
    bot.action('templates:delete', withUser(), withNotion(), deleteTemplateAction({ storage }));
    bot.action(/templates:delete:template:(.+)/, withUser(), withPhase(null, deleteTemplateByHashAction({ storage })));
    bot.action('templates:delete:cancel', withUser(), withNotion(), cancelDeleteTemplateAction());
    bot.action('templates:reorder', withUser(), withNotion(), reorderTemplatesAction({ frontendDomain: FRONTEND_DOMAIN, storage }));
    bot.action(/template:add:database-alias:(.+)/, withUser(), withPhase(phases.template.database, addTemplateWithDatabaseAction({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));
    bot.action('template:add:skip-database', withUser(), withPhase(phases.template.database, addTemplateWithoutDatabase({ frontendDomain: FRONTEND_DOMAIN, userSessionManager })));
    bot.action('template:add-default-fields:cancel', withUser(), cancelAddDefaultFieldsToTemplateAction({ userSessionManager }));
    bot.action(/template:add-default-fields:(.+)/, withUser(), addDefaultFieldsToTemplateAction({ userSessionManager }));

    bot.on('message',
        // Start
        withPhase(phases.start.timezone, timezoneMessage({ storage, userSessionManager, notionSessionManager })),
        withUser(),
        // Notion
        withPhase(phases.notion.token, notionMessage({ storage, userSessionManager, notionSessionManager })),
        // Databases
        withPhase(phases.addDatabase.link, databaseLinkMessage({ userSessionManager })),
        withPhase(phases.addDatabase.alias, databaseAliasMessage({ storage, userSessionManager })),
        // Templates
        withPhase(phases.template.pattern, templatePatternMessage({ storage, userSessionManager })),
        withPhase(phases.template.addDefaultFields, templateDefaultFieldsMessage({ storage, userSessionManager })),
        // Handle message
        withNotion(),
        withPhase(null, matchMessage({ bot, storage }))
    );
    bot.action(/undo:notion:(.+)/, withUser(), withNotion(), withPhase(null, undoNotionAction()));

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

    await new Promise(resolve => app.listen(port, () => resolve()));

    console.log(
        `Webhook 0.0.0.0:${port} is listening at ${webhookUrl}:`,
        await bot.telegram.getWebhookInfo()
    );
})();
