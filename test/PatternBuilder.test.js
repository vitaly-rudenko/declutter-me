const { expect } = require('chai');
const PatternBuilder = require('../app/PatternBuilder');

describe('PatternBuilder', () => {
    /** @type {PatternBuilder} */
    let patternBuilder;

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
    });

    describe('#build()', () => {
        it('should parse simple text', () => {
            expect(patternBuilder.build('Hello'))
                .to.deep.eq([
                    { type: 'text', value: 'hello' },
                ]);

            expect(patternBuilder.build('Buy chicken'))
                .to.deep.eq([
                    { type: 'text', value: 'buy chicken' },
                ]);
        });

        it('should parse variables', () => {
            expect(patternBuilder.build('{note}'))
                .to.deep.eq([
                    { type: 'variable', value: 'note' },
                ]);

            expect(patternBuilder.build('{tag}{note}'))
                .to.deep.eq([
                    { type: 'variable', value: 'tag' },
                    { type: 'variable', value: 'note' },
                ]);

            expect(patternBuilder.build('{tag} {note}'))
                .to.deep.eq([
                    { type: 'variable', value: 'tag' },
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: 'note' },
                ]);

            expect(patternBuilder.build('Buy {note}, please'))
                .to.deep.eq([
                    { type: 'text', value: 'buy ' },
                    { type: 'variable', value: 'note' },
                    { type: 'text', value: ', please' },
                ]);

            expect(patternBuilder.build('#{tag} Buy {note}, please'))
                .to.deep.eq([
                    { type: 'text', value: '#' },
                    { type: 'variable', value: 'tag' },
                    { type: 'text', value: ' buy ' },
                    { type: 'variable', value: 'note' },
                    { type: 'text', value: ', please' },
                ]);
        });

        it('should parse bang variables', () => {
            expect(patternBuilder.build('#{tag!} Buy {note}, please'))
                .to.deep.eq([
                    { type: 'text', value: '#' },
                    { type: 'variable', value: 'tag', bang: true },
                    { type: 'text', value: ' buy ' },
                    { type: 'variable', value: 'note' },
                    { type: 'text', value: ', please' },
                ]);
        });

        it('should parse optionals', () => {
            expect(patternBuilder.build('[hello]'))
                .to.deep.eq([
                    { type: 'optional', value: [{ type: 'text', value: 'hello' }] }
                ]);

            expect(patternBuilder.build('[hello][world]'))
                .to.deep.eq([
                    { type: 'optional', value: [{ type: 'text', value: 'hello' }] },
                    { type: 'optional', value: [{ type: 'text', value: 'world' }] }
                ]);

            expect(patternBuilder.build('[hello] [world]'))
                .to.deep.eq([
                    { type: 'optional', value: [{ type: 'text', value: 'hello' }] },
                    { type: 'text', value: ' ' },
                    { type: 'optional', value: [{ type: 'text', value: 'world' }] }
                ]);
        });

        it('should parse variations', () => {
            expect(patternBuilder.build('(hello)'))
                .to.deep.eq([
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'hello' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi)'))
                .to.deep.eq([
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'hello' }],
                            [{ type: 'text', value: 'hi' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi)(world|there)'))
                .to.deep.eq([
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'hello' }],
                            [{ type: 'text', value: 'hi' }],
                        ]
                    },
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'world' }],
                            [{ type: 'text', value: 'there' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi|hey) (world|there)'))
                .to.deep.eq([
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'hello' }],
                            [{ type: 'text', value: 'hi' }],
                            [{ type: 'text', value: 'hey' }],
                        ]
                    },
                    { type: 'text', value: ' ' },
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'world' }],
                            [{ type: 'text', value: 'there' }],
                        ]
                    }
                ]);
        });

        it('should build pattern from the input string (complex)', () => {
            expect(patternBuilder.build('(Buy|Purchase) {body}[,] please[ #{tag!}][(!|.)]'))
                .to.deep.eq([
                    {
                        type: 'variational',
                        value: [
                            [{ type: 'text', value: 'buy' }],
                            [{ type: 'text', value: 'purchase' }],
                        ]
                    },
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: 'body' },
                    {
                        type: 'optional',
                        value: [{ type: 'text', value: ',' }]
                    },
                    { type: 'text', value: ' please' },
                    {
                        type: 'optional',
                        value: [
                            { type: 'text', value: ' #' },
                            { type: 'variable', value: 'tag', bang: true }
                        ]
                    },
                    {
                        type: 'optional',
                        value: [{
                            type: 'variational',
                            value: [
                                [{ type: 'text', value: '!' }],
                                [{ type: 'text', value: '.' }]
                            ]
                        }]
                    },
                ]);
        });

        it('should parse nested cases', () => {
            expect(patternBuilder.build('[[{tag}]]'))
                .to.deep.eq([{
                    "type": "optional",
                    "value": [{
                        "type": "optional",
                        "value": [{
                            "type": "variable",
                            "value": "tag"
                        }]
                    }]
                }]);

            expect(patternBuilder.build('(([[hello]]))'))
                .to.deep.eq([{
                    "type": "variational",
                    "value": [
                        [{
                            "type": "variational",
                            "value": [
                                [{
                                    "type": "optional",
                                    "value": [{
                                        "type": "optional",
                                        "value": [{
                                            "type": "text",
                                            "value": "hello"
                                        }]
                                    }]
                                }]
                            ]
                        }]
                    ]
                }]);
        });
    });
});
