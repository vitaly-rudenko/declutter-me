module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            BEGIN;
            ALTER TABLE users ALTER COLUMN language SET NOT NULL;
            ALTER TABLE users ALTER COLUMN timezone_offset_minutes SET NOT NULL;
            COMMIT;
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            BEGIN;
            ALTER TABLE users ALTER COLUMN language DROP NOT NULL;
            ALTER TABLE users ALTER COLUMN timezone_offset_minutes DROP NOT NULL;
            COMMIT;
        `);
    },
};
