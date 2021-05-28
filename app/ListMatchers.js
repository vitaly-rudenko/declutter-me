class ListMatchers {
    constructor() {
        this.item = this.item.bind(this);
        this.list = this.list.bind(this);
    }

    item(input, { nextTokens: [nextToken] }) {
        if (nextToken && nextToken.type === 'text') {
            return input.slice(0, input.lastIndexOf(nextToken.value));
        }

        return input;
    }

    list(input) {
        return input.split(' ')[0];
    }
}

module.exports = ListMatchers;
