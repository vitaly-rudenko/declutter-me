import { phases } from '../phases.js';

export function notionCommand({ userSessionManager }) {
    return async (context) => {
        await context.reply(context.state.localize('command.notion.yourToken'));
        userSessionManager.setPhase(context.state.userId, phases.notion.token);
    };
}
