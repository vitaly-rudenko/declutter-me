    // /**
    //  * @param {string} input
    //  * @param {{ origin: Date, futureOnly: boolean }} params
    //  */
    //  parseExactDate(input, { origin, futureOnly }) {
    //     const inputParts = input.split('.');

    //     if (inputParts.length !== 3) {
    //         return null;
    //     }

    //     const [date, month, rawYear] = inputParts.map(Number);

    //     if (!this._isValidDate(date) || !this._isValidMonth(month) || !this._isValidYear(rawYear)) {
    //         return null;
    //     }

    //     const year = this._alignYear(rawYear, { origin, futureOnly });

    //     return new Date(Date.UTC(
    //         year, month - 1, date,
    //         origin.getUTCHours(), origin.getUTCMinutes(), origin.getUTCSeconds()
    //     ));
    // }

    // _isValidDate(date) {
    //     return Number.isSafeInteger(date) && date >= 1 && date <= 31;
    // }

    // _isValidMonth(month) {
    //     return Number.isSafeInteger(month) && month >= 1 && month <= 12;
    // }

    // _isValidYear(year) {
    //     return Number.isSafeInteger(year) && year >= 0;
    // }