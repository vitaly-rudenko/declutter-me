import { Language } from '../Language.js';

export function createGuideLink({ language }) {
    if (language === Language.ENGLISH) return process.env.GUIDE_LINK_EN;
    if (language === Language.RUSSIAN) return process.env.GUIDE_LINK_RU;
    if (language === Language.UKRAINIAN) return process.env.GUIDE_LINK_UK;
    throw new Error(`Invalid language: ${language}`)
}
