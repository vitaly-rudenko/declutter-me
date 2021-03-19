class ReminderGateway {
    constructor() {
        this._id = 0;
        /** @type {import('./Reminder')[]} */
        this._reminders = [];
    }

    /** @param {import('./Reminder')} reminder */
    create(reminder) {
        const createdReminder = reminder.clone({ id: ++this._id });
        this._reminders.push(createdReminder);
        return createdReminder;
    }

    /** @param {number} id */
    deleteById(id) {
        const index = this._reminders.findIndex(r => r.id === id);
        if (index !== -1) {
            this._reminders.splice(index, 1);
        }
    }
}

module.exports = ReminderGateway;
