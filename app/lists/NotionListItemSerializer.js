class NotionListItemSerializer {
    /**
     * @param {{
        * listItem: import('./ListItem'),
        * databaseId: string
     * }} data
     */
    serialize({ listItem, databaseId }) {
        return {
            'parent': { 'database_id': databaseId },
            'properties': {
                'Item': {
                    'title': [{
                        'type': 'text',
                        'text': {
                            'content': listItem.content,
                        }
                    }]
                }
            }
        };
    }
}

module.exports = NotionListItemSerializer;
