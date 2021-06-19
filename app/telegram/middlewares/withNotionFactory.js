const { Client } = require('@notionhq/client');
const NotionAccountNotFound = require('../../errors/NotionAccountNotFound');

/** @param {import('../../notion/NotionSessionManager')} notionSessionManager */
const withNotionFactory = (notionSessionManager) => {
    /** @param {{ required?: boolean }} [options] */
    return ({ required = true } = {}) => {
        /** @param {import('telegraf').Context} context @param {Function} next */
        return async (ctx, next) => {
            try {
                const [notion, notionAccount] = await notionSessionManager.get(ctx.state.userId);
    
                ctx.state.notion = notion;
                ctx.state.notionAccount = notionAccount;
            } catch (error) {
                if (error instanceof NotionAccountNotFound) {
                    if (required) {
                        await ctx.reply('Please use `/notion` first 🙇');
                        return;
                    }
                }
                
                throw error;
            }

            next();
        };
    };
};

module.exports = withNotionFactory;
