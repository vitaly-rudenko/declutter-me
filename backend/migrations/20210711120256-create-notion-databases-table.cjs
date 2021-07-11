module.exports = {
    /** @param {import('pg').Pool} db */
    up: async (db) => {
        await db.query(`
            CREATE TABLE notion_databases (
                user_id VARCHAR,
                alias VARCHAR,
                notion_database_url VARCHAR,
                PRIMARY KEY (user_id, alias)
            );
        `);
    },

    /** @param {import('pg').Pool} db */
    down: async (db) => {
        await db.query(`
            DROP TABLE notion_databases;
        `);
    },
};
