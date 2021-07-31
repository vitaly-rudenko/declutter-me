import { TokenType } from './TokenType.js';

export class PatternBuilder {
    build(input) {
        input = input.replace(/\\\|/g, '|')

        const result = [];

        let currentType = TokenType.TEXT;
        let value = '';
        let nested = 0;

        let i = 0;
        while (i <= input.length) {
            const character = i < input.length ? input[i] : null;

            let type = currentType;
            let skip = false;

            if (character === '{') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = TokenType.VARIABLE;
                }
            }

            if (character === '}') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = TokenType.TEXT;
                }
            }

            if (character === '[') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = TokenType.OPTIONAL;
                }
            }

            if (character === ']') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = TokenType.TEXT;
                }
            }

            if (character === '(') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = TokenType.VARIATIONAL;
                }
            }

            if (character === ')') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = TokenType.TEXT;
                }
            }

            if (
                value.length > 0 &&
                (currentType !== type || character === null)
            ) {
                const metadata = {};

                if (currentType === TokenType.VARIABLE) {
                    if (value.endsWith('!')) {
                        metadata.bang = true;
                        value = value.slice(0, -1);
                    }

                    let inputType;
                    [value, inputType] = value.split(':');

                    if (inputType) metadata.inputType = inputType;
                }

                result.push({
                    type: currentType,
                    value: currentType === TokenType.OPTIONAL
                        ? this.build(value)
                        : currentType === TokenType.VARIATIONAL
                            ? value.split(/(?<!\\)\|/g).map(v => this.build(v))
                            : currentType === TokenType.VARIABLE
                                ? value
                                : value.toLowerCase(),
                    ...metadata,
                });
                value = '';
            }

            currentType = type;
            if (!skip) {
                if (character === '|' && nested > 1) {
                    value += '\\';
                }

                value += character;
            }

            i++;
        }

        return result;
    }
}
