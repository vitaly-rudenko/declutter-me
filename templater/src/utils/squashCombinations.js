export const squashCombinations = (combinations) => {
    return combinations.length > 1
        ? combinations[0].flatMap(c => squashCombinations(combinations.slice(1)).map(cc => [c, ...cc]))
        : combinations[0].map(c => [c]);
};
