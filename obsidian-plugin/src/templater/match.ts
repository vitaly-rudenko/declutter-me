import { extractVariableDefinitionsFromPattern } from './extract-variable-definitions-from-pattern'
import { parseTemplate } from './parse-template'
import { transformPatternToRegex } from './transform-pattern-to-regex'

export type MatchResultVariable = {
  name: string
  type: 'text' | 'word' | 'url' | 'email' | 'phone'
  value: string
} | {
  name: string
  type: 'number'
  value: number
}

export type MatchResult = {
  variables: MatchResultVariable[]
}

export function match(input: string, template: string): MatchResult | undefined {
  const tokens = parseTemplate(template)
  const regex = `^${transformPatternToRegex(tokens)}$`
  const variableDefinitionMap = extractVariableDefinitionsFromPattern(tokens)

  const matchResult = input.match(new RegExp(regex, 'i'))
  if (!matchResult) return undefined

  const variables: MatchResultVariable[] = []
  for (const [variableName, value] of Object.entries(matchResult.groups ?? {})) {
    if (value === undefined) continue

    const variableDefinition = variableDefinitionMap[variableName]
    if (!variableDefinition) {
      throw new Error(`Variable is not defined: ${variableName}`)
    }

    if (variableDefinition.type === 'number') {
      variables.push({
        name: variableName,
        type: 'number',
        value: Number(value),
      })
    } else {
      variables.push({
        name: variableName,
        type: variableDefinition.type === 'match' ? 'text' : variableDefinition.type,
        value,
      })
    }
  }

  return { variables }
}
