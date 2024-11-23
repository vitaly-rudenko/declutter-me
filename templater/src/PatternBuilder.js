import { InputType } from './InputType.js';
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

            if (character === '<') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = TokenType.ANY_ORDER;
                }
            }

            if (character === '>') {
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
                    let inputType;

                    if (value === 'database') {
                        inputType = InputType.DATABASE;
                        value = null;
                    } else {
                        const parts = value.split(':');
                        if (parts.length > 1) {
                            value = parts.shift();
                            inputType = parts.join(':');
                        }
                    }
                    

                    if (inputType) {
                        if (Object.values(InputType).includes(inputType)) {
                            metadata.inputType = inputType;
                        } else {
                            metadata.inputType = InputType.MATCH;
                            metadata.match = this.build(inputType);
                        }
                    }
                }

                result.push({
                    type: currentType,
                    ...value && { value: currentType === TokenType.OPTIONAL
                        ? this.build(value)
                        : (currentType === TokenType.VARIATIONAL || currentType === TokenType.ANY_ORDER)
                            ? value.split(/(?<!\\)\|/g).map(v => this.build(v))
                            : value },
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
