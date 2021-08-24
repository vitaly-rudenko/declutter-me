import pako from 'pako';
import base64url from 'base64url';
import { escapeMd } from '../../utils/escapeMd.js';
import { formatTemplates } from '../../utils/formatTemplates.js';
import { linkLanguageMap } from '../../linkLanguageMap.js';

// -- /templates reorder command
const TEMPLATES_REORDER_REGEX = /\/templates reorder\n(.+)/s;

export function templatesReorderCommand({ storage }) {
    return async (context, next) => {
        if (!TEMPLATES_REORDER_REGEX.test(context.message.text)) {
            await next();
            return;
        }
        
        const databases = await storage.findDatabasesByUserId(context.state.userId);
        const [_, match] = context.message.text.match(TEMPLATES_REORDER_REGEX);

        const patterns = match.split('\n').filter(Boolean).map(p => p.replace(/\\n/g, '\n'));
        const templates = await storage.findTemplatesByUserId(context.state.userId);

        let partialSuccess = false;
        let order = 0;
        for (const pattern of patterns) {
            const existingTemplate = templates.find(t => t.pattern === pattern);
            if (!existingTemplate) {
                partialSuccess = true;
                continue;
            }

            order++;
            await storage.storeTemplate(existingTemplate.clone({ order }))
        }

        for (const template of templates) {
            if (patterns.includes(template.pattern)) continue;
            partialSuccess = true;

            order++;
            await storage.storeTemplate(template.clone({ order }))
        }

        const updatedTemplates = await storage.findTemplatesByUserId(context.state.userId);

        if (partialSuccess) {
            await context.reply(
                context.state.localize('command.templates.reorder.partialSuccess', {
                    templates: formatTemplates(updatedTemplates, databases, context.state.localize)
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            );
        } else {
            await context.reply(
                context.state.localize('command.templates.reorder.success', {
                    templates: formatTemplates(updatedTemplates, databases, context.state.localize)
                }),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
            );
        }
    };
}

// -- "reorder" button clicked
export function templatesReorderAction({ frontendDomain, storage }) {
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

