import dotenv from 'dotenv'
dotenv.config()

import { SqliteStorage } from '../app/storage/SqliteStorage.js';

async function run() {
    const storage = new SqliteStorage('database.db');
    storage.setup()
}

run()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
