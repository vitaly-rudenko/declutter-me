import { applyMarkdownModification } from './apply-markdown-modification'

const propertiesVariations = [
  undefined,
  '---\nhello: world\n---\n\n\n',
  '---\nhello: world\n---\n{existingContent}\n',
]

const sectionVariations = [
  undefined,
  '# section\n\n\n',
  '# section before\n# section\n\n\n# section after\n',
  '# section\n{existingContent}\n',
  '# section before\n# section\n{existingContent}\n# section after\n',
]

const existingContentVariations = [
  'hello world',
  '\nhello world\nhi there',
]

const contentVariations = [
  'INSERTED',
  'INSERTED 1\nINSERTED 2',
]

describe('applyMarkdownModification()', () => {
  describe('type: appendLineAfterContent', () => {
    it('defaults', () => {
      const options = {
        type: 'appendLineAfterContent',
        content: 'test',
      } as const

      expect(applyMarkdownModification({
        ...options,
        markdown: '',
      })).toBe('test\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: 'hello world',
      })).toBe('hello world\ntest\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '\n\n\nhello world\n\n\n',
      })).toBe('\n\n\nhello world\ntest\n\n\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '\n\n\nhello world\n\n\nhello world\nhi there\n\n\n',
        content: 'multiline\ntest',
      })).toBe('\n\n\nhello world\n\n\nhello world\nhi there\nmultiline\ntest\n\n\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\n\n\n',
      })).toBe('---\nhello: world\n---\n\ntest\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\n\nhello world',
      })).toBe('---\nhello: world\n---\n\nhello world\ntest\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\n\n---\n\nhello world\n\n\n',
      })).toBe('---\nhello: world\n---\n\n---\n\nhello world\ntest\n\n\n')
    })

    it('section: "# section"', () => {
      const options = {
        type: 'appendLineAfterContent',
        section: '# section',
        content: 'test',
      } as const

      expect(applyMarkdownModification({
        markdown: '# section\n\n\n',
        ...options,
      })).toBe('# section\n\ntest\n')

      expect(applyMarkdownModification({
        markdown: 'hello world!\n\n# section\n\n\n',
        ...options,
      })).toBe('hello world!\n\n# section\n\ntest\n')

      expect(applyMarkdownModification({
        markdown: '# section\n\n\n# section after',
        ...options,
      })).toBe('# section\n\ntest\n\n# section after')

      expect(applyMarkdownModification({
        markdown: '# section\n\nhello world',
        ...options,
      })).toBe('# section\n\nhello world\ntest\n')

      expect(applyMarkdownModification({
        markdown: '# section before\n# section\n\n\n# section after\n',
        ...options,
      })).toBe('# section before\n# section\n\ntest\n\n# section after\n')
    })

    it('[permutations]', () => {
      const tested = new Set<string>()

      for (const propertiesVariation of propertiesVariations) {
        for (const sectionVariation of sectionVariations) {
          for (const existingContentVariation of existingContentVariations) {
            for (const contentVariation of contentVariations) {
              const markdown = [
                ...propertiesVariation?.replace('{existingContent}', existingContentVariation) ?? [],
                ...sectionVariation?.replace('{existingContent}', existingContentVariation) ?? [],
              ].filter(line => line !== undefined).join('')

              if (tested.has(markdown)) continue
              tested.add(markdown)

              expect(applyMarkdownModification({
                markdown,
                type: 'appendLineAfterContent',
                content: contentVariation,
              })).toMatchSnapshot(markdown.replace(/\n/g, '<br>'))
            }
          }
        }
      }
    })
  })

  describe('type: prependLineBeforeContent', () => {
    it('defaults', () => {
      const options = {
        type: 'prependLineBeforeContent',
        content: 'test',
      } as const

      expect(applyMarkdownModification({
        ...options,
        markdown: '',
      })).toBe('test\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: 'hello world',
      })).toBe('test\nhello world')

      expect(applyMarkdownModification({
        ...options,
        markdown: '\n\n\nhello world\n\n\n',
      })).toBe('\n\n\ntest\nhello world\n\n\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '\n\n\nhello world\n\n\nhello world\nhi there\n\n\n',
        content: 'multiline\ntest',
      })).toBe('\n\n\nmultiline\ntest\nhello world\n\n\nhello world\nhi there\n\n\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\n\n\n',
      })).toBe('---\nhello: world\n---\n\ntest\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\nhello world',
      })).toBe('---\nhello: world\n---\n\ntest\nhello world')

      expect(applyMarkdownModification({
        ...options,
        markdown: '---\nhello: world\n---\n\n---\n\nhello world\n\n\n',
      })).toBe('---\nhello: world\n---\n\n---\n\ntest\nhello world\n\n\n')
    })

    it('section: "# section"', () => {
      const options = {
        type: 'prependLineBeforeContent',
        section: '# section',
        content: 'test',
      } as const

      expect(applyMarkdownModification({
        ...options,
        markdown: '# section\n\n\n',
      })).toBe('# section\n\ntest\n')

      expect(applyMarkdownModification({
        ...options,
        markdown: '# section\n\nhello world',
      })).toBe('# section\n\ntest\nhello world')

      expect(applyMarkdownModification({
        ...options,
        markdown: '# section before\n# section\n\n\n# section after\n',
      })).toBe('# section before\n# section\n\ntest\n\n# section after\n')
    })

    it('[permutations]', () => {
      const tested = new Set<string>()

      for (const propertiesVariation of propertiesVariations) {
        for (const sectionVariation of sectionVariations) {
          for (const existingContentVariation of existingContentVariations) {
            for (const contentVariation of contentVariations) {
              const markdown = [
                ...propertiesVariation?.replace('{existingContent}', existingContentVariation) ?? [],
                ...sectionVariation?.replace('{existingContent}', existingContentVariation) ?? [],
              ].filter(line => line !== undefined).join('')

              if (tested.has(markdown)) continue
              tested.add(markdown)

              expect(applyMarkdownModification({
                markdown,
                type: 'prependLineBeforeContent',
                content: contentVariation,
              })).toMatchSnapshot(markdown.replace(/\n/g, '<br>'))
            }
          }
        }
      }
    })
  })
})
