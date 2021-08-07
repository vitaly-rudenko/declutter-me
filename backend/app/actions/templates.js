import pako from 'pako';
import base64url from 'base64url';
import { Field, InputType } from '@vitalyrudenko/templater';
import { Markup } from 'telegraf';
import { Language } from '../Language.js';
import { phases } from '../phases.js';
import { escapeMd } from '../utils/escapeMd.js';
import { formatPattern } from '../utils/formatPattern.js';
import { createGuideLink } from '../utils/createGuideLink.js';

export function addTemplateAction({ frontendDomain, userSessionManager, storage }) {
    return async (context) => {
        await context.answerCbQuery();
        await context.deleteMessage();

        userSessionManager.context(context.state.userId).defaultFields = [];
        
        const databases = await storage.findDatabasesByUserId(context.state.userId);
        if (databases.length > 0) {
            await context.reply(
                context.state.localize('command.templates.add.chooseDatabase'),
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(database.alias, 'template:add:database-alias:' + database.alias)),
                    Markup.button.callback(context.state.localize('command.templates.add.skipDatabase'), 'template:add:skip-database'),
                ], { columns: 2 })
            );
            userSessionManager.setPhase(context.state.userId, phases.template.database);
        } else {
            const templateBuilderLink = createTemplateBuilderLink({ frontendDomain, language: context.state.user?.language });
            await context.reply(
                context.state.localize('command.templates.add.sendTemplate', {
                    templateBuilderLink,
                    guideLink: createGuideLink({ language: context.state.user?.language }),
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            );

            userSessionManager.setPhase(context.state.userId, phases.template.pattern);
        }
    };
}

export function deleteTemplateAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();

        const templates = await storage.findTemplatesByUserId(context.state.userId);

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.delete.chooseTemplate'),
                Markup.inlineKeyboard([
                    ...templates.map((template, i) => Markup.button.callback(
                        formatPattern(template.pattern),
                        `templates:delete:template:${i}`
                    )),
                    Markup.button.callback(
                        context.state.localize('command.templates.delete.cancel'),
                        'templates:delete:cancel'
                    ),
                ], { columns: 1 })
            )
        ]);
    };
}

export function deleteTemplateByIndexAction({ storage }) {
    return async (context) => {
        await context.answerCbQuery();
        
        const index = Number(context.match[1]);
        const templates = await storage.findTemplatesByUserId(context.state.userId);
        const template = templates[index];

        if (!template) {
            return;
        }

        await storage.deleteTemplateByPattern(context.state.userId, template.pattern);

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.templates.delete.deleted', { template: formatPattern(template.pattern) })),
        ]);
    };
}

export function cancelDeleteTemplateAction() {
    return async (context) => {
        await context.answerCbQuery();

        await Promise.all([
            context.deleteMessage(),
            context.reply(context.state.localize('command.templates.delete.cancelled'))
        ]);
    };
}

export function reorderTemplatesAction({ frontendDomain, storage }) {
    return async (context) => {
        await context.answerCbQuery();

        const templates = await storage.findTemplatesByUserId(context.state.userId);
        const link = createTemplateManagerLink({ frontendDomain, templates, language: context.state.user?.language });

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.reorder.link', {
                    link,
                    linkLabel: escapeMd(link),
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            )
        ]);
    };
}

export function addTemplateWithDatabaseAction({ frontendDomain, userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();
        
        const databaseAlias = context.match[1];
        userSessionManager.context(context.state.userId)
            .defaultFields.push(new Field({ inputType: InputType.DATABASE, value: databaseAlias }));

        const templateBuilderLink = createTemplateBuilderLink({ frontendDomain, language: context.state.user?.language });
        
        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.add.databaseChosen', {
                    database: escapeMd(databaseAlias),
                    templateBuilderLink,
                    guideLink: createGuideLink({ language: context.state.user?.language }),
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            ),
        ]);

        userSessionManager.setPhase(context.state.userId, phases.template.pattern);
    };
}

export function addTemplateWithoutDatabase({ frontendDomain, userSessionManager }) {
    return async (context) => {
        await context.answerCbQuery();

        const templateBuilderLink = createTemplateBuilderLink({ frontendDomain, language: context.state.user?.language });

        await Promise.all([
            context.deleteMessage(),
            context.reply(
                context.state.localize('command.templates.add.sendTemplate', {
                    templateBuilderLink,
                    guideLink: createGuideLink({ language: context.state.user?.language }),
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            )
        ]);

        userSessionManager.setPhase(context.state.userId, phases.template.pattern);
    };
}

const linkLanguageMap = {
    [Language.ENGLISH]: 'en',
    [Language.RUSSIAN]: 'ru',
    [Language.UKRAINIAN]: 'uk',
};

export function createTemplateBuilderLink({ frontendDomain, pattern = null, test = null, language }) {
    const linkLanguage = linkLanguageMap[language] ?? 'en';
    const searchParams = new URLSearchParams()
    if (pattern) searchParams.append('pattern', pattern);
    if (test) searchParams.append('test', test);

    let queryParams = searchParams.toString();
    if (queryParams) {
        queryParams = '?' + queryParams;
    }
    
    return `${frontendDomain}/#/${linkLanguage}/builder${queryParams}`;
}

function encodeTemplates(templates) {
    return base64url.fromBase64(
        Buffer.from(
            pako.deflate(
                JSON.stringify(templates)
            )
        ).toString('base64')
    );
}

export function createTemplateManagerLink({ frontendDomain, templates, language }) {
    const linkLanguage = linkLanguageMap[language] ?? 'en';
    const searchParams = new URLSearchParams()
    searchParams.append('templates', encodeTemplates(templates.map(t => ({ pattern: t.pattern }))));
    
    return `${frontendDomain}/#/${linkLanguage}/manager?${searchParams.toString()}`;
}
