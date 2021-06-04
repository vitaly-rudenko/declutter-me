class NotionAccountNotFound extends Error {
    constructor() {
        super('Notion account has not been found');
    }
}

module.exports = NotionAccountNotFound;
