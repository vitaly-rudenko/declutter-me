import { EntryMatchers, InputType, PatternBuilder, PatternMatcher, RussianDateParser, TokenType } from '@vitalyrudenko/templater';
import { Markup } from 'telegraf';
import { NotionEntry } from '../notion/NotionEntry.js';
import { NotionEntrySerializer } from '../notion/NotionEntrySerializer.js';
import { NotionProperty } from '../notion/NotionProperty.js';
import { escapeMd } from '../utils/escapeMd.js';
import { mergeFields } from '../utils/mergeFields.js';

// -- message is sent
const MatchResultStatus = {
    MATCHED: 'matched',
    SAVED: 'saved',
    FAILED: 'failed',
};

export function matchMessage({ bot, storage }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const { userId, user } = context.state;

        /** @type {import('@notionhq/client').Client} */
        const notion = context.state.notion;

        const templates = await storage.findTemplatesByUserId(userId);

        const dateParser = new RussianDateParser();
        const patternMatcher = new PatternMatcher();
        const entryMatchers = new EntryMatchers({ dateParser });

        for (const template of templates) {
            const result = patternMatcher.match(
                context.message.text,
                new PatternBuilder().build(template.pattern),
                entryMatchers,
                { returnCombination: true }
            );

            if (!result) continue;

            const fields = mergeFields(template.defaultFields, result.fields)

            const databaseField = fields.find(field => field.inputType === InputType.DATABASE)
            if (!databaseField) {
                await context.reply(context.state.localize('match.noDatabaseSpecified'));
                return;
            }

            const databaseAlias = databaseField.value;
            const database = await storage.findDatabaseByAlias(userId, databaseAlias);
            if (!database) {
                await context.reply(context.state.localize('match.databaseNotFound', { database: databaseAlias }));
                return;
            }

            let message, pageId, pageUrl;
            async function sendMatchResult(status, { error } = {}) {
                const text = formatMatchResult({ status, database, fields, localize: context.state.localize, result, error });
                const options = {
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true,
                    reply_markup: pageId && pageUrl && Markup.inlineKeyboard([
                        Markup.button.url(context.state.localize('match.open'), pageUrl),
                        Markup.button.callback(context.state.localize('match.undo'), `undo:notion:${pageId}`)
                    ], { columns: 2 }).reply_markup,
                };
    
                if (message) {
                    await bot.telegram.editMessageText(message.chat.id, message.message_id, null, text, options);
                } else {
                    message = await context.reply(text, options);
                }
            }

            await sendMatchResult(MatchResultStatus.MATCHED);
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
                sendMatchResult(MatchResultStatus.FAILED, { error: error.message })
                    .catch(() => {});
                throw error;
            }

            await sendMatchResult(MatchResultStatus.SAVED);
            return;
        }

        await context.reply(context.state.localize('match.notMatch'));
    };
}

function formatMatchResult({ status, result, fields, database, localize, error }) {
    return localize(`match.${status}`, {
        ...error && { error: escapeMd(error) },
        match: formatCombination(result.combination, fields),
        databaseAlias: escapeMd(database.alias),
        databaseUrl: database.notionDatabaseUrl,
        fields: fields
            .filter(field => field.inputType !== InputType.DATABASE)
            .map((field) => localize(
                'match.field',
                {
                    name: escapeMd(field.name),
                    value: escapeMd(Array.isArray(field.value) ? field.value.join(', '): field.value)
                }
            )).join('\n')
    });
}

export function formatCombination(combination, fields) {
    const fieldIndex = new Map();
    
    return combination.map((token) => {
        if (token.type === TokenType.VARIABLE) {
            const field = fields.find(f => f.name === token.value);

            if (Array.isArray(field.value)) {
                if (!fieldIndex.has(field)) {
                    fieldIndex.set(field, 0);
                } else {
                    fieldIndex.set(field, fieldIndex.get(field) + 1);
                }

                return `__*${escapeMd(field.value[fieldIndex.get(field)])}*__`;
            }

            return `__*${escapeMd(field.value)}*__`;
        }

        return escapeMd(token.value);
    }).join('');
}

// -- "undo" button clicked
export function matchNotionUndoAction() {
    return async (context) => {
        await context.answerCbQuery();

        context.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                Markup.button.callback(context.state.localize('match.undoInProcess'), 'fake-button'),
            ]).reply_markup,
        ).catch(() => {});

        /** @type {import('@notionhq/client').Client} */
        const notion = context.state.notion;
        const pageId = context.match[1];

        await notion.pages.update({
            page_id: pageId,
            archived: true,
            properties: {},
        });

        await context.editMessageText(context.state.localize('match.undoSuccessful'));
    };
}
