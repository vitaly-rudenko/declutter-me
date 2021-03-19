const Note = require('./Note');

class NoteAction {
    constructor({ noteGateway }) {
        this._noteGateway = noteGateway;
    }

    async execute(context) {
        if (context.isRequired) {
            const existingNotes = await this._noteGateway.findByTag(context.tag);
            if (existingNotes.length === 0) {
                return false;
            }
        }

        await this._noteGateway.create(
            new Note({
                tag: context.tag,
                body: context.body,
            })
        );

        return true;
    }
}

module.exports = NoteAction;
