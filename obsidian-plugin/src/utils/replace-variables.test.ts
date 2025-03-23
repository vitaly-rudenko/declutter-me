import { replaceVariables } from './replace-variables'

describe('replaceVariables()', () => {
  it('replaces variables', () => {
    expect(replaceVariables(
      'Hello, {name} {surname}! Your age is {age}.',
      [
        { name: 'name', value: 'John' },
        { name: 'surname', value: 'Doe' },
        { name: 'age', value: 30 },
      ],
      new Date('2021-02-03')
    )).toBe('Hello, John Doe! Your age is 30.')
  })

  it('replaces repeated variables', () => {
    expect(replaceVariables(
      'Hello, {name}! {name}\'s age is {age}.',
      [
        { name: 'name', value: 'John' },
        { name: 'age', value: 30 },
      ],
      new Date('2021-02-03')
    )).toBe('Hello, John! John\'s age is 30.')
  })

  it('should override variables', () => {
    expect(replaceVariables(
      'Hello, {name}! Your age is {age}.',
      [
        { name: 'name', value: 'John' },
        { name: 'name', value: 'Jane' },
        { name: 'age', value: 30 },
        { name: 'age', value: 25 },
      ],
      new Date('2021-02-03')
    )).toBe('Hello, Jane! Your age is 25.')
  })

  it('replaces dates', () => {
    expect(replaceVariables(
      'Today is {date:yyyy-MM-dd}. Year: {date:yyyy}!',
      [],
      new Date('2021-02-03')
    )).toBe('Today is 2021-02-03. Year: 2021!')
  })
})