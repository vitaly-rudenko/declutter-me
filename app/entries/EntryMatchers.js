const { URL } = require('url');

const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

class EntryMatchers {
    /** @param {{ dateParser: import('../date-parsers/RussianDateParser') }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;

        this['database'] = this._word.bind(this);

        this['text'] = this._text.bind(this);
        this['word'] = this._word.bind(this);

        this['date'] = (input) => this._date(input, false);
        this['future_date'] = (input) => this._date(input, true);

        this['url'] = this._url.bind(this);
        this['email'] = this._email.bind(this);
        this['phone'] = this._phone.bind(this);
        this['number'] = this._number.bind(this);
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

    _email(input) {
        input = input.split(' ')[0];

        if (EMAIL_REGEX.test(input)) {
            return input;
        }

        return null;
    }

    _phone(input) {
        input = input.split(' ')[0];

        if (PHONE_REGEX.test(input)) {
            return input;
        }

        return null;
    }

    _url(input) {
        input = input.split(' ')[0];

        if (this._isValidUrl(input) || this._isValidUrl('http://' + input)) {
            return input;
        }

        return null;
    }

    _isValidUrl(input) {
        try {
            new URL(input);
        } catch (error) {
            return false;
        }

        return true;
    }

    // TODO: add support for natural language numbers
    _number(input) {
        input = input.split(' ')[0];

        if (!Number.isNaN(Number(input))) {
            return input;
        }

        return null;
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
