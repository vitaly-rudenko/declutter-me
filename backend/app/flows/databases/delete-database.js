import { Markup } from 'telegraf';

// -- "delete" button clicked
export function databasesDeleteAction({ storage }) {
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
                        `databases:delete:${database.alias}`
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

// -- database selected
export function databasesDeleteByAliasAction({ storage }) {
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

// -- "cancel" button clicked
export function databasesDeleteCancelAction() {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.databases.delete.cancelled'))
        ]);
    };
}
