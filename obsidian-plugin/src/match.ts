import { extractVariableDefinitionsFromPattern } from "./extract-variable-definitions-from-pattern"
import { parseTemplate } from "./parse-template"
import { transformPatternToRegex } from "./transform-pattern-to-regex"

export type MatchResult = Record<string, string | number>

export function match(input: string, template: string): MatchResult | undefined {
  const tokens = parseTemplate(template)
  const regex = transformPatternToRegex(tokens)
  const variableDefinitionMap = extractVariableDefinitionsFromPattern(tokens)

  const matchResult = input.match(new RegExp(regex, 'i'))
  if (!matchResult) return undefined

  const results: MatchResult = {}
  for (const [variableName, value] of Object.entries(matchResult.groups ?? {})) {
    const variableDefinition = variableDefinitionMap[variableName]
    if (!variableDefinition) {
      throw new Error(`Variable is not defined: ${variableName}`)
    }

    if (variableDefinition.type === 'number') {
      results[variableName] = Number(value)
    } else {
      results[variableName] = value
    }
  }

  return results
}
