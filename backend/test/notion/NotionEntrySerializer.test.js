const chai = require('chai');
const { spy } = require('sinon');
const Field = require('../../app/fields/Field');
const Entry = require('../../app/entries/Entry');
const NotionEntrySerializer = require('../../app/notion/NotionEntrySerializer');
const User = require('../../app/users/User');
const NotionField = require('../../app/notion/NotionField');
const NotionFieldType = require('../../app/notion/NotionFieldType');

chai.use(require('sinon-chai'));
const { expect } = chai;

describe('NotionEntrySerializer', () => {
    /** @type {NotionEntrySerializer} */
    let notionEntrySerializer;
    let dateParser;

    beforeEach(() => {
        dateParser = spy({ parse: () => utcDate('2015-06-07 12:34') });

        notionEntrySerializer = new NotionEntrySerializer({ dateParser });
    });

    describe('serialize()', () => {
        it('should serialize entries properly', () => {
            expect(notionEntrySerializer.serialize(
                'fake-database-id',
                new Entry({
                    fields: [
                        new Field({
                            name: '@the title',
                            inputType: 'text',
                            value: 'hey_there',
                        }),
                        new Field({
                            name: 'description',
                            inputType: 'word',
                            value: '!hey there!',
                        }),
                        new Field({
                            name: '@the_tag',
                            inputType: 'word',
                            value: '!hey_there!',
                        }),
                        new Field({
                            name: 'mytags',
                            inputType: 'word',
                            value: ['My Tag 1', 'My Other Tag 2'],
                        }),
                        new Field({
                            name: 'DATE',
                            inputType: 'date',
                            value: 'в 8:05',
                        }),
                        new Field({
                            name: 'reminder-date',
                            inputType: 'future_date',
                            value: 'в 12:00',
                        }),
                    ]
                }),
                [
                    new NotionField({ name: '@The Title', type: NotionFieldType.TITLE }),
                    new NotionField({ name: 'Description', type: NotionFieldType.RICH_TEXT }),
                    new NotionField({ name: '@the TAG', type: NotionFieldType.SELECT }),
                    new NotionField({ name: 'My Tags', type: NotionFieldType.MULTI_SELECT }),
                    new NotionField({ name: 'date', type: NotionFieldType.DATE }),
                    new NotionField({ name: 'Reminder Date', type: NotionFieldType.DATE }),
                ],
                new User({
                    id: 'fake-user-id',
                    language: 'fake-language',
                    timezoneOffsetMinutes: 180,
                })
            )).to.deep.eq({
                'parent': {
                    'database_id': 'fake-database-id',
                },
                'properties': {
                    '@The Title': {
                        'type': 'title',
                        'title': [{
                            'type': 'text',
                            'text': {
                                'content': 'hey_there',
                            }
                        }]
                    },
                    'Description': {
                        'type': 'rich_text',
                        'rich_text': [{
                            'type': 'text',
                            'text': {
                                'content': '!hey there!',
                            }
                        }]
                    },
                    '@the TAG': {
                        'type': 'select',
                        'select': {
                            'name': '!hey_there!'
                        }
                    },
                    'My Tags': {
                        'type': 'multi_select',
                        'multi_select': [{
                            'name': 'My Tag 1'
                        }, {
                            'name': 'My Other Tag 2'
                        }]
                    },
                    'date': {
                        'type': 'date',
                        'date': '2015-06-07T15:34:00.000+03:00'
                    },
                    'Reminder Date': {
                        'type': 'date',
                        'date': '2015-06-07T15:34:00.000+03:00'
                    },
                }
            });

            expect(dateParser.parse).to.have.been.calledTwice;
            expect(dateParser.parse).to.have.been.calledWithExactly('в 8:05', { futureOnly: false });
            expect(dateParser.parse).to.have.been.calledWithExactly('в 12:00', { futureOnly: true });
        });
    });
});

function utcDate(dateString) {
    const date = new Date(dateString);
    const result = new Date();

    result.setUTCFullYear(date.getFullYear());
    result.setUTCMonth(date.getMonth());
    result.setUTCDate(date.getDate());
    result.setUTCHours(date.getHours());
    result.setUTCMinutes(date.getMinutes());
    result.setUTCSeconds(date.getSeconds());
    result.setUTCMilliseconds(0);

    return result;
}
