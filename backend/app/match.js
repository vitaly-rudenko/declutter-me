import { EntryMatchers, InputType, PatternBuilder, PatternMatcher, RussianDateParser } from '@vitalyrudenko/templater';
import { MatchError } from './errors/MatchError.js';
import { NotionEntry } from './notion/NotionEntry.js';
import { NotionEntrySerializer } from './notion/NotionEntrySerializer.js';
import { NotionProperty } from './notion/NotionProperty.js';
import { mergeFields } from './utils/mergeFields.js';

const MatchResultStatus = {
    MATCHED: 'matched',
    SAVED: 'saved',
    FAILED: 'failed',
};

const noopAsync = async (status, options) => {}

export async function match({ text, user, storage, notion, sendMatchResult = noopAsync }) {
    const templates = await storage.findTemplatesByUserId(user.id);

    const dateParser = new RussianDateParser();
    const patternMatcher = new PatternMatcher();
    const entryMatchers = new EntryMatchers({ dateParser });

    for (const template of templates) {
        const result = patternMatcher.match(
            text,
            new PatternBuilder().build(template.pattern),
            entryMatchers,
            { returnCombination: true }
        );

        if (!result) continue;

        const fields = mergeFields(template.defaultFields, result.fields)
        const { combination } = result

        const databaseField = fields.find(field => field.inputType === InputType.DATABASE)
        if (!databaseField) {
            throw new MatchError('DATABASE_NOT_SPECIFIED')
        }

        const databaseAlias = databaseField.value;
        const database = await storage.findDatabaseByAlias(user.id, databaseAlias);
        if (!database) {
            throw new MatchError('DATABASE_NOT_FOUND', { databaseAlias })
        }

        let pageId, pageUrl;

        await sendMatchResult(MatchResultStatus.MATCHED, { database, fields, pageId, pageUrl, result });
        try {
            const notionDatabase = await notion.databases.retrieve({ database_id: database.notionDatabaseId });
            const entry = new NotionEntry({
                databaseId: notionDatabase.id,
                fields,
                properties: Object.entries(notionDatabase.properties)
                    .map(([name, options]) => new NotionProperty({
                        type: options.type,
                        name,
                    }))
            });
            
            const page = await notion.pages.create(
                new NotionEntrySerializer({
                    dateParser,
                }).serialize(
                    entry,
                    user,
                )
            );

            pageId = page.id;
            pageUrl = page.url;
        } catch (error) {
            sendMatchResult(MatchResultStatus.FAILED, { database, fields, pageId, pageUrl, result, error: error.message }).catch(() => {});
            throw error;
        }

        await sendMatchResult(MatchResultStatus.SAVED, { database, fields, pageId, pageUrl, result });
        return {
            match: {
                fields,
                combination,
                database,
                notion: {
                    pageId,
                    pageUrl,
                }
            }
        };
    }

    return { match: null }
}
