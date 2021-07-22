import { InputType } from '@vitalyrudenko/templater';
import { NotionFieldType } from './NotionFieldType.js';

function last(arrayOrValue) {
    return Array.isArray(arrayOrValue) ? arrayOrValue[arrayOrValue.length - 1] : arrayOrValue;
}

export class NotionEntrySerializer {
    /** @param {{ dateParser }} dependencies */
    constructor({ dateParser }) {
        this._dateParser = dateParser;
    }

    /**
     * @param {import('./NotionEntry').NotionEntry} entry
     * @param {import('../users/User').User} user
     * @returns {import('@notionhq/client/build/src/api-endpoints').PagesCreateParameters}
     */
    serialize(entry, user) {
        const properties = {};

        for (const field of entry.fields) {
            if (field.inputType === InputType.DATABASE) continue;

            const property = entry.getProperty(field);
            if (!property) continue;

            const { name, type } = property;

            if (type === NotionFieldType.TITLE) {
                properties[name] = this.serializeTitle(last(field.value));
            } else if (type === NotionFieldType.RICH_TEXT) {
                properties[name] = this.serializeRichText(last(field.value));
            } else if (type === NotionFieldType.SELECT) {
                properties[name] = this.serializeSelect(last(field.value));
            } else if (type === NotionFieldType.MULTI_SELECT) {
                properties[name] = this.serializeMultiSelect(field.value);
            } else if (type === NotionFieldType.PHONE) {
                properties[name] = this.serializePhoneNumber(last(field.value));
            } else if (type === NotionFieldType.EMAIL) {
                properties[name] = this.serializeEmail(last(field.value));
            } else if (type === NotionFieldType.URL) {
                properties[name] = this.serializeUrl(last(field.value));
            } else if (type === NotionFieldType.NUMBER) {
                properties[name] = this.serializeNumber(Number(last(field.value)));
            } else if (type === NotionFieldType.DATE) {
                const date = this._dateParser.parse(last(field.value), {
                    futureOnly: field.inputType === InputType.FUTURE_DATE,
                });

                properties[name] = this.serializeDate(date, user.timezoneOffsetMinutes);
            } else {
                throw new Error('Unsupported field type: ' + type);
            }
        }

        return {
            'parent': {
                'database_id': entry.databaseId,
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

    serializeRichText(value) {
        return {
            'type': 'rich_text',
            'rich_text': [{
                'type': 'text',
                'text': {
                    'content': value,
                }
            }]
        };
    }

    serializeNumber(value) {
        return {
            'type': 'number',
            'number': value,
        };
    }

    serializeEmail(value) {
        return {
            'type': 'email',
            'email': value,
        };
    }

    serializeUrl(value) {
        return {
            'type': 'url',
            'url': value,
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
            'multi_select': (Array.isArray(values) ? values : [values])
                .map(value => ({
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

    serializePhoneNumber(value) {
        return {
            'type': 'phone_number',
            'phone_number': value
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
