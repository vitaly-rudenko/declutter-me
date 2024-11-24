// @ts-expect-error
import { PatternBuilder, PatternMatcher, EntryMatchers } from '@vitalyrudenko/templater'

export function match(input: string, pattern: string): { fields: { name?: string; inputType?: string; value: string | string[] }[] } | null {
  const patternMatcher = new PatternMatcher()
  const entryMatchers = new EntryMatchers()

  const result = patternMatcher.match(
    input,
    new PatternBuilder().build(pattern),
    entryMatchers,
    { returnCombination: true }
  )

  return result
}

export function isMatching(input: string, pattern: string): boolean {
  return match(input, pattern) !== null
}
