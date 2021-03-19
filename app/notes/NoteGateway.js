class NoteGateway {
    constructor() {
        this._id = 0;
        /** @type {import('./Note')[]} */
        this._notes = [];
    }

    /** @param {string} tag */
    findByTag(tag) {
        return this._notes.filter(n => n.tag === tag);
    }

    /** @param {import('./Note')} note */
    create(note) {
        const createdNote = note.clone({ id: ++this._id });
        this._notes.push(createdNote);
        return createdNote;
    }

    /** @param {number} id */
    deleteById(id) {
        const index = this._notes.findIndex(r => r.id === id);
        if (index !== -1) {
            this._notes.splice(index, 1);
        }
    }
}

module.exports = NoteGateway;
