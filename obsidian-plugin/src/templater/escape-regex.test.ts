import { escapeRegex } from './escape-regex.js'

describe('escapeRegex()', () => {
    it('should escape regex characters', () => {
        expect(escapeRegex('()[]{}+*?|\\^$-')).toBe('\\(\\)\\[\\]\\{\\}\\+\\*\\?\\|\\\\\\^\\$\\x2d')
    })
})
