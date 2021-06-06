class EntryMatchers {
    /** @param {{ dateParser: import('../date-parsers/RussianDateParser') }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;

        this.metadata = {
            texts: { array: true },
            words: { array: true },
        };

        this.text = this.text.bind(this);
        this.word = this.word.bind(this);

        this.database = this.word.bind(this);
        this.texts = this.text.bind(this);
        this.words = this.word.bind(this);

        this.date = this.date.bind(this);
        this.futureDate = this.futureDate.bind(this);
    }

    text(input, { nextTokens: [nextToken, nextToken2] }) {
        if (!nextToken) {
            return input;
        }

        if (nextToken.type === 'text') {
            const results = [];
            let startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase());
            while (startIndex > 0) {
                results.push(input.slice(0, startIndex));
                startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase(), startIndex - 1);
            }

            results.push(input);

            if (nextToken2 && nextToken2.fieldType === 'futureDate') {
                return results.map(result => this._removeDateFromInput(result, { nextTokens: [nextToken2] }, true))
            }

            if (nextToken2 && nextToken2.fieldType === 'date') {
                return results.map(result => this._removeDateFromInput(result, { nextTokens: [nextToken2] }, false))
            }

            return results;
        }

        return input;
    }

    _removeDateFromInput(input, { nextTokens: [nextToken] }, futureOnly) {
        if (!nextToken) {
            return input;
        }

        let lastDate = null;
        let startIndex = input.length;

        while (startIndex > 0) {
            startIndex = input.lastIndexOf(' ', startIndex - 1);
            if (startIndex === -1) startIndex = -1;

            const date = input.slice(startIndex + 1);
            if (this._dateParser.parse(date, null, futureOnly)) {
                lastDate = date;
            }
        }

        if (lastDate) {
            input = input.slice(0, input.length - lastDate.length);

            if (nextToken.type === 'text') {
                input = input.slice(0, input.length - nextToken.value.length);
            }
        }

        return input;
    }

    word(input) {
        return input.split(' ')[0];
    }

    futureDate(input) {
        return this._date(input, true);
    }

    date(input) {
        return this._date(input, false);
    }

    _date(input, futureOnly) {
        let lastDate = null;
        let endIndex = 0;

        while (endIndex < input.length) {
            endIndex = input.indexOf(' ', endIndex + 1);
            if (endIndex === -1) endIndex = input.length;

            const date = input.slice(0, endIndex);
            if (this._dateParser.parse(date, null, futureOnly)) {
                lastDate = date;
            }
        }

        return lastDate;
    }
}

module.exports = EntryMatchers;
