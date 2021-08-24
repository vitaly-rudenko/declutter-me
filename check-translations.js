const fs = require('fs');

const backendEn = JSON.parse(fs.readFileSync('./backend/assets/localization/en.json', { encoding: 'utf-8' }));
const backendRu = JSON.parse(fs.readFileSync('./backend/assets/localization/ru.json', { encoding: 'utf-8' }));
const backendUk = JSON.parse(fs.readFileSync('./backend/assets/localization/uk.json', { encoding: 'utf-8' }));

const frontendEn = JSON.parse(fs.readFileSync('./frontend/src/localization/en.json', { encoding: 'utf-8' }));
const frontendRu = JSON.parse(fs.readFileSync('./frontend/src/localization/ru.json', { encoding: 'utf-8' }));
const frontendUk = JSON.parse(fs.readFileSync('./frontend/src/localization/uk.json', { encoding: 'utf-8' }));

function compareTranslations(original, translation) {
    const originalEntries = getEntries(original);
    const translationEntries = getEntries(translation);

    const missingEntries = [];
    const extraEntries = [];
    const mismatchingEntries = [];
    const equalEntries = [];

    for (const originalEntry of originalEntries) {
        const translatedEntry = translationEntries.find(entry => entry[0] === originalEntry[0]);

        if (translatedEntry) {
            if (JSON.stringify(originalEntry[1]) === JSON.stringify(translatedEntry[1])) {
                equalEntries.push([originalEntry, translatedEntry]);
            }

            if (Array.isArray(originalEntry[1]) && originalEntry[1].length !== translatedEntry[1].length) {
                mismatchingEntries.push([originalEntry, translatedEntry]);
            }
        } else {
            missingEntries.push(originalEntry);
        }
    }

    for (const translatedEntry of translationEntries) {
        const originalEntry = originalEntries.find(entry => entry[0] === translatedEntry[0]);

        if (!originalEntry) {
            extraEntries.push(translatedEntry);
        }
    }

    if (missingEntries.length > 0) {
        console.log('--- Missing entries:', missingEntries.length);
        console.log(missingEntries.map(([key, value]) => `- ${key}: ${formatEntryValue(value)}`).join('\n'));
    }

    if (extraEntries.length > 0) {
        console.log('--- Extra entries:', extraEntries.length);
        console.log(extraEntries.map(([key, value]) => `- ${key}: ${formatEntryValue(value)}`).join('\n'));
    }

    if (mismatchingEntries.length > 0) {
        console.log('--- Mismatching entries:', mismatchingEntries.length);
        console.log(mismatchingEntries.map(([originalEntry, translatedEntry]) => `- ${originalEntry[0]}: ${formatEntryValue(originalEntry[1])} => ${translatedEntry[0]}: ${formatEntryValue(translatedEntry[1])}`).join('\n'));
    }

    if (equalEntries.length > 0) {
        console.log('--- Equal entries:', equalEntries.length);
        console.log(equalEntries.map(([originalEntry, translatedEntry]) => `- ${originalEntry[0]}: ${formatEntryValue(originalEntry[1])} => ${translatedEntry[0]}: ${formatEntryValue(translatedEntry[1])}`).join('\n'));
    }
}

function getEntries(object, prefix = '') {
    const entries = [];

    for (const [key, value] of Object.entries(object)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            entries.push(...getEntries(value, [prefix, key].filter(Boolean).join('.')))
        } else {
            entries.push([[prefix, key].filter(Boolean).join('.'), value]);
        }
    }

    return entries;
}

function formatEntryValue(value) {
    if (typeof value !== 'string') {
        value = JSON.stringify(value);
    }

    if (value.length > 20) {
        return value.slice(0, 20) + '...';
    }

    return value;
}

console.log('--------- Back-end');
console.log('\n------ English <=> Russian');
compareTranslations(backendEn, backendRu);
console.log('\n------ English <=> Ukrainian');
compareTranslations(backendEn, backendUk);
console.log('\n------ Russian <=> Ukrainian');
compareTranslations(backendRu, backendUk);

console.log('\n--------- Front-end');
console.log('\n------ English <=> Russian');
compareTranslations(frontendEn, frontendRu);
console.log('\n------ English <=> Ukrainian');
compareTranslations(frontendEn, frontendUk);
console.log('\n------ Russian <=> Ukrainian');
compareTranslations(frontendRu, frontendUk);
