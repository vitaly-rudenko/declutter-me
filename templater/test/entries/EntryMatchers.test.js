import { stripIndent } from 'common-tags';
import { expect } from 'chai';
import { PatternMatcher, PatternBuilder, EntryMatchers, Field, InputType } from '../../index.js';
import { TokenType } from '../../src/TokenType.js';

describe('EntryMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {EntryMatchers} */
    let matchers;
    /** @type {PatternBuilder} */
    let patternBuilder;

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
        patternMatcher = new PatternMatcher();
        matchers = new EntryMatchers();
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
                const pattern = patternBuilder.build('[#{database}( |\n)][заметка( |\n)]{заметка:text}[( |\n)#{теги:word}][( |\n)#{теги:word}][( |\n)#{теги:word}]');

                expect(
                    patternMatcher.match(stripIndent`
                        #notes
                        Привет мир.
                        Как дела?
                        #tag1 #tag2
                        #tag3
                    `, pattern, matchers)
                ).to.deep.eq({
                    fields: [
                        new Field({ inputType: InputType.DATABASE, value: 'notes' }),
                        new Field({ name: 'заметка', inputType: InputType.TEXT, value: 'Привет мир.\nКак дела?' }),
                        new Field({ name: 'теги', inputType: InputType.WORD, value: ['tag1', 'tag2', 'tag3'] }),
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
});