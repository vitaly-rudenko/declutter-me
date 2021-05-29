// TODO: add support for multiple tags
class NoteMatchers {
    constructor() {
        this.note = this.note.bind(this);
        this.tag = this.tag.bind(this);
    }

    note(input, { nextTokens: [nextToken] }) {
        if (nextToken && nextToken.type === 'text') {
            return input.slice(0, input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase()));
        }

        return input;
    }

    tag(input) {
        return input.split(' ')[0];
    }
}

module.exports = NoteMatchers;
