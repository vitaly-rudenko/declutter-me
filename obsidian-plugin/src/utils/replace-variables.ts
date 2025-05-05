import { format } from 'date-fns'
import { Variable } from 'src/plugin/common.js'

export function replaceVariables(input: string, variables: Variable[], now = new Date()) {
  let result = input
  const processedVariableNames = new Set<string>()

  for (let i = variables.length - 1; i >= 0; i--) {
    const { name, value } = variables[i]
    if (processedVariableNames.has(name)) continue
    processedVariableNames.add(name)

    const variableName = '{' + name + '}'
    while (result.includes(variableName)) {
      result = result.replace(variableName, String(value))
    }
  }

  return result.replace(/\{date:(.+?)\}/ig, (_, dateFormat) => format(now, dateFormat))
}
