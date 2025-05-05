import { formatTaskContent } from "./format-task-content.js"

describe('formatTaskContent()', () => {
  it('should format single-line content', () => {
    expect(formatTaskContent('Task')).toBe('- [ ] Task')
  })

  it('should format multi-line content', () => {
    expect(formatTaskContent('Task\n1\n2\n3')).toBe(`\
- [ ] Task...
\`\`\`
Task
1
2
3
\`\`\``)
  })
})
