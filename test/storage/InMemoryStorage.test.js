const chai = require('chai');
const TelegramAccount = require('../../app/entities/TelegramAccount');
const NotionAccount = require('../../app/entities/NotionAccount');
const User = require('../../app/entities/User');
const InMemoryStorage = require('../../app/storage/InMemoryStorage');
const NotionAccountNotFound = require('../../app/storage/NotionAccountNotFound');
const NotionList = require('../../app/entities/NotionList');
const PatternBuilder = require('../../app/PatternBuilder');
const Template = require('../../app/entities/Template');

const { expect } = chai;
chai.use(require('chai-as-promised'));

describe('InMemoryStorage', () => {
    /** @type {InMemoryStorage} */
    let inMemoryStorage;

    beforeEach(() => {
        inMemoryStorage = new InMemoryStorage();
    });

    it('should implement user management', async () => {
        expect(await inMemoryStorage.findUser(1)).to.eq(null);
        expect(await inMemoryStorage.getUsers()).to.deep.eq([]);

        const user1 = await inMemoryStorage.createUser({ language: 'english', timezoneOffsetMinutes: 123 });
        const user2 = await inMemoryStorage.createUser({ language: 'ukrainian', timezoneOffsetMinutes: 146 });
        const user3 = await inMemoryStorage.createUser({ language: 'russian', timezoneOffsetMinutes: 0 });

        expect(user1).to.deep.eq(new User({ userId: 1, language: 'english', timezoneOffsetMinutes: 123 }));
        expect(user2).to.deep.eq(new User({ userId: 2, language: 'ukrainian', timezoneOffsetMinutes: 146 }));
        expect(user3).to.deep.eq(new User({ userId: 3, language: 'russian', timezoneOffsetMinutes: 0 }));

        expect(await inMemoryStorage.findUser(1)).to.eq(user1);
        expect(await inMemoryStorage.findUser(2)).to.eq(user2);
        expect(await inMemoryStorage.findUser(3)).to.eq(user3);
        expect(await inMemoryStorage.findUser(4)).to.be.null;

        expect(await inMemoryStorage.getUsers()).to.deep.eq([user1, user2, user3]);
    });

    describe('[with users]', () => {
        let user1, user2, user3;

        beforeEach(async () => {
            user1 = await inMemoryStorage.createUser({ language: 'english', timezoneOffsetMinutes: 123 });
            user2 = await inMemoryStorage.createUser({ language: 'ukrainian', timezoneOffsetMinutes: 146 });
            user3 = await inMemoryStorage.createUser({ language: 'russian', timezoneOffsetMinutes: 0 });    
        });
    
        it('should implement telegram account management', async () => {
            expect(await inMemoryStorage.findTelegramAccount(123456)).to.be.null;
            expect(await inMemoryStorage.findTelegramAccountByUserId(1)).to.be.null;

            const telegramAccount1 = await inMemoryStorage.createTelegramAccount(user1.userId, 123456);
            const telegramAccount2 = await inMemoryStorage.createTelegramAccount(user2.userId, 464646);
            const telegramAccount3 = await inMemoryStorage.createTelegramAccount(user3.userId, 868686);

            expect(telegramAccount1).to.deep.eq(new TelegramAccount({ userId: 1, telegramUserId: 123456 }));
            expect(telegramAccount2).to.deep.eq(new TelegramAccount({ userId: 2, telegramUserId: 464646 }));
            expect(telegramAccount3).to.deep.eq(new TelegramAccount({ userId: 3, telegramUserId: 868686 }));

            expect(await inMemoryStorage.findTelegramAccount(123456)).to.eq(telegramAccount1);
            expect(await inMemoryStorage.findTelegramAccount(464646)).to.eq(telegramAccount2);
            expect(await inMemoryStorage.findTelegramAccount(868686)).to.eq(telegramAccount3);
            expect(await inMemoryStorage.findTelegramAccount(111111)).to.be.null;

            expect(await inMemoryStorage.findTelegramAccountByUserId(1)).to.eq(telegramAccount1);
            expect(await inMemoryStorage.findTelegramAccountByUserId(2)).to.eq(telegramAccount2);
            expect(await inMemoryStorage.findTelegramAccountByUserId(3)).to.eq(telegramAccount3);
            expect(await inMemoryStorage.findTelegramAccountByUserId(4)).to.be.null;
        });

        it('should implement notion account management', async () => {
            expect(await inMemoryStorage.findNotionAccount(1)).to.be.null;

            const notionAccount1 = await inMemoryStorage.createNotionAccount(user1.userId, 'fake-token-1');
            const notionAccount2 = await inMemoryStorage.createNotionAccount(user2.userId, 'fake-token-2');
            const notionAccount3 = await inMemoryStorage.createNotionAccount(user3.userId, 'fake-token-3');

            expect(notionAccount1).to.deep.eq(new NotionAccount({ userId: 1, token: 'fake-token-1' }));
            expect(notionAccount2).to.deep.eq(new NotionAccount({ userId: 2, token: 'fake-token-2' }));
            expect(notionAccount3).to.deep.eq(new NotionAccount({ userId: 3, token: 'fake-token-3' }));

            expect(await inMemoryStorage.findNotionAccount(1)).to.eq(notionAccount1);
            expect(await inMemoryStorage.findNotionAccount(2)).to.eq(notionAccount2);
            expect(await inMemoryStorage.findNotionAccount(3)).to.eq(notionAccount3);
            expect(await inMemoryStorage.findNotionAccount(4)).to.be.null;

            expect(notionAccount1.notesDatabaseId).to.be.null;
            expect(notionAccount1.remindersDatabaseId).to.be.null;

            await inMemoryStorage.setNotesDatabaseId(1, 'fake-notes-database-id');
            await inMemoryStorage.setRemindersDatabaseId(1, 'fake-reminders-database-id');
            
            expect(notionAccount1.notesDatabaseId).to.eq('fake-notes-database-id');
            expect(notionAccount1.remindersDatabaseId).to.eq('fake-reminders-database-id');

            await expect(inMemoryStorage.setNotesDatabaseId(4, 'fake-notes-database-id'))
                .to.eventually.be.rejectedWith(NotionAccountNotFound);
            await expect(inMemoryStorage.setRemindersDatabaseId(4, 'fake-reminders-database-id'))
                .to.eventually.be.rejectedWith(NotionAccountNotFound);
        });

        it('should implement notion list management', async () => {
            const notionList1 = await inMemoryStorage.createList(user1.userId, 'fake-list-id-1', 'alias-1');
            const notionList2 = await inMemoryStorage.createList(user2.userId, 'fake-list-id-2', 'alias-2');
            const notionList3 = await inMemoryStorage.createList(user2.userId, 'fake-list-id-3', 'alias-3');

            expect(notionList1).to.deep.eq(new NotionList({ userId: 1, databaseId: 'fake-list-id-1', alias: 'alias-1' }));
            expect(notionList2).to.deep.eq(new NotionList({ userId: 2, databaseId: 'fake-list-id-2', alias: 'alias-2' }));
            expect(notionList3).to.deep.eq(new NotionList({ userId: 2, databaseId: 'fake-list-id-3', alias: 'alias-3' }));

            expect(await inMemoryStorage.findLists(1)).to.deep.eq([notionList1]);
            expect(await inMemoryStorage.findLists(2)).to.deep.eq([notionList2, notionList3]);
            expect(await inMemoryStorage.findLists(3)).to.deep.eq([]);
            expect(await inMemoryStorage.findLists(4)).to.deep.eq([]);

            expect(await inMemoryStorage.findList(1, 'alias-1')).to.eq(notionList1);
            expect(await inMemoryStorage.findList(2, 'alias-2')).to.eq(notionList2);
            expect(await inMemoryStorage.findList(2, 'alias-3')).to.eq(notionList3);

            expect(await inMemoryStorage.findList(1, 'alias-2')).to.be.null;
            expect(await inMemoryStorage.findList(2, 'alias-1')).to.be.null;
            expect(await inMemoryStorage.findList(3, 'alias-3')).to.be.null;
            expect(await inMemoryStorage.findList(4, 'alias-4')).to.be.null;
        });

        it('should implement template management', async () => {
            const pattern1 = ['fake', 'pattern', 1];
            const pattern2 = ['fake', 'pattern', 2];
            const pattern3 = ['fake', 'pattern', 3];
            const pattern4 = ['fake', 'pattern', 4];
            const pattern5 = ['fake', 'pattern', 5];

            const template1 = await inMemoryStorage.addPattern(user1.userId, 'note', pattern1);
            const template2 = await inMemoryStorage.addPattern(user2.userId, 'reminder', pattern2, { date: 'in five minutes' });
            const template3 = await inMemoryStorage.addPattern(user2.userId, 'list', pattern3, { list: 'shopping' });
            const template4 = await inMemoryStorage.addPattern(user2.userId, 'list', pattern4, {});
            const template5 = await inMemoryStorage.addPattern(user3.userId, 'note', pattern5);

            expect(template1)
                .to.deep.eq(new Template({ userId: 1, type: 'note', order: 1, pattern: pattern1, defaultVariables: {} }));
            expect(template2)
                .to.deep.eq(new Template({ userId: 2, type: 'reminder', order: 1, pattern: pattern2, defaultVariables: { date: 'in five minutes' } }));
            expect(template3)
                .to.deep.eq(new Template({ userId: 2, type: 'list', order: 2, pattern: pattern3, defaultVariables: { list: 'shopping' } }));
            expect(template4)
                .to.deep.eq(new Template({ userId: 2, type: 'list', order: 3, pattern: pattern4, defaultVariables: {} }));
            expect(template5)
                .to.deep.eq(new Template({ userId: 3, type: 'note', order: 1, pattern: pattern5, defaultVariables: {} }));
            
            expect(await inMemoryStorage.findPatterns(1)).to.deep.eq([template1]);
            expect(await inMemoryStorage.findPatterns(2)).to.deep.eq([template2, template3, template4]);
            expect(await inMemoryStorage.findPatterns(3)).to.deep.eq([template5]);
            expect(await inMemoryStorage.findPatterns(4)).to.deep.eq([]);
        });

        it('should implement close reminders management', async () => {
            const reminder1 = { id: 'reminder-1' };
            const reminder2 = { id: 'reminder-2' };
            const reminder3 = { id: 'reminder-3' };
            const reminder4 = { id: 'reminder-4' };

            await inMemoryStorage.storeCloseReminders(user1.userId, [reminder1]);
            await inMemoryStorage.storeCloseReminders(user2.userId, [reminder2, reminder3]);
            await inMemoryStorage.storeCloseReminders(user3.userId, [reminder4]);

            expect(await inMemoryStorage.getCloseReminders(1)).to.deep.eq([reminder1]);
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([reminder2, reminder3]);
            expect(await inMemoryStorage.getCloseReminders(3)).to.deep.eq([reminder4]);
            expect(await inMemoryStorage.getCloseReminders(4)).to.deep.eq([]);

            await inMemoryStorage.removeCloseReminder(1, 'reminder-1');
            expect(await inMemoryStorage.getCloseReminders(1)).to.deep.eq([]);

            await inMemoryStorage.addCloseReminder(1, reminder1);
            expect(await inMemoryStorage.getCloseReminders(1)).to.deep.eq([reminder1]);

            await inMemoryStorage.removeCloseReminder(2, 'reminder-3');
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([reminder2]);

            await inMemoryStorage.removeCloseReminder(2, 'reminder-2');
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([]);

            await inMemoryStorage.addCloseReminder(2, reminder3);
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([reminder3]);

            await inMemoryStorage.addCloseReminder(2, reminder2);
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([reminder3, reminder2]);

            await inMemoryStorage.removeCloseReminder(2, 'reminder-4'); // doesn't exist
            expect(await inMemoryStorage.getCloseReminders(2)).to.deep.eq([reminder3, reminder2]);

            await inMemoryStorage.removeCloseReminder(4, 'reminder-4'); // doesn't exist
        });
    });
});