/** @param {import('../../storage/InMemoryStorage')} storage */
const withTelegramAccount = (storage) => {
    return async (context, next) => {
        context.state.telegramAccount = await storage.findTelegramAccount(context.from.id);

        if (context.state.telegramAccount) {
            context.state.userId = context.state.telegramAccount.userId;
        }

        return next();
    };
};

module.exports = withTelegramAccount;
