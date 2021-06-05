const Cache = require('../storage/Cache');

class UserSessionManager {
    constructor() {
        this._phases = new Cache(60 * 60_000);
        this._contexts = new Cache(60 * 60_000);
    }

    setPhase(userId, phase) {
        this._phases.set(userId, { phase });
    }
    
    getPhase(userId) {
        return this._phases.get(userId)?.phase ?? null;
    }

    context(userId) {
        if (!this._contexts.get(userId)) {
            this._contexts.set(userId, {});
        }

        return this._contexts.get(userId);
    }

    reset(userId) {
        this._phases.delete(userId);
        this._contexts.delete(userId);
    }
}

module.exports = UserSessionManager;
