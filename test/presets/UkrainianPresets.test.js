const { expect } = require('chai');
const UkrainianPresents = require('../../app/presets/UkrainianPresets');

describe('UkrainianPresents', () => {
    /** @type {UkrainianPresents} */
    let ukrainianPresets;

    beforeEach(() => {
        ukrainianPresets = new UkrainianPresents();
    });

    describe('get()', () => {
        it('should not apply presets when all types are provided', () => {
            for (const input of [
                { value: 'some value', inputType: 'text', outputType: 'title' },
                { value: 'my_value', inputType: 'word', outputType: 'multi_select' },
                { value: 'SOME value!!', inputType: 'future_date', outputType: 'date' },
            ]) {
                expect(ukrainianPresets.get(input)).to.be.null
            }
        });

        it('should not apply preset to all type-less variables', () => {
            for (const input of [
                { value: 'note' },
                { value: 'item' },
                { value: 'reminder' },
                { value: 'd4tabase' },
                { value: 'dbase' },
                { value: 'l1st' },
                { value: 'ta0le' },
                { value: 'Content' },
                { value: 'My Field' },
                { value: 'name' },
            ]) {
                expect(ukrainianPresets.get(input)).to.be.null
            }
        });

        it('should accept aliases for "database" variable', () => {
            for (const { value } of [
                { value: 'база_даних' },
                { value: 'базаданих' },
                { value: 'базаДаних' },
                { value: 'База-ДаниХ' },
                { value: 'бд' },
                { value: 'БД' },
                { value: 'перелік' },
                { value: 'ПеРеліК' },
                { value: 'список' },
                { value: 'СпиСОк' },
                { value: 'таблиця' },
                { value: 'ТаБлИцЯ' },
            ]) {
                expect(ukrainianPresets.get({ value })).to.deep.eq({ value, inputType: 'database', outputType: 'database' });
            }
        });

        it('should apply special preset to "select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'вибір' },
                { value: 'My Field', inputType: 'ВиБір' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'select' });
            }
        });

        it('should apply special preset to "multi_select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'множинний_вибір' },
                { value: 'My Field', inputType: 'множинний вибір' },
                { value: 'Field', inputType: 'Множинний Вибір' },
                { value: 'field', inputType: 'МножиНний-Вибір' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'multi_select' });
            }
        });

        it('should apply special preset to "date" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'ДаТа' },
                { value: 'My Field', inputType: 'дата' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset to "future_date" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'майбутня_дата' },
                { value: 'My Custom Field', inputType: 'дата_повідомлення' },
                { value: 'My Custom Field', inputType: 'дата_нагадування' },
                { value: 'My Custom Field', inputType: 'Майбутня Дата' },
                { value: 'My Custom Field', inputType: 'дАТа-повідоМлення' },
                { value: 'My Custom Field', inputType: 'дата_нагадування' },
                { value: 'My Custom Field', inputType: 'майбутняДата' },
                { value: 'My Custom Field', inputType: 'датаПовідомлення' },
                { value: 'My Custom Field', inputType: 'датаНагадування' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset to "number" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'число' },
                { value: 'Custom Field', inputType: 'ЧиСло' },
                { value: 'My Custom Field', inputType: 'цифра' },
                { value: 'My Custom Field', inputType: 'ЦиФрА' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'number', outputType: 'number' });
            }
        });

        it('should apply special preset to "url" input type', () => {
            for (const input of [
                { value: 'My Field', inputType: 'посилання' },
                { value: 'My Field', inputType: 'веб_сторінка' },
                { value: 'My Field', inputType: 'сторінка' },
                { value: 'My Field', inputType: 'сайт' },
                { value: 'My Field', inputType: 'Посилання' },
                { value: 'My Field', inputType: 'Веб-Сторінка' },
                { value: 'My Field', inputType: 'Веб СторіНка' },
                { value: 'My Field', inputType: 'Сторінка' },
                { value: 'My Field', inputType: 'Сайт' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset to "phone" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'телефон' },
                { value: 'My Custom Field', inputType: 'номер_телефону' },
                { value: 'My Custom Field', inputType: 'номер_телефона', },
                { value: 'My Custom Field', inputType: 'мобільний_номер' },
                { value: 'My Custom Field', inputType: 'мобільний' },
                { value: 'My Custom Field', inputType: 'Телефон' },
                { value: 'My Custom Field', inputType: 'Номер Телефону' },
                { value: 'My Custom Field', inputType: 'Номер Телефона', },
                { value: 'My Custom Field', inputType: 'Мобільний номер' },
                { value: 'My Custom Field', inputType: 'Мобільний' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset to "email" input type', () => {
            for (const input of [
                { value: '@The-Field!', inputType: 'пошта' },
                { value: '@The-Field!', inputType: 'електронна_пошта', },
                { value: '@The-Field!', inputType: 'поштова_скринька' },
                { value: '@The-Field!', inputType: 'ел_пошта' },
                { value: '@The-Field!', inputType: 'електронна_адреса', },
                { value: '@The-Field!', inputType: 'ел_адреса' },
                { value: '@The-Field!', inputType: 'мило' },
                { value: '@The-Field!', inputType: 'скринька' },
                { value: '@The-Field!', inputType: 'поштова_адреса' },
                { value: '@The-Field!', inputType: 'Пошта' },
                { value: '@The-Field!', inputType: 'Електроннапошта', },
                { value: '@The-Field!', inputType: 'Поштова Скринька' },
                { value: '@The-Field!', inputType: 'Ел. пошта' },
                { value: '@The-Field!', inputType: 'ЕлектрОннаАдреса', },
                { value: '@The-Field!', inputType: 'Ел._адреса' },
                { value: '@The-Field!', inputType: 'Мило' },
                { value: '@The-Field!', inputType: 'СкриНька' },
                { value: '@The-Field!', inputType: 'ПоштоваАдреса' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'email', outputType: 'email' });
            }
        });
        
        it('should apply special preset for "tag" variable', () => {
            for (const input of [
                { value: 'тег' },
                { value: 'Тег' },
                { value: 'теги' },
                { value: 'ТЕГИ' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: 'Теги', inputType: 'word', outputType: 'multi_select' });
            }
        });

        it('should apply special preset for "reminder_date" variable', () => {
            for (const input of [
                { value: 'майбутня_дата' },
                { value: 'дата_повідомлення' },
                { value: 'дата_нагадування' },
                { value: 'Майбутня Дата' },
                { value: 'дАТа-повідоМлення' },
                { value: 'дата_нагадування' },
                { value: 'майбутняДата' },
                { value: 'датаПовідомлення' },
                { value: 'датаНагадування' },
            ]) {
                expect(ukrainianPresets.get(input), JSON.stringify(input))
                    .to.deep.eq({ value: 'Дата', inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset for "date" variable', () => {
            for (const input of [
                { value: 'дата' },
                { value: 'Дата' },
                { value: 'ДАТА' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: 'Дата', inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset for "phone" variable', () => {
            for (const input of [
                { value: 'телефон' },
                { value: 'номер_телефону' },
                { value: 'номер_телефона', },
                { value: 'мобільний_номер' },
                { value: 'мобільний' },
                { value: 'Телефон' },
                { value: 'Номер Телефону' },
                { value: 'Номер Телефона', },
                { value: 'Мобільний номер' },
                { value: 'Мобільний' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: 'Телефон', inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset for "url" variable', () => {
            for (const input of [
                { value: 'посилання' },
                { value: 'веб_сторінка' },
                { value: 'сторінка' },
                { value: 'сайт' },
                { value: 'Посилання' },
                { value: 'Веб-Сторінка' },
                { value: 'Веб СторіНка' },
                { value: 'Сторінка' },
                { value: 'Сайт' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: 'URL', inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset for "email" variable', () => {
            for (const input of [
                { value: 'пошта' },
                { value: 'електронна_пошта', },
                { value: 'поштова_скринька' },
                { value: 'ел_пошта' },
                { value: 'електронна_адреса', },
                { value: 'ел_адреса' },
                { value: 'мило' },
                { value: 'скринька' },
                { value: 'поштова_адреса' },
                { value: 'Пошта' },
                { value: 'Електроннапошта', },
                { value: 'Поштова Скринька' },
                { value: 'Ел. пошта' },
                { value: 'ЕлектрОннаАдреса', },
                { value: 'Ел._адреса' },
                { value: 'Мило' },
                { value: 'СкриНька' },
                { value: 'ПоштоваАдреса' },
            ]) {
                expect(ukrainianPresets.get(input)).to.deep.eq({ value: 'Email', inputType: 'email', outputType: 'email' });
            }
        });
    });
});
