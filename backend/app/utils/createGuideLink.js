import { Locale } from '../Locale.js';

export function createGuideLink({ language }) {
    if (language === Locale.ENGLISH) return process.env.GUIDE_LINK_EN;
    throw new Error(`Invalid language: ${language}`)
}
