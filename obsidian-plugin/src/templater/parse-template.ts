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

// TODO: arrays
// TODO: repeated pattern

export function parseTemplate(template: string): Token[] {
  const result: Token[] = []

  let currentType: TokenType = 'text'
  let value = ''
  let values: string[] = []
  let variableName: string | undefined = undefined
  let nested = 0
  let escape = false

  let i = 0
  while (i <= template.length) {
    const character = i < template.length ? template[i] : null

    let type: TokenType = currentType
    let skip = false


    if (currentType === 'variational') {
      if (character === '|' && nested === 1) {
        if (escape) {
          escape = false
        } else {
          values.push(value)
          value = ''
          i++
          continue
        }
      }
    }

    if (currentType === 'variable') {
      if (character === ':' && nested === 1 && variableName === undefined) {
        if (escape) {
          escape = false
        } else {
          variableName = value
          value = ''
          i++
          continue
        }
      }
    }

    if (character === '\\') {
      if (!escape) {
        escape = true
        i++
        continue
      }
    }

    if (character === '{') {
      if (escape) {
        escape = false
      } else {
        nested++
        if (nested === 1) {
          variableName = undefined
          skip = true
          type = 'variable'
        }
      }
    }

    if (character === '}') {
      if (escape) {
        escape = false
      } else {
        nested--
        if (nested === 0) {
          skip = true
          type = 'text'
        }
      }
    }

    if (character === '[') {
      if (escape) {
        escape = false
      } else {
        nested++
        if (nested === 1) {
          skip = true
          type = 'optional'
        }
      }
    }

    if (character === ']') {
      if (escape) {
        escape = false
      } else {
        nested--
        if (nested === 0) {
          skip = true
          type = 'text'
        }
      }
    }

    if (character === '(') {
      if (escape) {
        escape = false
      } else {
        nested++
        if (nested === 1) {
          skip = true
          type = 'variational'
        }
      }
    }

    if (character === ')') {
      if (escape) {
        escape = false
      } else {
        nested--
        if (nested === 0) {
          values.push(value)
          skip = true
          type = 'text'
        }
      }
    }

    if (
      value.length > 0 &&
      (currentType !== type || character === null)
    ) {
      let inputType: TokenInputType | undefined
      let match: Token[] | undefined

      if (currentType === 'text') {
        if (!value) throw new Error('TODO: text parsing error')

        result.push({
          type: currentType,
          value,
        })
      } else if (currentType === 'variable') {
        const finalVariableName = variableName === undefined ? value : variableName
        if (!finalVariableName) throw new Error('TODO: empty variable')

        const rawInputType = variableName === undefined ? undefined : value


        if (rawInputType) {
          if (tokenInputTypes.includes(rawInputType as TokenInputType)) {
            inputType = rawInputType as TokenInputType
          } else {
            inputType = 'match'
            match = parseTemplate(rawInputType)
          }
        } else {
          inputType = 'text'
        }

        const input = inputType === 'match' && match
          ? { type: 'match', match } as const : inputType !== 'match' && inputType
          ? { type: inputType } as const : undefined
        if (!input) throw new Error('TODO')

        result.push({
          type: currentType,
          value: finalVariableName,
          input,
        })
      } else if (currentType === 'optional') {
        if (!value) throw new Error('TODO: empty optional')

        result.push({
          type: currentType,
          value: parseTemplate(value),
        })
      } else {
        result.push({
          type: currentType,
          value: values.map(v => parseTemplate(v)),
        })
      }

      value = ''
      values = []
    }

    if (escape) {
      value += '\\'
      escape = false
    }

    currentType = type
    if (!skip) {
      value += character
    }

    i++
  }

  if (nested !== 0) {
    throw new Error('TODO: nested ' + nested)
  }

  return result
}
