const chai = require('chai');
const { spy } = require('sinon');
const Field = require('../../app/fields/Field');
const NotionEntry = require('../../app/notion/NotionEntry');
const NotionEntrySerializer = require('../../app/notion/NotionEntrySerializer');
const User = require('../../app/users/User');

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
                new NotionEntry({
                    fields: [
                        new Field({
                            name: '@the Title',
                            inputType: 'text',
                            outputType: 'title',
                            value: 'hey_there',
                        }),
                        new Field({
                            name: '@the TAG',
                            inputType: 'word',
                            outputType: 'select',
                            value: '!hey_there!',
                        }),
                        new Field({
                            name: 'My Tags',
                            inputType: 'word',
                            outputType: 'multi_select',
                            value: ['My Tag 1', 'My Other Tag 2'],
                        }),
                        new Field({
                            name: 'date',
                            inputType: 'date',
                            outputType: 'date',
                            value: 'в 8:05',
                        }),
                        new Field({
                            name: 'Reminder Date',
                            inputType: 'future_date',
                            outputType: 'date',
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
                    '@the Title': {
                        'type': 'title',
                        'title': [{
                            'type': 'text',
                            'text': {
                                'content': 'hey_there',
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
