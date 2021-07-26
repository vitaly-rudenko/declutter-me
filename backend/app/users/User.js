export class User {
    constructor({ id = null, language, timezoneOffsetMinutes }) {
        this._id = id;
        this._language = language;
        this._timezoneOffsetMinutes = timezoneOffsetMinutes;
    }

    clone(attributes = {}) {
        return new User({
            id: this._id,
            language: this._language,
            timezoneOffsetMinutes: this._timezoneOffsetMinutes,
            ...attributes
        });
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
