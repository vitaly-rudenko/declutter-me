import { RussianNumberParser } from '../number-parsers/RussianNumberParser.js';

const Unit = {
    SECOND: 'second',
    MINUTE: 'minute',
    HALF_HOUR: 'halfHour',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
    HALF_YEAR: 'halfYear',
};

const UNIT_MATCHERS = [
    [['минута', 'минуту', 'минут', 'минуты'], Unit.MINUTE],
    [['полчаса'], Unit.HALF_HOUR],
    [['час', 'часов', 'часа'], Unit.HOUR],
    [['день', 'дня', 'дней'], Unit.DAY],
    [['неделя', 'неделю', 'недели', 'недель'], Unit.WEEK],
    [['месяц', 'месяца', 'месяцев'], Unit.MONTH],
    [['лет', 'год', 'года'], Unit.YEAR],
    [['полгода'], Unit.HALF_YEAR],
];

/** @type {[string[], (date: Date) => any][]} */
const SPECIAL_MATCHERS = [
    // [['сейчас'], () => {}],
    [['сегодня'], () => {}],
    // [['вчера'], date => date.setUTCDate(date.getUTCDate() - 1)],
    // [['позавчера'], date => date.setUTCDate(date.getUTCDate() - 2)],
    [['завтра'], date => date.setUTCDate(date.getUTCDate() + 1)],
    [['послезавтра'], date => date.setUTCDate(date.getUTCDate() + 2)],
    [['утром'], date => date.setUTCHours(8, 0, 0, 0)],
    [['днем', 'днём'], date => date.setUTCHours(12, 0, 0, 0)],
    [['вечером'], date => date.setUTCHours(18, 0, 0, 0)],
    [['ночью'], date => {
        date.setUTCDate(date.getUTCDate() + 1);
        date.setUTCHours(0, 0, 0, 0);
    }],
];

const MONTH_MATCHERS = [
    ['январь', 'января', 'январе'],
    ['февраль', 'февраля', 'феврале'],
    ['март', 'марта', 'марте'],
    ['апрель', 'апреля', 'апреле'],
    ['май', 'мая', 'мае'],
    ['июнь', 'июня', 'июне'],
    ['июль', 'июля', 'июле'],
    ['август', 'августа', 'августе'],
    ['сентябрь', 'сентября', 'сентябре'],
    ['октябрь', 'октября', 'октябре'],
    ['ноябрь', 'ноября', 'ноябре'],
    ['декабрь', 'декабря', 'декабре'],
];

function endsWith(array, item) {
    return array[array.length - 1] === item;
}

export class RussianDateParser {
    /**
     * @param {string} input
     * @param {{ origin?: Date, futureOnly?: boolean }} [options]
     */
    parse(input, { origin = null, futureOnly = false } = {}) {
        input = input.toLowerCase();

        if (!origin) {
            origin = new Date();
            origin.setMilliseconds(0);
        }

        return (
            this.parseRelativeDate(input, { origin }) ||
            this.parseAbsoluteTime(input, { origin, futureOnly }) ||
            this.parseSpecialDateTime(input, { origin, futureOnly }) ||
            this.parseAbsoluteDate(input, { origin, futureOnly }) ||
            this.parseDateTime(input, { origin, futureOnly }) ||
            this.parseDateWithSpecialTime(input, { origin, futureOnly })
        );
    }

    /**
     * @param {string} input
     * @param {{ origin: Date }} params
     */
    parseRelativeDate(input, { origin }) {
        if (!input.startsWith('через ')) return null;
        input = input.slice('через '.length);

        let value, unit;
        if (input.includes(' ')) {
            const index = input.lastIndexOf(' ');
            value = this.parseNumber(input.slice(0, index));
            unit = this.parseUnit(input.slice(index + 1));
        } else {
            value = 1;
            unit = this.parseUnit(input);
        }
        
        if (value && unit) {
            return this._getRelativeDate({ value, unit, origin });
        }

        return null;
    }

