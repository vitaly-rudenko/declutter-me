import { Field } from './fields/Field.js';
import { InputType } from './InputType.js';
import { TokenType } from './TokenType.js';
import { generateCombinations } from './utils/generateCombinations.js';
import { squashCombinations } from './utils/squashCombinations.js';

export class PatternMatcher {
    /**
     * 
     * @param {string} input
     * @param {any[]} pattern
     * @param {import('./entries/EntryMatchers').EntryMatchers} matchers
     * @param {{ returnCombination?: boolean }} [options]
     * @returns {{ fields: Field[], combination?: any[] } | null}
     */
    match(input, pattern, matchers, { returnCombination } = {}) {
        const combinations = this.getPatternCombinations(pattern, matchers);

        for (const combination of combinations) {
            let remainingInput = input;

            let match = true;
            /** @type {{ [variable: string]: Field }} */
            const fieldMap = {};

            for (const [i, token] of combination.entries()) {
                let value = token.value;
                let { value: name, inputType } = token;

                if (token.type === TokenType.VARIABLE) {
                    if (!inputType) {
                        throw new Error(`No input type provided: ${name}`)
                    }

                    const matcher = matchers[inputType];
                    if (!matcher) {
                        throw new Error(`Unsupported matcher: ${inputType}`);
                    }

                    const nextTokens = combination.slice(i + 1);
                    value = matcher(remainingInput, {
                        token,
                        nextTokens,
                        match: (input, pattern) => this.match(input, pattern, matchers),
                    });
                    
                    if (Array.isArray(value)) {
                        for (const valueVariation of value) {
                            const matchResult = this.match(remainingInput.slice(valueVariation.length), nextTokens, matchers);
                            if (matchResult) {
                                value = valueVariation;
                                break;
                            }
                        }

                        if (Array.isArray(value)) {
                            value = undefined;
                        }
                    }

                    if (name !== undefined || inputType === InputType.DATABASE) {
                        if (value !== undefined && value !== null) {
                            const existingValue = fieldMap[name] && fieldMap[name].value;
    
                            fieldMap[name] = new Field({
                                name,
                                inputType,
                                value: Array.isArray(existingValue)
                                    ? [...existingValue, value]
                                    : existingValue
                                        ? [existingValue, value]
                                        : value,
                            })
                        } else {
                            fieldMap[name] = undefined;
                        }
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
                const fields = Object.values(fieldMap);

                if (returnCombination) {
                    return { fields, combination };
                }

                return { fields };
            }
        }

        return null;
    }

    getPatternCombinations(pattern, matchers) {
        let combinations = [[]];

        for (const token of pattern) {
            const tokenCombinations = this.getTokenCombinations(token, matchers);

            if (tokenCombinations.length > 0) {
                const updatedCombinations = [];
                for (const tokenCombination of tokenCombinations) {
                    updatedCombinations.push(
                        ...combinations.map(combination => [...combination, ...tokenCombination])
                    );
                }
    
                combinations = updatedCombinations;
            }
        }

        combinations = combinations
            .sort((a, b) => this.scoreCombination(b, matchers) - this.scoreCombination(a, matchers))
            .map(this.simplifyPattern)
            .filter((combination) => (
                !combination.some((_, i) => (
                    (combination[i] && combination[i].type) === TokenType.VARIABLE &&
                    (combination[i - 1] && combination[i - 1].type) === TokenType.VARIABLE
                ))
            ));

        const combinationStrings = combinations.map(c => JSON.stringify(c));
        const result = [];
        const resultStrings = [];

        for (let i = 0; i < combinationStrings.length; i++) {
            const combination = combinations[i];
            const combinationStr = combinationStrings[i];

            if (!resultStrings.includes(combinationStr)) {
                result.push(combination);
                resultStrings.push(combinationStr);
            }
        }

        return result;
    }

    scoreCombination(combination, matchers) {
        const score = matchers && matchers.score || (() => 1);
        return combination.reduce((acc, curr) => acc + score(curr), 0);
    }

    getTokenCombinations(token, matchers) {
        const combinations = [];

        if (token.type === TokenType.TEXT || token.type === TokenType.VARIABLE) {
            combinations.push([token]);
        }

        if (token.type === TokenType.OPTIONAL) {
            combinations.push([]);
            combinations.push(...this.getPatternCombinations(token.value, matchers));
        }

        if (token.type === TokenType.VARIATIONAL) {
            for (const variation of token.value) {
                combinations.push(...this.getPatternCombinations(variation, matchers));
            }
        }
        
        if (token.type === TokenType.ANY_ORDER) {
            combinations.push(
                ...squashCombinations(token.value.map(part => this.getPatternCombinations(part, matchers)))
                    .map(c => generateCombinations(c).map(c => c.flat()))
                    .flat()
            )
        }

        return combinations.map(this.simplifyPattern);
    }

    simplifyPattern(pattern) {
        return pattern.reduce((result, token, i) => {
            const latestToken = result[result.length - 1];

            if ((latestToken && latestToken.type) === TokenType.TEXT && token.type === TokenType.TEXT) {
                latestToken.value += token.value;
            } else {
                result.push({ ...token });
            }

            return result;
        }, []);
    }
}
