class ListMatchers {
    constructor() {
        this.item = this.item.bind(this);
        this.list = this.list.bind(this);
    }

    item(input, { nextTokens: [nextToken] }) {
        if (nextToken && nextToken.type === 'text') {
            return input.slice(0, input.toLowerCase().lastIndexOf(nextToken.value.toLowerCase()));
        }

        return input;
    }

    list(input) {
        return input.split(' ')[0];
    }
}

module.exports = ListMatchers;
