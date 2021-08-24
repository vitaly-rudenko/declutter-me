export class Field {
    /**
     * @param {{
     *     name?: string,
     *     inputType?: string,
     *     value: string | string[],
     * }} attributes
     */
    constructor({ name, inputType, value }) {
        this._name = name;
        this._inputType = inputType;
        this._value = value;
    }

    get name() {
        return this._name;
    }

    get inputType() {
        return this._inputType;
    }

    get value() {
        return this._value;
    }
}
