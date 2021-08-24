import { NotionDatabase } from '../../notion/NotionDatabase.js';
import { phases } from '../../phases.js';

// -- "add" button clicked
export function databasesAddAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.databases.add.link'))
        ]);

        userSessionManager.setPhase(context.state.userId, phases.addDatabase.link);
    };
}

// -- link sent
export function databasesAddLinkMessage({ userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const notionDatabaseUrl = context.message.text;
        if (!isValidNotionDatabaseUrl(notionDatabaseUrl)) {
            await context.reply(context.state.localize('command.databases.add.invalidLink'));
            return;
        }

        userSessionManager.context(context.state.userId).notionDatabaseUrl = notionDatabaseUrl;
        userSessionManager.setPhase(context.state.userId, phases.addDatabase.alias);
        await context.reply(context.state.localize('command.databases.add.alias'));
    };
}

// -- alias sent
export function databasesAddAliasMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const alias = toDatabaseAlias(context.message.text);
        if (!alias) {
            await context.reply(context.state.localize('command.databases.add.invalidAlias'));
            return;
        }

        const { notionDatabaseUrl } = userSessionManager.context(context.state.userId);
        await storage.storeDatabase(
            new NotionDatabase({
                userId: context.state.userId,
                notionDatabaseUrl,
                alias,
            })
        );

        userSessionManager.clear(context.state.userId);
        await context.reply(context.state.localize('command.databases.add.added', { alias }));
    };
}

export function isValidNotionDatabaseUrl(link) {
    try {
        const databaseId = new URL(link).pathname.slice(1).split('/').pop().split('-').pop();
        return (/^[a-z0-9]+$/i).test(databaseId);
    } catch (error) {
        return null;
    }
}

export function toDatabaseAlias(value) {
    value = value.trim().toLowerCase();

    if (!value || /\s/.test(value)) {
        return null;
    }

    return value;
}
