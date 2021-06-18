const fuzzyEquals = require('../utils/fuzzyEquals');

const FUTURE_DATE = ['майбутня_дата','дата_повідомлення','дата_нагадування'];
const DATE = ['дата', 'час'];
const PHONE = [
    'телефон', 'номер_телефону', 'номер_телефона',
    'мобільний_номер', 'мобільний'
];
const EMAIL = [
    'пошта', 'електронна_пошта',
    'поштова_скринька', 'ел_пошта', 'електронна_адреса',
    'ел_адреса', 'мило', 'скринька', 'поштова_адреса'
];
const URL = ['посилання', 'веб_сторінка', 'сторінка', 'сайт'];

class UkrainianPresets {
    get({ value, inputType, outputType }) {
        if (inputType && !outputType) {
            if (fuzzyEquals(inputType, 'вибір')) {
                return { value, inputType: 'word', outputType: 'select' };
            }

            if (fuzzyEquals(inputType, 'множинний_вибір')) {
                return { value, inputType: 'word', outputType: 'multi_select' };
            }

            if (fuzzyEquals(inputType, ...DATE)) {
                return { value, inputType: 'date', outputType: 'date' };
            }

            if (fuzzyEquals(inputType, ...FUTURE_DATE)) {
                return { value, inputType: 'future_date', outputType: 'date' };
            }

            if (fuzzyEquals(inputType, 'число', 'цифра')) {
                return { value, inputType: 'number', outputType: 'number' };
            }

            if (fuzzyEquals(inputType, ...URL)) {
                return { value, inputType: 'url', outputType: 'url' };
            }

            if (fuzzyEquals(inputType, ...PHONE)) {
                return { value, inputType: 'phone', outputType: 'phone' };
            }

            if (fuzzyEquals(inputType, ...EMAIL)) {
                return { value, inputType: 'email', outputType: 'email' };
            }
        }

        if (!inputType && !outputType) {
            if (fuzzyEquals(value, ...FUTURE_DATE)) {
                return { value: 'Дата', inputType: 'future_date', outputType: 'date' };
            }
    
            if (fuzzyEquals(value, ...DATE)) {
                return { value: 'Дата', inputType: 'date', outputType: 'date' };
            }
    
            if (fuzzyEquals(value, 'тег', 'теги')) {
                return { value: 'Теги', inputType: 'word', outputType: 'multi_select' };
            }
    
            if (fuzzyEquals(value, ...PHONE)) {
                return { value: 'Телефон', inputType: 'phone', outputType: 'phone' };
            }
    
            if (fuzzyEquals(value, ...URL)) {
                return { value: 'URL', inputType: 'url', outputType: 'url' };
            }
    
            if (fuzzyEquals(value, ...EMAIL)) {
                return { value: 'Email', inputType: 'email', outputType: 'email' };
            }

            if (fuzzyEquals(value, 'база_даних', 'бд', 'перелік', 'список', 'таблиця')) {
                return { value, inputType: 'database', outputType: 'database' };
            }
        }

        return null;
    }
}

module.exports = UkrainianPresets;
