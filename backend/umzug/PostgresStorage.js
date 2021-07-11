export class PostgresStorage {
    /**
   * @param {import('pg').Pool} connectionPool Postgres connection pool
   * @param {string} tableName Name of the migrations meta table
   */
    constructor(connectionPool, tableName) {
        this.pool = connectionPool;
        this.tableName = tableName;
    }

    async logMigration(migrationName) {
        await this.init();

        await this.pool.query(`
            INSERT INTO ${this.tableName}(name)
            VALUES ('${migrationName}')
            ON CONFLICT DO NOTHING;
        `);
    }

    async unlogMigration(migrationName) {
        await this.init();

        await this.pool.query(`
            DELETE FROM ${this.tableName}
            WHERE name = '${migrationName}';
        `);
    }

    async executed() {
        await this.init();

        const { rows } = await this.pool.query(`
            SELECT name FROM ${this.tableName};
        `);

        return rows.map(row => row.name);
    }

    async init() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                name varchar(255) PRIMARY KEY
            );
        `);
    }
}
