import chai from 'chai';
import { InputType, PatternMatcher, TokenType } from '../index.js';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';

const { expect } = chai;
chai.use(deepEqualInAnyOrder);

const { TEXT, VARIABLE, OPTIONAL, VARIATIONAL, ANY_ORDER } = TokenType;

describe('PatternMatcher', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
    });

    describe('match()', () => {
        it('should throw error for non-existing matchers', () => {
            expect(() => patternMatcher.match(
                'my-name', [{ type: VARIABLE, value: 'name', inputType: TEXT }], {})
            ).to.throw('Unsupported matcher: text');
        });
    });

    describe('getPatternCombinations()', () => {
        it('should handle empty optionals and variationals', () => {
            // (|a|b|) []()(||) hello!
            expect(patternMatcher.getPatternCombinations([
                { type: VARIATIONAL, value: [
                    [{ type: TEXT, value: '' }],
                    [{ type: TEXT, value: 'a' }],
                    [{ type: TEXT, value: 'b' }],
                    [{ type: TEXT, value: '' }],
                ] },
                { type: TEXT, value: ' ' },
                { type: OPTIONAL, value: [] },
                { type: VARIATIONAL, value: [] },
                { type: VARIATIONAL, value: [
                    [{ type: TEXT, value: '' }],
                    [{ type: TEXT, value: '' }],
                    [{ type: TEXT, value: '' }],
                ] },
                { type: TEXT, value: ' hello!' },
            ])).to.deep.equalInAnyOrder([
                [{ type: TEXT, value: '  hello!' }],
                [{ type: TEXT, value: 'a  hello!' }],
                [{ type: TEXT, value: 'b  hello!' }],
            ]);
        });

        it('should exclude combinations with variables next to each other', () => {
            // [{1:word}][ ][{2:word}][ ][{3:word}]
            expect(patternMatcher.getPatternCombinations([
                { type: OPTIONAL, value: [
                    { type: VARIABLE, value: '1', inputType: InputType.WORD },
                ] },
                { type: OPTIONAL, value: [
                    { type: TEXT, value: ' ' },
                ] },
                { type: OPTIONAL, value: [
                    { type: VARIABLE, value: '2', inputType: InputType.WORD },
                ] },
            ])).to.deep.equalInAnyOrder([
                [
                    { type: 'variable', value: '1', inputType: 'word' },
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: '2', inputType: 'word' }
                ],
                [
                    { type: 'variable', value: '1', inputType: 'word' },
                    { type: 'text', value: ' ' }
                ],
                [
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: '2', inputType: 'word' }
                ],
                [{ type: 'variable', value: '1', inputType: 'word' }],
                [{ type: 'text', value: ' ' }],
                [{ type: 'variable', value: '2', inputType: 'word' }],
                []
            ]);
        });
    });

    describe('getTokenCombinations()', () => {
        it('should create simple combinations', () => {
            // hello world
            expect(patternMatcher.getTokenCombinations({
                type: TEXT,
                value: 'hello world'
            })).to.deep.equalInAnyOrder([
                [{ type: TEXT, value: 'hello world' }]
            ]);

            // [hello world]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [{ type: TEXT, value: 'hello world' }]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'hello world' }]
            ]);

            // (hello world|hello there)
            expect(patternMatcher.getTokenCombinations({
                type: VARIATIONAL,
                value: [
                    [{ type: TEXT, value: 'hello world' }],
                    [{ type: TEXT, value: 'hello there' }],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'hello there' }]
            ]);
        });

        it('should create combinations for nested optionals', () => {
            // [hello[ world]]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [
                    { type: TEXT, value: 'hello' },
                    { type: OPTIONAL, value: [{ type: TEXT, value: ' world' }] }
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'hello' }],
                [{ type: TEXT, value: 'hello world' }]
            ]);

            // [hello[ world[!]]]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [
                    { type: TEXT, value: 'hello' },
                    { type: OPTIONAL, value: [
                        { type: TEXT, value: ' world' },
                        { type: OPTIONAL, value: [{ type: TEXT, value: '!' }] }
                    ] }
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'hello' }],
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'hello world!' }],
            ]);
        });

        it('should create combinations for chained optionals', () => {
            // [hello [world][!]]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [
                    { type: TEXT, value: 'hello' },
                    { type: OPTIONAL, value: [{ type: TEXT, value: ' world' }] },
                    { type: OPTIONAL, value: [{ type: TEXT, value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'hello' }],
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'hello!' }],
                [{ type: TEXT, value: 'hello world!' }],
            ]);

            // [hello [world][, my friend][!]]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [
                    { type: TEXT, value: 'hello' },
                    { type: OPTIONAL, value: [{ type: TEXT, value: ' world' }] },
                    { type: OPTIONAL, value: [{ type: TEXT, value: ', my friend' }] },
                    { type: OPTIONAL, value: [{ type: TEXT, value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'hello' }],
                [{ type: TEXT, value: 'hello!' }],
                [{ type: TEXT, value: 'hello, my friend' }],
                [{ type: TEXT, value: 'hello, my friend!' }],
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'hello world!' }],
                [{ type: TEXT, value: 'hello world, my friend' }],
                [{ type: TEXT, value: 'hello world, my friend!' }],
            ]);
        });

        it('should create combinations for nested & chained optionals', () => {
            // [he[l]lo[[,] wor[l]d][!]]
            expect(patternMatcher.getTokenCombinations({
                type: OPTIONAL,
                value: [
                    { type: TEXT, value: 'he' },
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'l' }] },
                    { type: TEXT, value: 'lo' },
                    { type: OPTIONAL, value: [
                        { type: OPTIONAL, value: [{ type: TEXT, value: ',' }] },
                        { type: TEXT, value: ' wor' },
                        { type: OPTIONAL, value: [{ type: TEXT, value: 'l' }] },
                        { type: TEXT, value: 'd' }
                    ] },
                    { type: OPTIONAL, value: [{ type: TEXT, value: '!' }] },
                ]
            })).to.deep.equalInAnyOrder([
                [],
                [{ type: TEXT, value: 'helo' }],
                [{ type: TEXT, value: 'hello' }],
                [{ type: TEXT, value: 'helo word' }],
                [{ type: TEXT, value: 'hello word' }],
                [{ type: TEXT, value: 'helo, word' }],
                [{ type: TEXT, value: 'hello, word' }],
                [{ type: TEXT, value: 'helo world' }],
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'helo, world' }],
                [{ type: TEXT, value: 'hello, world' }],
                [{ type: TEXT, value: 'helo!' }],
                [{ type: TEXT, value: 'hello!' }],
                [{ type: TEXT, value: 'helo word!' }],
                [{ type: TEXT, value: 'hello word!' }],
                [{ type: TEXT, value: 'helo, word!' }],
                [{ type: TEXT, value: 'hello, word!' }],
                [{ type: TEXT, value: 'helo world!' }],
                [{ type: TEXT, value: 'hello world!' }],
                [{ type: TEXT, value: 'helo, world!' }],
                [{ type: TEXT, value: 'hello, world!' }],
            ]);
        });

        it('should create combinations for nested variations', () => {
            // ((hey|he(l|n|)lo) ((the|my) world|there|everybody!))
            expect(patternMatcher.getTokenCombinations({
                type: VARIATIONAL,
                value: [
                    [
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: 'hey' }],
                            [
                                { type: TEXT, value: 'he' },
                                { type: VARIATIONAL, value: [
                                    [{ type: TEXT, value: 'l' }],
                                    [{ type: TEXT, value: 'n' }],
                                    [],
                                ] },
                                { type: TEXT, value: 'lo' },
                            ],
                        ] },
                        { type: TEXT, value: ' ' },
                        { type: VARIATIONAL, value: [
                            [
                                { type: VARIATIONAL, value: [
                                    [{ type: TEXT, value: 'the' }],
                                    [{ type: TEXT, value: 'my' }],
                                ] },
                                { type: TEXT, value: ' world' },
                            ],
                            [{ type: TEXT, value: 'there' }],
                            [{ type: TEXT, value: 'everybody!' }],
                        ] },
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: TEXT, value: 'hey the world' }],
                [{ type: TEXT, value: 'hello the world' }],
                [{ type: TEXT, value: 'henlo the world' }],
                [{ type: TEXT, value: 'helo the world' }],
                [{ type: TEXT, value: 'hey my world' }],
                [{ type: TEXT, value: 'hello my world' }],
                [{ type: TEXT, value: 'henlo my world' }],
                [{ type: TEXT, value: 'helo my world' }],
                [{ type: TEXT, value: 'hey there' }],
                [{ type: TEXT, value: 'hello there' }],
                [{ type: TEXT, value: 'henlo there' }],
                [{ type: TEXT, value: 'helo there' }],
                [{ type: TEXT, value: 'hey everybody!' }],
                [{ type: TEXT, value: 'hello everybody!' }],
                [{ type: TEXT, value: 'henlo everybody!' }],
                [{ type: TEXT, value: 'helo everybody!' }],
            ]);
        });

        it('should create combinations for chained variations', () => {
            // ((hey|hello) (world|there)|(jon|john) (snow|doe)(!|?))
            expect(patternMatcher.getTokenCombinations({
                type: VARIATIONAL,
                value: [
                    [
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: 'hey' }],
                            [{ type: TEXT, value: 'hello' }],
                        ] },
                        { type: TEXT, value: ' ' },
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: 'world' }],
                            [{ type: TEXT, value: 'there' }],
                        ] }
                    ],
                    [
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: 'jon' }],
                            [{ type: TEXT, value: 'john' }],
                        ] },
                        { type: TEXT, value: ' ' },
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: 'snow' }],
                            [{ type: TEXT, value: 'doe' }],
                        ] },
                        { type: VARIATIONAL, value: [
                            [{ type: TEXT, value: '!' }],
                            [{ type: TEXT, value: '?' }],
                        ] }
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: TEXT, value: 'hey world' }],
                [{ type: TEXT, value: 'hey there' }],
                [{ type: TEXT, value: 'hello world' }],
                [{ type: TEXT, value: 'hello there' }],
                [{ type: TEXT, value: 'jon snow!' }],
                [{ type: TEXT, value: 'jon doe!' }],
                [{ type: TEXT, value: 'john snow!' }],
                [{ type: TEXT, value: 'john doe!' }],
                [{ type: TEXT, value: 'jon snow?' }],
                [{ type: TEXT, value: 'jon doe?' }],
                [{ type: TEXT, value: 'john snow?' }],
                [{ type: TEXT, value: 'john doe?' }],
            ]);
        });

        it('should create combinations for any-order operator', () => {
            // <{phone}>
            expect(patternMatcher.getTokenCombinations({
                type: ANY_ORDER,
                value: [
                    [{ type: VARIABLE, value: 'phone' }]
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: VARIABLE, value: 'phone' }],
            ]);

            // <{phone}|{email}>
            expect(patternMatcher.getTokenCombinations({
                type: ANY_ORDER,
                value: [
                    [
                        { type: VARIABLE, value: 'phone' },
                    ],
                    [
                        { type: VARIABLE, value: 'email' },
                    ],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }],
            ]);

            // <{phone}|{email}|{url}>
            expect(patternMatcher.getTokenCombinations({
                type: ANY_ORDER,
                value: [
                    [{ type: VARIABLE, value: 'phone' }],
                    [{ type: VARIABLE, value: 'email' }],
                    [{ type: VARIABLE, value: 'url' }],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'phone' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }],
            ]);
        });

        it.skip('should create combinations for optional any-order operator', () => {
            // <[{phone}]|[{email}]|[{url}]>
            expect(patternMatcher.getTokenCombinations({
                type: ANY_ORDER,
                value: [
                    [{ type: OPTIONAL, value: [{ type: VARIABLE, value: 'phone' }] }],
                    [{ type: OPTIONAL, value: [{ type: VARIABLE, value: 'email' }] }],
                    [{ type: OPTIONAL, value: [{ type: VARIABLE, value: 'url' }] }],
                ]
            })).to.deep.equalInAnyOrder([
                [{ type: VARIABLE, value: 'phone' }],
                [{ type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'url' }],

                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }],

                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'phone' }],

                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'email' }],

                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'url' }],
                [{ type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'phone' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'phone' }, { type: VARIABLE, value: 'email' }],
                [{ type: VARIABLE, value: 'url' }, { type: VARIABLE, value: 'email' }, { type: VARIABLE, value: 'phone' }],
            ]);
        });
    });
});
