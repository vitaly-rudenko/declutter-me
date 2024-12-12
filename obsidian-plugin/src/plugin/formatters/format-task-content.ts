export function formatTaskContent(content: string) {
  if (!content.includes('\n')) {
    return `- [ ] ${content}`
  }

  const lines = content.split('\n')
  const result: string[] = []
  result.push(`- [ ] ${lines[0]}...`)
  result.push('```')
  result.push(...lines)
  result.push('```')

  return result.join('\n')
}
