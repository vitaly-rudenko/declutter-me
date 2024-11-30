import { format } from 'date-fns'

export function replaceVariables(input: string, variables: Record<string, string | number>, now = new Date()) {
  let result = input
  for (const [name, value] of Object.entries(variables)) {
    const variableName = '{' + name + '}'
    while (result.includes(variableName)) {
      result = result.replace(variableName, String(value))
    }
  }
  return result.replace(/\{date:(.+?)\}/ig, (_, dateFormat) => format(now, dateFormat))
}
