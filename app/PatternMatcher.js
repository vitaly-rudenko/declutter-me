function toString(token) {
    if (token.type === 'variable') {

    }
}

class PatternMatcher {
    match(input, pattern, matchers) {
        const combinations = this.getPatternCombinations(pattern);

        for (const [j, combination] of combinations.entries()) {
            let remainingInput = input;

            let match = true;
            const variables = {};
            const bang = {};

            for (const [i, token] of combination.entries()) {
                let value = token.value;

                if (token.type === 'variable') {
                    const matcher = matchers[token.value];
                    if (!matcher) {
                        throw new Error(`Unsupported matcher: ${token.value}`);
                    }

                    const nextTokens = combination.slice(i + 1);
                    value = matcher(remainingInput, { nextTokens });
                    if (Array.isArray(value)) {
                        for (const valueVariation of value) {
                            const matchResult = this.match(remainingInput.slice(valueVariation.length), nextTokens, matchers);
                            if (matchResult.match) {
                                value = valueVariation;
                                break;
                            }
                        }

                        if (Array.isArray(value)) {
                            value = undefined;
                        }
                    }

                    if (variables[token.value] === undefined) {
                        variables[token.value] = value;
                    } else if (Array.isArray(variables[token.value])) {
                        variables[token.value].push(value);
                    } else {
                        variables[token.value] = [variables[token.value], value];
                    }

                    delete bang[token.value];
                    if (variables[token.value] !== undefined && token.bang) {
                        bang[token.value] = token.bang;
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
                return {
                    match: true,
                    variables,
                    ...Object.keys(bang).length > 0 && { bang },
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
