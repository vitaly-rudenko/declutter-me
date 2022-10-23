import chai, { expect } from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { stripIndent } from 'common-tags';
import { InputType, PatternBuilder, TokenType } from '../index.js';

const { TEXT, VARIABLE, OPTIONAL, VARIATIONAL, ANY_ORDER } = TokenType;

chai.use(deepEqualInAnyOrder);

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
                    { type: TEXT, value: 'Hello' },
                ]);

            expect(patternBuilder.build('Buy chicken'))
                .to.deep.eq([
                    { type: TEXT, value: 'Buy chicken' },
                ]);
        });

        it('should parse variables', () => {
            expect(patternBuilder.build('{note}'))
                .to.deep.eq([
                    { type: VARIABLE, value: 'note' },
                ]);

            expect(patternBuilder.build('{tag}{note}'))
                .to.deep.eq([
                    { type: VARIABLE, value: 'tag' },
                    { type: VARIABLE, value: 'note' },
                ]);

            expect(patternBuilder.build('{tag} {note}'))
                .to.deep.eq([
                    { type: VARIABLE, value: 'tag' },
                    { type: TEXT, value: ' ' },
                    { type: VARIABLE, value: 'note' },
                ]);

            expect(patternBuilder.build('Buy {note}, please'))
                .to.deep.eq([
                    { type: TEXT, value: 'Buy ' },
                    { type: VARIABLE, value: 'note' },
                    { type: TEXT, value: ', please' },
                ]);

            expect(patternBuilder.build('#{tag} Buy {note}, please'))
                .to.deep.eq([
                    { type: TEXT, value: '#' },
                    { type: VARIABLE, value: 'tag' },
                    { type: TEXT, value: ' Buy ' },
                    { type: VARIABLE, value: 'note' },
                    { type: TEXT, value: ', please' },
                ]);
        });

        it('should parse optionals', () => {
            expect(patternBuilder.build('[hello]'))
                .to.deep.eq([
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'hello' }] }
                ]);

            expect(patternBuilder.build('[hello][world]'))
                .to.deep.eq([
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'hello' }] },
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'world' }] }
                ]);

            expect(patternBuilder.build('[hello] [world]'))
                .to.deep.eq([
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'hello' }] },
                    { type: TEXT, value: ' ' },
                    { type: OPTIONAL, value: [{ type: TEXT, value: 'world' }] }
                ]);
        });

        it('should parse variations', () => {
            expect(patternBuilder.build('(hello)'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'hello' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi)'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'hello' }],
                            [{ type: TEXT, value: 'hi' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi)(world|there)'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'hello' }],
                            [{ type: TEXT, value: 'hi' }],
                        ]
                    },
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'world' }],
                            [{ type: TEXT, value: 'there' }],
                        ]
                    }
                ]);

            expect(patternBuilder.build('(hello|hi|hey) (world|there)'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'hello' }],
                            [{ type: TEXT, value: 'hi' }],
                            [{ type: TEXT, value: 'hey' }],
                        ]
                    },
                    { type: TEXT, value: ' ' },
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'world' }],
                            [{ type: TEXT, value: 'there' }],
                        ]
                    }
                ]);
        });

        it('should build pattern from the input string (complex)', () => {
            expect(patternBuilder.build('(Buy|Purchase) {body}[,] please[ #{tag}][(!|.)]'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'Buy' }],
                            [{ type: TEXT, value: 'Purchase' }],
                        ]
                    },
                    { type: TEXT, value: ' ' },
                    { type: VARIABLE, value: 'body' },
                    {
                        type: OPTIONAL,
                        value: [{ type: TEXT, value: ',' }]
                    },
                    { type: TEXT, value: ' please' },
                    {
                        type: OPTIONAL,
                        value: [
                            { type: TEXT, value: ' #' },
                            { type: VARIABLE, value: 'tag' }
                        ]
                    },
                    {
                        type: OPTIONAL,
                        value: [{
                            type: VARIATIONAL,
                            value: [
                                [{ type: TEXT, value: '!' }],
                                [{ type: TEXT, value: '.' }]
                            ]
                        }]
                    },
                ]);
        });

        it('should parse nested cases', () => {
            expect(patternBuilder.build('[[{tag}]]'))
                .to.deep.eq([{
                    'type': OPTIONAL,
                    'value': [{
                        'type': OPTIONAL,
                        'value': [{
                            'type': VARIABLE,
                            'value': 'tag'
                        }]
                    }]
                }]);

            expect(patternBuilder.build('(([[hello]]))'))
                .to.deep.eq([{
                    'type': VARIATIONAL,
                    'value': [
                        [{
                            'type': VARIATIONAL,
                            'value': [
                                [{
                                    'type': OPTIONAL,
                                    'value': [{
                                        'type': OPTIONAL,
                                        'value': [{
                                            'type': TEXT,
                                            'value': 'hello'
                                        }]
                                    }]
                                }]
                            ]
                        }]
                    ]
                }]);
        });

        it('should parse input types', () => {
            expect(patternBuilder.build('#{database} buy {Note:text}, please[ {when:number}][ #{My Tag:word}]'))
                .to.deep.eq([
                    { type: TEXT, value: '#' },
                    { type: VARIABLE, inputType: InputType.DATABASE },
                    { type: TEXT, value: ' buy ' },
                    { type: VARIABLE, value: 'Note', inputType: TEXT },
                    { type: TEXT, value: ', please' },
                    { type: OPTIONAL, value: [
                        { type: TEXT, value: ' ' },
                        { type: VARIABLE, value: 'when', inputType: InputType.NUMBER },
                    ] },
                    { type: OPTIONAL, value: [
                        { type: TEXT, value: ' #' },
                        { type: VARIABLE, value: 'My Tag', inputType: InputType.WORD },
                    ] },
                ]);
        });

        it('should build multiline patterns properly', () => {
            expect(patternBuilder.build(stripIndent`
                Contact: {Name:word}[ {Surname:word}][
                Phone: {Phone:phone}]
                Email: {Email:email}
            `)).to.deep.eq([
                { type: TEXT, value: 'Contact: ' },
                { type: VARIABLE, value: 'Name', inputType: InputType.WORD },
                { type: OPTIONAL, value: [
                    { type: TEXT, value: ' ' },
                    { type: VARIABLE, value: 'Surname', inputType: InputType.WORD },
                ] },
                { type: OPTIONAL, value: [
                    { type: TEXT, value: '\nPhone: ' },
                    { type: VARIABLE, value: 'Phone', inputType: InputType.PHONE },
                ] },
                { type: TEXT, value: '\nEmail: ' },
                { type: VARIABLE, value: 'Email', inputType: InputType.EMAIL },
            ]);

            expect(patternBuilder.build(stripIndent`
                Hello( world|
                world)
            `)).to.deep.eq([
                { type: TEXT, value: 'Hello' },
                { type: VARIATIONAL, value: [
                    [{ type: TEXT, value: ' world' }],
                    [{ type: TEXT, value: '\nworld' }],
                ] },
            ]);
        });

        it('should build patterns for complex nested variational and optional tokens', () => {
            expect(patternBuilder.build('(кг|кило[грам[(а|ов)]])')).to.deep.equalInAnyOrder([
                { type: VARIATIONAL, value: [
                    [{ type: TEXT, value: 'кг' }],
                    [
                        { type: TEXT, value: 'кило' },
                        { type: OPTIONAL, value: [
                            { type: TEXT, value: 'грам' },
                            { type: OPTIONAL, value: [
                                { type: VARIATIONAL, value: [
                                    [{ type: TEXT, value: 'а' }],
                                    [{ type: TEXT, value: 'ов' }],
                                ] }
                            ] }
                        ] }
                    ]
                ] }
            ]);
        });

        it('should build patterns with any-order operator', () => {
            expect(patternBuilder.build('<a |b |c >')).to.deep.eq([
                { type: ANY_ORDER, value: [
                    [{ type: TEXT, value: 'a ' }],
                    [{ type: TEXT, value: 'b ' }],
                    [{ type: TEXT, value: 'c ' }],
                ] }
            ]);

            expect(patternBuilder.build('<a |<b |c >|d >')).to.deep.eq([
                { type: ANY_ORDER, value: [
                    [{ type: TEXT, value: 'a ' }],
                    [{ type: ANY_ORDER, value: [
                        [{ type: TEXT, value: 'b ' }],
                        [{ type: TEXT, value: 'c ' }],
                    ] }],
                    [{ type: TEXT, value: 'd ' }],
                ] }
            ]);
        });

        it('should build patterns for custom input types', () => {
            expect(patternBuilder.build('{Unit:(kg|g|pcs)}')).to.deep.eq([
                { type: VARIABLE, inputType: InputType.MATCH, value: 'Unit', match: [
                    { type: VARIATIONAL, value: [
                        [{ type: TEXT, value: 'kg' }],
                        [{ type: TEXT, value: 'g' }],
                        [{ type: TEXT, value: 'pcs' }],
                    ] }
                ] }
            ]);

            expect(patternBuilder.build('{Amount:{:number} kg}')).to.deep.eq([
                { type: VARIABLE, inputType: InputType.MATCH, value: 'Amount', match: [
                    { type: VARIABLE, inputType: InputType.NUMBER },
                    { type: TEXT, value: ' kg' },
                ] }
            ]);
        });

        it('should parse {database} variable properly', () => {
            expect(patternBuilder.build('{database}')).to.deep.eq([
                { type: VARIABLE, inputType: InputType.DATABASE }
            ]);
        });
    });
});
