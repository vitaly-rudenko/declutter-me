class TelegramAccount {
    constructor({ userId, telegramUserId }) {
        this._userId = userId;
        this._telegramUserId = telegramUserId;
    }

    get userId() {
        return this._userId;
    }

    get telegramUserId() {
        return this._telegramUserId;
    }
}

module.exports = TelegramAccount;
