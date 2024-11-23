export const generateCombinations = (items) => {
    if (items.length === 1) {
        return [[items[0]]];
    }

    return items
        .flatMap((item, i) => {
            const remaining = [...items];
            remaining.splice(i, 1);
            return generateCombinations(remaining).map(combination => [item, ...combination]);
        });
};
