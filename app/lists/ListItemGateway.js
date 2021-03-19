class ListItemGateway {
    constructor() {
        this._id = 0;
        /** @type {import('./Note')[]} */
        this._listItems = [];
    }

    /** @param {string} name */
    findByName(name) {
        return this._listItems.filter(n => n.name === name);
    }

    /** @param {import('./ListItem')} listItem */
    create(listItem) {
        const createdListItem = listItem.clone({ id: ++this._id });
        this._listItems.push(createdListItem);
        return createdListItem;
    }

    /** @param {number} id */
    deleteById(id) {
        const index = this._listItems.findIndex(r => r.id === id);
        if (index !== -1) {
            this._listItems.splice(index, 1);
        }
    }
}

module.exports = ListItemGateway;
