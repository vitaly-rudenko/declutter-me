class PatternBuilder {
    build(input) {
        const result = [];

        let currentType = 'text';
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
                    type = 'variable';
                }
            }

            if (character === '}') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = 'text';
                }
            }

            if (character === '[') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = 'optional';
                }
            }

            if (character === ']') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = 'text';
                }
            }

            if (character === '(') {
                nested++;
                if (nested === 1) {
                    skip = true;
                    type = 'variational';
                }
            }

            if (character === ')') {
                nested--;
                if (nested === 0) {
                    skip = true;
                    type = 'text';
                }
            }

            if (
                value.length > 0 &&
                (currentType !== type || character === null)
            ) {
                const metadata = {};

                if (currentType === 'variable') {
                    if (value.endsWith('!')) {
                        metadata.bang = true;
                        value = value.slice(0, -1);
                    }

                    let inputType, outputType;
                    [value, inputType, outputType] = value.split(':');

                    if (inputType) metadata.inputType = inputType;
                    if (outputType) metadata.outputType = outputType;
                }

                result.push({
                    type: currentType,
                    value: currentType === 'optional'
                        ? this.build(value)
                        : currentType === 'variational'
                            ? value.split('|').map(v => this.build(v))
                            : currentType === 'variable'
                                ? value
                                : value.toLowerCase(),
                    ...metadata,
                });
                value = '';
            }

            currentType = type;
            if (!skip) {
                value += character;
            }

            i++;
        }

        return result;
    }
}

module.exports = PatternBuilder;
