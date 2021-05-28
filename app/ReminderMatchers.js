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

        const inputParts = input.split(' ');
        const dateParts = [];
        let wasDate = false;

        while (inputParts.length > 0) {
            dateParts.unshift(inputParts.pop());

            if (this._dateMatcher.match(dateParts.join(' '))) {
                wasDate = true;
            } else if (wasDate) {
                inputParts.push(dateParts.shift());
                break;
            }
        }

        const result = inputParts.join(' ') + ' ';

        if (nextToken.type === 'text') {
            return result.slice(0, result.lastIndexOf(nextToken.value));
        }

        return inputParts.join(' ');
    }

    date(input) {
        const inputParts = input.split(' ');
        const dateParts = [];
        let wasDate = false;

        while (inputParts.length > 0) {
            dateParts.push(inputParts.shift());

            if (this._dateMatcher.match(dateParts.join(' '))) {
                wasDate = true;
                if (inputParts.length === 0) {
                    return dateParts.join(' ');
                }
            } else if (wasDate) {
                dateParts.pop();
                return dateParts.join(' ');
            }
        }

        return null;
    }
}

module.exports = ReminderMatchers;
