import { extractVariableDefinitionsFromPattern } from './extract-variable-definitions-from-pattern.js'
import { parseTemplate } from './parse-template.js'

describe('extractVariableDefinitionsFromPattern()', () => {
    it('extracts variable definitions from flat pattern', () => {
        const pattern = parseTemplate('{a:number} {b:text} {c:word} {d:email} {e:phone} {f:url} {g:{h:number} {i:text}}')

        expect(extractVariableDefinitionsFromPattern(pattern)).toEqual({
            a: { type: 'number' },
            b: { type: 'text' },
            c: { type: 'word' },
            d: { type: 'email' },
            e: { type: 'phone' },
            f: { type: 'url' },
            g: { type: 'match' },
            h: { type: 'number' },
            i: { type: 'text' },
        })
    })

    it('extracts variable definitions from nested pattern', () => {
        const pattern = parseTemplate('[{a:number}] ({b:text}|{c:word}) [({d:email}|email)|({e:phone}|phone)] {g:({h:number}|{i:text}|[{j:{k:number}}])}')

        expect(extractVariableDefinitionsFromPattern(pattern)).toEqual({
            a: { type: 'number' },
            b: { type: 'text' },
            c: { type: 'word' },
            d: { type: 'email' },
            e: { type: 'phone' },
            g: { type: 'match' },
            h: { type: 'number' },
            i: { type: 'text' },
            j: { type: 'match' },
            k: { type: 'number' },
        })
    })

    it('fails when variable is already defined', () => {
        const patterns = [
            parseTemplate('{a:number} {a:text}'),
            parseTemplate('{a:{a:text}}'),
            parseTemplate('({a:number}|{a:text})'),
        ]

        for (const pattern of patterns) {
            expect(() => extractVariableDefinitionsFromPattern(pattern)).toThrow('Variable is already defined: a')
        }
    })
})