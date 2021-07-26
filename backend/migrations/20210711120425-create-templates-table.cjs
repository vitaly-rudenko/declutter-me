module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE TABLE templates (
                user_id VARCHAR,
                pattern TEXT,
                "order" INT,
                default_fields TEXT,
                PRIMARY KEY (user_id, pattern)
            );
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            DROP TABLE templates;
        `);
    },
};
