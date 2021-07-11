import { expect } from 'chai';
import { stripIndent } from 'common-tags'
import { escapeMd } from '../../app/utils/escapeMd.js'

describe('escapeMd()', () => {
    it('should escape text properly', () => {
        expect(escapeMd(stripIndent`
            Привет, Виталий!

            Язык: Русский
            Часовой пояс: +03:00
            Токен Notion: secret_abcdef
            
            \\/

            Базы данных:
            - alias (hello world!)

            Шаблоны: <пусто>
        `)).to.equal(stripIndent`
            Привет\\, Виталий\\!

            Язык\\: Русский
            Часовой пояс\\: \\+03\\:00
            Токен Notion\\: secret\\_abcdef

            \\\\/
            
            Базы данных\\:
            \\- alias \\(hello world\\!\\)

            Шаблоны\\: \\<пусто\\>
        `)
    })
})
