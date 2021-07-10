import axios from 'axios';
import fs from 'fs';
import ru from './assets/localization/ru.json';

async function getTranslated(obj) {
    const res = {};

    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            res[key] = [];
            for (const v of value) {
                res[key].push(await translate(v));
            }
        } else if (typeof value === 'object') {
            res[key] = await getTranslated(value);
        } else {
            res[key] = await translate(value);
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return res;
}

async function init() {
    const uk = await getTranslated(ru);

    fs.writeFileSync('./uk.json', JSON.stringify(uk, null, 4));
}

init();

async function translate(text) {
    const match = text.match(/\{.+?\}/g);
    const protectedWords = match ? [...match].map(v => v.slice(1, -1)) : [];

    return axios.request({
        method: 'GET',
        url: 'https://nlp-translation.p.rapidapi.com/v1/translate',
        params: {
            text: text,
            to: 'uk',
            from: 'ru',
            ...protectedWords.length > 0 && { protected_words: protectedWords.join(';') }
        },
        headers: {
            'x-rapidapi-key': 'xxx',
            'x-rapidapi-host': 'nlp-translation.p.rapidapi.com'
        }
    }).then(function (response) {
        return response.data?.translated_text?.uk ?? text;
    })
}