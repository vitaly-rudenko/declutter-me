import { expect } from 'chai';
import { stripIndent } from 'common-tags';
import { InputType, PatternBuilder, TokenType } from '../index.js';

const { TEXT, VARIABLE, OPTIONAL, VARIATIONAL } = TokenType;

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
                    { type: TEXT, value: 'hello' },
                ]);

            expect(patternBuilder.build('Buy chicken'))
                .to.deep.eq([
                    { type: TEXT, value: 'buy chicken' },
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
                    { type: TEXT, value: 'buy ' },
                    { type: VARIABLE, value: 'note' },
                    { type: TEXT, value: ', please' },
                ]);

            expect(patternBuilder.build('#{tag} Buy {note}, please'))
                .to.deep.eq([
                    { type: TEXT, value: '#' },
                    { type: VARIABLE, value: 'tag' },
                    { type: TEXT, value: ' buy ' },
                    { type: VARIABLE, value: 'note' },
                    { type: TEXT, value: ', please' },
                ]);
        });

        it('should parse bang variables', () => {
            expect(patternBuilder.build('#{tag!} Buy {note}, please'))
                .to.deep.eq([
                    { type: TEXT, value: '#' },
                    { type: VARIABLE, value: 'tag', bang: true },
                    { type: TEXT, value: ' buy ' },
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
            expect(patternBuilder.build('(Buy|Purchase) {body}[,] please[ #{tag!}][(!|.)]'))
                .to.deep.eq([
                    {
                        type: VARIATIONAL,
                        value: [
                            [{ type: TEXT, value: 'buy' }],
                            [{ type: TEXT, value: 'purchase' }],
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
                            { type: VARIABLE, value: 'tag', bang: true }
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
            expect(patternBuilder.build('#{database!} buy {Note:text}, please[ {when:future_date}][ #{My Tag:word}]'))
                .to.deep.eq([
                    { type: TEXT, value: '#' },
                    { type: VARIABLE, value: 'database', bang: true },
                    { type: TEXT, value: ' buy ' },
                    { type: VARIABLE, value: 'Note', inputType: TEXT },
                    { type: TEXT, value: ', please' },
                    { type: OPTIONAL, value: [
                        { type: TEXT, value: ' ' },
                        { type: VARIABLE, value: 'when', inputType: InputType.FUTURE_DATE },
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
                { type: TEXT, value: 'contact: ' },
                { type: VARIABLE, value: 'Name', inputType: InputType.WORD },
                { type: OPTIONAL, value: [
                    { type: TEXT, value: ' ' },
                    { type: VARIABLE, value: 'Surname', inputType: InputType.WORD },
                ] },
                { type: OPTIONAL, value: [
                    { type: TEXT, value: '\nphone: ' },
                    { type: VARIABLE, value: 'Phone', inputType: InputType.PHONE },
                ] },
                { type: TEXT, value: '\nemail: ' },
                { type: VARIABLE, value: 'Email', inputType: InputType.EMAIL },
            ]);

            expect(patternBuilder.build(stripIndent`
                Hello( world|
                world)
            `)).to.deep.eq([
                { type: TEXT, value: 'hello' },
                { type: VARIATIONAL, value: [
                    [{ type: TEXT, value: ' world' }],
                    [{ type: TEXT, value: '\nworld' }],
                ] },
            ]);
        });
    });
});
