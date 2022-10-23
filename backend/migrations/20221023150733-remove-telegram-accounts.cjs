module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            BEGIN;
            UPDATE users SET id = (SELECT telegram_user_id FROM telegram_accounts WHERE user_id = user.id);
            DROP TABLE telegram_accounts;
            COMMIT;
        `)
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        // irreversible
    },
};
