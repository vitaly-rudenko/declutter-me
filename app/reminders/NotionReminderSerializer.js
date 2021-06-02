const Reminder = require('./Reminder');

class NotionReminderSerializer {
    /**
     * @param {{
     *     reminder: Reminder,
     *     databaseId: string,
     *     timezoneOffsetMinutes: number
     * }} data
     */
    serialize({ reminder, databaseId, timezoneOffsetMinutes }) {
        return {
            'parent': { 'database_id': databaseId },
            'properties': {
                'Reminder': {
                    'title': [{
                        'type': 'text',
                        'text': {
                            'content': reminder.content,
                        }
                    }]
                },
                'Date': {
                    'date': {
                        'start': this._formatUtcDateWithTimezone(reminder.date, timezoneOffsetMinutes),
                    }
                }
            }
        };
    }

    /** @param {import('@notionhq/client/build/src/api-types').Page} page */
    deserialize(page) {
        return new Reminder({
            id: page.id,
            content: page.properties['Reminder'].title[0].text.content,
            date: new Date(page.properties['Date'].date.start),
            reminded: page.properties['Reminded'].checkbox,
        });
    }

    _formatUtcDateWithTimezone(date, timezoneOffsetMinutes) {
        const dateWithTimezone = new Date(date.getTime() + timezoneOffsetMinutes * 60_000);
    
        const timezoneHours = Math.trunc(timezoneOffsetMinutes / 60);
        const timezoneMinutes = (timezoneOffsetMinutes - timezoneHours * 60);
    
        const timezone = String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
        
        return dateWithTimezone.toISOString().slice(0, -1) + (timezoneOffsetMinutes >= 0 ? '+' : '-') + timezone;
    }
}

module.exports = NotionReminderSerializer;
