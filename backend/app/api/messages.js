import { NotionAccountNotFound } from '../errors/NotionAccountNotFound';
import { match } from '../match';

export function sendMessage({ storage, notionSessionManager }) {
    return async (req, res) => {
        try {
            const apiKey = req.get('api-key')
            if (!apiKey) {
                return res.status(422).json({ error: { code: 'API_KEY_NOT_PROVIDED' } });
            }
    
            const text = req.body.text
            if (!text) {
                return res.status(422).json({ error: { code: 'TEXT_NOT_PROVIDED' } });
            }
    
            const user = await storage.findUserByApiKey(apiKey);
            if (!user) {
                return res.status(401).json({ error: { code: 'API_KEY_NOT_FOUND' } });
            }
    
            let notion;
            try {
                ([notion] = await notionSessionManager.get(user.id));
            } catch (error) {
                if (error instanceof NotionAccountNotFound) {
                    return res.status(400).json({ error: { code: 'NOTION_ACCOUNT_NOT_CONFIGURED' } });
                }
    
                throw error;
            }
    
            const result = await match({
                user,
                notion,
                storage,
                text,
            });
    
            if (!result.match) {
                return res.status(404).json({ match: null });
            }
    
            res.json({
                match: {
                    fields: result.match.fields.map(field => ({
                        name: field.name,
                        inputType: field.inputType,
                        value: field.value,
                    })),
                    database: {
                        alias: result.match.database.alias,
                        notionDatabaseUrl: result.match.database.notionDatabaseUrl,
                    },
                    notionPage: {
                        id: result.match.notion.pageId,
                        url: result.match.notion.pageUrl,
                    },
                    combination: result.match.combination,
                }
            });
        } catch (error) {
            res.status(500).json({
                error: {
                    code: 'UNEXPECTED_ERROR',
                    message: error.message,
                }
            });
        }
    }
}
