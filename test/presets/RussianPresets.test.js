const { expect } = require('chai');
const RussianPresents = require('../../app/presets/RussianPresets');

describe('RussianPresents', () => {
    /** @type {RussianPresents} */
    let russianPresets;

    beforeEach(() => {
        russianPresets = new RussianPresents();
    });

    describe('get()', () => {
        it('should not apply presets when all types are provided', () => {
            for (const input of [
                { value: 'some value', inputType: 'text', outputType: 'title' },
                { value: 'my_value', inputType: 'word', outputType: 'multi_select' },
                { value: 'SOME value!!', inputType: 'future_date', outputType: 'date' },
            ]) {
                expect(russianPresets.get(input)).to.be.null
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
                expect(russianPresets.get(input)).to.be.null
            }
        });

        it('should accept aliases for "database" variable', () => {
            for (const { value } of [
                { value: 'база_данных' },
                { value: 'базаданных' },
                { value: 'базаДанных' },
                { value: 'БазаДанныХ' },
                { value: 'бд' },
                { value: 'БД' },
                { value: 'список' },
                { value: 'СпиСОк' },
                { value: 'таблица' },
                { value: 'ТаБлИцА' },
            ]) {
                expect(russianPresets.get({ value })).to.deep.eq({ value, inputType: 'database', outputType: 'database' });
            }
        });

        it('should apply special preset to "word" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'слово' },
                { value: 'My Field', inputType: 'Слово' },
                { value: 'My Field', inputType: 'СлОвО' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'title' });
            }
        });

        it('should apply special preset to "select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'выбор' },
                { value: 'My Field', inputType: 'ВыБоР' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'select' });
            }
        });

        it('should apply special preset to "multi_select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'множественный_выбор' },
                { value: 'My Field', inputType: 'множественный выбор' },
                { value: 'Field', inputType: 'Множественный Выбор' },
                { value: 'field', inputType: 'МноЖествеННыЙ-Выбор' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'multi_select' });
            }
        });

        it('should apply special preset to "date" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'ДаТа' },
                { value: 'My Field', inputType: 'дата' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset to "future_date" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'будущая_дата' },
                { value: 'My Custom Field 123', inputType: 'дата_уведомления' },
                { value: 'Field', inputType: 'дата_напоминания' },
                { value: 'Field', inputType: 'будущаяДата' },
                { value: 'The Date', inputType: 'датаУведомления' },
                { value: 'My Custom Field', inputType: 'датаНапоминания' },
                { value: 'My Field', inputType: 'БУДУщая-ДАТА' },
                { value: '@My Field', inputType: 'ДаТа-УведоМления' },
                { value: 'My Field', inputType: 'ДаТА-НапоминАНИЯ' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset to "number" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'число' },
                { value: 'Custom Field', inputType: 'ЧиСло' },
                { value: 'My Custom Field', inputType: 'цифра' },
                { value: 'My Custom Field', inputType: 'ЦиФрА' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'number', outputType: 'number' });
            }
        });

        it('should apply special preset to "url" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'ссылка' },
                { value: 'My Custom Field', inputType: 'Ссылка' },
                { value: 'My Field', inputType: 'Веб-страница' },
                { value: 'My Field', inputType: 'ВебСтраница' },
                { value: 'My Field', inputType: 'сайт' },
                { value: 'My Field', inputType: 'Сайт' },
                { value: 'My Field', inputType: 'САЙТ' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset to "phone" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'телефон' },
                { value: 'My Custom Field', inputType: 'Номер Телефона' },
                { value: 'My Field', inputType: 'мобильный-номер' },
                { value: 'My Field', inputType: 'МобИльНый' },
                { value: 'Custom Field', inputType: 'Телефон' },
                { value: 'My Custom Field', inputType: 'Номер_телефона' },
                { value: 'My Field', inputType: 'мобильный номер' },
                { value: 'My Field', inputType: 'мобильный' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset to "email" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'почта' },
                { value: 'My Custom Field', inputType: 'почтовый-адрес' },
                { value: 'My Field', inputType: 'ЭлектроннаяПочта' },
                { value: 'My Field', inputType: 'ПочтовыйЯщик' },
                { value: 'My Field', inputType: 'Эл. почта' },
                { value: 'My Field', inputType: 'Электронный Адрес' },
                { value: 'My Field', inputType: 'эл._адрес' },
                { value: 'My Field', inputType: 'МЫЛО' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'email', outputType: 'email' });
            }
        });
        
        it('should apply special preset for "tag" variable', () => {
            for (const input of [
                { value: 'тег' },
                { value: 'Тег' },
                { value: 'теги' },
                { value: 'ТЕГИ' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: 'Теги', inputType: 'word', outputType: 'multi_select' });
            }
        });

        it('should apply special preset for "reminder_date" variable', () => {
            for (const input of [
                { value: 'будущая_дата' },
                { value: 'дата_уведомления' },
                { value: 'дата_напоминания' },
                { value: 'будущаяДата' },
                { value: 'датаУведомления' },
                { value: 'датаНапоминания' },
                { value: 'БУДУщая-ДАТА' },
                { value: 'ДаТа-УведоМления' },
                { value: 'ДаТА-НапоминАНИЯ' },
            ]) {
                expect(russianPresets.get(input), JSON.stringify(input))
                    .to.deep.eq({ value: 'Дата', inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset for "date" variable', () => {
            for (const input of [
                { value: 'дата' },
                { value: 'Дата' },
                { value: 'ДАТА' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: 'Дата', inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset for "phone" variable', () => {
            for (const input of [
                { value: 'телефон' },
                { value: 'Номер Телефона' },
                { value: 'мобильный-номер' },
                { value: 'МобИльНый' },
                { value: 'Телефон' },
                { value: 'Номер_телефона' },
                { value: 'мобильный номер' },
                { value: 'мобильный' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: 'Телефон', inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset for "url" variable', () => {
            for (const input of [
                { value: 'ссылка' },
                { value: 'Ссылка' },
                { value: 'Веб-страница' },
                { value: 'ВебСтраница' },
                { value: 'сайт' },
                { value: 'Сайт' },
                { value: 'САЙТ' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: 'URL', inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset for "email" variable', () => {
            for (const input of [
                { value: 'почта' },
                { value: 'почтовый-адрес' },
                { value: 'ЭлектроннаяПочта' },
                { value: 'ПочтовыйЯщик' },
                { value: 'Эл. почта' },
                { value: 'Электронный Адрес' },
                { value: 'эл._адрес' },
                { value: 'МЫЛО' },
            ]) {
                expect(russianPresets.get(input)).to.deep.eq({ value: 'Email', inputType: 'email', outputType: 'email' });
            }
        });
    });
});
