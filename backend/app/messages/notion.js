import { NotionAccount } from '../notion/NotionAccount.js';

export function notionMessage({ storage, userSessionManager, notionSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const token = context.message.text;

        await storage.upsertNotionAccount(new NotionAccount({ userId: context.state.userId, token }));
        await context.reply(context.state.localize('command.notion.allSet', { token }));

        userSessionManager.clear(context.state.userId);
        notionSessionManager.clear(context.state.userId);
    };
}
