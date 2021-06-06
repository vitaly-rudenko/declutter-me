class NoteMatchers {
    constructor() {
        this.metadata = {
            tag: { array: true }
        };

        this.note = this.note.bind(this);
        this.tag = this.tag.bind(this);
    }

    note(input, { nextTokens: [nextToken] }) {
        if (nextToken && nextToken.type === 'text') {
            const results = [];
            let startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase());
            while (startIndex > 0) {
                results.push(input.slice(0, startIndex));
                startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase(), startIndex - 1);
            }

            results.push(input);

            return results;
        }

        return input;
    }

    tag(input) {
        return input.split(' ')[0];
    }
}

module.exports = NoteMatchers;
