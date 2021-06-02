class List {
    constructor({ id, alias, userId }) {
        this._id = id;
        this._alias = alias;
        this._userId = userId;
    }

    get id() {
        return this._id;
    }

    get alias() {
        return this._alias;
    }

    get userId() {
        return this._userId;
    }
}

module.exports = List;
