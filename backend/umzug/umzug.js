import Umzug from 'umzug';
import pg from 'pg';
import { PostgresStorage } from './PostgresStorage.js';

const pool = new pg.Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
});

export const umzug = new Umzug({
    storage: new PostgresStorage(pool, 'migrations_meta'),
    migrations: {
        pattern: /\d+-.+\.cjs/,
        params: [pool]
    }
});
