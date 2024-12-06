export function isEmpty(line: string) {
  return line.trim() === ''
}

export function isLogicalSeparator(line: string) {
  return isSection(line) || isHorizontalRule(line)
}

export function isSection(line: string) {
  return /^#+ /.test(line)
}

export function isHorizontalRule(line: string) {
  return line === '---'
}
