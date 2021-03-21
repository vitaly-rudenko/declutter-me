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
    [['один', 'одну'], 1],
    [['полтора', 'полторы'], 1.5],
    [['два', 'две', 'пару'], 2],
    [['три', 'несколько'], 3],
    [['четыре'], 4],
    [['пять'], 5],
    [['шесть'], 6],
    [['семь'], 7],
    [['восемь'], 8],
    [['девять'], 9],
    [['десять'], 10],
    [['одиннадцать'], 11],
    [['двенадцать'], 12],
    [['тринадцать'], 13],
    [['четырнадцать'], 14],
    [['пятнадцать'], 15],
    [['шестнадцать'], 16],
    [['семнадцать'], 17],
    [['восемнадцать'], 18],
    [['девятнадцать'], 19],
    [['двадцать'], 20],
    [['тридцать'], 30],
    [['сорок'], 40],
    [['пятьдесят'], 50],
    [['шестьдесят'], 60],
    [['семьдесят'], 70],
    [['восемьдесят'], 80],
    [['девяносто'], 90],
    [['сто', 'сотни', 'сотню', 'сотен'], 100],
    [['двести', 'двести'], 200],
    [['триста'], 300],
    [['четыреста'], 400],
    [['пятьсот'], 500],
    [['шестьсот'], 600],
    [['семьсот'], 700],
    [['восемьсот'], 800],
    [['девятьсот'], 900],
    [['тысяч', 'тысяча', 'тысячи', 'тысячу'], 1000],
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

class RussianDateMatcher {
    match(input) {
        input = input.toLowerCase();

        let amount;
        let date = new Date();
        date.setSeconds(0);
        date.getMilliseconds(0);

        if (input.startsWith('через ')) {
            amount = input.slice('через '.length);
        } else {
            amount = input;
        }

        if (!amount) {
            return null;
        }

        let value, unit;
        if (amount.includes(' ')) {
            const index = amount.lastIndexOf(' ');
            value = this.parseValue(amount.slice(0, index));
            unit = this.parseUnit(amount.slice(index + 1));
        } else {
            value = 1;
            unit = this.parseUnit(amount);
        }
        
        if (value && unit) {
            return this.getRelativeDate(value, unit, date);
        }

        const values = amount.split(' ');

        for (const value of values) {
            date = this.parseSpecial(value, date);
            if (date === null) {
                return null;
            }
        }

        return date;
    }

    /**
     * @param {string} value
     * @param {Date} date
     */
    parseSpecial(value, date) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        const match = SPECIAL_MATCHERS.find(([values]) => values.includes(value));
        if (!match) {
            return null;
        }

        const dateCopy = new Date(date);
        match[1](dateCopy);

        if (dateCopy < date) {
            dateCopy.setDate(dateCopy.getDate() + 1);
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

    parseValue(value) {
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
