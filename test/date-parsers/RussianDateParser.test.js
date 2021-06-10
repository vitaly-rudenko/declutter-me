const { expect } = require('chai');
const sinon = require('sinon');

const RussianDateParser = require('../../app/date-parsers/RussianDateParser');

describe('RussianDateParser', () => {
    /** @type {RussianDateParser} */
    let russianDateParser;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers(utcDate('2020-05-05 10:00').getTime());

        russianDateParser = new RussianDateParser();
    });

    afterEach(() => {
        clock.restore();
    });

    describe('match()', () => {
        describe('[futureOnly]', () => {
            it('should match special cases of absolute dates', () => {
                for (const [input, output] of [
                    ['утром', utcDate('2020-05-06 8:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match absolute times', () => {
                for (const [input, output] of [
                    ['в 9', utcDate('2020-05-06 9:00')],
                    ['в 10', utcDate('2020-05-06 10:00')],
                    ['в 9:45', utcDate('2020-05-06 9:45')],
                    ['в 8 утра', utcDate('2020-05-06 08:00')],
                    ['в 2 ночи', utcDate('2020-05-06 02:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match absolute dates (exact date and month)', () => {
                for (const [input, output] of [
                    ['25 марта', utcDate('2021-03-25 10:00')],
                    ['двадцать третьего января', utcDate('2021-01-23 10:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match absolute dates (exact date of this month)', () => {
                for (const [input, output] of [
                    ['первого числа', utcDate('2020-06-01 10:00')],
                    ['четвертого числа', utcDate('2020-06-04 10:00')],
                    ['пятого числа', utcDate('2020-06-05 10:00')],
                    ['в декабре девяносто девятого года', utcDate('2099-12-05 10:00')],
                    ['в августе девятнадцатого года', utcDate('2119-08-05 10:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });
            
            it('should match absolute dates (exact month)', () => {
                for (const [input, output] of [
                    ['в январе', utcDate('2021-01-05 10:00')],
                    ['в мае', utcDate('2021-05-05 10:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match absolute dates with special time', () => {
                for (const [input, output] of [
                    ['вечером 3 марта', utcDate('2021-03-03 18:00')],
                    ['ночью двадцать третьего января', utcDate('2021-01-24 00:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match dates with time', () => {
                for (const [input, output] of [
                    ['пятого мая в 5:00', utcDate('2021-05-05 05:00')],
                    ['первого января в 1:30', utcDate('2021-01-01 01:30')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it('should match dates with special time', () => {
                for (const [input, output] of [
                    ['тридцать первого января вечером', utcDate('2021-01-31 18:00')],
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.deep.eq(output);
                }
            });

            it.skip('should not parse dates in the past', () => {
                for (const input of [
                    'сейчас',
                    'вчера',
                    'позавчера',
                    'сегодня в 4:05',
                    '01.01.2020 12:30',
                    'первого января этого года',
                    'первого мая 2020 года в 8:00',
                ]) {
                    expect(russianDateParser.parse(input, { futureOnly: true }), input).to.be.null;
                }
            });
        });

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
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
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
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match special cases of absolute dates', () => {
            for (const [input, output] of [
                ['утром', utcDate('2020-05-05 8:00')],
                ['днём', utcDate('2020-05-05 12:00')],
                ['вечером', utcDate('2020-05-05 18:00')],
                ['ночью', utcDate('2020-05-06 0:00')],
                ['завтра', utcDate('2020-05-06 10:00')],
                ['послезавтра', utcDate('2020-05-07 10:00')],
                ['завтра ночью', utcDate('2020-05-07 0:00')],
                ['послезавтра днём', utcDate('2020-05-07 12:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute times', () => {
            for (const [input, output] of [
                ['в 9', utcDate('2020-05-05 9:00')],
                ['в 10', utcDate('2020-05-05 10:00')],
                ['в 11', utcDate('2020-05-05 11:00')],
                ['в 21', utcDate('2020-05-05 21:00')],
                ['в 9:45', utcDate('2020-05-05 9:45')],
                ['в 10:15', utcDate('2020-05-05 10:15')],
                ['в 11:30', utcDate('2020-05-05 11:30')],
                ['в 21:12', utcDate('2020-05-05 21:12')],
                ['в полночь', utcDate('2020-05-06 00:00')],
                ['в час ночи', utcDate('2020-05-05 01:00')],
                ['в 9 вечера', utcDate('2020-05-05 21:00')],
                ['в 9 часов вечера', utcDate('2020-05-05 21:00')],
                ['в 8 утра', utcDate('2020-05-05 08:00')],
                ['в 2 ночи', utcDate('2020-05-05 02:00')],
                ['в 2 часа ночи', utcDate('2020-05-05 02:00')],
                ['в 3 часа дня', utcDate('2020-05-05 15:00')],
                ['в час дня', utcDate('2020-05-05 13:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact date and month)', () => {
            for (const [input, output] of [
                ['9 декабря', utcDate('2020-12-09 10:00')],
                ['3 июля', utcDate('2020-07-03 10:00')],
                ['25 марта', utcDate('2020-03-25 10:00')],
                ['тридцатого ноября', utcDate('2020-11-30 10:00')],
                ['двадцать третьего января', utcDate('2020-01-23 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact date, month and year)', () => {
            for (const [input, output] of [
                ['9 декабря 2027', utcDate('2027-12-09 10:00')],
                ['3 июля 2025 года', utcDate('2025-07-03 10:00')],
                ['25 марта сорок четвертого года', utcDate('2044-03-25 10:00')],
                ['тридцатого ноября 2022 года', utcDate('2022-11-30 10:00')],
                ['двадцать третьего января 2046', utcDate('2046-01-23 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact date of this month)', () => {
            for (const [input, output] of [
                ['первого числа', utcDate('2020-05-01 10:00')],
                ['четвертого числа', utcDate('2020-05-04 10:00')],
                ['пятого числа', utcDate('2020-05-05 10:00')],
                ['девятого числа', utcDate('2020-05-09 10:00')],
                ['тридцатого числа', utcDate('2020-05-30 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact date and year, this month)', () => {
            for (const [input, output] of [
                ['пятого числа 2025 года', utcDate('2025-05-05 10:00')],
                ['девятого числа 2046', utcDate('2046-05-09 10:00')],
                ['тридцатого числа 2022', utcDate('2022-05-30 10:00')],
                ['первого числа 21 года', utcDate('2021-05-01 10:00')],
                ['четвертого числа тридцатого года', utcDate('2030-05-04 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact month)', () => {
            for (const [input, output] of [
                ['в январе', utcDate('2020-01-05 10:00')],
                ['в мае', utcDate('2020-05-05 10:00')],
                ['в июле', utcDate('2020-07-05 10:00')],
                ['в декабре', utcDate('2020-12-05 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates (exact month with year)', () => {
            for (const [input, output] of [
                ['в январе 2022', utcDate('2022-01-05 10:00')],
                ['в январе 73 года', utcDate('1973-01-05 10:00')],
                ['в мае 2025 года', utcDate('2025-05-05 10:00')],
                ['в июле две тысячи двадцать третьего года', utcDate('2023-07-05 10:00')],
                ['в декабре двадцать второго года', utcDate('2022-12-05 10:00')],
                ['в декабре девяносто девятого года', utcDate('1999-12-05 10:00')],
                ['в декабре девятнадцатого года', utcDate('2019-12-05 10:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match absolute dates with special time', () => {
            for (const [input, output] of [
                ['утром 25 декабря', utcDate('2020-12-25 08:00')],
                ['вечером 3 марта', utcDate('2020-03-03 18:00')],
                ['ночью пятого марта двадцать третьего года', utcDate('2023-03-06 00:00')],
                ['днём одиннадцатого июля 2025 года', utcDate('2025-07-11 12:00')],
                ['ночью двадцать третьего января', utcDate('2020-01-24 00:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match dates with time', () => {
            for (const [input, output] of [
                ['9 августа в 19:30', utcDate('2020-08-09 19:30')],
                ['21 сентября в 21:00', utcDate('2020-09-21 21:00')],
                ['двадцать пятого декабря в 00:00', utcDate('2020-12-25 00:00')],
                ['пятого мая в 5:00', utcDate('2020-05-05 05:00')],
                ['первого января в 1:30', utcDate('2020-01-01 01:30')],
                ['через две недели в 8:00', utcDate('2020-05-19 8:00')],
                ['послезавтра в 23:59', utcDate('2020-05-07 23:59')],
                ['сегодня в 0', utcDate('2020-05-05 00:00')],
                ['сегодня в 24', utcDate('2020-05-06 00:00')],
                ['завтра в 0:00', utcDate('2020-05-06 00:00')],
                ['завтра в 24:30', utcDate('2020-05-07 00:30')],
                ['через несколько часов в 15:00', utcDate('2020-05-05 15:00')], // absolute time overrides relative one
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should match dates with special time', () => {
            for (const [input, output] of [
                ['9 августа утром', utcDate('2020-08-09 8:00')],
                ['через три недели вечером', utcDate('2020-05-26 18:00')],
                ['первого декабря днём', utcDate('2020-12-01 12:00')],
                ['тридцать первого декабря утром', utcDate('2020-12-31 08:00')],
                ['тридцать первого декабря днем', utcDate('2020-12-31 12:00')],
                ['тридцать первого января вечером', utcDate('2020-01-31 18:00')],
                ['тридцать первого декабря ночью', utcDate('2021-01-01 00:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it.skip('should parse exact dates', () => {
            for (const [input, output] of [
                ['12.12.2022 12:12', utcDate('2022-12-12 12:12')],
                ['01.01.2001 00:00', utcDate('2001-01-01 00:00')],
                ['3.5.98 9:5', utcDate('1998-05-03 9:05')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        })

        it.skip('should parse dates in the past', () => {
            for (const [input, output] of [
                ['сейчас', utcDate('2020-05-05 10:00')],
                ['вчера', utcDate('2020-05-04 10:00')],
                ['позавчера', utcDate('2020-05-03 10:00')],
                ['сегодня в 4:05', utcDate('2020-05-05 04:05')],
                ['01.01.2020 12:30', utcDate('2020-01-01 12:30')],
                ['третьего февраля этого года', utcDate('2020-02-03 10:00')],
                ['ночью второго марта', utcDate('2020-03-03 00:00')],
                ['первого мая 2020 года в 8:00', utcDate('2020-05-01 08:00')],
            ]) {
                expect(russianDateParser.parse(input), input).to.deep.eq(output);
            }
        });

        it('should return null for invalid dates', () => {
            for (const input of [
                'сентября в 21:00',
                'через NaN недель',
                'через много недель',
                'в 21:60',
                'в 25:20',
                'в 1.5:6.3',
                'через много лет',
                'через 0 минут',
                'через 0 лет',
                'послепослезавтра',
                'в -9 вечера',
                '9 вечера',
                '18:00',
                'в городе',
                'через дорогу',
                '31 февраля',
                'в январе 73',
                'в декабре 15',
                '31 февраля'
            ]) {
                expect(russianDateParser.parse(input), input).to.be.null;
            }
        });
    });

    describe('isValidHours()', () => {
        it('should return false for invalid minutes', () => {
            for (const hours of [
                null,
                undefined,
                '',
                -1,
                -46,
                25,
                26,
                100,
            ]) {
                expect(russianDateParser.isValidHours(hours)).to.be.false
            }
        });
    });

    describe('isValidMinutes()', () => {
        it('should return false for invalid minutes', () => {
            for (const minutes of [
                null,
                undefined,
                '',
                -1,
                -46,
                60,
                61,
                100,
            ]) {
                expect(russianDateParser.isValidMinutes(minutes)).to.be.false
            }
        });
    });

    describe('parseSpecial()', () => {
        it('should return null for invalid special dates', () => {
            for (const date of [
                123,
                { hello: 'world' },
                null,
                undefined,
                ''
            ]) {
                expect(russianDateParser.parseSpecial(date, {})).to.be.null
            }
        });
    });

    describe('parseUnit()', () => {
        it('should return null for invalid units', () => {
            for (const unit of [
                123,
                { hello: 'world' },
                null,
                undefined,
                ''
            ]) {
                expect(russianDateParser.parseUnit(unit)).to.be.null
            }
        });
    });

    describe('parseNumber()', () => {
        it('should parse regular numbers', () => {
            for (const value of ['1', '123', '1000', '156000']) {
                expect(russianDateParser.parseNumber(value), value).to.eq(Number(value));
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
                ['сто семьдесят', 170],
                ['семь тысяч двадцатого', 7020],
                ['восьмидесятого', 80],
                ['тринадцатого', 13],
                ['шестого', 6],
                ['первого', 1],
            ]) {
                expect(russianDateParser.parseNumber(value), value).to.eq(result);
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
                expect(russianDateParser.parseNumber(value), value).to.eq(result);
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
                expect(russianDateParser.parseNumber(value), value).to.be.null;
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
