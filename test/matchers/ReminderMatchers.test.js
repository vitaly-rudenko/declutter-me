const { expect } = require('chai');
const PatternMatcher = require('../../app/PatternMatcher');
const RussianDateParser = require('../../app/date-parsers/RussianDateParser');
const ReminderMatchers = require('../../app/matchers/ReminderMatchers');

describe('ReminderMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {RussianDateParser} */
    let russianDateParser;
    /** @type {ReminderMatcher} */
    let reminderMatchers;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
        russianDateParser = new RussianDateParser();
        reminderMatchers = new ReminderMatchers({
            dateParser: russianDateParser
        });
    });

    it('should match dates properly from the start', () => {
        // {date} {reminder}
        const pattern = [
            { type: 'variable', value: 'date' },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'reminder' },
        ];

        expect(patternMatcher.match('послезавтра купить морковку', pattern, reminderMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'купить морковку',
                        date: 'послезавтра',
                    }
                });

        expect(patternMatcher.match('через тридцать дней позвонить', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'позвонить',
                    date: 'через тридцать дней',
                }
            });

        expect(patternMatcher.match('девятого декабря 2025 года пойти к стоматологу', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти к стоматологу',
                    date: 'девятого декабря 2025 года',
                }
            });

        expect(patternMatcher.match('через три недели вечером пойти погулять', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти погулять',
                    date: 'через три недели вечером',
                }
            });
        
        expect(patternMatcher.match('21 сентября в 21:00 увидеть это напоминание', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'увидеть это напоминание',
                    date: '21 сентября в 21:00',
                }
            });
    });

    it('should match dates properly from the end (unique separator)', () => {
        // {reminder} {date}
        const pattern = [
            { type: 'variable', value: 'reminder' },
            { type: 'text', value: '; ' },
            { type: 'variable', value: 'date' },
        ];

        expect(patternMatcher.match('купить морковку; послезавтра', pattern, reminderMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'купить морковку',
                        date: 'послезавтра',
                    }
                });

        expect(patternMatcher.match('позвонить; через тридцать дней', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'позвонить',
                    date: 'через тридцать дней',
                }
            });

        expect(patternMatcher.match('пойти к стоматологу; девятого декабря 2025 года', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти к стоматологу',
                    date: 'девятого декабря 2025 года',
                }
            });
    });

    it('should match dates properly from the end (non-unique separator)', () => {
        // {reminder} {date}
        const pattern = [
            { type: 'variable', value: 'reminder' },
            { type: 'text', value: ', ' },
            { type: 'variable', value: 'date' },
        ];

        expect(patternMatcher.match('купить морковку, баклажан и капусту, послезавтра', pattern, reminderMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'купить морковку, баклажан и капусту',
                        date: 'послезавтра',
                    }
                });

        expect(patternMatcher.match('позвонить маме, папе, через тридцать дней', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'позвонить маме, папе',
                    date: 'через тридцать дней',
                }
            });

        expect(patternMatcher.match('пойти к стоматологу, дантисту, девятого декабря 2025 года', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти к стоматологу, дантисту',
                    date: 'девятого декабря 2025 года',
                }
            });
    });

    it('should match dates properly from the end (space separator)', () => {
        // {reminder} {date}
        const pattern = [
            { type: 'variable', value: 'reminder' },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'date' },
        ];

        expect(patternMatcher.match('купить морковку послезавтра', pattern, reminderMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        reminder: 'купить морковку',
                        date: 'послезавтра',
                    }
                });

        expect(patternMatcher.match('позвонить через тридцать дней', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'позвонить',
                    date: 'через тридцать дней',
                }
            });

        expect(patternMatcher.match('пойти к стоматологу девятого декабря 2025 года', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти к стоматологу',
                    date: 'девятого декабря 2025 года',
                }
            });
        
        expect(patternMatcher.match('пойти погулять через три недели вечером', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'пойти погулять',
                    date: 'через три недели вечером',
                }
            });
        
        expect(patternMatcher.match('увидеть это напоминание 21 сентября в 21:00', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'увидеть это напоминание',
                    date: '21 сентября в 21:00',
                }
            });
    });

    it('should match complex patterns', () => {
        // [напомни ]({reminder} {date}|{date} {reminder})
        const pattern = [
            { type: 'optional', value: [{ type: 'text', value: 'напомни ' }] },
            { type: 'variational', value: [
                [
                    { type: 'variable', value: 'reminder' },
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: 'date' }
                ], [
                    { type: 'variable', value: 'date' },
                    { type: 'text', value: ' ' },
                    { type: 'variable', value: 'reminder' }
                ],
            ] },
        ];

        expect(patternMatcher.match('напомни съесть морковку через минуту', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'съесть морковку',
                    date: 'через минуту',
                }
            });
        
        expect(patternMatcher.match('напомни через минуту съесть морковку', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'съесть морковку',
                    date: 'через минуту',
                }
            });

        expect(patternMatcher.match('завтра в 16:00 съесть морковку', pattern, reminderMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    reminder: 'съесть морковку',
                    date: 'завтра в 16:00',
                }
            });
    });
});