export class NotionProperty {
    constructor({ name, type }) {
        this._name = name;
        this._type = type;
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }
}
