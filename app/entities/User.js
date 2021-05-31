class User {
    constructor({ userId, language, timezoneOffsetMinutes }) {
        this._userId = userId;
        this._language = language;
        this._timezoneOffsetMinutes = timezoneOffsetMinutes;
    }

    get userId() {
        return this._userId;
    }

    get language() {
        return this._language;
    }

    get timezoneOffsetMinutes() {
        return this._timezoneOffsetMinutes;
    }
}

module.exports = User;
