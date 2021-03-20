const { expect } = require('chai');
const sinon = require('sinon');

const RussianDateMatcher = require('../app/RussianDateMatcher');

describe('DateMatcher', () => {
    /** @type {RussianDateMatcher} */
    let russianDateMatcher;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers(Date.parse('2020-05-05 10:00'));

        russianDateMatcher = new RussianDateMatcher();
    });

    afterEach(() => {
        clock.restore();
    });


    describe('match()', () => {
        it('should match simple relative dates', () => {
            const expectations = [
                ['через час', new Date('2020-05-05 11:00')],
                ['через 1 час', new Date('2020-05-05 11:00')],
                ['через пару часов', new Date('2020-05-05 12:00')],
                ['через 2 часа', new Date('2020-05-05 12:00')],
                ['через несколько часов', new Date('2020-05-05 13:00')],
                ['через 5 часов', new Date('2020-05-05 15:00')],
                ['через 24 часа', new Date('2020-05-06 10:00')],
                ['через минуту', new Date('2020-05-05 10:01')],
                ['через пару минут', new Date('2020-05-05 10:02')],
                ['через несколько минут', new Date('2020-05-05 10:03')],
                ['через 3 минуты', new Date('2020-05-05 10:03')],
                ['через 5 минут', new Date('2020-05-05 10:05')],
                ['через 15 минут', new Date('2020-05-05 10:15')],
                ['через 60 минут', new Date('2020-05-05 11:00')],
                ['через несколько лет', new Date('2023-05-05 10:00')],
                ['через двадцать три года', new Date('2043-05-05 10:00')],
                ['через сто двадцать минут', new Date('2020-05-05 12:00')],
                ['через месяц', new Date('2020-06-05 10:00')],
                ['через год', new Date('2021-05-05 10:00')],
                ['через полгода', new Date('2020-11-05 10:00')],
            ];

            for (const [input, output] of expectations) {
                expect(russianDateMatcher.match(input), input).to.deep.eq(output);
            }
        });
    });

    describe('parseValue()', () => {
        it('should parse regular numbers', () => {
            for (const value of ['1', '123', '1000', '156000']) {
                expect(russianDateMatcher.parseValue(value), value).to.eq(Number(value));
            }
        });

        it('should parse localized numbers', () => {
            for (const [value, result] of [
                ['один', 1],
                ['два', 2],
                ['пару', 2],
                ['пару тысяч', 2000],
                ['несколько сотен', 300],
                ['тысячу', 1000],
                ['сто одиннадцать тысяч', 111000],
                ['две тысячи сто тридцать три', 2133],
                ['сто двадцать три тысячи', 123000],
                ['сто двадцать три тысячи сто семь', 123107],
                ['двести двадцать семь', 227],
                ['тысяча семь', 1007],
                ['двенадцать', 12],
            ]) {
                expect(russianDateMatcher.parseValue(value), value).to.eq(result);
            }
        });

        it('should return null for invalid or non-numbers', () => {
            for (const value of [
                '',
                'адын',
                'много',
                'сто мильёнов',
                'миллион',
                'трыцтры',
                '123abc',
                '1 2 3',
                true,
                { hello: 'world' }
            ]) {
                expect(russianDateMatcher.parseValue(value), value).to.be.null;
            }
        });
    });
});
