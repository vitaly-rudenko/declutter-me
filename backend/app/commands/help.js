import { createGuideLink } from '../utils/createGuideLink.js';

export function helpCommand() {
    return async (context) => {
        await context.reply(
            context.state.localize('command.help', {
                guideLink: createGuideLink({ language: context.state.user?.language })
            }),
            { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
        );
    };
}
