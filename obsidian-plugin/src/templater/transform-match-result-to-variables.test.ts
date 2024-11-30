import { MatchResult } from './match'
import { transformMatchResultToVariables } from './transform-match-result-to-variables'

describe('transformMatchResultToVariables()', () => {
    it('extracts variables from MatchResult', () => {
        const matchResult: MatchResult = {
            greeting: { value: 'hello world', type: 'text' },
            phoneNumber: { value: '+380891234567', type: 'phone' },
            age: { value: 25, type: 'number' },
            workEmail: { value: 'fake@example.com', type: 'email' },
        }

        expect(transformMatchResultToVariables(matchResult)).toEqual({
            greeting: 'hello world',
            phoneNumber: '+380891234567',
            age: 25,
            workEmail: 'fake@example.com'
        })
    })
})