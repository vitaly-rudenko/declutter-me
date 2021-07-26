module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE TABLE notion_accounts (
                user_id VARCHAR,
                token VARCHAR,
                PRIMARY KEY (user_id, token)
            );
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            DROP TABLE notion_accounts;
        `);
    },
};
