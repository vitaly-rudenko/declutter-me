import { Markup } from 'telegraf';
import { NotionAccount } from '../notion/NotionAccount.js';
import { phases } from '../phases.js';

// -- /notion command
export function notionCommand({ userSessionManager }) {
    return async (context) => {
        const notionToken = context.state.notionAccount?.token;
        if (!notionToken) {
            await updateNotionToken(context, { userSessionManager });
            return;
        }

        await context.reply(
            context.state.localize('command.notion.chooseAction', { notionToken }),
            {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.callback(context.state.localize('command.notion.actions.update'), 'notion:update'),
                ]).reply_markup,
            },
        );
    };
}

// -- "update" button is clicked
export function notionUpdateTokenAction({ userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            updateNotionToken(context, { userSessionManager }),
        ]);
    };
}

async function updateNotionToken(context, { userSessionManager }) {
    await context.reply(
        context.state.localize('command.notion.update.sendToken'),
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true },
    );

    userSessionManager.setPhase(context.state.userId, phases.notion.sendToken);
}

// -- Notion token is sent
export function notionTokenMessage({ storage, userSessionManager, notionSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const token = context.message.text;

        await storage.upsertNotionAccount(new NotionAccount({ userId: context.state.userId, token }));
        await context.reply(context.state.localize('command.notion.update.done', { token }));

        userSessionManager.clear(context.state.userId);
        notionSessionManager.clear(context.state.userId);
    };
}
