/** @param {import('../../storage/PostgresStorage').PostgresStorage} storage */
export const withUserFactory = (storage) => {
    /** @param {{ required?: boolean, skipAccountCheck?: boolean }} [options] */
    return ({ required = true, skipAccountCheck = false } = {}) => {
        /** @param {import('telegraf').Context} context @param {Function} next */
        return async (context, next) => {
            if (!context.state.userId && !skipAccountCheck) {
                context.reply('Please use /start first 🙇');
                return;
            }
        
            context.state.user = await storage.findUserById(context.state.userId);
            if (!context.state.user && required) {
                context.reply('Please use /start first 🙇');
                return;
            }
        
            await next();
        };
    };
};
