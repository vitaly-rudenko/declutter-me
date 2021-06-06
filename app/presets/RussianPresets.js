const SharedPresets = require('./SharedPresets');

class RussianPresets {
    get({ value, inputType, outputType }) {
        if (!inputType && !outputType) {
            if (
                value.toLowerCase() === 'reminder_date' ||
                value.toLowerCase() === 'reminderdate'
            ) {
                return { value: 'Дата', inputType: 'future_date', outputType: 'date' };
            }
    
            if (value.toLowerCase() === 'date') {
                return { value: 'Дата', inputType: 'date', outputType: 'date' };
            }
    
            if (value.toLowerCase() === 'tag') {
                return { value: 'Теги', inputType: 'word', outputType: 'multiselect' };
            }
    
            if (value.toLowerCase() === 'phone') {
                return { value: 'Телефон', inputType: 'phone', outputType: 'phone' };
            }
    
            if (value.toLowerCase() === 'url') {
                return { value: 'URL', inputType: 'url', outputType: 'url' };
            }
    
            if (value.toLowerCase() === 'email') {
                return { value: 'Email', inputType: 'email', outputType: 'email' };
            }
        }

        return new SharedPresets().get({ value, inputType, outputType });
    }
}

module.exports = RussianPresets;
