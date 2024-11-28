import { match } from "./match"

describe('match()', () => {
    it('matches simple template', () => {
        expect(match('w Hello world!', 'p {note}')).toBeUndefined()
        expect(match('w Hello world!', 'w {note}')).toEqual({ note: 'Hello world!' })
        expect(match('JIRA-123 Hello world!', 'JIRA-{id:number} {note}')).toEqual({ id: 123, note: 'Hello world!' })
    })
})