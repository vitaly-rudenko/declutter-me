/** @type [string[], number][] */
const NUMBER_MATCHERS = [
    [['zero'], 0],
    [['half'], 0.5],
    [['one'], 1],
    [['two'], 2],
    [['three'], 3],
    [['four'], 4],
    [['five'], 5],
    [['six'], 6],
    [['seven'], 7],
    [['eight'], 8],
    [['nine'], 9],
    [['ten'], 10],
    [['eleven'], 11],
    [['twelve'], 12],
    [['thirteen'], 13],
    [['fourteen'], 14],
    [['fifteen'], 15],
    [['sixteen'], 16],
    [['seventeen'], 17],
    [['eighteen'], 18],
    [['nineteen'], 19],
    [['twenty'], 20],
    [['thirty'], 30],
    [['forty'], 40],
    [['fifty'], 50],
    [['sixty'], 60],
    [['seventy'], 70],
    [['eighty'], 80],
    [['ninety'], 90],
    [['hundred', 'hundreds'], 100],
    [['thousand', 'thousands'], 1000],
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
        if (parts[0] === 'minus' || parts[0] === 'negative') {
            sign = -1;
            parts.shift();
        }

        let largestNumber = 0;
        let result = 0;
        let glue = false;

        for (const part of parts) {
            if (part === 'a') continue;

            if (part === 'and') {
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
