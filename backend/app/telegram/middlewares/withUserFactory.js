/** @param {import('../../storage/InMemoryStorage')} storage */
const withUserFactory = (storage) => {
    /** @param {{ required?: boolean }} [options] */
    return ({ required = true } = {}) => {
        /** @param {import('telegraf').Context} context @param {Function} next */
        return async (context, next) => {
            if (!context.state.userId) {
                context.reply('Please use /start first 🙇');
                return;
            }
        
            context.state.user = await storage.findUserById(context.state.userId);
            if (!context.state.user && required) {
                context.reply('Please use /start first 🙇');
                return;
            }
        
            next();
        };
    };
};

module.exports = withUserFactory;