    /** @param {{ value: number, unit: string, origin: Date }} params */
    _getRelativeDate({ value, unit, origin }) {
        const dateCopy = new Date(origin);

        const hasExtraHalf = Math.trunc(value) !== value;
        value = Math.trunc(value);

        switch (unit) {
            case Unit.MINUTE:
                dateCopy.setUTCMinutes(origin.getUTCMinutes() + value);
                break;
            case Unit.HALF_HOUR:
                dateCopy.setUTCMinutes(origin.getUTCMinutes() + 30);
                break;
            case Unit.HOUR:
                dateCopy.setUTCHours(origin.getUTCHours() + value);
                break;
            case Unit.DAY:
                dateCopy.setUTCDate(origin.getUTCDate() + value);
                break;
            case Unit.WEEK:
                dateCopy.setUTCDate(origin.getUTCDate() + value * 7);
                break;
            case Unit.MONTH:
                dateCopy.setUTCMonth(origin.getUTCMonth() + value);
                break;
            case Unit.HALF_YEAR:
                dateCopy.setUTCMonth(origin.getUTCMonth() + 6);
                break;
            case Unit.YEAR:
                dateCopy.setUTCFullYear(origin.getUTCFullYear() + value);
                break;
            default:
                break;
        }

        if (hasExtraHalf) {
            switch (unit) {
                case Unit.MINUTE:
                    dateCopy.setUTCSeconds(dateCopy.getUTCSeconds() + 30);
                    break;
                case Unit.HOUR:
                    dateCopy.setUTCMinutes(dateCopy.getUTCMinutes() + 30);
                    break;
                case Unit.DAY:
                    dateCopy.setUTCHours(dateCopy.getUTCHours() + 12);
                    break;
                case Unit.WEEK:
                    dateCopy.setUTCDate(dateCopy.getUTCDate() + 3);
                    break;
                case Unit.MONTH:
                    dateCopy.setUTCDate(dateCopy.getUTCDate() + 15);
                    break;
                case Unit.YEAR:
                    dateCopy.setUTCMonth(dateCopy.getUTCMonth() + 6);
                    break;
                default:
                    break;
            }
        }

        return dateCopy;
    }

    /**
     * @param {string} input
     * @param {{ origin: Date, futureOnly: boolean }} params
     */
    parseAbsoluteTime(input, { origin, futureOnly }) {
        if (!input.startsWith('в ')) return null;
        input = input.slice('в '.length);

        const dateCopy = new Date(origin);
        const parts = input.split(' ');

        for (const part of parts) {
            const number = this.parseNumber(part);

            if (this.isValidHours(number)) {
                if (number === 24) {
                    dateCopy.setUTCHours(0);
                    dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
                } else {
                    dateCopy.setUTCHours(number);
                }
                dateCopy.setUTCMinutes(0);
                continue;
            } 

            if (part.includes(':')) {
                const [rawHours, rawMinutes] = part.split(':');
                const hours = Number(rawHours);
                const minutes = Number(rawMinutes);

                if (this.isValidHours(hours) && this.isValidMinutes(minutes)) {
                    if (hours === 24) {
                        dateCopy.setUTCHours(0);
                        dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
                    } else {
                        dateCopy.setUTCHours(hours);
                    }
                    dateCopy.setUTCMinutes(minutes);
                    continue;
                }
            }

            if (['дня', 'вечера'].includes(part) && dateCopy.getUTCHours() <= 12) {
                dateCopy.setUTCHours(dateCopy.getUTCHours() + 12);
                continue;
            }

            if (part === 'полночь') {
                dateCopy.setUTCHours(0);
                dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
                continue;
            }

            if (part === 'час') {
                dateCopy.setUTCHours(1);
                continue;
            }

            if (['часа', 'часов'].includes(part) || ['утра', 'ночи'].includes(part)) {
                continue;
            }

            return null;
        }

        if (futureOnly && dateCopy <= origin) {
            dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
        }

        return dateCopy;
    }

    isValidHours(hours) {
        return Number.isSafeInteger(hours) && hours >= 0 && hours <= 24;
    }

    isValidMinutes(minutes) {
        return Number.isSafeInteger(minutes) && minutes >= 0 && minutes < 60;
    }

    /**
     * @param {string} input
     * @param {{ origin: Date, futureOnly: boolean }} params
     */
    parseSpecialDateTime(input, { origin, futureOnly }) {
        const parts = input.split(' ');
        let specialDate = new Date(origin);

        for (const value of parts) {
            specialDate = this.parseSpecial(value, { origin: specialDate, futureOnly, skipDateIfNecessary: true });
            if (!specialDate) break;
        }

        return specialDate;
    }

