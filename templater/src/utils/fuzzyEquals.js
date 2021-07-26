export const fuzzyEquals = (actualValue, ...expectedValues) => {
    return expectedValues.some(expectedValue => normalize(actualValue) === normalize(expectedValue));
}

function normalize(value) {
    return value.toLowerCase().replace(/[_\-.\s]+/g, '');
}
