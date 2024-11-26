export type Token = {
  type: 'text'
  value: string
} | {
  type: 'variable'
  value: string
  input: {
    type: 'text' | 'word' | 'number' | 'url' | 'email' | 'phone'
  } | {
    type: 'match'
    match: Token[]
  }
} | {
  type: 'optional'
  value: Token[]
} | {
  type: 'variational'
  value: Token[][]
}

export type TokenType = Token['type']

export const tokenInputTypes = ['text', 'word', 'number', 'url', 'email', 'phone', 'match'] as const
export type TokenInputType = (typeof tokenInputTypes)[number]

export function parseTemplate(template: string): Token[] {
  template = template.replace(/\\\|/g, '|')

  const result: Token[] = [];

  let currentType: TokenType = 'text';
  let value = '';
  let nested = 0;

  let i = 0;
  while (i <= template.length) {
    const character = i < template.length ? template[i] : null;

    let type: TokenType = currentType;
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
      let inputType: TokenInputType | undefined
      let match: Token[] | undefined

      if (currentType === 'variable') {
        let rawInputType: string | undefined

        const parts = value.split(':');
        if (parts.length > 1) {
          value = parts[0];
          rawInputType = parts.slice(1).join(':');
        }

        if (rawInputType) {
          if (tokenInputTypes.includes(rawInputType as TokenInputType)) {
            inputType = rawInputType as TokenInputType;
          } else {
            inputType = 'match';
            match = parseTemplate(rawInputType);
          }
        } else {
          inputType = 'text'
        }
      }

      if (!value) {
        throw new Error('TODO')
      }

      if (currentType === 'text') {
        result.push({
          type: currentType,
          value,
        })
      } else if (currentType === 'variable') {
        const input = inputType === 'match' && match
          ? { type: 'match', match } as const : inputType !== 'match' && inputType
            ? { type: inputType } as const : undefined
        if (!input) throw new Error('TODO')

        result.push({
          type: currentType,
          value,
          input,
        })
      } else if (currentType === 'optional') {
        result.push({
          type: currentType,
          value: parseTemplate(value),
        })
      } else {
        result.push({
          type: currentType,
          value: value.split(/(?<!\\)\|/g).map(v => parseTemplate(v)),
        })
      }

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
