module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            BEGIN;
            DELETE FROM notion_accounts;
            ALTER TABLE notion_accounts DROP CONSTRAINT notion_accounts_pkey;
            ALTER TABLE notion_accounts ADD PRIMARY KEY (user_id);
            COMMIT;
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            BEGIN;
            ALTER TABLE notion_accounts DROP CONSTRAINT notion_accounts_pkey;
            ALTER TABLE notion_accounts ADD PRIMARY KEY (user_id, token);
            COMMIT;
        `);
    },
};
