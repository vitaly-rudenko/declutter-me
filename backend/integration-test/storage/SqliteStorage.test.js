import { promises as fs } from 'fs';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised'
import { User } from '../../app/users/User';
import { TelegramAccount } from '../../app/telegram/TelegramAccount';
import { NotionAccount } from '../../app/notion/NotionAccount';
import { NotionDatabase } from '../../app/notion/NotionDatabase';
import { Template } from '../../app/templates/Template';
import { Field } from '../../app/fields/Field';
import { SqliteStorage } from '../../app/storage/SqliteStorage';
import { Language } from '../../app/Language';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('SqliteStorage', () => {
    /** @type {SqliteStorage} */
    let sqliteStorage;

    beforeEach(() => {
        sqliteStorage = new SqliteStorage('test.db');
        sqliteStorage.setup();
    });

    afterEach(async () => {
        await fs.unlink(path.join(process.cwd(), 'test.db'));
    })

    it('should implement User flow', async () => {
        expect(await sqliteStorage.findUserById('non-existing-user-id')).to.be.null;

        const user = await sqliteStorage.createUser(
            new User({ language: Language.UKRAINIAN, timezoneOffsetMinutes: 180 })
        );

        expect(typeof user.id === 'number').to.be.true
        expect(user.language).to.equal(Language.UKRAINIAN);
        expect(user.timezoneOffsetMinutes).to.equal(180);

        expect(await sqliteStorage.findUserById(user.id)).to.deep.equal(user);

        const updatedUser = await sqliteStorage.updateUser(
            new User({
                id: user.id,
                language: Language.ENGLISH,
                timezoneOffsetMinutes: -60,
            })
        );

        expect(user.id).to.equal(updatedUser.id);
        expect(await sqliteStorage.findUserById(user.id)).to.deep.equal(updatedUser);
    });

    it('should implement TelegramAccount flow', async () => {
        expect(await sqliteStorage.findTelegramAccountByTelegramUserId('fake-telegram-user-id'))
            .to.be.null;

        const telegramAccount = await sqliteStorage.createTelegramAccount(
            new TelegramAccount({ userId: 'fake-user-id', telegramUserId: 'fake-telegram-user-id' })
        );

        expect(telegramAccount.userId).to.equal('fake-user-id');
        expect(telegramAccount.telegramUserId).to.equal('fake-telegram-user-id');

        expect(await sqliteStorage.findTelegramAccountByTelegramUserId('fake-telegram-user-id'))
            .to.deep.equal(telegramAccount);
    });

    it('should implement NotionAccount flow', async () => {
        expect(await sqliteStorage.findNotionAccountByUserId('fake-user-id'))
            .to.be.null;

        const notionAccount = await sqliteStorage.createNotionAccount(
            new NotionAccount({ userId: 'fake-user-id', token: 'fake-token' })
        );

        expect(notionAccount.userId).to.equal('fake-user-id');
        expect(notionAccount.token).to.equal('fake-token');

        expect(await sqliteStorage.findNotionAccountByUserId('fake-user-id'))
            .to.deep.equal(notionAccount);
    });

    it('should implement Database flow [Notion]', async () => {
        expect(await sqliteStorage.findDatabaseByAlias('fake-user-id', 'fake-alias'))
            .to.be.null;
        expect(await sqliteStorage.findDatabasesByUserId('fake-user-id'))
            .to.deep.equal([]);

        const database = await sqliteStorage.storeDatabase(
            new NotionDatabase({
                userId: 'fake-user-id',
                alias: 'fake-alias',
                notionDatabaseId: 'fake-notion-database-id'
            })
        );

        expect(database.userId).to.equal('fake-user-id');
        expect(database.alias).to.equal('fake-alias');
        expect(database.notionDatabaseId).to.equal('fake-notion-database-id');

        expect(await sqliteStorage.findDatabaseByAlias('fake-user-id', 'fake-alias'))
            .to.deep.equal(database);
        expect(await sqliteStorage.findDatabasesByUserId('fake-user-id'))
            .to.deep.equal([database]);

        await sqliteStorage.deleteDatabaseByAlias('fake-user-id', 'fake-alias');

        expect(await sqliteStorage.findDatabaseByAlias('fake-user-id', 'fake-alias'))
            .to.be.null;
        expect(await sqliteStorage.findDatabasesByUserId('fake-user-id'))
            .to.deep.equal([]);
    });

    it('should implement Template flow', async () => {
        expect(await sqliteStorage.findTemplatesByUserId('fake-user-id'))
            .to.deep.equal([]);

        const template = await sqliteStorage.storeTemplate(
            new Template({
                userId: 'fake-user-id',
                pattern: 'fake-pattern',
                order: 123,
                defaultFields: [
                    new Field({ value: 'my-field-1' }),
                    new Field({ value: 'my-field-2', name: 'my-name-1' }),
                    new Field({ value: 'my-field-3', name: 'my-name-2', inputType: 'my-input-type' }),
                    new Field({ value: 'my-field-4', name: 'my-name-3', inputType: 'my-input-type', bang: true }),
                ]
            })
        );

        expect(template.userId).to.equal('fake-user-id');
        expect(template.pattern).to.equal('fake-pattern');
        expect(template.order).to.equal(123);
        expect(template.defaultFields).to.deep.equal([
            new Field({ value: 'my-field-1' }),
            new Field({ value: 'my-field-2', name: 'my-name-1' }),
            new Field({ value: 'my-field-3', name: 'my-name-2', inputType: 'my-input-type' }),
            new Field({ value: 'my-field-4', name: 'my-name-3', inputType: 'my-input-type', bang: true }),
        ]);

        expect(await sqliteStorage.findTemplatesByUserId('fake-user-id'))
            .to.deep.equal([template]);

        await sqliteStorage.deleteTemplateByPattern('fake-user-id', 'fake-pattern');
    });

    it('should automatically assign order of the template when not provided', async () => {
        expect((await sqliteStorage.storeTemplate(
            new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-1' })
        )).order).to.equal(1);

        expect((await sqliteStorage.storeTemplate(
            new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-2' })
        )).order).to.equal(2);

        expect((await sqliteStorage.storeTemplate(
            new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-3' })
        )).order).to.equal(3);

        expect((await sqliteStorage.storeTemplate(
            new Template({ userId: 'fake-user-id-2', pattern: 'fake-pattern-1' })
        )).order).to.equal(1);

        expect((await sqliteStorage.storeTemplate(
            new Template({ userId: 'fake-user-id-2', pattern: 'fake-pattern-2' })
        )).order).to.equal(2);
    });

    it('should update templates by their pattern', async () => {
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-1', order: 1 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-2', order: 2 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-2', pattern: 'fake-pattern-3', order: 3 }));

        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-1', order: 4 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-2', order: 5 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id-2', pattern: 'fake-pattern-3', order: 6 }));

        expect(await sqliteStorage.findTemplatesByUserId('fake-user-id-1'))
            .to.deep.eq([
                new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-1', order: 4 }),
                new Template({ userId: 'fake-user-id-1', pattern: 'fake-pattern-2', order: 5 }),
            ]);
        
        expect(await sqliteStorage.findTemplatesByUserId('fake-user-id-2'))
            .to.deep.eq([
                new Template({ userId: 'fake-user-id-2', pattern: 'fake-pattern-3', order: 6 }),
            ]);
    });

    it('should order templates by their order', async () => {
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-1', order: 7 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-2', order: 3 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-3', order: 2 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-4', order: 1 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-5', order: 5 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-6', order: 4 }));
        await sqliteStorage.storeTemplate(new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-7', order: 6 }));

        expect(await sqliteStorage.findTemplatesByUserId('fake-user-id'))
            .to.deep.eq([
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-4', order: 1 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-3', order: 2 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-2', order: 3 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-6', order: 4 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-5', order: 5 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-7', order: 6 }),
                new Template({ userId: 'fake-user-id', pattern: 'fake-pattern-1', order: 7 }),
            ]);
    })
});