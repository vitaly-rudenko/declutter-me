/** @param {import('../../storage/PostgresStorage').PostgresStorage} storage */
export const withTelegramAccount = (storage) => {
    /** @param {import('telegraf').Context} context @param {Function} next */
    return async (context, next) => {
        context.state.telegramAccount = await storage.findTelegramAccountByTelegramUserId(context.from.id);

        if (context.state.telegramAccount) {
            context.state.userId = context.state.telegramAccount.userId;
        }

        next();
    };
};
