class Reminder {
    constructor({ id, date, body }) {
        this._id = id;
        this._date = date;
        this._body = body;
    }

    clone(attributeChanges = {}) {
        return new Reminder({
            id: this._id,
            date: this._date,
            body: this._body,
            ...attributeChanges,
        });
    }

    get id() {
        return this._id;
    }

    get date() {
        return this._date;
    }

    get body() {
        return this._body;
    }
}

module.exports = Reminder;
