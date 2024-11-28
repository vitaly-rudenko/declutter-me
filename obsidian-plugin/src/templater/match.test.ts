import { match } from './match.js'

describe('match()', () => {
  it('matches simple template', () => {
    expect(match('w Hello world!', 'p {note}')).toBeUndefined()

    expect(match('w Hello world!', 'w {note}')).toEqual({
      note: { type: 'text', value: 'Hello world!' }
    })

    expect(match('JIRA-123 Hello world!', 'JIRA-{id:number} {note}')).toEqual({
      id: { type: 'number', value: 123 },
      note: { type: 'text', value: 'Hello world!' },
    })
  })

  it('should match simple pattern', () => {
    const pattern = '#{tag:word} {note:text}'

    expect(match('#ideas Draw fan-art of Haruhi', pattern))
      .toEqual({
        tag: { type: 'word', value: 'ideas' },
        note: { type: 'text', value: 'Draw fan-art of Haruhi' }
      })

    expect(match('#my-ideas Write HTML parser', pattern))
      .toEqual({
        tag: { type: 'word', value: 'my-ideas' },
        note: { type: 'text', value: 'Write HTML parser' }
      })

    expect(match('Write HTML parser', pattern))
      .toBeUndefined()

    expect(match('# Write HTML parser', pattern))
      .toBeUndefined()
  })

  it('should separate variables properly', () => {
    const pattern = '{note:text} #{tag:word}'

    expect(match('Draw fan-art of Haruhi #art-ideas', pattern))
      .toEqual({
        note: { type: 'text', value: 'Draw fan-art of Haruhi' },
        tag: { type: 'word', value: 'art-ideas' }
      })

    expect(match('Write an app in Go #my #idea', pattern))
      .toEqual({
        note: { type: 'text', value: 'Write an app in Go #my' },
        tag: { type: 'word', value: 'idea' }
      })

    expect(match('Write an app in Go potatoes #my idea', pattern))
      .toBeUndefined()
  })

  it('should separate variables properly in complete sentences', () => {
    const pattern = 'save {note:text} to the {tag:word} notes'

    expect(match('Save Pygmalion effect to the idea notes', pattern))
      .toEqual({
        note: { type: 'text', value: 'Pygmalion effect' },
        tag: { type: 'word', value: 'idea' }
      })
  })

  it('should match complex patterns', () => {
    const pattern = '[[#]{database} ](add|save) {note:text}[ to[ the] {tag:word}[ notes]]'

    for (const input of ['Add my unique idea', 'save my unique idea']) {
      expect(match(input, pattern))
        .toEqual({
          note: { type: 'text', value: 'my unique idea' }
        })
    }

    for (const input of [
      'shopping Add my unique idea to my-ideas',
      '#shopping Add my unique idea to my-ideas notes',
      'shopping add my unique idea To The my-ideas',
      '#shopping Add my unique idea to the my-ideas notes'
    ]) {
      expect(match(input, pattern))
        .toEqual({
          database: { type: 'text', value: 'shopping' },
          note: { type: 'text', value: 'my unique idea' },
          tag: { type: 'word', value: 'my-ideas' }
        })
    }
  })

  it.only('should match patterns with special characters', () => {
    expect(match(
      'Jon Snow: A character of Game of Thrones',
      '{name:word} {surname:word}: {description:text}'
    )).toEqual({
      name: { type: 'word', value: 'Jon' },
      surname: { type: 'word', value: 'Snow' },
      description: { type: 'text', value: 'A character of Game of Thrones' }
    })

    expect(match(
      'Hi! My name is George.',
      '{greeting:word}! My {variable:word} is {value:word}.'
    )).toEqual({
      greeting: { type: 'word', value: 'Hi' },
      variable: { type: 'word', value: 'name' },
      value: { type: 'word', value: 'George' }
    })
  })

  it('should match multiline patterns properly', () => {
    const pattern = `
      Contact: {Name:word}[ {Surname:word}][
      Phone: {Phone:phone}]
      Email: {Email:email}
    `

    expect(match(`
      Contact: Jon
      Email: jon.snow@example.com
    `, pattern))
      .toEqual({
        Name: { type: 'word', value: 'Jon' },
        Email: { type: 'email', value: 'jon.snow@example.com' }
      })

    expect(match(`
      Contact: Jon Snow
      Phone: +380123456789
      Email: jon.snow@example.com
    `, pattern))
      .toEqual({
        Name: { type: 'word', value: 'Jon' },
        Surname: { type: 'word', value: 'Snow' },
        Phone: { type: 'phone', value: '+380123456789' },
        Email: { type: 'email', value: 'jon.snow@example.com' }
      })
  })
})