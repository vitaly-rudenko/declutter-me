module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE TABLE users (
                id VARCHAR PRIMARY KEY,
                language VARCHAR,
                timezone_offset_minutes INT
            );
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            DROP TABLE users;
        `);
    },
};
