import { Markup } from 'telegraf';

export function undoNotionAction() {
    return async (context) => {
        await context.answerCbQuery();

        context.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                Markup.button.callback(context.state.localize('match.undoInProcess'), 'fake-button'),
            ]).reply_markup,
        ).catch(() => {});

        /** @type {import('@notionhq/client').Client} */
        const notion = context.state.notion;
        const pageId = context.match[1];

        await notion.pages.update({
            page_id: pageId,
            archived: true,
            properties: {},
        });

        await context.editMessageText(context.state.localize('match.undoSuccessful'));
    };
}
