class Field {
    constructor({ name, type, value }) {
        this._name = name;
        this._type = type;
        this._value = value;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get value() {
        return this._value;
    }
}

module.exports = Field;
