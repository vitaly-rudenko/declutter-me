const chai = require('chai');
const PatternMatcher = require('../app/PatternMatcher');

const { expect } = chai;
chai.use(require('deep-equal-in-any-order'));

describe('PatternMatcher', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
    });

    describe('match()', () => {
        it('should throw error for non-existing matchers', () => {
            expect(() => patternMatcher.match(
                'my-name', [{ type: 'variable', value: 'name', inputType: 'text', outputType: 'title' }], {})
            ).to.throw('Unsupported matcher: text');
        });
    });

    describe('getTokenCombinations()', () => {
        it('should create simple combinations', () => {
            // hello world
            expect(patternMatcher.getTokenCombinations({
                type: 'text',
                value: 'hello world'
            })).to.deep.equalInAnyOrder([
                [{ type: 'text', value: 'hello world' }]
            ]);

            // [hello world]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [{ type: 'text', value: 'hello world' }]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'hello world' }]
            ]);

            // (hello world|hello there)
            expect(patternMatcher.getTokenCombinations({
                type: 'variational',
                value: [
                    [{ type: 'text', value: 'hello world' }],
                    [{ type: 'text', value: 'hello there' }],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'hello there' }]
            ]);
        });

        it('should create combinations for nested optionals', () => {
            // [hello[ world]]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [
                    { type: 'text', value: 'hello' },
                    { type: 'optional', value: [{ type: 'text', value: ' world' }] }
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'hello' }],
                [{ type: 'text', value: 'hello world' }]
            ]);

            // [hello[ world[!]]]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [
                    { type: 'text', value: 'hello' },
                    { type: 'optional', value: [
                        { type: 'text', value: ' world' },
                        { type: 'optional', value: [{ type: 'text', value: '!' }] }
                    ] }
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'hello' }],
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'hello world!' }],
            ]);
        });

        it('should create combinations for chained optionals', () => {
            // [hello [world][!]]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [
                    { type: 'text', value: 'hello' },
                    { type: 'optional', value: [{ type: 'text', value: ' world' }] },
                    { type: 'optional', value: [{ type: 'text', value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'hello' }],
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'hello!' }],
                [{ type: 'text', value: 'hello world!' }],
            ]);

            // [hello [world][, my friend][!]]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [
                    { type: 'text', value: 'hello' },
                    { type: 'optional', value: [{ type: 'text', value: ' world' }] },
                    { type: 'optional', value: [{ type: 'text', value: ', my friend' }] },
                    { type: 'optional', value: [{ type: 'text', value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'hello' }],
                [{ type: 'text', value: 'hello!' }],
                [{ type: 'text', value: 'hello, my friend' }],
                [{ type: 'text', value: 'hello, my friend!' }],
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'hello world!' }],
                [{ type: 'text', value: 'hello world, my friend' }],
                [{ type: 'text', value: 'hello world, my friend!' }],
            ]);
        });

        it('should create combinations for nested & chained optionals', () => {
            // [he[l]lo[[,] wor[l]d][!]]
            expect(patternMatcher.getTokenCombinations({
                type: 'optional',
                value: [
                    { type: 'text', value: 'he' },
                    { type: 'optional', value: [{ type: 'text', value: 'l' }] },
                    { type: 'text', value: 'lo' },
                    { type: 'optional', value: [
                        { type: 'optional', value: [{ type: 'text', value: ',' }] },
                        { type: 'text', value: ' wor' },
                        { type: 'optional', value: [{ type: 'text', value: 'l' }] },
                        { type: 'text', value: 'd' }
                    ] },
                    { type: 'optional', value: [{ type: 'text', value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: 'text', value: 'helo' }],
                [{ type: 'text', value: 'hello' }],
                [{ type: 'text', value: 'helo word' }],
                [{ type: 'text', value: 'hello word' }],
                [{ type: 'text', value: 'helo, word' }],
                [{ type: 'text', value: 'hello, word' }],
                [{ type: 'text', value: 'helo world' }],
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'helo, world' }],
                [{ type: 'text', value: 'hello, world' }],
                [{ type: 'text', value: 'helo!' }],
                [{ type: 'text', value: 'hello!' }],
                [{ type: 'text', value: 'helo word!' }],
                [{ type: 'text', value: 'hello word!' }],
                [{ type: 'text', value: 'helo, word!' }],
                [{ type: 'text', value: 'hello, word!' }],
                [{ type: 'text', value: 'helo world!' }],
                [{ type: 'text', value: 'hello world!' }],
                [{ type: 'text', value: 'helo, world!' }],
                [{ type: 'text', value: 'hello, world!' }],
            ]);
        });

        it('should create combinations for nested variations', () => {
            // ((hey|he(l|n|)lo) ((the|my) world|there|everybody!))
            expect(patternMatcher.getTokenCombinations({
                type: 'variational',
                value: [
                    [
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'hey' }],
                            [
                                { type: 'text', value: 'he' },
                                { type: 'variational', value: [
                                    [{ type: 'text', value: 'l' }],
                                    [{ type: 'text', value: 'n' }],
                                    [],
                                ] },
                                { type: 'text', value: 'lo' },
                            ],
                        ] },
                        { type: 'text', value: ' ' },
                        { type: 'variational', value: [
                            [
                                { type: 'variational', value: [
                                    [{ type: 'text', value: 'the' }],
                                    [{ type: 'text', value: 'my' }],
                                ] },
                                { type: 'text', value: ' world' },
                            ],
                            [{ type: 'text', value: 'there' }],
                            [{ type: 'text', value: 'everybody!' }],
                        ] },
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: 'text', value: 'hey the world' }],
                [{ type: 'text', value: 'hello the world' }],
                [{ type: 'text', value: 'henlo the world' }],
                [{ type: 'text', value: 'helo the world' }],
                [{ type: 'text', value: 'hey my world' }],
                [{ type: 'text', value: 'hello my world' }],
                [{ type: 'text', value: 'henlo my world' }],
                [{ type: 'text', value: 'helo my world' }],
                [{ type: 'text', value: 'hey there' }],
                [{ type: 'text', value: 'hello there' }],
                [{ type: 'text', value: 'henlo there' }],
                [{ type: 'text', value: 'helo there' }],
                [{ type: 'text', value: 'hey everybody!' }],
                [{ type: 'text', value: 'hello everybody!' }],
                [{ type: 'text', value: 'henlo everybody!' }],
                [{ type: 'text', value: 'helo everybody!' }],
            ]);
        });

        it('should create combinations for chained variations', () => {
            // ((hey|hello) (world|there)|(jon|john) (snow|doe)(!|?))
            expect(patternMatcher.getTokenCombinations({
                type: 'variational',
                value: [
                    [
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'hey' }],
                            [{ type: 'text', value: 'hello' }],
                        ] },
                        { type: 'text', value: ' ' },
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'world' }],
                            [{ type: 'text', value: 'there' }],
                        ] }
                    ],
                    [
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'jon' }],
                            [{ type: 'text', value: 'john' }],
                        ] },
                        { type: 'text', value: ' ' },
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'snow' }],
                            [{ type: 'text', value: 'doe' }],
                        ] },
                        { type: 'variational', value: [
                            [{ type: 'text', value: '!' }],
                            [{ type: 'text', value: '?' }],
                        ] }
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: 'text', value: 'hey world' }],
                [{ type: 'text', value: 'hey there' }],
                [{ type: 'text', value: 'hello world' }],
                [{ type: 'text', value: 'hello there' }],
                [{ type: 'text', value: 'jon snow!' }],
                [{ type: 'text', value: 'jon doe!' }],
                [{ type: 'text', value: 'john snow!' }],
                [{ type: 'text', value: 'john doe!' }],
                [{ type: 'text', value: 'jon snow?' }],
                [{ type: 'text', value: 'jon doe?' }],
                [{ type: 'text', value: 'john snow?' }],
                [{ type: 'text', value: 'john doe?' }],
            ]);
        });

        it('should create combinations for complex patterns', () => {
            // ((buy|purchase) {item}[, please]|#{list} {item})
            expect(patternMatcher.getTokenCombinations({
                type: 'variational',
                value: [
                    [
                        { type: 'variational', value: [
                            [{ type: 'text', value: 'buy' }],
                            [{ type: 'text', value: 'purchase' }],
                        ] },
                        { type: 'text', value: ' ' },
                        { type: 'variable', value: 'item' },
                        { type: 'optional', value: [
                            { type: 'text', value: ', please' },
                        ] },
                    ],
                    [
                        { type: 'text', value: '#' },
                        { type: 'variable', value: 'list' },
                        { type: 'text', value: ' ' },
                        { type: 'variable', value: 'item' },
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: 'text', value: 'buy ' }, { type: 'variable', value: 'item' }],
                [{ type: 'text', value: 'purchase ' }, { type: 'variable', value: 'item' }],
                [{ type: 'text', value: 'buy ' }, { type: 'variable', value: 'item' }, { type: 'text', value: ', please' }],
                [{ type: 'text', value: 'purchase ' }, { type: 'variable', value: 'item' }, { type: 'text', value: ', please' }],
                [{ type: 'text', value: '#' }, { type: 'variable', value: 'list' }, { type: 'text', value: ' ' }, { type: 'variable', value: 'item' }],
            ]);
        });
    });
});
