/** @type [string[], number][] */
const NUMBER_MATCHERS = [
    [['нуль'], 0],
    [['один', 'одна'], 1],
    [['півтори', 'півтора'], 1.5],
    [['два', 'дві', 'пару'], 2],
    [['три', 'кілька'], 3],
    [['чотири'], 4],
    [['п\'ять'], 5],
    [['шість'], 6],
    [['сім'], 7],
    [['вісім'], 8],
    [['дев\'ять'], 9],
    [['десять'], 10],
    [['одинадцять'], 11],
    [['дванадцять'], 12],
    [['тринадцять'], 13],
    [['чотирнадцять'], 14],
    [['п\'ятнадцять'], 15],
    [['шістнадцять'], 16],
    [['сімнадцять'], 17],
    [['вісімнадцять'], 18],
    [['дев\'ятнадцять'], 19],
    [['двадцять'], 20],
    [['тридцять'], 30],
    [['сорок'], 40],
    [['п\'ятдесят'], 50],
    [['шістдесят'], 60],
    [['сімдесят'], 70],
    [['вісімдесят'], 80],
    [['дев\'яносто'], 90],
    [['сто', 'сотня', 'сотні'], 100],
    [['двісті'], 200],
    [['триста'], 300],
    [['чотириста'], 400],
    [['п\'ятсот'], 500],
    [['шість сотень'], 600],
    [['сімсот'], 700],
    [['вісімсот'], 800],
    [['дев\'ятьсот'], 900],
    [['тисяч', 'тисяча', 'тисячі'], 1000],
];

export class UkrainianNumberParser {
    parse(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return null;
        }

        if (!Number.isNaN(Number(value))) {
            return Number(value);
        }

        const parts = value.split(' ');

        let sign = 1;
        if (parts[0] === 'мінус') {
            sign = -1;
            parts.shift();
        }

        let largestNumber = 0;
        let result = 0;
        let glue = false;

        for (const part of parts) {
            if (part === 'і' || part === 'й' || part === 'та') {
                glue = true;
                continue;
            }

            const match = NUMBER_MATCHERS.find(([values]) => values.includes(part));
            if (!match) {
                return null;
            }

            const number = Number(match[1]);

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
