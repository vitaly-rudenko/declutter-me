const { expect } = require('chai');
const PatternMatcher = require('../app/PatternMatcher');
const RussianDateMatcher = require('../app/RussianDateMatcher');
const ReminderMatchers = require('../app/ReminderMatchers');

describe('ReminderMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {RussianDateMatcher} */
    let russianDateMatcher;
    /** @type {ReminderMatcher} */
    let reminderMatchers;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
        russianDateMatcher = new RussianDateMatcher();
        reminderMatchers = new ReminderMatchers({
            dateMatcher: russianDateMatcher
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
    });

    it('should match dates properly from the start (unique separator)', () => {
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

    it('should match dates properly from the start (non-unique separator)', () => {
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

    it('should match dates properly from the start (space separator)', () => {
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
    });
});