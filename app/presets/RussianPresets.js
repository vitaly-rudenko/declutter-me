const fuzzyEquals = require('../utils/fuzzyEquals');

const FUTURE_DATE = ['будущая_дата', 'дата_уведомления', 'дата_напоминания'];
const DATE = ['дата', 'время'];
const PHONE = ['телефон', 'номер_телефона', 'мобильный_номер', 'мобильный'];
const EMAIL = [
    'почта', 'почтовый_адрес', 'электронная_почта',
    'почтовый_ящик', 'эл_почта', 'электронный_адрес',
    'эл_адрес', 'мыло'
];
const URL = ['ссылка', 'веб_страница', 'страница', 'сайт'];

class RussianPresets {
    get({ value, inputType, outputType }) {
        if (inputType && !outputType) {
            if (fuzzyEquals(inputType, 'выбор')) {
                return { value, inputType: 'word', outputType: 'select' };
            }

            if (fuzzyEquals(inputType, 'множественный_выбор')) {
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
                return { value: 'Теги', inputType: 'word', outputType: 'multiselect' };
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

            if (fuzzyEquals(value, 'база_данных', 'бд', 'список', 'таблица')) {
                return { value, inputType: 'database', outputType: 'database' };
            }
        }

        return null;
    }
}

module.exports = RussianPresets;
