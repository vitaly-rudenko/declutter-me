import { formatListItemContent } from "./format-list-item-content.js"

describe('formatListItemContent()', () => {
  it('should format single-line content', () => {
    expect(formatListItemContent('List item')).toBe('- List item')
  })

  it('should format multi-line content', () => {
    expect(formatListItemContent('List item\n1\n2\n3')).toBe(`\
- List item...
\`\`\`
List item
1
2
3
\`\`\``)
  })
})
