const Field = require('./fields/Field');
const Presets = require('./presets/Presets');

class PatternMatcher {
    /**
     * 
     * @param {string} input
     * @param {any[]} pattern
     * @param {{
     *     matchers: import('./entries/EntryMatchers'),
     *     presets?: import('./presets/CommonPresets')[],
     * }} params
     * @returns {{
     *     match: boolean,
     *     fields?: Field[],
     *     bang?: { [variable: string]: boolean }
     * }}
     */
    match(input, pattern, { matchers, presets: presetList }) {
        const presets = new Presets();
        const combinations = this.getPatternCombinations(pattern);

        for (const combination of combinations) {
            let remainingInput = input;

            let match = true;
            /** @type {{ [variable: string]: Field }} */
            const fieldMap = {};
            const bang = {};

            for (const [i, token] of combination.entries()) {
                let value = token.value;
                let { value: name, inputType, outputType } = presets.get({
                    value: token.value,
                    inputType: token.inputType,
                    outputType: token.outputType,
                }, presetList);

                if (token.type === 'variable') {
                    const matcher = matchers[inputType];
                    if (!matcher) {
                        throw new Error(`Unsupported matcher: ${inputType}`);
                    }

                    const nextTokens = combination.slice(i + 1);
                    value = matcher(remainingInput, { nextTokens });
                    if (Array.isArray(value)) {
                        for (const valueVariation of value) {
                            const matchResult = this.match(remainingInput.slice(valueVariation.length), nextTokens, { matchers, presets: presetList });
                            if (matchResult.match) {
                                value = valueVariation;
                                break;
                            }
                        }

                        if (Array.isArray(value)) {
                            value = undefined;
                        }
                    }

                    if (value !== undefined && value !== null) {
                        if (outputType === 'multi_select') {
                            fieldMap[name] = new Field({
                                name,
                                inputType,
                                outputType,
                                value: fieldMap[name]
                                    ? [...fieldMap[name].value, value]
                                    : [value]
                            })
                        } else {
                            fieldMap[name] = new Field({
                                name,
                                inputType,
                                outputType,
                                value,
                            });
                        }
    
                        bang[name] = token.bang;
                    } else {
                        fieldMap[name] = undefined;
                        bang[name] = false;
                    }
                }

                if (value && remainingInput.toLowerCase().startsWith(value.toLowerCase())) {
                    remainingInput = remainingInput.slice(value.length);
                } else {
                    match = false;
                    break;
                }
            }

            if (match && remainingInput.length === 0) {
                const filteredBang = Object.entries(bang).filter(([,value]) => value);
                const fields = Object.values(fieldMap);

                return {
                    match: true,
                    ...fields.length > 0 && { fields },
                    ...filteredBang.length > 0 && { bang: Object.fromEntries(filteredBang) },
                };
            }
        }

        return { match: false };
    }

    getPatternCombinations(pattern) {
        let combinations = [[]];

        for (const token of pattern) {
            const tokenCombinations = this.getTokenCombinations(token);

            const updatedCombinations = [];
            for (const tokenCombination of tokenCombinations) {
                updatedCombinations.push(
                    ...combinations.map(combination => [...combination, ...tokenCombination])
                );
            }

            combinations = updatedCombinations;
        }

        return combinations.sort((a, b) => b.length - a.length);
    }

    getTokenCombinations(token) {
        const combinations = [];

        if (token.type === 'text' || token.type === 'variable') {
            combinations.push([token]);
        }

        if (token.type === 'optional') {
            combinations.push([]);
            combinations.push(...this.getPatternCombinations(token.value));
        }

        if (token.type === 'variational') {
            for (const variation of token.value) {
                combinations.push(...this.getPatternCombinations(variation));
            }
        }

        return combinations.map(this.simplifyPattern);
    }

    simplifyPattern(pattern) {
        return pattern.reduce((result, token, i) => {
            const latestToken = i > 0 ? result[result.length - 1]: null;

            if (latestToken && latestToken.type === 'text' && token.type === 'text') {
                latestToken.value += token.value;
            } else {
                result.push({ ...token });
            }

            return result;
        }, []);
    }
}

module.exports = PatternMatcher;
