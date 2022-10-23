module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `)
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {},
};
