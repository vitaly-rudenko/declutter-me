import dotenv from 'dotenv'
dotenv.config()

import { promises as fs } from 'fs';
import { Template } from './app/templates/Template';
import { NotionDatabase } from './app/notion/NotionDatabase';
import { Field } from './app/fields/Field';
import { Language } from './app/Language';
import { InputType } from './app/InputType';
import { SqliteStorage } from './app/storage/SqliteStorage';
import { User } from './app/users/User';
import { TelegramAccount } from './app/telegram/TelegramAccount';
import { NotionAccount } from './app/notion/NotionAccount';

async function setup() {
    await fs.unlink('./database.db');

    const storage = new SqliteStorage('database.db');
    storage.setup()

    const user = await storage.createUser(new User({ language: Language.RUSSIAN, timezoneOffsetMinutes: 3 * 60 }));
    await storage.createTelegramAccount(new TelegramAccount({ userId: user.id, telegramUserId: 56681133 }));
    await storage.createNotionAccount(new NotionAccount({ userId: user.id, token: 'secret_sUmg2sizdQDYmfGrQ0amjXSuOv4tHTevLn4PVgcopG6' }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 1,
        pattern: 'купить [{количество:number} (шт[ук[и]]|гр[ам[м]]|кг|кило[грам[м]]) ]{товар:text}',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'shopping' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 2,
        pattern: 'посмотреть {название:text}[ #{тип:word}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'to_watch' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 3,
        pattern: '(сделать|задача) {задача:text}',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'todo' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 4,
        pattern: 'контакт {имя:word} {фамилия:word}[ {телефон:phone}][ {эл. почта:email}][ {сайт:url}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'contacts' })
        ]
    }));

    await storage.storeTemplate(new Template({
        userId: user.id,
        order: 5,
        pattern: '[#{:database}( |\n)][заметка( |\n)]{заметка:text}[( |\n)#{теги:word}][( |\n)#{теги:word}][( |\n)#{теги:word}]',
        defaultFields: [
            new Field({ inputType: InputType.DATABASE, value: 'notes' })
        ]
    }));

    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'to_watch', notionDatabaseId: '3af8dfb79d18428b86419bd7a211084a' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'notes', notionDatabaseId: 'a64b650b4036407385272f3867de44f3' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'backup_notes', notionDatabaseId: '6ea2673f45fe428aa758da2aaf1316d7' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'todo', notionDatabaseId: '8c83e61c0fb848ef85d6644725296a15' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'contacts', notionDatabaseId: 'ce850d3910b24a64b5cf4f6da28738bf' }))
    await storage.storeDatabase(new NotionDatabase({ userId: user.id, alias: 'shopping', notionDatabaseId: 'ca75e1d762c24d4893e2d682c1823797' }))
}

setup();
