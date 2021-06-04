class Reminder {
    constructor({ id = null, content, date, reminded = false }) {
        this._id = id;
        this._content = content;
        this._date = date;
        this._reminded = reminded;
    }

    get id() {
        return this._id;
    }

    get content() {
        return this._content;
    }

    get date() {
        return this._date;
    }

    get reminded() {
        return this._reminded;
    }
}

module.exports = Reminder;
