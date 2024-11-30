import { Variable } from 'src/plugin/common'
import { flattenVariables } from './flatten-variables'

describe('flattenVariables()', () => {
  it('flattens array of variables into a map', () => {
    const variables: Variable[] = [
      { name: 'greeting', value: 'hello world' },
      { name: 'phoneNumber', value: '+380891234567' },
      { name: 'age', value: 25 },
      { name: 'workEmail', value: 'fake@example.com'  }
    ]

    expect(flattenVariables(variables)).toEqual({
      greeting: 'hello world',
      phoneNumber: '+380891234567',
      age: 25,
      workEmail: 'fake@example.com'
    })
  })
})