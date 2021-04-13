class ReminderMatchers {
    constructor({ russianDateMatcher }) {
        this._russianDateMatcher = russianDateMatcher;

        this.reminder = this.reminder.bind(this);
        this.date = this.date.bind(this);
    }

    reminder(input) {
        return input;
    }

    date(input) {
        const inputParts = input.split(' ');
        const dateParts = [];
        let wasDate = false;

        while (inputParts.length > 0) {
            dateParts.push(inputParts.shift());

            if (this._russianDateMatcher.match(dateParts.join(' '))) {
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
