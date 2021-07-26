export const split = (text, delimiter) => {
    const textLower = text.toLowerCase();
    const delimiterLower = typeof delimiter === 'string' ? delimiter.toLowerCase() : delimiter;

    const splitResult = textLower.split(delimiterLower);

    let index = 0;
    const result = [];

    for (const res of splitResult) {
        result.push(text.slice(index, index + res.length));
        index = index + res.length + delimiter.length;
    }

    return result;
};
