class Note {
    constructor({ id, tag, body }) {
        this._id = id;
        this._tag = tag;
        this._body = body;
    }

    clone(attributeChanges = {}) {
        return new Note({
            id: this._id,
            tag: this._tag,
            body: this._body,
            ...attributeChanges,
        });
    }

    get id() {
        return this._id;
    }

    get tag() {
        return this._tag;
    }

    get body() {
        return this._body;
    }
}

module.exports = Note;
