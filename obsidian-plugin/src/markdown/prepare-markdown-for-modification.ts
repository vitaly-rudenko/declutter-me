import { isEmpty, isLogicalSeparator } from "./markdown-tools.js"

export function prepareMarkdownForModification(input: {
  markdown: string,
  section?: string
}): string {
  const { markdown, section } = input

  const lines = markdown.split('\n')

  if (section) {
    if (!lines.includes(section)) {
      if (lines.every(line => isEmpty(line))) {
        lines[0] = section
        lines[1] = ''
        lines[2] = ''
        lines[3] = ''
      } else {
        if (!isEmpty(lines[lines.length - 1])) {
          lines.push('')
        }

        lines.push(section, '', '', '')
      }
    } else {
      const sectionIndex = lines.indexOf(section)
      const nextLogicalSeparatorIndex = lines.findIndex((line, index) => index > sectionIndex && isLogicalSeparator(line))
      const sectionHasContent = nextLogicalSeparatorIndex === -1
        ? lines.some((line, index) => index > sectionIndex && !isEmpty(line))
        : lines.some((line, index) => index > sectionIndex && index < nextLogicalSeparatorIndex && !isEmpty(line))

      if (!sectionHasContent) {
        while (lines[sectionIndex + 3] === undefined || !isEmpty(lines[sectionIndex + 3])) {
          lines.splice(sectionIndex + 1, 0, '')
        }
      }
    }
  } else {
    const lastNonEmptyLineIndex = lines.findLastIndex((line) => !isEmpty(line))
    if (lastNonEmptyLineIndex !== -1 && isLogicalSeparator(lines[lastNonEmptyLineIndex])) {
      while (lines[lastNonEmptyLineIndex + 3] === undefined || !isEmpty(lines[lastNonEmptyLineIndex + 3])) {
        lines.splice(lastNonEmptyLineIndex + 1, 0, '')
      }
    }
  }

  return lines.join('\n')
}