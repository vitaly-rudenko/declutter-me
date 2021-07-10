import dotenv from 'dotenv'
dotenv.config()

import { promises as fs } from 'fs';
import path from 'path';

async function run() {
    await fs.unlink(path.join(process.cwd(), 'database.db'));
}

run()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
