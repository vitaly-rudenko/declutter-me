export function applyMarkdownModification(input: {
    markdown: string,
    type: 'appendLineAfterContent' | 'prependLineBeforeContent'
    section?: string
    skipProperties: boolean
    content: string
}) {
    const { markdown, type, section, skipProperties, content } = input

    const lines = markdown.split('\n')

    let startIndex = 0
    let endIndex = lines.length

    if (section) {
        startIndex = lines.indexOf(section, startIndex)
        if (startIndex === -1) {
            const lastNonEmptyLineIndex = Math.max(0, lines.findLastIndex(line => line.trim() !== ''))
            if (lines[lastNonEmptyLineIndex] !== undefined && lines[lastNonEmptyLineIndex].trim() !== '') {
                lines.splice(lastNonEmptyLineIndex + 1, 0, section)
            } else {
                lines.splice(lastNonEmptyLineIndex, 0, section)
            }

            startIndex = lastNonEmptyLineIndex + 2
        }

        endIndex = lines.findIndex((line, index) => index > startIndex && line.startsWith('#'))
        if (endIndex === -1) {
            endIndex = lines.length
        }
    } else if (skipProperties) {
        if (lines[0] === '---') {
            const propertiesEndIndex = lines.indexOf('---', 1)
            if (propertiesEndIndex !== -1) {
                startIndex = propertiesEndIndex + 1
            }
        }
    }

    if (type === 'appendLineAfterContent') {
        // @ts-ignore
        const lastNonEmptyLineIndex = lines.findLastIndex((line, index) => index >= startIndex && index < endIndex && line.trim() !== '')
        if (lastNonEmptyLineIndex === -1) {
            lines[startIndex] = content
        } else {
            lines.splice(lastNonEmptyLineIndex + 1, 0, content)
        }
    } else if (type === 'prependLineBeforeContent') {
        const firstNonEmptyLineIndex = lines.findIndex((line, index) => index > startIndex && index <= endIndex && line.trim() !== '')
        if (firstNonEmptyLineIndex === -1) {
            if (lines[startIndex] !== undefined && lines[startIndex].trim() !== '') {
                lines.splice(startIndex, 0, content)
            } else {
                lines[startIndex] = content
            }
        } else {
            lines.splice(firstNonEmptyLineIndex, 0, content)
        }
    }

    return lines.join('\n')
}
