class NotionEntrySerializer {
    /**
     * @param {{
     *   entry: import('./Entry'),
     *   databaseId: string
     * }} data
     */
    serialize({ entry, databaseId }) {
        return {
            'parent': { 'database_id': databaseId },
            'properties': {
                'Content': {
                    'title': [{
                        'type': 'text',
                        'text': {
                            'content': entry.content,
                        }
                    }]
                },
                // TODO: What if I want to use regular "select", not multi?
                ...entry.tags.length > 0 && {
                    'Tags': {
                        'multi_select': entry.tags.map(tag => ({ name: tag })),
                    },
                }
            }
        };
    }
}

module.exports = NotionEntrySerializer;
