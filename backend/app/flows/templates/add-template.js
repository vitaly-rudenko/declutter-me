import { Field, InputType } from '@vitalyrudenko/templater';
import { Markup } from 'telegraf';
import { linkLanguageMap } from '../../linkLanguageMap.js';
import { phases } from '../../phases.js';
import { Template } from '../../templates/Template.js';
import { createGuideLink } from '../../utils/createGuideLink.js';
import { escapeMd } from '@vitalyrudenko/telegramify'

// -- "add" button clicked
export function templatesAddAction({ frontendDomain, userSessionManager, storage }) {
    return async (context) => {
        await context.answerCbQuery();
        await context.deleteMessage();

        userSessionManager.context(context.state.userId).defaultFields = [];
        
        const databases = await storage.findDatabasesByUserId(context.state.userId);
        if (databases.length > 0) {
            await context.reply(
                context.state.localize('command.templates.add.chooseDatabase'),
                Markup.inlineKeyboard([
                    ...databases.map(database => Markup.button.callback(database.alias, `template:add:database:${database.alias}`)),
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

// -- database selected
export function templatesAddWithDatabaseAction({ frontendDomain, userSessionManager }) {
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

// -- "skip database" button clicked
export function templatesAddWithoutDatabaseAction({ frontendDomain, userSessionManager }) {
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

// -- template pattern sent
export function templatesAddPatternMessage({ storage, userSessionManager }) {
    return async (context) => {
        if (!('text' in context.message)) return;

        const { defaultFields } = userSessionManager.context(context.state.userId);

        const pattern = context.message.text.replace(/\\n/g, '\n');

        const template = await storage.storeTemplate(
            new Template({
                pattern,
                defaultFields,
                userId: context.state.userId,
            })
        );

        userSessionManager.clear(context.state.userId);

        await context.reply(
            context.state.localize('command.templates.add.added'),
            Markup.inlineKeyboard([
                Markup.button.callback(
                    context.state.localize('command.templates.defaultFields.add'),
                    `template:add-default-fields:${template.getHash()}`
                ),
            ])
        );
    };
}

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
