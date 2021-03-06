import { stripIndent } from 'common-tags';
import { expect } from 'chai';
import { PatternMatcher, PatternBuilder, RussianDateParser, EntryMatchers, Field, InputType } from '../../index.js';
import { TokenType } from '../../src/TokenType.js';

describe('EntryMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {RussianDateParser} */
    let russianDateParser;
    /** @type {EntryMatchers} */
    let matchers;
    /** @type {PatternBuilder} */
    let patternBuilder;

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
        patternMatcher = new PatternMatcher();
        russianDateParser = new RussianDateParser();
        matchers = new EntryMatchers({ dateParser: russianDateParser });
    });

    describe('[entries]', () => {
        it('should match simple pattern', () => {
            const pattern = patternBuilder.build('#{tag:word} {note:text}');
    
            expect(patternMatcher.match('#ideas Draw fan-art of Haruhi', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'ideas' }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'Draw fan-art of Haruhi' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-ideas Write HTML parser', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-ideas' }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'Write HTML parser' }),
                    ]
                });
            
            expect(patternMatcher.match('Write HTML parser', pattern, matchers))
                .to.be.null;
            
            expect(patternMatcher.match('# Write HTML parser', pattern, matchers, { returnCombination: true }))
                .to.be.null;
        });
    
        it('should separate variables properly', () => {
            const pattern = patternBuilder.build('{note:text} #{tag:word}');
            
            expect(patternMatcher.match('Draw fan-art of Haruhi #art-ideas', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'Draw fan-art of Haruhi' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'art-ideas' }),
                    ]
                });
    
            expect(patternMatcher.match('Write an app in Go #my #idea', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'Write an app in Go #my' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'idea' }),
                    ]
                });
            
            expect(patternMatcher.match('Write an app in Go potatoes #my idea', pattern, matchers))
                .to.be.null;
        });
    
        it('should separate variables properly in complete sentences', () => {
            const pattern = patternBuilder.build('save {note:text} to the {tag:word} notes');
    
            expect(patternMatcher.match('Save Pygmalion effect to the idea notes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'Pygmalion effect' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'idea' }),
                    ]
                });
        });

        it('should not override word when repeated (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word} ][#{tag:word} ][#{tag:word} ]{note:text}');
    
            expect(patternMatcher.match('my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-tag-1' }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: '#my-tag-4 my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: '#my-tag-4 #my-tag-5 my note' }),
                    ]
                });
        });

        it('should not override word when repeated (from the end)', () => {
            const pattern = patternBuilder.build('save {note:text}[ #{tag:word}][ #{tag:word}][ #{tag:word}]');
    
            expect(patternMatcher.match('Save my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-tag-1' }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2'] }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note #my-tag-1' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-2', 'my-tag-3', 'my-tag-4'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note #my-tag-1 #my-tag-2' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-3', 'my-tag-4', 'my-tag-5'] }),
                    ]
                });
        });
    
        it('should allow matching multiple tags (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word} ][#{tag:word} ][#{tag:word} ]{note:text}');
    
            expect(patternMatcher.match('my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-tag-1' }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: '#my-tag-4 my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: InputType.TEXT, value: '#my-tag-4 #my-tag-5 my note' }),
                    ]
                });
        });
        
        it('should allow matching multiple tags (from the end)', () => {
            const pattern = patternBuilder.build('Save {note:text}[ #{tag:word}][ #{tag:word}][ #{tag:word}]');
    
            expect(patternMatcher.match('Save my note', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-tag-1' }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2'] }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note #my-tag-1' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-2', 'my-tag-3', 'my-tag-4'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note #my-tag-1 #my-tag-2' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-3', 'my-tag-4', 'my-tag-5'] }),
                    ]
                });

            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, matchers, { returnCombination: true }))
                .to.deep.eq({
                    combination: [
                        { type: TokenType.TEXT, value: 'Save ' },
                        { type: TokenType.VARIABLE, value: 'note', inputType: InputType.TEXT },
                        { type: TokenType.TEXT, value: ' #' },
                        { type: TokenType.VARIABLE, value: 'tag', inputType: InputType.WORD },
                        { type: TokenType.TEXT, value: ' #' },
                        { type: TokenType.VARIABLE, value: 'tag', inputType: InputType.WORD },
                    ],
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my note' }),
                        new Field({ name: 'tag', inputType: InputType.WORD, value: ['my-tag-1', 'my-tag-2'] }),
                    ]
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[[#]{database:database} ](add|save) {note:text}[ to[ the] {tag:word}[ notes]]');
    
            for (const input of ['Add my unique idea', 'save my unique idea']) {
                expect(patternMatcher.match(input, pattern, matchers), input)
                    .to.deep.eq({
                        fields: [
                            new Field({ name: 'note', inputType: InputType.TEXT, value: 'my unique idea' }),
                        ]
                    });
            }
    
            for (const input of [
                'shopping Add my unique idea to my-ideas',
                '#shopping Add my unique idea to my-ideas notes',
                'shopping add my unique idea To The my-ideas',
                '#shopping Add my unique idea to the my-ideas notes',
                'shopping Save my unique idea to my-ideas',
                '#shopping Save my unique idea to my-ideas notes',
                'shopping save my unique idea to the my-ideas',
                '#shopping Save my unique idea to the my-ideas Notes',
            ]) {
                expect(patternMatcher.match(input, pattern, matchers), input)
                    .to.deep.eq({
                        fields: [
                            new Field({ name: 'database', inputType: InputType.DATABASE, value: 'shopping' }),
                            new Field({ name: 'note', inputType: InputType.TEXT, value: 'my unique idea' }),
                            new Field({ name: 'tag', inputType: InputType.WORD, value: 'my-ideas' }),
                        ]
                    });
            }
    
            for (const input of [
                'Insert my unique idea to the my-ideas notes',
                'Save', 'Add', 'Addmy unique idea'
            ]) {
                expect(patternMatcher.match(input, pattern, matchers), input)
                    .to.be.null;
            }
    
            // Special case
            expect(patternMatcher.match('Add my unique idea into the my-ideas notes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'note', inputType: InputType.TEXT, value: 'my unique idea into the my-ideas notes' }),
                    ]
                });
        });

        it('should match patterns with special characters', () => {
            expect(patternMatcher.match(
                'Jon Snow: A character of Game of Thrones',
                patternBuilder.build('{name:word} {surname:word}: {description:text}'),
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'surname', inputType: InputType.WORD, value: 'Snow' }),
                    new Field({ name: 'description', inputType: InputType.TEXT, value: 'A character of Game of Thrones' }),
                ]
            });

            expect(patternMatcher.match(
                'Hi! My name is George.',
                patternBuilder.build('{greeting:word}! My {variable:word} is {value:word}.'),
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'greeting', inputType: InputType.WORD, value: 'Hi' }),
                    new Field({ name: 'variable', inputType: InputType.WORD, value: 'name' }),
                    new Field({ name: 'value', inputType: InputType.WORD, value: 'George' }),
                ]
            });

            expect(patternMatcher.match(
                'Hi there! My real name is Jr. George McDonald.',
                patternBuilder.build('{greeting:text}! My {variable:text} is {value:text}.'),
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'greeting', inputType: InputType.TEXT, value: 'Hi there' }),
                    new Field({ name: 'variable', inputType: InputType.TEXT, value: 'real name' }),
                    new Field({ name: 'value', inputType: InputType.TEXT, value: 'Jr. George McDonald' }),
                ]
            });
        });

        it('should prioritize special matchers (1)', () => {
            const pattern = patternBuilder.build('{name:word}[ {surname:word}][ {description:text}][ {phone:phone}][ {email:email}]');

            expect(patternMatcher.match(
                'Jon +380123456789',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'phone', inputType: InputType.PHONE, value: '+380123456789' }),
                ]
            });

            expect(patternMatcher.match(
                'Jon jon.snow@example.com',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                ]
            });

            expect(patternMatcher.match(
                'Jon +380123456789 jon.snow@example.com',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'phone', inputType: InputType.PHONE, value: '+380123456789' }),
                    new Field({ name: 'email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                ]
            });

            expect(patternMatcher.match(
                'Jon Snow +380123456789',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'surname', inputType: InputType.WORD, value: 'Snow' }),
                    new Field({ name: 'phone', inputType: InputType.PHONE, value: '+380123456789' }),
                ]
            });

            expect(patternMatcher.match(
                'Jon Snow A Game of Thrones character jon.snow@example.com',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'surname', inputType: InputType.WORD, value: 'Snow' }),
                    new Field({ name: 'description', inputType: InputType.TEXT, value: 'A Game of Thrones character' }),
                    new Field({ name: 'email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                ]
            });

            expect(patternMatcher.match(
                'Jon Snow A Game of Thrones character +380123456789 jon.snow@example.com',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: 'name', inputType: InputType.WORD, value: 'Jon' }),
                    new Field({ name: 'surname', inputType: InputType.WORD, value: 'Snow' }),
                    new Field({ name: 'description', inputType: InputType.TEXT, value: 'A Game of Thrones character' }),
                    new Field({ name: 'phone', inputType: InputType.PHONE, value: '+380123456789' }),
                    new Field({ name: 'email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                ]
            });
        });

        it('should preserve order of the pattern', () => {
            const pattern = patternBuilder.build('[1 ][{2:word}][ {3:word}]');

            expect(patternMatcher.match(
                '1 2',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: '2', inputType: InputType.WORD, value: '2' }),
                ]
            });

            expect(patternMatcher.match(
                '1  3',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: '3', inputType: InputType.WORD, value: '3' }),
                ]
            });

            expect(patternMatcher.match(
                '2 3',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: '2', inputType: InputType.WORD, value: '2' }),
                    new Field({ name: '3', inputType: InputType.WORD, value: '3' }),
                ]
            });

            expect(patternMatcher.match(
                '1 2 3',
                pattern,
                matchers
            )).to.deep.eq({
                fields: [
                    new Field({ name: '2', inputType: InputType.WORD, value: '2' }),
                    new Field({ name: '3', inputType: InputType.WORD, value: '3' }),
                ]
            });
        });

        describe('[multiline patterns]', () => {
            it('should match simple multiline patterns properly', () => {
                const pattern = patternBuilder.build(stripIndent`
                    {Name:word} {Surname:word}
                    {Phone:phone}
                    {Email:email}
                `);

                expect(
                    patternMatcher.match(stripIndent`
                        Jon Snow
                        +380123456789
                        jon.snow@example.com
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'Surname', inputType: InputType.WORD, value: 'Snow' }),
                        new Field({ name: 'Phone', inputType: InputType.PHONE, value: '+380123456789' }),
                        new Field({ name: 'Email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                    ]
                });
            });

            it('should match complex multiline patterns properly', () => {
                const pattern = patternBuilder.build(stripIndent`
                    Contact: {Name:word}[ {Surname:word}][
                    Phone: {Phone:phone}]
                    Email: {Email:email}
                `);

                expect(
                    patternMatcher.match(stripIndent`
                        Contact: Jon
                        Email: jon.snow@example.com
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'Email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                    ]
                });

                expect(
                    patternMatcher.match(stripIndent`
                        Contact: Jon Snow
                        Phone: +380123456789
                        Email: jon.snow@example.com
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'Surname', inputType: InputType.WORD, value: 'Snow' }),
                        new Field({ name: 'Phone', inputType: InputType.PHONE, value: '+380123456789' }),
                        new Field({ name: 'Email', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                    ]
                });
            });

            it('should match complex multiline patterns', () => {
                const pattern = patternBuilder.build('[#{database}( |\n)][??????????????( |\n)]{??????????????:text}[( |\n)#{????????:word}][( |\n)#{????????:word}][( |\n)#{????????:word}]');

                expect(
                    patternMatcher.match(stripIndent`
                        #notes
                        ???????????? ??????.
                        ?????? ?????????
                        #tag1 #tag2
                        #tag3
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ inputType: InputType.DATABASE, value: 'notes' }),
                        new Field({ name: '??????????????', inputType: InputType.TEXT, value: '???????????? ??????.\n?????? ?????????' }),
                        new Field({ name: '????????', inputType: InputType.WORD, value: ['tag1', 'tag2', 'tag3'] }),
                    ]
                });
            });

            it('should match simple multiline text', () => {
                const pattern = patternBuilder.build('Diary:[ ][\n]{entry:text}');

                expect(
                    patternMatcher.match(stripIndent`
                        Diary: Today was hard.
                        I hope tomorrow will be easier!
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ name: 'entry', inputType: InputType.TEXT, value: 'Today was hard.\nI hope tomorrow will be easier!' }),
                    ]
                });

                expect(
                    patternMatcher.match(stripIndent`
                        Diary:
                        Today was hard.
                        I hope tomorrow will be easier!
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ name: 'entry', inputType: InputType.TEXT, value: 'Today was hard.\nI hope tomorrow will be easier!' }),
                    ]
                });
            });
        });

        it('should match numbers next to the text', () => {
            const pattern1 = patternBuilder.build('{num:number}45');
            const pattern2 = patternBuilder.build('123{num:number}');
            const pattern3 = patternBuilder.build('12{num:number}56');

            expect(patternMatcher.match('12345', pattern1, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'num', value: '123', inputType: InputType.NUMBER })
                    ]
                })

            expect(patternMatcher.match('12345', pattern2, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'num', value: '45', inputType: InputType.NUMBER })
                    ]
                })

            expect(patternMatcher.match('123456', pattern3, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'num', value: '34', inputType: InputType.NUMBER })
                    ]
                })
        })

        it('should match words next to the text', () => {
            const pattern1 = patternBuilder.build('{str:word}def');
            const pattern2 = patternBuilder.build('abc{str:word}');
            const pattern3 = patternBuilder.build('ab{str:word}ef');

            expect(patternMatcher.match('abcdef', pattern1, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'str', value: 'abc', inputType: InputType.WORD })
                    ]
                })

            expect(patternMatcher.match('abcdef', pattern2, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'str', value: 'def', inputType: InputType.WORD })
                    ]
                })

            expect(patternMatcher.match('abcdef', pattern3, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'str', value: 'cd', inputType: InputType.WORD })
                    ]
                })
        })
    });

    describe('[reminders]', () => {
        it('should match dates properly from the start', () => {
            const pattern = patternBuilder.build('{date:future_date} {reminder:text}');
    
            expect(patternMatcher.match('?????????????????????? ???????????? ????????????????', pattern, matchers))
                    .to.deep.eq({
                        fields: [
                            new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '??????????????????????' }),
                            new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                        ]
                    });
    
            expect(patternMatcher.match('?????????? ???????????????? ???????? ??????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ???????????????? ????????' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '??????????????????' }),
                    ]
                });
    
            expect(patternMatcher.match('???????????????? ?????????????? 2025 ???????? ?????????? ?? ??????????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '???????????????? ?????????????? 2025 ????????' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????? ?? ??????????????????????' }),
                    ]
                });
    
            expect(patternMatcher.match('?????????? ?????? ???????????? ?????????????? ????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ?????? ???????????? ??????????????' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '????????????????' }),
                    ]
                });
            
            expect(patternMatcher.match('21 ???????????????? ?? 21:00 ?????????????? ?????? ??????????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '21 ???????????????? ?? 21:00' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????????? ?????? ??????????????????????' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text}; {date:future_date}')
    
            expect(patternMatcher.match('???????????? ????????????????; ??????????????????????', pattern, matchers))
                    .to.deep.eq({
                        fields:  [
                            new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                            new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '??????????????????????' }),
                        ]
                    });
    
            expect(patternMatcher.match('??????????????????; ?????????? ???????????????? ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '??????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ???????????????? ????????' }),
                    ]
                });
    
            expect(patternMatcher.match('?????????? ?? ??????????????????????; ???????????????? ?????????????? 2025 ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????? ?? ??????????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '???????????????? ?????????????? 2025 ????????' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (non-unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text}, {date:future_date}')
    
            expect(patternMatcher.match('???????????? ????????????????, ???????????????? ?? ??????????????, ??????????????????????', pattern, matchers))
                    .to.deep.eq({
                        fields: [
                            new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????, ???????????????? ?? ??????????????' }),
                            new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '??????????????????????' }),
                        ]
                    });
    
            expect(patternMatcher.match('?????????????????? ????????, ????????, ?????????? ???????????????? ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????????????? ????????, ????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ???????????????? ????????' }),
                    ]
                });
    
            expect(patternMatcher.match('?????????? ?? ??????????????????????, ????????????????, ???????????????? ?????????????? 2025 ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????? ?? ??????????????????????, ????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '???????????????? ?????????????? 2025 ????????' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (space separator)', () => {
            const pattern = patternBuilder.build('{reminder:text} {date:future_date}')
    
            expect(patternMatcher.match('???????????? ???????????????? ??????????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '??????????????????????' }),
                    ]
                });
    
            expect(patternMatcher.match('?????????????????? ?????????? ???????????????? ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '??????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ???????????????? ????????' }),
                    ]
                });
    
            expect(patternMatcher.match('?????????? ?? ?????????????????????? ???????????????? ?????????????? 2025 ????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????? ?? ??????????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '???????????????? ?????????????? 2025 ????????' }),
                    ]
                });
            
            expect(patternMatcher.match('?????????? ???????????????? ?????????? ?????? ???????????? ??????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????? ????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ?????? ???????????? ??????????????' }),
                    ]
                });
            
            expect(patternMatcher.match('?????????????? ?????? ?????????????????????? 21 ???????????????? ?? 21:00', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '?????????????? ?????? ??????????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '21 ???????????????? ?? 21:00' }),
                    ]
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[?????????????? ]({reminder:text} {date:future_date}|{date:future_date} {reminder:text})')
    
            expect(patternMatcher.match('?????????????? ???????????? ???????????????? ?????????? ????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ????????????' }),
                    ]
                });
            
            expect(patternMatcher.match('?????????????? ?????????? ???????????? ???????????? ????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '?????????? ????????????' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                    ]
                });
    
            expect(patternMatcher.match('???????????? ?? 16:00 ???????????? ????????????????', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'date', inputType: InputType.FUTURE_DATE, value: '???????????? ?? 16:00' }),
                        new Field({ name: 'reminder', inputType: InputType.TEXT, value: '???????????? ????????????????' }),
                    ]
                });
        });

        it('should match numbers without separators', () => {
            const pattern = patternBuilder.build('buy {kg:number}kg of {item:text}');

            expect(patternMatcher.match('buy 5kg of potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'kg', inputType: InputType.NUMBER, value: '5' }),
                        new Field({ name: 'item', inputType: InputType.TEXT, value: 'potatoes' }),
                    ]
                });
        })

        it('should match any-order operator', () => {
            const pattern = patternBuilder.build('contact {Name:word}<[ {Phone:phone}]|[ {E-mail:email}]>');

            expect(patternMatcher.match('contact Jon', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                    ]
                });

            expect(patternMatcher.match('contact Jon +1234567890', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'Phone', inputType: InputType.PHONE, value: '+1234567890' }),
                    ]
                });

            expect(patternMatcher.match('contact Jon jon.snow@example.com', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'E-mail', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                    ]
                });

            expect(patternMatcher.match('contact Jon +1234567890 jon.snow@example.com', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'Phone', inputType: InputType.PHONE, value: '+1234567890' }),
                        new Field({ name: 'E-mail', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                    ]
                });

            expect(patternMatcher.match('contact Jon jon.snow@example.com +1234567890', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Name', inputType: InputType.WORD, value: 'Jon' }),
                        new Field({ name: 'E-mail', inputType: InputType.EMAIL, value: 'jon.snow@example.com' }),
                        new Field({ name: 'Phone', inputType: InputType.PHONE, value: '+1234567890' }),
                    ]
                });
        });

        it('should match variables with custom matchers', () => {
            const pattern = patternBuilder.build('buy [{Amount:number} {Unit:(kg|g|pcs)} of ]{Item:text}');

            expect(patternMatcher.match('buy fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });

            expect(patternMatcher.match('buy 5 kg of fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.NUMBER, value: '5' }),
                        new Field({ name: 'Unit', inputType: InputType.MATCH, value: 'kg' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });
        });

        it('should match variables with complex custom matchers', () => {
            const pattern = patternBuilder.build('Buy [{Amount:{:number}[ ][(kg|g|pcs)]}[ of] ]{Item:text}');

            expect(patternMatcher.match('buy fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });

            expect(patternMatcher.match('buy 5 fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.MATCH, value: '5' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });
            
            expect(patternMatcher.match('buy 5 kg of Fresh Potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.MATCH, value: '5 kg' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'Fresh Potatoes' }),
                    ]
                });
            
            expect(patternMatcher.match('BUY 100g of fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.MATCH, value: '100g' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });
            
            expect(patternMatcher.match('buy 123 pcs OF fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.MATCH, value: '123 pcs' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });
            
            
            expect(patternMatcher.match('Buy 123 PCS of Fresh potatoes', pattern, matchers, { returnCombination: true }))
                .to.deep.eq({
                    combination: [
                        { type: TokenType.TEXT, value: 'Buy ' },
                        { type: TokenType.VARIABLE, value: 'Amount', inputType: InputType.MATCH, match: [
                            { type: TokenType.VARIABLE, inputType: InputType.NUMBER },
                            { type: TokenType.OPTIONAL, value: [
                                { type: TokenType.TEXT, value: ' ' },
                            ] },
                            { type: TokenType.OPTIONAL, value: [
                                { type: TokenType.VARIATIONAL, value: [
                                    [{ type: TokenType.TEXT, value: 'kg' }],
                                    [{ type: TokenType.TEXT, value: 'g' }],
                                    [{ type: TokenType.TEXT, value: 'pcs' }],
                                ] },
                            ] },
                        ] },
                        { type: TokenType.TEXT, value: ' of ' },
                        { type: TokenType.VARIABLE, value: 'Item', inputType: InputType.TEXT },
                    ],
                    fields: [
                        new Field({ name: 'Amount', inputType: InputType.MATCH, value: '123 PCS' }),
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'Fresh potatoes' }),
                    ]
                });
        });

        it('should match simple variables with custom matchers', () => {
            const pattern = patternBuilder.build('{a:{:number}[ a]} {b:text}');

            expect(patternMatcher.match('123 a b', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'a', inputType: InputType.MATCH, value: '123 a' }),
                        new Field({ name: 'b', inputType: InputType.TEXT, value: 'b' }),
                    ]
                });
        });

        it('should ignore variables without names', () => {
            const pattern = patternBuilder.build('buy {:number} kg of {Item:text}');

            expect(patternMatcher.match('buy 5 kg of fresh potatoes', pattern, matchers))
                .to.deep.eq({
                    fields: [
                        new Field({ name: 'Item', inputType: InputType.TEXT, value: 'fresh potatoes' }),
                    ]
                });
        });
    });
});