/** @typedef {import('telegraf').Context} Context */

/** @param {import('../../users/UserSessionManager')} userSessionManager */
const withPhaseFactory = (userSessionManager) => {
    /**
     * @param {string | null} phase
     * @param {(context: Context, next: Function)} middleware
     */
    return (phase, middleware) => {
        /** @param {Context} context @param {Function} next */
        return async (context, next) => {
            if (userSessionManager.getPhase(context.state.userId) === phase) {
                await middleware(context, next);
            } else {
                next();
            }
        }
    };
};

module.exports = withPhaseFactory;
