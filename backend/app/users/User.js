export class User {
    constructor({ id = null, language, timezoneOffsetMinutes, apiKey }) {
        this._id = id;
        this._language = language;
        this._timezoneOffsetMinutes = timezoneOffsetMinutes;
        this._apiKey = apiKey;
    }

    clone(attributes = {}) {
        return new User({
            id: this._id,
            language: this._language,
            timezoneOffsetMinutes: this._timezoneOffsetMinutes,
            apiKey: this._apiKey,
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

    get apiKey() {
        return this._apiKey;
    }
}
