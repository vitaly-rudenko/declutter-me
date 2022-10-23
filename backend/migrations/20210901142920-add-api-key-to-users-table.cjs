module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            BEGIN;
            ALTER TABLE users ADD COLUMN api_key VARCHAR;
            UPDATE users SET api_key = uuid_generate_v4();
            ALTER TABLE users ALTER COLUMN api_key SET NOT NULL;
            COMMIT;
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            ALTER TABLE users DROP COLUMN api_key;
        `);
    },
};
