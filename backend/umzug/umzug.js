import Umzug from 'umzug';
import pg from 'pg';
import { PostgresStorage } from './PostgresStorage.js';

const client = new pg.Client(process.env.DATABASE_URL);

export const umzug = new Umzug({
    storage: new PostgresStorage(client, 'migrations_meta'),
    migrations: {
        pattern: /\d+-.+\.cjs/,
        params: [client]
    }
});
