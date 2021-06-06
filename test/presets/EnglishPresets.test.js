const { expect } = require('chai');
const EnglishPresents = require('../../app/presets/EnglishPresets');

describe('EnglishPresents', () => {
    /** @type {EnglishPresents} */
    let englishPresets;

    beforeEach(() => {
        englishPresets = new EnglishPresents();
    });

    describe('get()', () => {
        it('should not apply presets when all types are provided', () => {
            for (const input of [
                { value: 'some value', inputType: 'text', outputType: 'title' },
                { value: 'my_value', inputType: 'word', outputType: 'multi_select' },
                { value: 'SOME value!!', inputType: 'future_date', outputType: 'date' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq(input);
            }
        });

        it('should accept aliases for "database" variable', () => {
            for (const input of [
                { value: 'database' },
                { value: 'DataBase' },
                { value: 'db' },
                { value: 'DB' },
                { value: 'list' },
                { value: 'lIsT' },
                { value: 'table' },
                { value: 'Table' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'database' });
            }
        });

        it('should apply special preset to all type-less variables', () => {
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
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'text', outputType: 'title' });
            }
        });

        it('should apply special preset to "select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'select' },
                { value: 'My Field', inputType: 'SeLeCt' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'select' });
            }
        });

        it('should apply special preset to "multi_select" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'multi_select' },
                { value: 'My Field', inputType: 'multiselect' },
                { value: 'Field', inputType: 'mUlTiSeLecT' },
                { value: 'field', inputType: 'mUlTi_SeLecT' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'word', outputType: 'multi_select' });
            }
        });

        it('should apply special preset to "date" input type', () => {
            for (const input of [
                { value: 'My Custom Field', inputType: 'date' },
                { value: 'My Field', inputType: 'DaTe' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset to "future_date" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'reminderdate' },
                { value: 'My Custom Field 123', inputType: 'reminderDate' },
                { value: 'Field', inputType: 'ReMinDerDate' },
                { value: 'Field', inputType: 'Reminder_Date' },
                { value: 'The Date', inputType: 'reminder_date' },
                { value: 'My Custom Field', inputType: 'futuredate' },
                { value: 'My Field', inputType: 'futureDate' },
                { value: '@My Field', inputType: 'future_date' },
                { value: 'My Field', inputType: 'FuTuReDaTe' },
                { value: '~Field!! ^_^', inputType: 'Future_Date' },
                { value: 'Field...', inputType: 'FuTuRe_DaTe' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset to "number" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'number' },
                { value: 'My Custom Field', inputType: 'NUMBER' },
                { value: 'My Field', inputType: 'NuMBEr' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'number', outputType: 'number' });
            }
        });

        it('should apply special preset to "url" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'url' },
                { value: 'My Custom Field', inputType: 'URL' },
                { value: 'My Field', inputType: 'Url' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset to "phone" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'phone' },
                { value: 'My Custom Field', inputType: 'PHONE' },
                { value: 'My Field', inputType: 'Phone' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset to "email" input type', () => {
            for (const input of [
                { value: 'Custom Field', inputType: 'email' },
                { value: 'My Custom Field', inputType: 'EMAIL' },
                { value: 'My Field', inputType: 'Email' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: input.value, inputType: 'email', outputType: 'email' });
            }
        });
        
        it('should apply special preset for "tag" variable', () => {
            for (const input of [
                { value: 'tag' },
                { value: 'Tag' },
                { value: 'TAG' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'Tags', inputType: 'word', outputType: 'multiselect' });
            }
        });

        it('should apply special preset for "reminder_date" variable', () => {
            for (const input of [
                { value: 'reminder_date' },
                { value: 'Reminder_Date' },
                { value: 'reminderdate' },
                { value: 'reminderDate' },
                { value: 'ReminderDate' },
                { value: 'REMINDERDATE' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'Date', inputType: 'future_date', outputType: 'date' });
            }
        });

        it('should apply special preset for "date" variable', () => {
            for (const input of [
                { value: 'date' },
                { value: 'Date' },
                { value: 'DATE' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'Date', inputType: 'date', outputType: 'date' });
            }
        });

        it('should apply special preset for "phone" variable', () => {
            for (const input of [
                { value: 'phone' },
                { value: 'Phone' },
                { value: 'PHONE' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'Phone', inputType: 'phone', outputType: 'phone' });
            }
        });

        it('should apply special preset for "url" variable', () => {
            for (const input of [
                { value: 'url' },
                { value: 'Url' },
                { value: 'URL' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'URL', inputType: 'url', outputType: 'url' });
            }
        });

        it('should apply special preset for "email" variable', () => {
            for (const input of [
                { value: 'email' },
                { value: 'Email' },
                { value: 'EMAIL' },
            ]) {
                expect(englishPresets.get(input)).to.deep.eq({ value: 'Email', inputType: 'email', outputType: 'email' });
            }
        });
    });
});
