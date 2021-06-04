/** @param {import('../../users/UserSessionManager')} userSessionManager */
const withPhaseFactory = (userSessionManager) => {
    /**
     * @param {string | null} phase
     * @param {Function} middleware
     */
    return (phase, middleware) => {
        /** @param {import('telegraf').Context} context @param {Function} next */
        return async (context, next) => {
            if ((userSessionManager.getPhase(context.state.userId) || null) === phase) {
                return middleware(context, next);
            } else {
                return next();
            }
        }
    };
};

module.exports = withPhaseFactory;
