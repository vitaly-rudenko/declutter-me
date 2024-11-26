export function match(input: string, regex: string): Record<string, string> | undefined {
  const matchResult = input.match(new RegExp(regex, 'i'))
  if (!matchResult) return undefined

  return matchResult.groups ?? {}
}
