class NotionAccount {
    constructor({ userId, token }) {
        this._userId = userId;
        this._token = token;
    }

    get userId() {
        return this._userId;
    }

    get token() {
        return this._token;
    }
}

module.exports = NotionAccount;
