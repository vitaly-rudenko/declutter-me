const Unit = {
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
    HALF_YEAR: 'half-year',
};

const UNIT_MATCHERS = [
    [['минута', 'минуту', 'минут', 'минуты'], Unit.MINUTE],
    [['час', 'часов', 'часа'], Unit.HOUR],
    [['день', 'дня', 'дней'], Unit.DAY],
    [['неделя', 'неделю', 'недели'], Unit.WEEK],
    [['месяц', 'месяца', 'месяцев'], Unit.MONTH],
    [['лет', 'год', 'года'], Unit.YEAR],
    [['полгода'], Unit.HALF_YEAR],
];

const NUMBER_MATCHERS = [
    [['один', 'одну'], 1],
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

class RussianDateMatcher {
    match(input) {
        input = input.toLowerCase();

        let amount;

        if (input.startsWith('через ')) {
            amount = input.slice('через '.length);
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
        
        if (!value || !unit) {
            return null;
        }

        return this.getRelativeDate(value, unit);
    }

    getRelativeDate(value, unit) {
        const date = new Date();

        switch (unit) {
            case Unit.MINUTE:
                date.setMinutes(date.getMinutes() + value);
                break;
            case Unit.HOUR:
                date.setHours(date.getHours() + value);
                break;
            case Unit.DAY:
                date.setDate(date.getDate() + value);
                break;
            case Unit.WEEK:
                date.setDate(date.getDate() + value * 7);
                break;
            case Unit.MONTH:
                date.setMonth(date.getMonth() + value);
                break;
            case Unit.YEAR:
                date.setFullYear(date.getFullYear() + value);
                break;
            case Unit.HALF_YEAR:
                date.setMonth(date.getMonth() + 6);
                break;
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
