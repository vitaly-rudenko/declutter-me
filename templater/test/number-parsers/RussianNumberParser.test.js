import { expect } from 'chai';
import { RussianNumberParser } from '../../index.js';

describe('RussianNumberParser', () => {
    /** @type {RussianNumberParser} */
    let russianNumberParser;

    beforeEach(() => {
        russianNumberParser = new RussianNumberParser();
    });

    describe('parse()', () => {
        it('should parse regular numbers', () => {
            for (const value of ['1', '123', '1000', '156000']) {
                expect(russianNumberParser.parse(value), value).to.eq(Number(value));
            }
        });

        it('should parse localized numbers', () => {
            for (const [value, result] of [
                ['один', 1],
                ['два', 2],
                ['пару', 2],
                ['пару тысяч', 2000],
                ['несколько сотен', 300],
                ['тысяча', 1000],
                ['сто одиннадцать тысяч', 111000],
                ['две тысячи сто тридцать три', 2133],
                ['сто двадцать три тысячи', 123000],
                ['сто двадцать три тысячи сто семь', 123107],
                ['двести двадцать семь', 227],
                ['тысяча семь', 1007],
                ['двенадцать', 12],
                ['сто семьдесят', 170],
                ['семь тысяч двадцать', 7020],
                ['восемьдесят', 80],
                ['полторы тысячи', 1500],
                ['шесть', 6],
                ['один', 1],
            ]) {
                expect(russianNumberParser.parse(value), value).to.eq(result);
            }
        });

        it('should parse edge cases', () => {
            for (const [value, result] of [
                ['ноль', 0],
                ['две сотни тысяч', 200000],
                ['тысяча тысяч', 1000000],
                ['две тысячи тысяч одиннадцать', 2000011],
                ['сотня сотен и один', 10001],
            ]) {
                expect(russianNumberParser.parse(value), value).to.eq(result);
            }
        })

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
                'два и три',
                true,
                { hello: 'world' }
            ]) {
                expect(russianNumberParser.parse(value), value).to.be.null;
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
