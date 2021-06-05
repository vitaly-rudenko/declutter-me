class Template {
    constructor({ userId, type, pattern, order = null, defaultVariables = {} }) {
        this._userId = userId;
        this._type = type;
        this._order = order;
        this._pattern = pattern;
        this._defaultVariables = defaultVariables;
    }

    clone(override = {}) {
        return new Template({
            userId: this._userId,
            type: this._type,
            order: this._order,
            pattern: this._pattern,
            defaultVariables: this._defaultVariables,
            ...override,
        });
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
