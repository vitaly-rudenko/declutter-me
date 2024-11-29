import { format } from 'date-fns'

export function replaceVariables(input: string, variables: Record<string, string>) {
  let result = input
  for (const [name, value] of Object.entries(variables)) {
    const variableName = '{' + name + '}'
    while (result.includes(variableName)) {
      result = result.replace(variableName, value)
    }
  }
  return result.replace(/\{date:(.+?)\}/i, (_, dateFormat) => format(new Date(), dateFormat))
}
