function last(arrayOrValue) {
    return Array.isArray(arrayOrValue) ? arrayOrValue[arrayOrValue.length - 1] : arrayOrValue;
}

class NotionEntrySerializer {
    /** @param {{ dateParser: import('../date-parsers/DateParserFactory') }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;
    }

    /**
     * @param {import('./NotionEntry')} notionEntry
     * @param {import('../users/User')} user
     * @returns {import('@notionhq/client/build/src/api-endpoints').PagesCreateParameters}
     */
    serialize(notionEntry, user) {
        const properties = {};

        for (const field of notionEntry.fields) {
            if (field.outputType === 'title') {
                properties[field.name] = this.serializeTitle(last(field.value));
            } else if (field.outputType === 'select') {
                properties[field.name] = this.serializeSelect(last(field.value));
            } else if (field.outputType === 'multi_select') {
                properties[field.name] = this.serializeMultiSelect(field.value);
            } else if (field.outputType === 'date') {
                const date = this._dateParser.parse(last(field.value), {
                    language: user.language,
                    futureOnly: field.inputType === 'future_date',
                });

                properties[field.name] = this.serializeDate(date, user.timezoneOffsetMinutes);
            } else {
                throw new Error('Unsupported field output type: ' + field.outputType);
            }
        }

        return {
            'parent': {
                'database_id': notionEntry.databaseId
            },
            'properties': {
                ...properties,
            },
        };
    }

    serializeTitle(value) {
        return {
            'type': 'title',
            'title': [{
                'type': 'text',
                'text': {
                    'content': value,
                }
            }]
        };
    }

    serializeSelect(value) {
        return {
            'type': 'select',
            'select': {
                'name': value
            }
        };
    }

    serializeMultiSelect(values) {
        return {
            'type': 'multi_select',
            'multi_select': values.map(value => ({
                'name': value
            })),
        };
    }

    serializeDate(value, timezoneOffsetMinutes) {
        return {
            'type': 'date',
            'date': this.formatUtcDateWithTimezone(value, timezoneOffsetMinutes),
        };
    }

    formatUtcDateWithTimezone(date, timezoneOffsetMinutes) {
        const offset = Math.abs(timezoneOffsetMinutes);

        const dateWithTimezone = new Date(date.getTime() + offset * 60_000);
    
        const timezoneHours = Math.trunc(offset / 60);
        const timezoneMinutes = (offset - timezoneHours * 60);
    
        const timezone = String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
        
        return dateWithTimezone.toISOString().slice(0, -1) + (timezoneOffsetMinutes >= 0 ? '+' : '-') + timezone;
    }
}

module.exports = NotionEntrySerializer;
