import { InputType } from '../InputType.js';
import { TokenType } from '../TokenType.js';
import { split } from '../utils/split.js';

const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const TEXT_SCORE = 2;
const InputTypeScore = {
    [InputType.TEXT]: 1,
    [InputType.WORD]: 2,
    [InputType.DATABASE]: 2,
    [InputType.URL]: 3,
    [InputType.EMAIL]: 3,
    [InputType.PHONE]: 3,
    [InputType.NUMBER]: 3,
    [InputType.MATCH]: 3,
};

export class EntryMatchers {
    constructor() {
        this[InputType.DATABASE] = this._word.bind(this);

        this[InputType.TEXT] = this._text.bind(this);
        this[InputType.WORD] = this._word.bind(this);

        this[InputType.URL] = this._url.bind(this);
        this[InputType.EMAIL] = this._email.bind(this);
        this[InputType.PHONE] = this._phone.bind(this);
        this[InputType.NUMBER] = this._number.bind(this);

        this[InputType.MATCH] = this._match.bind(this);
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
            return results;
        }

        return input;
    }

    _word(input, { nextTokens: [nextToken] }) {
        return this._select(input, nextToken, value => !/(\s|\n)/.test(value));
    }

    _email(input, { nextTokens: [nextToken] }) {
        return this._select(input, nextToken, value => EMAIL_REGEX.test(value));
    }

    _phone(input, { nextTokens: [nextToken] }) {
        return this._select(input, nextToken, value => PHONE_REGEX.test(value));
    }

    _url(input, { nextTokens: [nextToken] }) {
        return this._select(input, nextToken, value => this._isValidUrl(value));
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
    _number(input, { nextTokens: [nextToken] }) {
        return this._select(input, nextToken, value => Number.isFinite(Number(value)));
    }

    _match(input, { token, nextTokens: [nextToken], match }) {
        return this._select(input, nextToken, value => match(value, token.match));
    }

    _select(input, nextToken, matcher) {
        if (nextToken && nextToken.type === TokenType.TEXT) {
            const parts = split(input, nextToken.value);
            const variants = [];
            let value = parts.shift();

            for (const part of parts) {
                if (matcher(value)) {
                    variants.push(value);
                }

                value += nextToken.value + part;
            }

            if (variants.length === 0) return null;
            return variants.reverse();
        }

        if (matcher(input)) {
            return input;
        }

        return null;
    }
}
