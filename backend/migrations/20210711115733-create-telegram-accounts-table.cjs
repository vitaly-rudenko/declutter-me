module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE TABLE telegram_accounts (
                user_id VARCHAR,
                telegram_user_id BIGINT,
                PRIMARY KEY (user_id, telegram_user_id)
            );
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            DROP TABLE telegram_accounts;
        `);
    },
};
