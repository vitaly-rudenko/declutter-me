import { parsePhases } from '@vitalyrudenko/telegramify'

export const phases = parsePhases({
    start: {
        language: '',
        timezone: '',
    },
    notion: {
        sendToken: '',
    },
    addDatabase: {
        link: '',
        alias: '',
    },
    deleteDatabase: {
        choose: ''
    },
    template: {
        database: '',
        pattern: '',
        addDefaultFields: ''
    },
});
