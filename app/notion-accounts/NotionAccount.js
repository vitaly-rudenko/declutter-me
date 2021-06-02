class NotionAccount {
    constructor({ userId, token }) {
        this._userId = userId;
        this._token = token;
        this._notesDatabaseId = null;
        this._remindersDatabaseId = null;
    }

    get userId() {
        return this._userId;
    }

    get token() {
        return this._token;
    }

    setNotesDatabaseId(value) {
        this._notesDatabaseId = value;
        return this;
    }
    
    get notesDatabaseId() {
        return this._notesDatabaseId;
    }

    setRemindersDatabaseId(value) {
        this._remindersDatabaseId = value;
        return this;
    }
    
    get remindersDatabaseId() {
        return this._remindersDatabaseId;
    }
}

module.exports = NotionAccount;