    /**
     * @param {string} input
     * @param {{ origin: Date, futureOnly: boolean }} params
     */
    parseAbsoluteDate(input, { origin, futureOnly }) {
        const inputParts = input.split(' ');

        let specialPart = null;
        if (this.parseSpecial(inputParts[0], { origin, futureOnly, skipDateIfNecessary: true })) {
            specialPart = inputParts.shift();
        }

        let yearNumber = origin.getUTCFullYear();
        let dateNumber = null;
        let monthIndex = -1;
        if (inputParts[0] === 'в') {
            inputParts.shift();
            
            dateNumber = origin.getUTCDate();

            const monthPart = inputParts.shift();
            monthIndex = MONTH_MATCHERS.findIndex(matchers => matchers.includes(monthPart));
        } else {
            let datePart = inputParts.shift();

            while(inputParts.length > 0) {
                const part = inputParts[0];
                dateNumber = this.parseNumber(datePart + ' ' + part);
                if (dateNumber === null) break;

                datePart = datePart + ' ' + inputParts.shift();
            }

            const monthPart = inputParts.shift();

            dateNumber = this.parseNumber(datePart);
            if (dateNumber === null) return null;

            if (monthPart === 'числа') {
                monthIndex = origin.getUTCMonth();
                if (futureOnly && dateNumber <= origin.getUTCDate()) {
                    monthIndex++;
                }
            } else {
                monthIndex = MONTH_MATCHERS.findIndex(matchers => matchers.includes(monthPart));
            }
        }

        let hasYearPart = false;
        let customYear = false;

        if (inputParts.length > 0) {
            if (endsWith(inputParts, 'года')) {
                hasYearPart = true;
                inputParts.pop();
            }

            yearNumber = this.parseNumber(inputParts.join(' '));
            if (yearNumber === null) {
                return null;
            }

            customYear = true;
        }

        if (monthIndex === -1) return null;

        if (yearNumber < 100) {
            if (!hasYearPart) return null;

            if (yearNumber >= 70) {
                yearNumber += 1900;
            } else {
                yearNumber += 2000;
            }
        }

        const dateCopy = new Date(origin);
        dateCopy.setUTCDate(dateNumber);
        dateCopy.setUTCMonth(monthIndex);
        dateCopy.setUTCFullYear(yearNumber);

        if (dateCopy.getUTCDate() !== dateNumber || dateCopy.getUTCMonth() !== monthIndex) {
            return null;
        }
        
        if (futureOnly && dateCopy <= origin) {
            if (customYear) {
                while(dateCopy <= origin) {
                    dateCopy.setUTCFullYear(dateCopy.getUTCFullYear() + 100);
                }
            } else {
                dateCopy.setUTCFullYear(dateCopy.getUTCFullYear() + 1);
            }
        }
        
        if (specialPart !== null) {
            return this.parseSpecial(specialPart, { origin: dateCopy, futureOnly, skipDateIfNecessary: false });
        }

        return dateCopy;
    }

    /**
     * @param {string} value
     * @param {{ origin: Date, futureOnly: boolean, skipDateIfNecessary: boolean }} params
     */
    parseSpecial(value, { origin, futureOnly, skipDateIfNecessary }) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const match = SPECIAL_MATCHERS.find(([values]) => values.includes(value));
        if (!match) {
            return null;
        }

        const [, transformDate] = match;

        const dateCopy = new Date(origin);
        transformDate(dateCopy);

        if (futureOnly && dateCopy <= origin) {
            if (skipDateIfNecessary) {
                dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
            }
        }

        return dateCopy;
    }

    /**
     * @param {string} input
     * @param {{ origin: Date, futureOnly: boolean }} params
     */
    parseDateTime(input, { origin, futureOnly }) {
        const inputParts = input.split(' в ');
        if (inputParts.length !== 2) {
            return null;
        }

        const [rawDate, rawTime] = inputParts;
        const time = this.parse('в ' + rawTime, { origin, futureOnly });
        const date = this.parse(rawDate, { origin: time, futureOnly });

        if (date && time) {
            return this._combineDateAndTime(date, time);
        }

        return null;
    }

    /**
     * @param {Date} date
     * @param {Date} time
     */
    _combineDateAndTime(date, time) {
        return new Date(Date.UTC(
            date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
            time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), time.getUTCMilliseconds()
        ));
    }

    /**
     * @param {string} input
     * @param {{ origin: Date, futureOnly: boolean }} params
     */
    parseDateWithSpecialTime(input, { origin, futureOnly }) {
        const indexOf = input.lastIndexOf(' ');
        if (indexOf === -1) return null;

        const [rawDate, rawTime] = [input.slice(0, indexOf), input.slice(indexOf + 1)];

        const date = this.parse(rawDate, { origin, futureOnly });
        if (!date) return null;
        date.setUTCHours(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);
        date.setUTCMilliseconds(0);

        const time = this.parseSpecial(rawTime, { origin: date, futureOnly, skipDateIfNecessary: true });
        return time;
    }

    parseUnit(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const match = UNIT_MATCHERS.find(([values]) => values.includes(value));
        if (!match) {
            return null;
        }

        return Array.isArray(match[1]) ? match[1][0] : match[1];
    }

    parseNumber(value) {
        return new RussianNumberParser().parse(value);
    }
}
