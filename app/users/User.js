class User {
    constructor({ id, language, timezoneOffsetMinutes }) {
        this._id = id;
        this._language = language;
        this._timezoneOffsetMinutes = timezoneOffsetMinutes;
    }

    get id() {
        return this._id;
    }

    get language() {
        return this._language;
    }

    get timezoneOffsetMinutes() {
        return this._timezoneOffsetMinutes;
    }
}

module.exports = User;
