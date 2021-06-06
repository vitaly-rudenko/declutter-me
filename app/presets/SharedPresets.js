class SharedPresets {
    // TODO: rename "value" to "name"
    get({ value, inputType, outputType }) {
        if (inputType && outputType) {
            return { value, inputType, outputType };
        }
        
        if (!inputType && outputType) {
            throw new Error('Invalid input: input type should be provided when output type is present');
        }

        if (inputType) {
            if (inputType.toLowerCase() === 'select') {
                return { value, inputType: 'word', outputType: 'select' };
            }

            if (
                inputType.toLowerCase() === 'multi_select' ||
                inputType.toLowerCase() === 'multiselect'
            ) {
                return { value, inputType: 'word', outputType: 'multi_select' };
            }

            if (inputType.toLowerCase() === 'date') {
                return { value, inputType: 'date', outputType: 'date' };
            }

            if (
                inputType.toLowerCase() === 'future_date' ||
                inputType.toLowerCase() === 'futuredate' ||
                inputType.toLowerCase() === 'reminder_date' ||
                inputType.toLowerCase() === 'reminderdate'
            ) {
                return { value, inputType: 'future_date', outputType: 'date' };
            }

            if (inputType.toLowerCase() === 'number') {
                return { value, inputType: 'number', outputType: 'number' };
            }

            if (inputType.toLowerCase() === 'url') {
                return { value, inputType: 'url', outputType: 'url' };
            }

            if (inputType.toLowerCase() === 'phone') {
                return { value, inputType: 'phone', outputType: 'phone' };
            }

            if (inputType.toLowerCase() === 'email') {
                return { value, inputType: 'email', outputType: 'email' };
            }
        }

        if (['database', 'db', 'list', 'table'].includes(value.toLowerCase())) {
            return { value: 'database' };
        }

        return { value, inputType: 'text', outputType: 'title' };
    }
}

module.exports = SharedPresets;
