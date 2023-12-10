import fs from 'fs'
import { Localization } from '@vitalyrudenko/telegramify'
import { Locale } from './Locale.js';

export const localization = new Localization({
    [Locale.ENGLISH]: JSON.parse(fs.readFileSync(`./assets/localization/en.json`, { encoding: 'utf-8' }))
}, console)
