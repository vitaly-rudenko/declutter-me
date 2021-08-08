import { expect } from 'chai';
import { organizeValues } from '../app/phases.js';

describe('[phases]', () => {
    describe('organizeValues()', () => {
        it('should create organized values', () => {
            expect(organizeValues({
                start: {
                    language: '',
                    timezone: '',
                },
                notion: {
                    token: '',
                },
                addDatabase: {
                    link: '',
                    alias: '',
                },
                deleteDatabase: {
                    choose: ''
                },
                template: {
                    database: '',
                    pattern: '',
                    addDefaultFields: {
                        send: '',
                    }
                },
            })).to.deep.equal({
                start: {
                    language: 'start:language',
                    timezone: 'start:timezone',
                },
                notion: {
                    token: 'notion:token',
                },
                addDatabase: {
                    link: 'addDatabase:link',
                    alias: 'addDatabase:alias',
                },
                deleteDatabase: {
                    choose: 'deleteDatabase:choose'
                },
                template: {
                    database: 'template:database',
                    pattern: 'template:pattern',
                    addDefaultFields: {
                        send: 'template:addDefaultFields:send',
                    }
                },
            });
        });
    });
});