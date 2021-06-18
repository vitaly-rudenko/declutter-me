module.exports = organizeValues({
    notion: {
        token: '1',
    },
    database: {
        link: '1',
        alias: '2',
    },
    template: {
        databaseAlias: '1',
        pattern: '2',
    }
});

console.log(JSON.stringify(module.exports, null, 4))

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
