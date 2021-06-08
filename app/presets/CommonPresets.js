const fuzzyEquals = require('../utils/fuzzyEquals');

class CommonPresets {
    // TODO: rename "value" to "name"
    get({ value, inputType, outputType }) {
        if (inputType && !outputType) {
            if (fuzzyEquals(inputType, 'select')) {
                return { value, inputType: 'word', outputType: 'select' };
            }

            if (fuzzyEquals(inputType, 'multiselect')) {
                return { value, inputType: 'word', outputType: 'multi_select' };
            }

            if (fuzzyEquals(inputType, 'date')) {
                return { value, inputType: 'date', outputType: 'date' };
            }

            if (fuzzyEquals(inputType, 'futuredate', 'reminderdate')) {
                return { value, inputType: 'future_date', outputType: 'date' };
            }

            if (fuzzyEquals(inputType, 'number')) {
                return { value, inputType: 'number', outputType: 'number' };
            }

            if (fuzzyEquals(inputType, 'url')) {
                return { value, inputType: 'url', outputType: 'url' };
            }

            if (fuzzyEquals(inputType, 'phone')) {
                return { value, inputType: 'phone', outputType: 'phone' };
            }

            if (fuzzyEquals(inputType, 'email')) {
                return { value, inputType: 'email', outputType: 'email' };
            }
        }

        if (!inputType && !outputType) {
            if (fuzzyEquals(value, 'reminderdate')) {
                return { value: 'Date', inputType: 'future_date', outputType: 'date' };
            }
    
            if (fuzzyEquals(value, 'date')) {
                return { value: 'Date', inputType: 'date', outputType: 'date' };
            }
    
            if (fuzzyEquals(value, 'tag')) {
                return { value: 'Tags', inputType: 'word', outputType: 'multiselect' };
            }
    
            if (fuzzyEquals(value, 'phone')) {
                return { value: 'Phone', inputType: 'phone', outputType: 'phone' };
            }
    
            if (fuzzyEquals(value, 'url')) {
                return { value: 'URL', inputType: 'url', outputType: 'url' };
            }
    
            if (fuzzyEquals(value, 'email')) {
                return { value: 'Email', inputType: 'email', outputType: 'email' };
            }

            if (fuzzyEquals(value, 'database', 'db', 'list', 'table')) {
                return { value, inputType: 'database', outputType: 'database' };
            }
        }

        return null;
    }
}

module.exports = CommonPresets;
