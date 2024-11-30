import { replaceVariables } from "./replace-variables"

describe('replaceVariables()', () => {
  it('replaces variables', () => {
    expect(replaceVariables(
      'Hello, {name} {surname}! Your age is {age}.',
      { name: 'John', surname: 'Doe', age: 30 }
    )).toBe('Hello, John Doe!')
  })

  it('replaces dates', () => {
    const now = new Date(2021, 0, 1)
    expect(replaceVariables('Today is {date:yyyy-MM-dd}. Year: {date:yyyy}!', {}, now)).toBe('Today is 2021-01-01. Year: 2021!')
  })
})