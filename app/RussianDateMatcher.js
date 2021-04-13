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

const NUMBER_MATCHERS = [
    [['один', 'одну', 'первого'], 1],
    [['полтора', 'полторы'], 1.5],
    [['два', 'две', 'пару', 'второго'], 2],
    [['три', 'несколько', 'третьего'], 3],
    [['четыре', 'четвертого'], 4],
    [['пять', 'пятого'], 5],
    [['шесть', 'шестого'], 6],
    [['семь', 'седьмого'], 7],
    [['восемь', 'восьмого'], 8],
    [['девять', 'девятого'], 9],
    [['десять', 'десятого'], 10],
    [['одиннадцать', 'одиннадцатого'], 11],
    [['двенадцать', 'двенадцатого'], 12],
    [['тринадцать', 'тринадцатого'], 13],
    [['четырнадцать', 'четырнадцатого'], 14],
    [['пятнадцать', 'пятнадцатого'], 15],
    [['шестнадцать', 'шестнадцатого'], 16],
    [['семнадцать', 'семнадцатого'], 17],
    [['восемнадцать', 'восемнадцатого'], 18],
    [['девятнадцать', 'девятнадцатого'], 19],
    [['двадцать', 'двадцатого'], 20],
    [['тридцать', 'тридцатого'], 30],
    [['сорок', 'сорокового'], 40],
    [['пятьдесят', 'пятьдесятого'], 50],
    [['шестьдесят', 'шестьдесятого'], 60],
    [['семьдесят', 'семидесятого'], 70],
    [['восемьдесят', 'восьмидесятого'], 80],
    [['девяносто', 'девяностого'], 90],
    [['сто', 'сотни', 'сотню', 'сотен'], 100],
    [['двести', 'двести', 'двухсотого'], 200],
    [['триста', 'трехсотого', 'трёхсотого'], 300],
    [['четыреста', 'четырехсотого', 'четырёхсотого'], 400],
    [['пятьсот', 'пятисотого'], 500],
    [['шестьсот', 'шестисотого'], 600],
    [['семьсот', 'семисотого'], 700],
    [['восемьсот', 'восьмисотого'], 800],
    [['девятьсот', 'девятисотого'], 900],
    [['тысяч', 'тысяча', 'тысячи', 'тысячу', 'тысячного'], 1000],
];

