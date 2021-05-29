class ReminderMatchers {
    constructor({ dateMatcher }) {
        this._dateMatcher = dateMatcher;

        this.reminder = this.reminder.bind(this);
        this.date = this.date.bind(this);
    }

    reminder(input, { nextTokens: [nextToken] }) {
        if (!nextToken) {
            return input;
        }

        let lastDate = null;
        let startIndex = input.length;

        while (startIndex > 0) {
            startIndex = input.lastIndexOf(' ', startIndex - 1);
            if (startIndex === -1) startIndex = 0;

            const date = input.slice(startIndex + 1);
            if (this._dateMatcher.match(date)) {
                lastDate = date;
            }
        }

        if (lastDate) {
            input = input.slice(0, input.length - lastDate.length);

            if (nextToken.type === 'text') {
                input = input.slice(0, input.length - nextToken.value.length);
            }
        }

        return input;
    }

    date(input) {
        let lastDate = null;
        let endIndex = 0;

        while (endIndex < input.length) {
            endIndex = input.indexOf(' ', endIndex + 1);
            if (endIndex === -1) endIndex = input.length;

            const date = input.slice(0, endIndex);
            if (this._dateMatcher.match(date)) {
                lastDate = date;
            }
        }

        return lastDate;
    }
}

module.exports = ReminderMatchers;
