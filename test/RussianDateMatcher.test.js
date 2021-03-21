const { expect } = require('chai');
const sinon = require('sinon');

const RussianDateMatcher = require('../app/RussianDateMatcher');

describe('DateMatcher', () => {
    /** @type {RussianDateMatcher} */
    let russianDateMatcher;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers(utcDate('2020-05-05 10:00').getTime());

        russianDateMatcher = new RussianDateMatcher();
    });

    afterEach(() => {
        clock.restore();
    });

    describe('match()', () => {
        it('should match relative dates', () => {
            for (const [input, output] of [
                ['через час', utcDate('2020-05-05 11:00')],
                ['через 1 час', utcDate('2020-05-05 11:00')],
                ['через пару часов', utcDate('2020-05-05 12:00')],
                ['через 2 часа', utcDate('2020-05-05 12:00')],
                ['через несколько часов', utcDate('2020-05-05 13:00')],
                ['через 5 часов', utcDate('2020-05-05 15:00')],
                ['через 24 часа', utcDate('2020-05-06 10:00')],
                ['через минуту', utcDate('2020-05-05 10:01')],
                ['через пару минут', utcDate('2020-05-05 10:02')],
                ['через несколько минут', utcDate('2020-05-05 10:03')],
                ['через 3 минуты', utcDate('2020-05-05 10:03')],
                ['через 5 минут', utcDate('2020-05-05 10:05')],
                ['через 15 минут', utcDate('2020-05-05 10:15')],
                ['через 60 минут', utcDate('2020-05-05 11:00')],
                ['через несколько лет', utcDate('2023-05-05 10:00')],
                ['через двадцать три года', utcDate('2043-05-05 10:00')],
                ['через сто двадцать минут', utcDate('2020-05-05 12:00')],
                ['через несколько недель', utcDate('2020-05-26 10:00')],
                ['через месяц', utcDate('2020-06-05 10:00')],
                ['через неделю', utcDate('2020-05-12 10:00')],
                ['через год', utcDate('2021-05-05 10:00')],
            ]) {
                expect(russianDateMatcher.match(input), input).to.deep.eq(output);
            }
        });

        it('should match non-integer relative dates', () => {
            for (const [input, output] of [
                ['через полчаса', utcDate('2020-05-05 10:30')],
                ['через полгода', utcDate('2020-11-05 10:00')],
                ['через полторы минуты', utcDate('2020-05-05 10:01:30')],
                ['через полтора часа', utcDate('2020-05-05 11:30')],
                ['через полтора дня', utcDate('2020-05-06 22:00')],
                ['через полторы недели', utcDate('2020-05-15 10:00')],
                ['через полтора месяца', utcDate('2020-06-20 10:00')],
                ['через полтора года', utcDate('2021-11-05 10:00')],
            ]) {
                expect(russianDateMatcher.match(input), input).to.deep.eq(output);
            }
        });

        it('should match special cases of absolute dates', () => {
            for (const [input, output] of [
                ['утром', utcDate('2020-05-06 8:00')],
                ['днём', utcDate('2020-05-05 12:00')],
                ['вечером', utcDate('2020-05-05 18:00')],
                ['ночью', utcDate('2020-05-06 0:00')],
                ['завтра', utcDate('2020-05-06 10:00')],
                ['послезавтра', utcDate('2020-05-07 10:00')],
                ['завтра ночью', utcDate('2020-05-07 0:00')],
                ['послезавтра днём', utcDate('2020-05-07 12:00')],
            ]) {
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
                ['сто семьдесят', 170]
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

function utcDate(dateString) {
    const date = new Date(dateString);
    const result = new Date();

    result.setUTCFullYear(date.getFullYear());
    result.setUTCMonth(date.getMonth());
    result.setUTCDate(date.getDate());
    result.setUTCHours(date.getHours());
    result.setUTCMinutes(date.getMinutes());
    result.setUTCSeconds(date.getSeconds());
    result.setUTCMilliseconds(0);

    return result;
}
