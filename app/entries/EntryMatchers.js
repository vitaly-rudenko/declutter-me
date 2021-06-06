class EntryMatchers {
    /** @param {{ dateParser: import('../date-parsers/RussianDateParser') }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;

        this['database'] = this._word.bind(this);

        this['text'] = this._text.bind(this);
        this['word'] = this._word.bind(this);

        this['date'] = (input) => this._date(input, false);
        this['future_date'] = (input) => this._date(input, true);

        this['url'] = this._word.bind(this); // TODO: parse URLs
        this['phone'] = this._word.bind(this); // TODO: parse phone numbers
        this['number'] = this._word.bind(this); // TODO: parse numbers
    }

    _text(input, { nextTokens: [nextToken, nextToken2] }) {
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

            if (nextToken2 && nextToken2.inputType === 'future_date') {
                return results.map(result => this._removeDateFromInput(result, { nextTokens: [nextToken2] }, { futureOnly: true }))
            }

            if (nextToken2 && nextToken2.inputType === 'date') {
                return results.map(result => this._removeDateFromInput(result, { nextTokens: [nextToken2] }, { futureOnly: false }))
            }

            return results;
        }

        return input;
    }

    _removeDateFromInput(input, { nextTokens: [nextToken] }, { futureOnly }) {
        if (!nextToken) {
            return input;
        }

        let lastDate = null;
        let startIndex = input.length;

        while (startIndex > 0) {
            startIndex = input.lastIndexOf(' ', startIndex - 1);
            if (startIndex === -1) startIndex = -1;

            const date = input.slice(startIndex + 1);
            if (this._dateParser.parse(date, { futureOnly })) {
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

    _word(input) {
        return input.split(' ')[0];
    }

    _date(input, futureOnly) {
        let lastDate = null;
        let endIndex = 0;

        while (endIndex < input.length) {
            endIndex = input.indexOf(' ', endIndex + 1);
            if (endIndex === -1) endIndex = input.length;

            const date = input.slice(0, endIndex);
            if (this._dateParser.parse(date, { futureOnly })) {
                lastDate = date;
            }
        }

        return lastDate;
    }
}

module.exports = EntryMatchers;
