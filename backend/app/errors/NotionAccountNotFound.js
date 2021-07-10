export class NotionAccountNotFound extends Error {
    constructor() {
        super('Notion account has not been found');
    }
}
