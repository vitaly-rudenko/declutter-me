import { escapeMd } from './escapeMd.js';

export function formatDatabases(databases, localize) {
    return databases.length > 0
        ? databases.map((database, i) => localize('output.databases.database', {
            index: i + 1,
            notionDatabaseUrl: database.notionDatabaseUrl,
            alias: escapeMd(database.alias),
        })).join('\n')
        : localize('output.databases.none')
}
