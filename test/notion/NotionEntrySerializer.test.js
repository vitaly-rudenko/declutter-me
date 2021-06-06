const { expect } = require('chai');
const Field = require('../../app/fields/Field');
const NotionEntry = require('../../app/notion/NotionEntry');
const NotionEntrySerializer = require('../../app/notion/NotionEntrySerializer');
const User = require('../../app/users/User');

describe('NotionEntrySerializer', () => {
    /** @type {NotionEntrySerializer} */
    let notionEntrySerializer;

    beforeEach(() => {
        notionEntrySerializer = new NotionEntrySerializer();
    });

    describe('serialize()', () => {
        it('should serialize entries properly', () => {
            expect(notionEntrySerializer.serialize(
                new NotionEntry({
                    databaseId: 'fake-database-id',
                    fields: [
                        new Field({
                            name: '@the Title',
                            type: 'word',
                            value: 'hey_there',
                        }),
                        new Field({
                            name: 'the: Note',
                            type: 'text',
                            value: 'hello world',
                        }),
                        new Field({
                            name: '@the TAG',
                            type: 'wordSelect',
                            value: '!hey_there!',
                        }),
                        new Field({
                            name: 'TAG!!!',
                            type: 'textSelect',
                            value: 'hello WORLD',
                        }),
                        new Field({
                            name: 'My Tags',
                            type: 'words',
                            value: ['My Tag 1', 'My Other Tag 2'],
                        }),
                        new Field({
                            name: 'note_texts',
                            type: 'texts',
                            value: ['hello world', 'hello there!'],
                        }),
                        new Field({
                            name: 'date',
                            type: 'date',
                            value: utcDate('2015-06-07 12:34'),
                        }),
                        new Field({
                            name: 'Date In The Future',
                            type: 'futureDate',
                            value: utcDate('2020-01-01 10:00'),
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
                    'the: Note': {
                        'type': 'title',
                        'title': [{
                            'type': 'text',
                            'text': {
                                'content': 'hello world',
                            }
                        }]
                    },
                    '@the TAG': {
                        'type': 'select',
                        'select': {
                            'name': '!hey_there!'
                        }
                    },
                    'TAG!!!': {
                        'type': 'select',
                        'select': {
                            'name': 'hello WORLD'
                        }
                    },
                    'My Tags': {
                        'type': 'multi_select',
                        'multi_select': [{
                            'name': 'My Tag 1',
                        }, {
                            'name': 'My Other Tag 2',
                        }]
                    },
                    'note_texts': {
                        'type': 'multi_select',
                        'multi_select': [{
                            'name': 'hello world',
                        }, {
                            'name': 'hello there!',
                        }]
                    },
                    'date': {
                        'type': 'date',
                        'date': '2015-06-07T15:34:00.000+03:00'
                    },
                    'Date In The Future': {
                        'type': 'date',
                        'date': '2020-01-01T13:00:00.000+03:00'
                    }
                }
            })
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
