type TokenType = 'text' | 'variable' | 'optional' | 'variational' | 'anyOrder'

const inputTypes = ['text', 'word', 'number', 'url', 'email', 'phone', 'match'] as const
type InputType = (typeof inputTypes)[number]

type Variable = {
  name: string
  inputType: InputType
  value: string | string[]
}

type Combination = any[]

type MatchResult = {
  variables: Variable[]
  combination: Combination
}

// TODO: strong type of Combination
// TODO: use left-to-right priority instead of Score system

export function match(input: string, template: string): MatchResult | undefined {
  const pattern = buildPatternFromTemplate(template)

  const combinations = getPatternCombinations(pattern, matchers);

  for (const combination of combinations) {
      let remainingInput = input;

      let match = true;
      /** @type {{ [variable: string]: Field }} */
      const fieldMap = {};

      for (const [i, token] of combination.entries()) {
          let value = token.value;
          let { value: name, inputType } = token;

          if (token.type === 'variable') {
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
                  match: (input, pattern) => match(input, pattern, matchers),
              });
              
              if (Array.isArray(value)) {
                  for (const valueVariation of value) {
                      const matchResult = match(remainingInput.slice(valueVariation.length), nextTokens, matchers);
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

  return undefined;
}

function getPatternCombinations(pattern: Pattern, matchers): Combination[] {
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
              (combination[i] && combination[i].type) === 'variable' &&
              (combination[i - 1] && combination[i - 1].type) === 'variable'
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

function scoreCombination(combination: Combination) {
  const score = matchers && matchers.score || (() => 1);
  return combination.reduce((acc, curr) => acc + score(curr), 0);
}

function getTokenCombinations(token: Token) {
  const combinations: Combination[] = [];

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
  
  if (token.type === 'anyOrder') {
      combinations.push(
          ...squashCombinations(token.value.map(part => this.getPatternCombinations(part)))
              .map(c => generateCombinations(c).map(c => c.flat()))
              .flat()
      )
  }

  return combinations.map(this.simplifyPattern);
}

function simplifyPattern(pattern: Pattern) {
  return pattern.reduce<Pattern>((result, token, i) => {
      const latestToken = result[result.length - 1];

      if (latestToken.type === 'text' && token.type === 'text') {
          latestToken.value += token.value;
      } else {
          result.push({ ...token });
      }

      return result;
  }, []);
}

function squashCombinations(combinations: Combination[]) {
  return combinations.length > 1
      ? combinations[0].flatMap(c => squashCombinations(combinations.slice(1)).map(cc => [c, ...cc]))
      : combinations[0].map(c => [c]);
}

function generateCombinations(items: Pattern): Combination[] {
  if (items.length === 1) {
      return [[items[0]]];
  }

  return items
      .flatMap((item, i) => {
          const remaining = [...items];
          remaining.splice(i, 1);
          return generateCombinations(remaining).map(combination => [item, ...combination]);
      });
}

type Input = {
  type: Exclude<InputType, 'match'>
} | {
  type: 'match'
  match: Pattern
}

type Token = ({
  type: 'text' | 'variable'
  value: string
  input: Input
} | {
  type: 'optional'
  value: Pattern
  input: Input
} | {
  type: 'variational' | 'anyOrder'
  value: Pattern[]
  input: Input
})

type Pattern = Token[]

function buildPatternFromTemplate(template: string): Pattern {
  template = template.replace(/\\\|/g, '|')

  const result: Pattern = [];

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

    if (character === '<') {
      nested++;
      if (nested === 1) {
        skip = true;
        type = 'anyOrder';
      }
    }

    if (character === '>') {
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
      let inputType: InputType = 'text'
      let match: Pattern | undefined

      if (currentType === 'variable') {
        let rawInputType: string | undefined

        const parts = value.split(':');
        if (parts.length > 1) {
          value = parts[0];
          rawInputType = parts.slice(1).join(':');
        }

        if (rawInputType) {
          if (inputTypes.includes(rawInputType as InputType)) {
            inputType = rawInputType as InputType;
          } else {
            inputType = 'match';
            match = buildPatternFromTemplate(rawInputType);
          }
        }
      }

      const input: Input | undefined = inputType === 'match' && match
        ? { type: 'match', match } : inputType !== 'match'
        ? { type: inputType } : undefined
      if (!input) throw new Error('TODO')

      if (currentType === 'text' || currentType === 'variable') {
        result.push({
          type: currentType,
          value,
          input,
        })
      } else if (currentType === 'optional') {
        result.push({
          type: currentType,
          value: buildPatternFromTemplate(value),
          input,
        })
      } else {
        result.push({
          type: currentType,
          value: value.split(/(?<!\\)\|/g).map(v => buildPatternFromTemplate(v)),
          input,
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
