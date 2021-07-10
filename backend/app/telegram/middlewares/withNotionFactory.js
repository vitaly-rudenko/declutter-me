import { NotionAccountNotFound } from '../../errors/NotionAccountNotFound.js';

/** @param {import('../../notion/NotionSessionManager').NotionSessionManager} notionSessionManager */
export const withNotionFactory = (notionSessionManager) => {
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
                        await ctx.reply(ctx.state.localize('notionNotConfigured'));
                        return;
                    }
                }
                
                throw error;
            }

            next();
        };
    };
};