/** @type {[string[], (date: Date) => any][]} */
const SPECIAL_MATCHERS = [
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

class RussianDateMatcher {
    match(input) {
        input = input.toLowerCase();

        const date = new Date();
        date.getMilliseconds(0);

        if (input.startsWith('через ')) {
            const updatedInput = input.slice('через '.length);

            let value, unit;
            if (updatedInput.includes(' ')) {
                const index = updatedInput.lastIndexOf(' ');
                value = this.parseNumber(updatedInput.slice(0, index));
                unit = this.parseUnit(updatedInput.slice(index + 1));
            } else {
                value = 1;
                unit = this.parseUnit(updatedInput);
            }
            
            if (value && unit) {
                const result = this.getRelativeDate(value, unit, date);
                if (result) {
                    return result;
                }
            }
        }

        if (input.startsWith('в ')) {
            const updatedInput = input.slice('в '.length);

            const result = this.parseAbsoluteTime(updatedInput, date);
            if (result) {
                return result;
            }
        }

        const parts = input.split(' ');
        let specialDate = new Date(date);

        for (const value of parts) {
            specialDate = this.parseSpecial(value, specialDate);
            if (!specialDate) break;
        }

        if (specialDate) {
            return specialDate;
        }

        return this.parseAbsoluteDate(input, date);
    }

    /**
     * @param {string} input
     * @param {Date} date
     */
    parseAbsoluteDate(input, date) {
        const inputParts = input.split(' ');

        let specialPart = null;
        if (this.parseSpecial(inputParts[0], date)) {
            specialPart = inputParts.shift();
        }

        let yearNumber = date.getUTCFullYear();
        let dateNumber = null;
        let monthIndex = -1;
        if (inputParts[0] === 'в') {
            inputParts.shift();
            
            dateNumber = date.getUTCDate();

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
                monthIndex = date.getUTCMonth();
                if (dateNumber <= date.getUTCDate()) {
                    monthIndex++;
                }
            } else {
                monthIndex = MONTH_MATCHERS.findIndex(matchers => matchers.includes(monthPart));
            }
        }

        if (inputParts.length > 0) {
            if (endsWith(inputParts, 'года')) {
                inputParts.pop();
            }

            yearNumber = this.parseNumber(inputParts.join(' '));
            if (yearNumber === null) {
                return null;
            }
        }

        if (monthIndex === -1) return null;

        if (yearNumber < 100) {
            yearNumber += Math.floor(date.getUTCFullYear() / 1000) * 1000;
        }

        const dateCopy = new Date(date);
        dateCopy.setUTCDate(dateNumber);
        dateCopy.setUTCMonth(monthIndex);
        dateCopy.setUTCFullYear(yearNumber);

        if (dateCopy.getUTCDate() !== dateNumber || dateCopy.getUTCMonth() !== monthIndex) {
            return null;
        }
        
        if (dateCopy <= date) {
            dateCopy.setUTCFullYear(dateCopy.getUTCFullYear() + 1);
        }
        
        if (specialPart !== null) {
            return this.parseSpecial(specialPart, dateCopy, false);
        }

        return dateCopy;
    }

    /**
     * @param {string} input
     * @param {Date} date
     */
    parseAbsoluteTime(input, date) {
        const dateCopy = new Date(date);
        const parts = input.split(' ');

        for (const part of parts) {
            const number = this.parseNumber(part);

            if (number && this.isValidHours(number)) {
                dateCopy.setUTCHours(number);
                continue;
            } 

            if (part.includes(':')) {
                const [rawHours, rawMinutes] = part.split(':');
                const hours = Number(rawHours);
                const minutes = Number(rawMinutes);

                if (
                    !Number.isNaN(hours) &&
                    !Number.isNaN(minutes) &&
                    this.isValidHours(hours) && 
                    this.isValidMinutes(minutes)
                ) {
                    dateCopy.setUTCHours(hours);
                    dateCopy.setUTCMinutes(minutes);
                    continue;
                }
            }

            if (part === 'вечера' && dateCopy.getUTCHours() <= 12) {
                dateCopy.setUTCHours(dateCopy.getUTCHours() + 12);
                continue;
            }

            if (['утра', 'дня', 'ночи'].includes(part)) {
                continue;
            }

            return null;
        }

        if (dateCopy <= date) {
            dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
        }

        return dateCopy;
    }

    isValidHours(hours) {
        return hours >= 0 && hours <= 24;
    }

    isValidMinutes(minutes) {
        return minutes >= 0 && minutes < 60;
    }

    /**
     * @param {string} value
     * @param {Date} date
     * @param {boolean} skipDateIfNecessary
     */
    parseSpecial(value, date, skipDateIfNecessary = true) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const match = SPECIAL_MATCHERS.find(([values]) => values.includes(value));
        if (!match) {
            return null;
        }

        const dateCopy = new Date(date);
        match[1](dateCopy);

        if (skipDateIfNecessary && dateCopy <= date) {
            dateCopy.setUTCDate(dateCopy.getUTCDate() + 1);
        }

        return dateCopy;
    }

    /**
     * @param {number} value
     * @param {string} unit
     * @param {Date} date
     */
    getRelativeDate(value, unit, date) {
        const hasExtraHalf = Math.trunc(value) !== value;
        value = Math.trunc(value);

        switch (unit) {
            case Unit.MINUTE:
                date.setUTCMinutes(date.getUTCMinutes() + value);
                break;
            case Unit.HALF_HOUR:
                date.setUTCMinutes(date.getUTCMinutes() + 30);
                break;
            case Unit.HOUR:
                date.setUTCHours(date.getUTCHours() + value);
                break;
            case Unit.DAY:
                date.setUTCDate(date.getUTCDate() + value);
                break;
            case Unit.WEEK:
                date.setUTCDate(date.getUTCDate() + value * 7);
                break;
            case Unit.MONTH:
                date.setUTCMonth(date.getUTCMonth() + value);
                break;
            case Unit.HALF_YEAR:
                date.setUTCMonth(date.getUTCMonth() + 6);
                break;
            case Unit.YEAR:
                date.setUTCFullYear(date.getUTCFullYear() + value);
                break;
        }

        if (hasExtraHalf) {
            switch (unit) {
                case Unit.MINUTE:
                    date.setUTCSeconds(date.getUTCSeconds() + 30);
                    break;
                case Unit.HOUR:
                    date.setUTCMinutes(date.getUTCMinutes() + 30);
                    break;
                case Unit.DAY:
                    date.setUTCHours(date.getUTCHours() + 12);
                    break;
                case Unit.WEEK:
                    date.setUTCDate(date.getUTCDate() + 3);
                    break;
                case Unit.MONTH:
                    date.setUTCDate(date.getUTCDate() + 15);
                    break;
                case Unit.YEAR:
                    date.setUTCMonth(date.getUTCMonth() + 6);
                    break;
            }
        }

        return date;
    }

    parseUnit(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const match = UNIT_MATCHERS.find(([values]) => values.includes(value));
        if (!match) {
            return null;
        }

        return match[1];
    }

    parseNumber(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        if (!Number.isNaN(Number(value))) {
            return Number(value);
        }

        const parts = value.split(' ');

        let result = 0;
        let multiplier = 0;
        let reduced = false;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[parts.length - i - 1];

            const match = NUMBER_MATCHERS.find(([values]) => values.includes(part));
            if (!match) {
                return null;
            }

            const number = match[1];

            if (multiplier > number) {
                if (!reduced) {
                    result -= multiplier;
                    reduced = true;
                }
                result += number * multiplier;
            } else {
                result += number;
                multiplier = number;
                reduced = false;
            }
        }

        return result;
    }
}

module.exports = RussianDateMatcher;
