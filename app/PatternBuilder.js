class PatternBuilder {
    build(input) {
        input = input.trim().toLowerCase();

        let currentType = 'text';
        let value = '';

        let i = 0;
        while (i <= input.length) {
            const previousCharacter = i > 0 ? input[i - 1] : null;
            const character = i < input.length ? input[i] : null;

            let type = 'text';

            let skip = false;


            if (previousCharacter === '#' && character !== '#') {
                type = 'variable';
                skip = true;
            }

            if (currentType !== type) {
                value = '';
            }

            if (!skip) {
                value += character;
            }

            i++;
        }
    }
}

module.exports = PatternBuilder;
