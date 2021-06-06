const { expect } = require('chai');
const PatternMatcher = require('../../app/PatternMatcher');
const PatternBuilder = require('../../app/PatternBuilder');
const RussianDateParser = require('../../app/date-parsers/RussianDateParser');
const EntryMatchers = require('../../app/entries/EntryMatchers');

describe('EntryMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {RussianDateParser} */
    let russianDateParser;
    /** @type {EntryMatchers} */
    let entryMatchers;
    /** @type {PatternBuilder} */
    let patternBuilder;

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
        patternMatcher = new PatternMatcher();
        russianDateParser = new RussianDateParser();
        entryMatchers = new EntryMatchers({ dateParser: russianDateParser });
    });

    describe('[notes]', () => {
        it('should match simple pattern', () => {
            const pattern = patternBuilder.build('#{tag:word:select} {note:text:title}');
    
            expect(patternMatcher.match('#ideas Draw fan-art of Haruhi', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        tag: 'ideas',
                        note: 'Draw fan-art of Haruhi'
                    }
                });
            
            expect(patternMatcher.match('#my-ideas Write HTML parser', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        tag: 'my-ideas',
                        note: 'Write HTML parser'
                    }
                });
            
            expect(patternMatcher.match('Write HTML parser', pattern, entryMatchers))
                .to.deep.eq({ match: false });
            
            expect(patternMatcher.match('# Write HTML parser', pattern, entryMatchers))
                .to.deep.eq({ match: false });
        });
    
        it('should separate variables properly', () => {
            const pattern = patternBuilder.build('{note:text:title} #{tag:word:select}');
            
            expect(patternMatcher.match('Draw fan-art of Haruhi #art-ideas', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        tag: 'art-ideas',
                        note: 'Draw fan-art of Haruhi'
                    }
                });
    
            expect(patternMatcher.match('Write an app in Go #my #idea', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        tag: 'idea',
                        note: 'Write an app in Go #my'
                    }
                });
            
            expect(patternMatcher.match('Write an app in Go potatoes #my idea', pattern, entryMatchers))
                .to.deep.eq({ match: false });
        });
    
        it('should separate variables properly in complete sentences', () => {
            const pattern = patternBuilder.build('save {note:text:title} to the {tag:word:select} notes');
    
            expect(patternMatcher.match('Save Pygmalion effect to the idea notes', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'Pygmalion effect',
                        tag: 'idea',
                    }
                });
        });

        it('should override word when repeated (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word:select} ][#{tag:word:select} ][#{tag:word:select} ]{note:text:title}');
    
            expect(patternMatcher.match('my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note'
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-1'
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-2'
                    }
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-3'
                    }
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: '#my-tag-4 my note',
                        tag: 'my-tag-3'
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: '#my-tag-4 #my-tag-5 my note',
                        tag: 'my-tag-3'
                    }
                });
        });
    
        it('should allow matching multiple tags (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word:multi_select} ][#{tag:word:multi_select} ][#{tag:word:multi_select} ]{note:text:title}');
    
            expect(patternMatcher.match('my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note'
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1']
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1', 'my-tag-2']
                    }
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                    }
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: '#my-tag-4 my note',
                        tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                    }
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: '#my-tag-4 #my-tag-5 my note',
                        tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                    }
                });
        });

        it('should override word when repeated (from the end)', () => {
            const pattern = patternBuilder.build('save {note:text:title}[ #{tag:word:select}][ #{tag:word:select}][ #{tag:word:select}]');
    
            expect(patternMatcher.match('Save my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note'
                    }
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-1'
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-2'
                    }
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: 'my-tag-3'
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note #my-tag-1',
                        tag: 'my-tag-4'
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note #my-tag-1 #my-tag-2',
                        tag: 'my-tag-5'
                    }
                });
        });
        
        it('should allow matching multiple tags (from the end)', () => {
            const pattern = patternBuilder.build('save {note:text:title}[ #{tag:word:multi_select}][ #{tag:word:multi_select}][ #{tag:word:multi_select}]');
    
            expect(patternMatcher.match('Save my note', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note'
                    }
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1']
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1', 'my-tag-2']
                    }
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note',
                        tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note #my-tag-1',
                        tag: ['my-tag-2', 'my-tag-3', 'my-tag-4']
                    }
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my note #my-tag-1 #my-tag-2',
                        tag: ['my-tag-3', 'my-tag-4', 'my-tag-5']
                    }
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[[#]{database} ](add|save) {note:text:title}[ to[ the] {tag:word:select}[ notes]]');
    
            for (const input of ['Add my unique idea', 'save my unique idea']) {
                expect(patternMatcher.match(input, pattern, entryMatchers), input)
                    .to.deep.eq({
                        match: true,
                        variables: { note: 'my unique idea' }
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
                expect(patternMatcher.match(input, pattern, entryMatchers), input)
                    .to.deep.eq({
                        match: true,
                        variables: {
                            database: 'shopping',
                            note: 'my unique idea',
                            tag: 'my-ideas',
                        }
                    });
            }
    
            for (const input of [
                'Insert my unique idea to the my-ideas notes',
                'Save', 'Add', 'Addmy unique idea'
            ]) {
                expect(patternMatcher.match(input, pattern, entryMatchers), input)
                    .to.deep.eq({ match: false });
            }
    
            // Special case
            expect(patternMatcher.match('Add my unique idea into the my-ideas notes', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: { note: 'my unique idea into the my-ideas notes' }
                });
        });
    });

    describe('[reminders]', () => {
        it('should match dates properly from the start', () => {
            const pattern = patternBuilder.build('{date:future_date} {reminder:text:title}');
    
            expect(patternMatcher.match('послезавтра купить морковку', pattern, entryMatchers))
                    .to.deep.eq({
                        match: true,
                        variables: {
                            reminder: 'купить морковку',
                            date: 'послезавтра',
                        }
                    });
    
            expect(patternMatcher.match('через тридцать дней позвонить', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'позвонить',
                        date: 'через тридцать дней',
                    }
                });
    
            expect(patternMatcher.match('девятого декабря 2025 года пойти к стоматологу', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти к стоматологу',
                        date: 'девятого декабря 2025 года',
                    }
                });
    
            expect(patternMatcher.match('через три недели вечером пойти погулять', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти погулять',
                        date: 'через три недели вечером',
                    }
                });
            
            expect(patternMatcher.match('21 сентября в 21:00 увидеть это напоминание', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'увидеть это напоминание',
                        date: '21 сентября в 21:00',
                    }
                });
        });
    
        it('should match dates properly from the end (unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title}; {date:future_date}')
    
            expect(patternMatcher.match('купить морковку; послезавтра', pattern, entryMatchers))
                    .to.deep.eq({
                        match: true,
                        variables: {
                            reminder: 'купить морковку',
                            date: 'послезавтра',
                        }
                    });
    
            expect(patternMatcher.match('позвонить; через тридцать дней', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'позвонить',
                        date: 'через тридцать дней',
                    }
                });
    
            expect(patternMatcher.match('пойти к стоматологу; девятого декабря 2025 года', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти к стоматологу',
                        date: 'девятого декабря 2025 года',
                    }
                });
        });
    
        it('should match dates properly from the end (non-unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title}, {date:future_date}')
    
            expect(patternMatcher.match('купить морковку, баклажан и капусту, послезавтра', pattern, entryMatchers))
                    .to.deep.eq({
                        match: true,
                        variables: {
                            reminder: 'купить морковку, баклажан и капусту',
                            date: 'послезавтра',
                        }
                    });
    
            expect(patternMatcher.match('позвонить маме, папе, через тридцать дней', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'позвонить маме, папе',
                        date: 'через тридцать дней',
                    }
                });
    
            expect(patternMatcher.match('пойти к стоматологу, дантисту, девятого декабря 2025 года', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти к стоматологу, дантисту',
                        date: 'девятого декабря 2025 года',
                    }
                });
        });
    
        it('should match dates properly from the end (space separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title} {date:future_date}')
    
            expect(patternMatcher.match('купить морковку послезавтра', pattern, entryMatchers))
                    .to.deep.eq({
                        match: true,
                        variables: {
                            reminder: 'купить морковку',
                            date: 'послезавтра',
                        }
                    });
    
            expect(patternMatcher.match('позвонить через тридцать дней', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'позвонить',
                        date: 'через тридцать дней',
                    }
                });
    
            expect(patternMatcher.match('пойти к стоматологу девятого декабря 2025 года', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти к стоматологу',
                        date: 'девятого декабря 2025 года',
                    }
                });
            
            expect(patternMatcher.match('пойти погулять через три недели вечером', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'пойти погулять',
                        date: 'через три недели вечером',
                    }
                });
            
            expect(patternMatcher.match('увидеть это напоминание 21 сентября в 21:00', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'увидеть это напоминание',
                        date: '21 сентября в 21:00',
                    }
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[напомни ]({reminder:text:title} {date:future_date}|{date:future_date} {reminder:text:title})')
    
            expect(patternMatcher.match('напомни съесть морковку через минуту', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'съесть морковку',
                        date: 'через минуту',
                    }
                });
            
            expect(patternMatcher.match('напомни через минуту съесть морковку', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'съесть морковку',
                        date: 'через минуту',
                    }
                });
    
            expect(patternMatcher.match('завтра в 16:00 съесть морковку', pattern, entryMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'съесть морковку',
                        date: 'завтра в 16:00',
                    }
                });
        }); 
    });
});