import { escapeMd } from '@vitalyrudenko/telegramify'

export function apiCommand() {
    /** @param {import('telegraf').Context} context */
    return async (context) => {
        const { user } = context.state

        await context.reply(
            context.state.localize(
                'command.api.response',
                {
                    domain: escapeMd(process.env.DOMAIN),
                    apiKey: escapeMd(user.apiKey),
                }
            ),
            { parse_mode: 'MarkdownV2' }
        );
    };
}
