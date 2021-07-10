export class Field {
    /**
     * @param {{
     *     name?: string,
     *     inputType?: string,
     *     value: string | string[],
     *     bang?: boolean,
     * }} attributes
     */
    constructor({ name, inputType, value, bang = false }) {
        this._name = name;
        this._inputType = inputType;
        this._value = value;
        this._bang = bang;
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

    get bang() {
        return this._bang;
    }
}
