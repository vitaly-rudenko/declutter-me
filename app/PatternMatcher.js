class PatternMatcher {
    match(input, pattern, matchers) {
        const combinations = this.getPatternCombinations(pattern);

        if (!matchers.priorities) {
            matchers.priorities = Object.keys(matchers);
        }

        for (const combination of combinations) {
            let remainingInput = input;

            let match = true;
            const variables = {};

            for (const [i, token] of combination.entries()) {
                let value = token.value;

                if (token.type === 'variable') {
                    let matcherInput = remainingInput;

                    const nextToken = combination[i + 1];
                    if (nextToken && nextToken.type === 'text') {
                        matcherInput = matcherInput.slice(0, matcherInput.lastIndexOf(nextToken.value));
                    }

                    const matcher = matchers[token.value];
                    if (!matcher) {
                        throw new Error(`Unsupported matcher: ${token.value}`);
                    }

                    value = matcher(matcherInput);
                    variables[token.value] = value;
                }

                if (value && remainingInput.toLowerCase().startsWith(value.toLowerCase())) {
                    remainingInput = remainingInput.slice(value.length);
                } else {
                    match = false;
                    break;
                }
            }

            if (match && remainingInput.length === 0) {
                return { match: true, variables };
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
