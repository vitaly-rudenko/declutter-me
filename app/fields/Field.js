class Field {
    /**
     * @param {{
     *     name: string,
     *     outputType?: string,
     *     inputType?: string,
     *     value: string | string[],
     * }} attributes
     */
    constructor({ name, inputType, outputType, value }) {
        this._name = name;
        this._inputType = inputType;
        this._outputType = outputType;
        this._value = value;
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
}

module.exports = Field;
