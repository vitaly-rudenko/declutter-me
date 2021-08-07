import { Template } from '../templates/Template.js';

export function templatePatternMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const { defaultFields } = userSessionManager.context(context.state.userId);

        const pattern = context.message.text.replace(/\\n/g, '\n');

        await storage.storeTemplate(
            new Template({
                pattern,
                defaultFields,
                userId: context.state.userId,
            })
        );

        userSessionManager.clear(context.state.userId);
        await context.reply(context.state.localize('command.templates.add.added'));
    };
}
