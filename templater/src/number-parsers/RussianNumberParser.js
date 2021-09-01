/** @type [string[], number][] */
const NUMBER_MATCHERS = [
    [['ноль'], 0],
    [['один', 'одна'], 1],
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
    [['сто', 'сотня', 'сотни', 'сотен'], 100],
    [['двести'], 200],
    [['триста'], 300],
    [['четыреста'], 400],
    [['пятьсот'], 500],
    [['шестьсот'], 600],
    [['семьсот'], 700],
    [['восемьсот'], 800],
    [['девятьсот'], 900],
    [['тысяч', 'тысяча', 'тысячи'], 1000],
    [['миллион', 'миллионов', 'миллиона'], 1000000],
];

export class RussianNumberParser {
    parse(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        if (!Number.isNaN(Number(value))) {
            return Number(value);
        }

        const parts = value.split(' ');

        let sign = 1;
        if (parts[0] === 'минус') {
            sign = -1;
            parts.shift();
        }

        let largestNumber = 0;
        let result = 0;
        let glue = false;

        for (const part of parts) {
            if (part === 'и') {
                glue = true;
                continue;
            }

            let multiplier = 1;
            let match = NUMBER_MATCHERS.find(([values]) => values.includes(part));
            if (!match) {
                if (!part.startsWith('пол')) {
                    return null;
                }

                const shortenedPart = part.slice(3);
                match = NUMBER_MATCHERS.find(([values]) => values.includes(shortenedPart));
                multiplier = 0.5;

                if (!match) {
                    return null;
                }
            }

            const number = Number(match[1]) * multiplier;

            if (number >= largestNumber) {
                if (glue) return null;
                if (result === 0) result = 1;

                result *= number;
                largestNumber = number;
            } else {
                result += number;
            }
        }

        return sign * result;
    }
}
