const Cache = require('../utils/Cache');

class UserSessionManager {
    constructor() {
        this._phases = new Cache(60 * 60_000);
    }

    setPhase(userId, phase) {
        this._phases.set(userId, { phase, context: {} });
    }
    
    getPhase(userId) {
        return this._phases.get(userId);
    }

    setContext(userId, context) {
        this._phases.get(userId).context = context;
    }

    getContext(userId) {
        return this._phases.get(userId)?.context ?? {};
    }

    reset(userId) {
        this._phases.delete(userId);
    }
}

module.exports = UserSessionManager;
