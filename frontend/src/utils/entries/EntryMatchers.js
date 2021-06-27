const InputType = require('../InputType');
const TokenType = require('../TokenType');
const split = require('../utils/split');

const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const TEXT_SCORE = 2;
const InputTypeScore = {
    [InputType.TEXT]: 1,
    [InputType.WORD]: 2,
    [InputType.DATABASE]: 2,
    [InputType.DATE]: 3,
    [InputType.FUTURE_DATE]: 3,
    [InputType.URL]: 3,
    [InputType.EMAIL]: 3,
    [InputType.PHONE]: 3,
    [InputType.NUMBER]: 3,
};

class EntryMatchers {
    /** @param {{ dateParser }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;

        this[InputType.DATABASE] = this._word.bind(this);

        this[InputType.TEXT] = this._text.bind(this);
        this[InputType.WORD] = this._word.bind(this);

        this[InputType.DATE] = (input) => this._date(input, false);
        this[InputType.FUTURE_DATE] = (input) => this._date(input, true);

        this[InputType.URL] = this._url.bind(this);
        this[InputType.EMAIL] = this._email.bind(this);
        this[InputType.PHONE] = this._phone.bind(this);
        this[InputType.NUMBER] = this._number.bind(this);
    }

    score(token) {
        if (token.type === TokenType.TEXT) {
            return TEXT_SCORE * token.value.length;
        }

        if (token.type === TokenType.VARIABLE) {
            return InputTypeScore[token.inputType];
        }

        throw new Error(`Cannot calculate score for: ${token.type}`);
    }

    _text(input, { nextTokens: [nextToken, nextToken2] }) {
        if (!nextToken) {
            return input;
        }

        if (nextToken.type === TokenType.TEXT) {
            const results = [];
            let startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase());
            while (startIndex > 0) {
                results.push(input.slice(0, startIndex));
                startIndex = input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase(), startIndex - 1);
            }   

            results.push(input);

            if (nextToken2 && nextToken2.inputType === InputType.FUTURE_DATE) {
                return results.map(result => this._removeDateFromInput(result, { nextTokens: [nextToken2] }, { futureOnly: true }))
            }

            if (nextToken2 && nextToken2.inputType === InputType.DATE) {
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

            if (nextToken.type === TokenType.TEXT) {
                input = input.slice(0, input.length - nextToken.value.length);
            }
        }

        return input;
    }

    _word(input, { nextTokens: [nextToken] }) {
        if (nextToken?.type === TokenType.TEXT) {
            input = split(input, nextToken.value)[0];
        }

        const result = split(input, ' ')[0];

        if (result.length > 0) {
            return result;
        }

        return null;
    }

    _email(input) {
        input = split(input, ' ')[0];

        if (EMAIL_REGEX.test(input)) {
            return input;
        }

        return null;
    }

    _phone(input) {
        input = split(input, ' ')[0];

        if (PHONE_REGEX.test(input)) {
            return input;
        }

        return null;
    }

    _url(input) {
        input = split(input, ' ')[0];

        if (this._isValidUrl(input)) {
            return input;
        }

        return null;
    }

    _isValidUrl(input) {
        if (!input.includes('.')) {
            return false;
        }

        if (!input.startsWith('http://') && !input.startsWith('http://')) {
            input = 'http://' + input;
        }

        try {
            new URL(input);
        } catch (error) {
            return false;
        }

        return true;
    }

    // TODO: add support for natural language numbers
    _number(input) {
        input = split(input, ' ')[0];

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
