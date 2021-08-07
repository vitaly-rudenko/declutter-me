import { Markup } from 'telegraf';
import { phases } from '../phases.js';

export function cancelDeleteDatabaseAction() {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.databases.delete.cancelled'))
        ]);
    };
}

export function deleteDatabaseByAliasAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();
        
        const databaseAlias = context.match[1];
        await storage.deleteDatabaseByAlias(context.state.userId, databaseAlias);

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.databases.delete.deleted', { database: databaseAlias })),
        ]);
    };
}

export function addDatabaseAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.databases.add.link'))
        ]);

        userSessionManager.setPhase(context.state.userId, phases.addDatabase.link);
    };
}

export function deleteDatabaseAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();

        const databases = await storage.findDatabasesByUserId(context.state.userId);

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.databases.delete.chooseDatabase'),
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(
                        database.alias,
                        `databases:delete:database-alias:${database.alias}`
                    )),
                    Markup.button.callback(
                        context.state.localize('command.databases.delete.cancel'),
                        'databases:delete:cancel'
                    ),
                ], { columns: 2 })
            )
        ]);
    };
}
