import { escapeRegex } from "./escape-regex";

describe('escapeRegex()', () => {
    it('should escape regex characters', () => {
        expect(escapeRegex('()[]{}+*?|\\^$-')).toBe('\\(\\)\\[\\]\\{\\}\\+\\*\\?\\|\\\\\\^\\$\\x2d');
    });
});
