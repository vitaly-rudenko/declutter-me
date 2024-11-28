import { transformPatternToRegex } from "./transform-pattern-to-regex"

describe('transformPatternToRegex()', () => {
    it('transforms simple patterns', () => {
        // Hello world!
        expect(transformPatternToRegex([
            { type: 'text', value: 'Hello world!' }
        ])).toEqual('Hello world!')

        // p {note:text}
        expect(transformPatternToRegex([
            { type: 'text', value: 'p ' },
            { type: 'variable', value: 'note', input: { type: 'text' } }
        ])).toEqual('p (?<note>.+)')

        // (p|personal) {note:text}
        expect(transformPatternToRegex([
            {
                type: 'variational',
                value: [
                    [{ type: 'text', value: 'p ' }],
                    [{ type: 'text', value: 'personal ' }],
                ]
            },
            { type: 'variable', value: 'note', input: { type: 'text' } }
        ])).toEqual('(?:p |personal )(?<note>.+)')

        // p[ersonal] {note:text}
        expect(transformPatternToRegex([
            { type: 'text', value: 'p' },
            { type: 'optional', value: [{ type: 'text', value: 'ersonal' }] },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'note', input: { type: 'text' } }
        ])).toEqual('p(?:ersonal)? (?<note>.+)')
    })

    it('transforms nested patterns', () => {
        // (He(n|l)lo|Hi|Greet[ing][s]) {firstName:word}[ {lastName:word}][!]
        expect(transformPatternToRegex([
            {
                type: 'variational',
                value: [
                    [
                        { type: 'text', value: 'He' },
                        {
                            type: 'variational',
                            value: [
                                [{ type: 'text', value: 'n' }],
                                [{ type: 'text', value: 'l' }],
                            ]
                        },
                        { type: 'text', value: 'lo' }
                    ],
                    [{ type: 'text', value: 'Hi' }],
                    [
                        { type: 'text', value: 'Greet' },
                        { type: 'optional', value: [{ type: 'text', value: 'ing' }] },
                        { type: 'optional', value: [{ type: 'text', value: 's' }] },
                    ],
                ]
            },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'firstName', input: { type: 'word' } },
            {
                type: 'optional',
                value: [
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: 'lastName', input: { type: 'word' } }
                ]
            },
            { type: 'optional', value: [{ type: 'text', value: '!' }] },
        ])).toEqual('(?:He(?:n|l)lo|Hi|Greet(?:ing)?(?:s)?) (?<firstName>\\S+)(?: (?<lastName>\\S+))?(?:!)?')
    })

    it('transforms variables with match input type', () => {
        // Buy {amount:{_:number}(kg|g)} of {product:text}
        expect(transformPatternToRegex([
            { type: 'text', value: 'Buy ' },
            {
                type: 'variable',
                value: 'amount',
                input: {
                    type: 'match',
                    match: [
                        { type: 'variable', value: '_', input: { type: 'number' } },
                        {
                            type: 'variational',
                            value: [
                                [{ type: 'text', value: 'kg' }],
                                [{ type: 'text', value: 'g' }],
                            ]
                        }
                    ]
                }
            },
            { type: 'text', value: ' of ' },
            { type: 'variable', value: 'product', input: { type: 'text' } }
        ])).toEqual('Buy (?<amount>(?<_>[\\d\\.]+)(?:kg|g)) of (?<product>.+)')
    })

    it('escapes regex', () => {
        // Hello? Pick your name: John | Jane. * You can edit later.
        expect(transformPatternToRegex([
            { type: 'text', value: 'Hello? Pick your name: John | Jane. * You can edit later.' },
        ])).toEqual('Hello\\? Pick your name: John \\| Jane\\. \\* You can edit later\\.')
    })
})