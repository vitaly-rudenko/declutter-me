module.exports = function split(text, delimiter) {
    const textLower = text.toLowerCase();
    const delimiterLower = delimiter.toLowerCase();

    const splitResult = textLower.split(delimiterLower);

    let index = 0;
    const result = [];

    for (const res of splitResult) {
        result.push(text.slice(index, index + res.length));
        index = index + res.length + delimiter.length;
    }

    return result;
};
