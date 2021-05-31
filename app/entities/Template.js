class Template {
    constructor({ userId, type, order, pattern, defaultVariables }) {
        this._userId = userId;
        this._type = type;
        this._order = order;
        this._pattern = pattern;
        this._defaultVariables = defaultVariables;
    }

    get userId() {
        return this._userId;
    }

    get type() {
        return this._type;
    }

    get order() {
        return this._order;
    }

    get pattern() {
        return this._pattern;
    }

    get defaultVariables() {
        return this._defaultVariables;
    }

}

module.exports = Template;
