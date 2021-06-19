const { expect } = require('chai');
const PatternMatcher = require('../../app/PatternMatcher');
const PatternBuilder = require('../../app/PatternBuilder');
const RussianDateParser = require('../../app/date-parsers/RussianDateParser');
const EntryMatchers = require('../../app/entries/EntryMatchers');
const Field = require('../../app/fields/Field');

describe('EntryMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {RussianDateParser} */
    let russianDateParser;
    /** @type {EntryMatchers} */
    let matchers;
    /** @type {PatternBuilder} */
    let patternBuilder;
    let presets = null; // TODO: test presets

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
        patternMatcher = new PatternMatcher();
        russianDateParser = new RussianDateParser();
        matchers = new EntryMatchers({ dateParser: russianDateParser });
    });

    describe('[notes]', () => {
        it('should match simple pattern', () => {
            const pattern = patternBuilder.build('#{tag:word:select} {note:text:title}');
    
            expect(patternMatcher.match('#ideas Draw fan-art of Haruhi', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'ideas' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'Draw fan-art of Haruhi' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-ideas Write HTML parser', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-ideas' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'Write HTML parser' }),
                    ]
                });
            
            expect(patternMatcher.match('Write HTML parser', pattern, { matchers, presets }))
                .to.deep.eq({ match: false });
            
            expect(patternMatcher.match('# Write HTML parser', pattern, { matchers, presets }))
                .to.deep.eq({ match: false });
        });
    
        it('should separate variables properly', () => {
            const pattern = patternBuilder.build('{note:text:title} #{tag:word:select}');
            
            expect(patternMatcher.match('Draw fan-art of Haruhi #art-ideas', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'Draw fan-art of Haruhi' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'art-ideas' }),
                    ]
                });
    
            expect(patternMatcher.match('Write an app in Go #my #idea', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'Write an app in Go #my' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'idea' }),
                    ]
                });
            
            expect(patternMatcher.match('Write an app in Go potatoes #my idea', pattern, { matchers, presets }))
                .to.deep.eq({ match: false });
        });
    
        it('should separate variables properly in complete sentences', () => {
            const pattern = patternBuilder.build('save {note:text:title} to the {tag:word:select} notes');
    
            expect(patternMatcher.match('Save Pygmalion effect to the idea notes', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'Pygmalion effect' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'idea' }),
                    ]
                });
        });

        it('should override word when repeated (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word:select} ][#{tag:word:select} ][#{tag:word:select} ]{note:text:title}');
    
            expect(patternMatcher.match('my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-1' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-2' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-3' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-3' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: '#my-tag-4 my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-3' }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: '#my-tag-4 #my-tag-5 my note' }),
                    ]
                });
        });

        it('should override word when repeated (from the end)', () => {
            const pattern = patternBuilder.build('save {note:text:title}[ #{tag:word:select}][ #{tag:word:select}][ #{tag:word:select}]');
    
            expect(patternMatcher.match('Save my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-1' }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-2' }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-3' }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note #my-tag-1' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-4' }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note #my-tag-1 #my-tag-2' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-tag-5' }),
                    ]
                });
        });
    
        it('should allow matching multiple tags (from the start)', () => {
            const pattern = patternBuilder.build('[#{tag:word:multi_select} ][#{tag:word:multi_select} ][#{tag:word:multi_select} ]{note:text:title}');
    
            expect(patternMatcher.match('my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1'] }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2'] }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
            
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: '#my-tag-4 my note' }),
                    ]
                });
    
            expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: '#my-tag-4 #my-tag-5 my note' }),
                    ]
                });
        });
        
        it('should allow matching multiple tags (from the end)', () => {
            const pattern = patternBuilder.build('save {note:text:title}[ #{tag:word:multi_select}][ #{tag:word:multi_select}][ #{tag:word:multi_select}]');
    
            expect(patternMatcher.match('Save my note', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2'] }),
                    ]
                });
    
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-1', 'my-tag-2', 'my-tag-3'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note #my-tag-1' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-2', 'my-tag-3', 'my-tag-4'] }),
                    ]
                });
            
            expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my note #my-tag-1 #my-tag-2' }),
                        new Field({ name: 'tag', inputType: 'word', outputType: 'multi_select', value: ['my-tag-3', 'my-tag-4', 'my-tag-5'] }),
                    ]
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[[#]{database} ](add|save) {note:text:title}[ to[ the] {tag:word:select}[ notes]]');
    
            for (const input of ['Add my unique idea', 'save my unique idea']) {
                expect(patternMatcher.match(input, pattern, { matchers, presets }), input)
                    .to.deep.eq({
                        match: true,
                        fields: [
                            new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my unique idea' }),
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
                expect(patternMatcher.match(input, pattern, { matchers, presets }), input)
                    .to.deep.eq({
                        match: true,
                        fields: [
                            new Field({ name: 'database', inputType: 'text', outputType: 'title', value: 'shopping' }),
                            new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my unique idea' }),
                            new Field({ name: 'tag', inputType: 'word', outputType: 'select', value: 'my-ideas' }),
                        ]
                    });
            }
    
            for (const input of [
                'Insert my unique idea to the my-ideas notes',
                'Save', 'Add', 'Addmy unique idea'
            ]) {
                expect(patternMatcher.match(input, pattern, { matchers, presets }), input)
                    .to.deep.eq({ match: false });
            }
    
            // Special case
            expect(patternMatcher.match('Add my unique idea into the my-ideas notes', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'note', inputType: 'text', outputType: 'title', value: 'my unique idea into the my-ideas notes' }),
                    ]
                });
        });
    });

    describe('[reminders]', () => {
        it('should match dates properly from the start', () => {
            const pattern = patternBuilder.build('{date:future_date:date} {reminder:text:title}');
    
            expect(patternMatcher.match('послезавтра купить морковку', pattern, { matchers, presets }))
                    .to.deep.eq({
                        match: true,
                        fields: [
                            new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'послезавтра' }),
                            new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'купить морковку' }),
                        ]
                    });
    
            expect(patternMatcher.match('через тридцать дней позвонить', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через тридцать дней' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'позвонить' }),
                    ]
                });
    
            expect(patternMatcher.match('девятого декабря 2025 года пойти к стоматологу', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'девятого декабря 2025 года' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'пойти к стоматологу' }),
                    ]
                });
    
            expect(patternMatcher.match('через три недели вечером погулять', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через три недели вечером' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'погулять' }),
                    ]
                });
            
            expect(patternMatcher.match('21 сентября в 21:00 увидеть это напоминание', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: '21 сентября в 21:00' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'увидеть это напоминание' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title}; {date:future_date:date}')
    
            expect(patternMatcher.match('купить морковку; послезавтра', pattern, { matchers, presets }))
                    .to.deep.eq({
                        match: true,
                        fields:  [
                            new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'купить морковку' }),
                            new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'послезавтра' }),
                        ]
                    });
    
            expect(patternMatcher.match('позвонить; через тридцать дней', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'позвонить' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через тридцать дней' }),
                    ]
                });
    
            expect(patternMatcher.match('пойти к стоматологу; девятого декабря 2025 года', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'пойти к стоматологу' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'девятого декабря 2025 года' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (non-unique separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title}, {date:future_date:date}')
    
            expect(patternMatcher.match('купить морковку, баклажан и капусту, послезавтра', pattern, { matchers, presets }))
                    .to.deep.eq({
                        match: true,
                        fields: [
                            new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'купить морковку, баклажан и капусту' }),
                            new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'послезавтра' }),
                        ]
                    });
    
            expect(patternMatcher.match('позвонить маме, папе, через тридцать дней', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'позвонить маме, папе' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через тридцать дней' }),
                    ]
                });
    
            expect(patternMatcher.match('пойти к стоматологу, дантисту, девятого декабря 2025 года', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'пойти к стоматологу, дантисту' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'девятого декабря 2025 года' }),
                    ]
                });
        });
    
        it('should match dates properly from the end (space separator)', () => {
            const pattern = patternBuilder.build('{reminder:text:title} {date:future_date:date}')
    
            expect(patternMatcher.match('купить морковку послезавтра', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'купить морковку' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'послезавтра' }),
                    ]
                });
    
            expect(patternMatcher.match('позвонить через тридцать дней', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'позвонить' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через тридцать дней' }),
                    ]
                });
    
            expect(patternMatcher.match('пойти к стоматологу девятого декабря 2025 года', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'пойти к стоматологу' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'девятого декабря 2025 года' }),
                    ]
                });
            
            expect(patternMatcher.match('пойти погулять через три недели вечером', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'пойти погулять' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через три недели вечером' }),
                    ]
                });
            
            expect(patternMatcher.match('увидеть это напоминание 21 сентября в 21:00', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'увидеть это напоминание' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: '21 сентября в 21:00' }),
                    ]
                });
        });
    
        it('should match complex patterns', () => {
            const pattern = patternBuilder.build('[напомни ]({reminder:text:title} {date:future_date:date}|{date:future_date:date} {reminder:text:title})')
    
            expect(patternMatcher.match('напомни съесть морковку через минуту', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'съесть морковку' }),
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через минуту' }),
                    ]
                });
            
            expect(patternMatcher.match('напомни через минуту съесть морковку', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'через минуту' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'съесть морковку' }),
                    ]
                });
    
            expect(patternMatcher.match('завтра в 16:00 съесть морковку', pattern, { matchers, presets }))
                .to.deep.eq({
                    match: true,
                    fields: [
                        new Field({ name: 'date', inputType: 'future_date', outputType: 'date', value: 'завтра в 16:00' }),
                        new Field({ name: 'reminder', inputType: 'text', outputType: 'title', value: 'съесть морковку' }),
                    ]
                });
        }); 
    });
});