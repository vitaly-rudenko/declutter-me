class Entry {
    constructor({ content, tags }) {
        this._content = content;
        this._tags = tags;
    }

    get content() {
        return this._content;
    }

    get tags() {
        return this._tags;
    }
}

module.exports = Entry;
