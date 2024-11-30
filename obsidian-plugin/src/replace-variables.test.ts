import { replaceVariables } from "./replace-variables"

describe('replaceVariables()', () => {
  it('replaces variables', () => {
    expect(replaceVariables(
      'Hello, {name} {surname}! Your age is {age}.',
      { name: 'John', surname: 'Doe', age: 30 },
      new Date(2021, 0, 1)
    )).toBe('Hello, John Doe! Your age is 30.')
  })

  it('replaces repeated variables', () => {
    expect(replaceVariables(
      'Hello, {name}! {name}\'s age is {age}.',
      { name: 'John', age: 30 },
      new Date(2021, 0, 1)
    )).toBe('Hello, John! John\'s age is 30.')
  })

  it('replaces dates', () => {
    expect(replaceVariables(
      'Today is {date:yyyy-MM-dd}. Year: {date:yyyy}!',
      {},
      new Date(2021, 0, 1)
    )).toBe('Today is 2021-01-01. Year: 2021!')
  })
})