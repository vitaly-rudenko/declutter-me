import crypto from 'crypto';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised'
import { v4 as uuid } from 'uuid'
import { User } from '../../app/users/User.js';
import { TelegramAccount } from '../../app/telegram/TelegramAccount.js';
import { NotionAccount } from '../../app/notion/NotionAccount.js';
import { NotionDatabase } from '../../app/notion/NotionDatabase.js';
import { Template } from '../../app/templates/Template.js';
import { Field } from '@vitalyrudenko/templater';
import { PostgresStorage } from '../../app/storage/PostgresStorage.js';
import { Language } from '../../app/Language.js';

const { expect } = chai;
chai.use(chaiAsPromised);

const createStringGenerator = (prefix) => {
    return () => prefix + crypto.randomBytes(10).toString('hex');
};

const generateUserId = () => uuid();
const generateApiKey = () => uuid();
const generateTelegramUserId = () => Math.floor(Date.now() / 100) * 100 + Math.floor(Math.random() * 100);
const generateNotionToken = createStringGenerator('token-');
const generateDatabaseAlias = createStringGenerator('alias-');
const generateNotionDatabaseUrl = createStringGenerator('http://notion.example.com/');

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

describe('PostgresStorage', () => {
    /** @type {PostgresStorage} */
    let postgresStorage;

    before(async () => {
        postgresStorage = new PostgresStorage(process.env.DATABASE_URL);
        await postgresStorage.connect();
    });

    it('should implement User flow', async () => {
        expect(await postgresStorage.findUserById(123)).to.be.null;

        const user = await postgresStorage.createUser(
            new User({ language: Language.UKRAINIAN, timezoneOffsetMinutes: 180, apiKey: 'fake-api-key' })
        );

        expect(typeof user.id === 'string').to.be.true
        expect(user.language).to.equal(Language.UKRAINIAN);
        expect(user.timezoneOffsetMinutes).to.equal(180);
        expect(user.apiKey).to.equal('fake-api-key');

        expect(await postgresStorage.findUserById(user.id)).to.deep.equal(user);

        const updatedUser = await postgresStorage.updateUser(
            new User({
                id: user.id,
                language: Language.ENGLISH,
                timezoneOffsetMinutes: -60,
                apiKey: 'updated-fake-api-key',
            })
        );

        expect(user.id).to.equal(updatedUser.id);
        expect(await postgresStorage.findUserById(user.id)).to.deep.equal(updatedUser);
    });

    it('should implement TelegramAccount flow', async () => {
        const userId = generateUserId()
        const telegramUserId = generateTelegramUserId()

        expect(await postgresStorage.findTelegramAccountByTelegramUserId(telegramUserId))
            .to.be.null;

        const telegramAccount = await postgresStorage.createTelegramAccount(
            new TelegramAccount({ userId, telegramUserId: telegramUserId })
        );

        expect(telegramAccount.userId).to.equal(userId);
        expect(telegramAccount.telegramUserId).to.equal(telegramUserId);

        expect(await postgresStorage.findTelegramAccountByTelegramUserId(telegramUserId))
            .to.deep.equal(telegramAccount);
    });

    it('should implement NotionAccount flow', async () => {
        const userId = generateUserId()
        const token = generateNotionToken()

        expect(await postgresStorage.findNotionAccountByUserId(userId))
            .to.be.null;

        const notionAccount = await postgresStorage.upsertNotionAccount(
            new NotionAccount({ userId, token })
        );

        expect(notionAccount.userId).to.equal(userId);
        expect(notionAccount.token).to.equal(token);

        expect(await postgresStorage.findNotionAccountByUserId(userId))
            .to.deep.equal(notionAccount);
    });

    it('should implement Database flow [Notion]', async () => {
        const userId = generateUserId()
        const alias = generateDatabaseAlias()
        const notionDatabaseUrl = generateNotionDatabaseUrl()

        expect(await postgresStorage.findDatabaseByAlias(userId, alias))
            .to.be.null;
        expect(await postgresStorage.findDatabasesByUserId(userId))
            .to.deep.equal([]);

        const database = await postgresStorage.storeDatabase(
            new NotionDatabase({
                userId,
                alias,
                notionDatabaseUrl,
            })
        );

        expect(database.userId).to.equal(userId);
        expect(database.alias).to.equal(alias);
        expect(database.notionDatabaseUrl).to.equal(notionDatabaseUrl);

        expect(await postgresStorage.findDatabaseByAlias(userId, alias))
            .to.deep.equal(database);
        expect(await postgresStorage.findDatabasesByUserId(userId))
            .to.deep.equal([database]);

        await postgresStorage.deleteDatabaseByAlias(userId, alias);

        expect(await postgresStorage.findDatabaseByAlias(userId, alias))
            .to.be.null;
        expect(await postgresStorage.findDatabasesByUserId(userId))
            .to.deep.equal([]);
    });

    it('should implement Template flow', async () => {
        const userId = generateUserId()
        
        expect(await postgresStorage.findTemplatesByUserId(userId))
            .to.deep.equal([]);
        
        const pattern = 'fake-pattern';
        const template = await postgresStorage.storeTemplate(
            new Template({
                userId,
                pattern,
                order: 123,
                defaultFields: [
                    new Field({ value: 'my-field-1' }),
                    new Field({ value: 'my-field-2', name: 'my-name-1' }),
                    new Field({ value: 'my-field-3', name: 'my-name-2', inputType: 'my-input-type' }),
                    new Field({ value: 'my-field-4', name: 'my-name-3', inputType: 'my-input-type' }),
                ]
            })
        );

        expect(template.userId).to.equal(userId);
        expect(template.pattern).to.equal(pattern);
        expect(template.order).to.equal(123);
        expect(template.defaultFields).to.deep.equal([
            new Field({ value: 'my-field-1' }),
            new Field({ value: 'my-field-2', name: 'my-name-1' }),
            new Field({ value: 'my-field-3', name: 'my-name-2', inputType: 'my-input-type' }),
            new Field({ value: 'my-field-4', name: 'my-name-3', inputType: 'my-input-type' }),
        ]);

        expect(await postgresStorage.findTemplatesByUserId(userId))
            .to.deep.equal([template]);

        expect(await postgresStorage.findTemplateByHash(userId, md5(pattern)))
            .to.deep.equal(template);
        
        expect(await postgresStorage.findTemplateByHash(userId, md5('other-pattern')))
            .to.be.null;
        
        expect(await postgresStorage.findTemplateByHash('other-user-id', md5(pattern)))
            .to.be.null;

        await postgresStorage.deleteTemplateByPattern(userId, pattern);

        expect(await postgresStorage.findTemplatesByUserId(userId))
            .to.deep.equal([]);

        expect(await postgresStorage.findTemplateByHash(userId, md5(pattern)))
            .to.be.null;
    });

    it('should automatically assign order of the template when not provided', async () => {
        const userId1 = generateUserId()
        const userId2 = generateUserId()

        expect((await postgresStorage.storeTemplate(
            new Template({ userId: userId1, pattern: 'fake-pattern-1' })
        )).order).to.equal(1);

        expect((await postgresStorage.storeTemplate(
            new Template({ userId: userId1, pattern: 'fake-pattern-2' })
        )).order).to.equal(1);

        expect((await postgresStorage.storeTemplate(
            new Template({ userId: userId1, pattern: 'fake-pattern-3' })
        )).order).to.equal(1);

        expect(await postgresStorage.findTemplatesByUserId(userId1))
            .to.deep.eq([
                new Template({ userId: userId1, pattern: 'fake-pattern-3', order: 1 }),
                new Template({ userId: userId1, pattern: 'fake-pattern-2', order: 2 }),
                new Template({ userId: userId1, pattern: 'fake-pattern-1', order: 3 }),
            ]);

        expect((await postgresStorage.storeTemplate(
            new Template({ userId: userId2, pattern: 'fake-pattern-1' })
        )).order).to.equal(1);

        expect((await postgresStorage.storeTemplate(
            new Template({ userId: userId2, pattern: 'fake-pattern-2' })
        )).order).to.equal(1);

        expect(await postgresStorage.findTemplatesByUserId(userId2))
            .to.deep.eq([
                new Template({ userId: userId2, pattern: 'fake-pattern-2', order: 1 }),
                new Template({ userId: userId2, pattern: 'fake-pattern-1', order: 2 }),
            ]);
    });

    it('should update templates by their pattern', async () => {
        const userId1 = generateUserId()
        const userId2 = generateUserId()

        await postgresStorage.storeTemplate(new Template({ userId: userId1, pattern: 'fake-pattern-1', order: 1 }));
        await postgresStorage.storeTemplate(new Template({ userId: userId1, pattern: 'fake-pattern-2', order: 2 }));
        await postgresStorage.storeTemplate(new Template({ userId: userId2, pattern: 'fake-pattern-3', order: 3 }));

        await postgresStorage.storeTemplate(new Template({ userId: userId1, pattern: 'fake-pattern-1', order: 4 }));
        await postgresStorage.storeTemplate(new Template({ userId: userId1, pattern: 'fake-pattern-2', order: 5 }));
        await postgresStorage.storeTemplate(new Template({ userId: userId2, pattern: 'fake-pattern-3', order: 6 }));

        expect(await postgresStorage.findTemplatesByUserId(userId1))
            .to.deep.eq([
                new Template({ userId: userId1, pattern: 'fake-pattern-1', order: 4 }),
                new Template({ userId: userId1, pattern: 'fake-pattern-2', order: 5 }),
            ]);
        
        expect(await postgresStorage.findTemplatesByUserId(userId2))
            .to.deep.eq([
                new Template({ userId: userId2, pattern: 'fake-pattern-3', order: 6 }),
            ]);
    });

    it('should order templates by their order', async () => {
        const userId = generateUserId()

        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-1', order: 7 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-2', order: 3 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-3', order: 2 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-4', order: 1 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-5', order: 5 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-6', order: 4 }));
        await postgresStorage.storeTemplate(new Template({ userId, pattern: 'fake-pattern-7', order: 6 }));

        expect(await postgresStorage.findTemplatesByUserId(userId))
            .to.deep.eq([
                new Template({ userId, pattern: 'fake-pattern-4', order: 1 }),
                new Template({ userId, pattern: 'fake-pattern-3', order: 2 }),
                new Template({ userId, pattern: 'fake-pattern-2', order: 3 }),
                new Template({ userId, pattern: 'fake-pattern-6', order: 4 }),
                new Template({ userId, pattern: 'fake-pattern-5', order: 5 }),
                new Template({ userId, pattern: 'fake-pattern-7', order: 6 }),
                new Template({ userId, pattern: 'fake-pattern-1', order: 7 }),
            ]);
    });
});