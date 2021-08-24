export const phases = organizeValues({
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

/**
 * @param {T} values
 * @returns {T}
 * @template T
 */
export function organizeValues(values, parents = []) {
    // @ts-ignore
    return Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
            return [
                key,
                typeof value !== 'object'
                    ? [...parents, key].join(':')
                    : organizeValues(value, [...parents, key]),
            ];
        })
    );
}
