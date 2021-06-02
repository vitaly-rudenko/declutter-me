class NotionNoteSerializer {
    /**
     * @param {{
     *   note: import('./Note'),
     *   databaseId: string
     * }} data
     */
    serialize({ note, databaseId }) {
        return {
            'parent': { 'database_id': databaseId },
            'properties': {
                'Note': {
                    'title': [{
                        'type': 'text',
                        'text': {
                            'content': note,
                        }
                    }]
                },
                ...tags.length > 0 && {
                    'Tags': {
                        'multi_select': tags.map(tag => ({ name: tag })),
                    },
                }
            }
        };
    }
}

module.exports = NotionNoteSerializer;
