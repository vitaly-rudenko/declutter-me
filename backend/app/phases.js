export const phases = organizeValues({
    start: {
        language: '1',
        timezone: '1',
    },
    notion: {
        token: '1',
    },
    addDatabase: {
        link: '1',
        alias: '2',
    },
    deleteDatabase: {
        choose: '1'
    },
    template: {
        database: '1',
        pattern: '2',
    }
});

/**
 * @param {T} values
 * @returns {T}
 * @template T
 */
function organizeValues(values, parents = []) {
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
