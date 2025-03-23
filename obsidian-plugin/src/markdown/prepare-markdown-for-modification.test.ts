import { prepareMarkdownForModification } from "./prepare-markdown-for-modification"

const markdownVariations = [
  '',
  '\n',
  '\n\n\n',
  'hello world',
  'hello world\n',
  '\n\n\nhello world\n\n\n',
  '---\nhello: world\n---',
  '---\nhello: world\n---\n',
  '\n\n\n---\nhello: world\n---\n\n\n',
  '# section\nhello world',
  '# section\nhello world\n',
  '\n\n\n# section\n\n\nhello world\n\n\n',
  '# section before\n# section\n# section after',
  '# section before\n# section\n\n# section after',
  '# section before\n# section\n\n\n# section after',
  '\n\n\n# section before\n\n\n# section\n\n\n# section after\n\n\n',
]

const sectionVariations = [
  undefined,
  '# section',
]

describe('prepareMarkdownForModification()', () => {
  it('prepares empty markdown for modification', () => {
    expect(prepareMarkdownForModification({ markdown: '' })).toEqual('')
  })

  it('appends section when missing', () => {
    expect(prepareMarkdownForModification({
      markdown: '',
      section: '# section'
    })).toEqual('# section\n\n\n')

    expect(prepareMarkdownForModification({
      markdown: '# section before\n',
      section: '# section'
    })).toEqual('# section before\n\n# section\n\n\n')
  })

  it('adds missing newlines to the section', () => {
    expect(prepareMarkdownForModification({
      markdown: '# section before\n# section\n# section after',
      section: '# section'
    })).toEqual('# section before\n# section\n\n\n\n# section after')
  })

  it('adds missing newlines after properties', () => {
    expect(prepareMarkdownForModification({
      markdown: '---\nhello: world\n---',
    })).toEqual('---\nhello: world\n---\n\n\n')
  })

  it('correctly appends section after properties', () => {
    expect(prepareMarkdownForModification({
      markdown: '---\nhello: world\n---',
      section: '# section'
    })).toEqual('---\nhello: world\n---\n\n# section\n\n\n')
  })

  it('keeps markdown unmodified when no changes are needed', () => {
    expect(prepareMarkdownForModification({
      markdown: 'hello world',
    })).toEqual('hello world')

    // Already has data in the section
    expect(prepareMarkdownForModification({
      markdown: '# section\nhello world',
      section: '# section'
    })).toEqual('# section\nhello world')

    // Already has data after properties
    expect(prepareMarkdownForModification({
      markdown: '---\nhello: world\n---\nhello world',
    })).toEqual('---\nhello: world\n---\nhello world')
  })

  it('[permutations]', () => {
    for (const markdownVariation of markdownVariations) {
      for (const sectionVariation of sectionVariations) {
        expect(prepareMarkdownForModification({
          markdown: markdownVariation,
          section: sectionVariation,
        })).toMatchSnapshot(markdownVariation.replace(/\n/g, '<br>') + (sectionVariation ? ` + section "${sectionVariation}"` : ' w/o section'))
      }
    }
  })
})