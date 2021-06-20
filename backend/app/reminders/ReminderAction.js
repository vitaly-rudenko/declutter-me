const Reminder = require('./Reminder');

class ReminderAction {
    constructor({ reminderGateway }) {
        this._reminderGateway = reminderGateway;
    }

    async execute(context) {
        if (context.date <= new Date()) {
            throw new Error('Reminder cannot be created in the past');
        }

        await this._reminderGateway.create(
            new Reminder({
                date: context.date,
                body: context.body,
            })
        );

        return true;
    }
}

module.exports = ReminderAction;
