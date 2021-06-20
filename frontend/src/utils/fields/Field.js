class Field {
    /**
     * @param {{
     *     name?: string,
     *     outputType?: string,
     *     inputType?: string,
     *     value: string | string[],
     *     bang?: boolean,
     * }} attributes
     */
    constructor({ name, inputType, outputType, value, bang = false }) {
        this._name = name;
        this._inputType = inputType;
        this._outputType = outputType;
        this._value = value;
        this._bang = bang;
    }

    get name() {
        return this._name;
    }

    get inputType() {
        return this._inputType;
    }

    get outputType() {
        return this._outputType;
    }

    get value() {
        return this._value;
    }

    get bang() {
        return this._bang;
    }
}

module.exports = Field;
