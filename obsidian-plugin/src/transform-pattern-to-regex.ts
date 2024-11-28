import { escapeRegex } from './escape-regex';
import { Token } from './parse-template';

export function transformPatternToRegex(tokens: Token[]): string {
    let result = ''

    for (const token of tokens) {
        if (token.type === 'text') {
            result += escapeRegex(token.value);
        }

        if (token.type === 'optional') {
            result += `(?:${transformPatternToRegex(token.value)})?`;
        }

        if (token.type === 'variational') {
            result += `(?:${token.value.map(pattern => transformPatternToRegex(pattern)).join('|')})`;
        }

        if (token.type === 'variable') {
            // TODO: heavily test and improve these regexes, especially email, phone and url ones
            const inputRegex =
                token.input.type === 'text' ? '.+' :
                token.input.type === 'word' ? '\\S+' :
                token.input.type === 'number' ? '[\\d\\.]+' :
                token.input.type === 'email' ? '\\S+@\\S+\\.\\S+' :
                token.input.type === 'phone' ? '[\\d\\+\\s]{7,15}' :
                token.input.type === 'url' ? 'https?:\\/\\/\\S+' :
                token.input.type === 'match' ? transformPatternToRegex(token.input.match)
                : undefined
            if (!inputRegex) throw new Error('TODO')

            result += `(?<${escapeRegex(token.value)}>${inputRegex})`
        }
    }

    return result
}
