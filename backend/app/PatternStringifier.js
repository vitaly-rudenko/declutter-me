class PatternStringifier {
    stringify(pattern) {
        return pattern.map((token) => {
            if (token.type === 'variable') {
                const value = [token.value, token.inputType].filter(Boolean).join(':');
                if (token.bang) {
                    return `{${value}!}`;
                } else {
                    return `{${value}}`;
                }
            }
    
            if (token.type === 'optional') {
                return `[${this.stringify(token.value)}]`;
            }
    
            if (token.type === 'variational') {
                return `(${token.value.map(variation => this.stringify(variation)).join('|')})`;
            }
    
            return token.value;
        }).join('');
    }
}

module.exports = PatternStringifier;
