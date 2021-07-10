import chai from 'chai';
import { spy } from 'sinon';
import { Field } from '../../app/fields/Field.js';
import { NotionEntrySerializer } from '../../app/notion/NotionEntrySerializer.js';
import { User } from '../../app/users/User.js';
import { NotionFieldType } from '../../app/notion/NotionFieldType.js';
import { NotionEntry } from '../../app/notion/NotionEntry.js';
import { NotionProperty } from '../../app/notion/NotionProperty.js';
import { InputType } from '../../app/InputType.js';

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
                new NotionEntry({
                    databaseId: 'fake-database-id',
                    properties: [
                        new NotionProperty({ name: '@The Title', type: NotionFieldType.TITLE }),
                        new NotionProperty({ name: 'Description', type: NotionFieldType.RICH_TEXT }),
                        new NotionProperty({ name: '@the TAG', type: NotionFieldType.SELECT }),
                        new NotionProperty({ name: 'My Tags', type: NotionFieldType.MULTI_SELECT }),
                        new NotionProperty({ name: 'date', type: NotionFieldType.DATE }),
                        new NotionProperty({ name: 'Reminder Date', type: NotionFieldType.DATE }),
                    ],
                    fields: [
                        new Field({
                            name: '@the title',
                            inputType: InputType.TEXT,
                            value: 'hey_there',
                        }),
                        new Field({
                            name: 'description',
                            inputType: InputType.WORD,
                            value: '!hey there!',
                        }),
                        new Field({
                            name: '@the_tag',
                            inputType: InputType.WORD,
                            value: '!hey_there!',
                        }),
                        new Field({
                            name: 'mytags',
                            inputType: InputType.WORD,
                            value: ['My Tag 1', 'My Other Tag 2'],
                        }),
                        new Field({
                            name: 'DATE',
                            inputType: InputType.DATE,
                            value: 'в 8:05',
                        }),
                        new Field({
                            name: 'reminder-date',
                            inputType: InputType.FUTURE_DATE,
                            value: 'в 12:00',
                        }),
                    ]
                }),
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
