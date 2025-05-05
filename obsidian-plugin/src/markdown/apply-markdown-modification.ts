import { isEmpty, isLogicalSeparator } from "./markdown-tools.js"

export function applyMarkdownModification(input: {
  markdown: string,
  type: 'appendLineAfterContent' | 'prependLineBeforeContent'
  section?: string
  content: string
}) {
  const { markdown, type, section, content } = input

  const lines = markdown.split('\n')

  let startIndex = 0
  let endIndex = lines.length - 1

  if (section) {
    const sectionIndex = lines.indexOf(section)
    if (sectionIndex === -1) throw new Error(`Section not found: ${section}`)

    const nextLogicalSeparatorIndex = lines.findIndex((line, index) => index > sectionIndex && isLogicalSeparator(line))
    if (nextLogicalSeparatorIndex !== -1) {
      startIndex = lines.findIndex((line, index) => index > sectionIndex && index < nextLogicalSeparatorIndex && !isEmpty(line))
      endIndex = lines.findLastIndex((line, index) => index > sectionIndex && index < nextLogicalSeparatorIndex && !isEmpty(line))
    } else {
      startIndex = lines.findIndex((line, index) => index > sectionIndex && !isEmpty(line))
      endIndex = lines.findLastIndex((line, index) => index > sectionIndex && !isEmpty(line))
    }
    if (startIndex === -1) startIndex = sectionIndex + 2
    if (endIndex === -1) endIndex = startIndex
  } else {
    const lastLogicalSeparatorIndex = lines.findLastIndex((line) => isLogicalSeparator(line))

    if (lastLogicalSeparatorIndex !== -1) {
      startIndex = lines.findIndex((line, index) => index > lastLogicalSeparatorIndex && !isEmpty(line))
      endIndex = lines.findLastIndex((line, index) => index > lastLogicalSeparatorIndex && !isEmpty(line))

      if (startIndex === -1) startIndex = lastLogicalSeparatorIndex + 2
    } else {
      startIndex = lines.findIndex((line) => !isEmpty(line))
      endIndex = lines.findLastIndex((line) => !isEmpty(line))

      if (startIndex === -1) startIndex = 0
    }

    if (endIndex === -1) endIndex = startIndex
  }

  if (startIndex < 0) throw new Error(`Invalid startIndex: ${startIndex}`)
  if (endIndex < 0) throw new Error(`Invalid endIndex: ${endIndex}`)

  if (type === 'appendLineAfterContent') {
    let insertedIndex: number
    if (lines[endIndex] === undefined || isEmpty(lines[endIndex])) {
      lines[endIndex] = content
      insertedIndex = endIndex
    } else {
      lines.splice(endIndex + 1, 0, content)
      insertedIndex = endIndex + 1
    }

    if (insertedIndex < 0) throw new Error(`Invalid insertedIndex: ${insertedIndex}`)

    const nextLine = lines[insertedIndex + 1]
    if (nextLine === undefined || !isEmpty(nextLine)) {
      lines.splice(insertedIndex + 1, 0, '')
    }
  } else if (type === 'prependLineBeforeContent') {
    let insertedIndex: number
    if (lines[startIndex] === undefined || isEmpty(lines[startIndex])) {
      lines[startIndex] = content
      insertedIndex = startIndex
    } else {
      lines.splice(startIndex, 0, content)
      insertedIndex = startIndex
    }

    if (insertedIndex < 0) throw new Error(`Invalid insertedIndex: ${insertedIndex}`)

    const nextLine = lines[insertedIndex + 1]
    if (nextLine === undefined || isLogicalSeparator(nextLine)) {
      lines.splice(insertedIndex + 1, 0, '')
    }

    const previousLine = lines[insertedIndex - 1]
    if (previousLine !== undefined && !isEmpty(previousLine)) {
      lines.splice(insertedIndex, 0, '')
    }
  }

  return lines.join('\n')
}
