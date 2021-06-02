const chai = require('chai');
const PatternMatcher = require('../../app/PatternMatcher');
const ListMatchers = require('../../app/lists/ListMatchers');

const { expect } = chai;

describe('ListMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {ListMatchers} */
    let listMatchers;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
        listMatchers = new ListMatchers();
    });

    it('should match simple pattern', () => {
        // #{list} {item}
        const pattern = [
            { type: 'text', value: '#' },
            { type: 'variable', value: 'list' },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'item' },
        ];

        expect(patternMatcher.match('#shopping Cabbages', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    list: 'shopping',
                    item: 'Cabbages'
                }
            });
        
        expect(patternMatcher.match('#shopping-list Sweet potatoes', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    list: 'shopping-list',
                    item: 'Sweet potatoes'
                }
            });
        
        expect(patternMatcher.match('Sweet potatoes', pattern, listMatchers))
            .to.deep.eq({ match: false });
        
        expect(patternMatcher.match('# Sweet potatoes', pattern, listMatchers))
            .to.deep.eq({ match: false });
    });

    it('should separate variables properly', () => {
        // {item} #{list}
        const pattern = [
            { type: 'variable', value: 'item' },
            { type: 'text', value: ' #' },
            { type: 'variable', value: 'list' },
        ];
        
        expect(patternMatcher.match('Sweet potatoes #shopping-list', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    list: 'shopping-list',
                    item: 'Sweet potatoes'
                }
            });

        expect(patternMatcher.match('Sweet #potatoes #shopping', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    list: 'shopping',
                    item: 'Sweet #potatoes'
                }
            });
        
        expect(patternMatcher.match('Sweet potatoes #shopping list', pattern, listMatchers))
            .to.deep.eq({ match: false });
    });

    it('should separate variables properly in complete sentences', () => {
        // add {item} to the {list} list
        const pattern = [
            { type: 'text', value: 'add ' },
            { type: 'variable', value: 'item' },
            { type: 'text', value: ' to the ' },
            { type: 'variable', value: 'list' },
            { type: 'text', value: ' list' },
        ];

        expect(patternMatcher.match('Add Sweet potatoes to the shopping list', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    item: 'Sweet potatoes',
                    list: 'shopping',
                }
            });
    });

    it('should match complex patterns', () => {
        // (add|put) {item}[ to[ the] {list}[ list]]
        const pattern = [
            { type: 'variational', value: [
                [{ type: 'text', value: 'add' }],
                [{ type: 'text', value: 'put' }],
            ] },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'item' },
            { type: 'optional', value: [
                { type: 'text', value: ' to' },
                { type: 'optional', value: [{ type: 'text', value: ' the' }] },
                { type: 'text', value: ' ' },
                { type: 'variable', value: 'list' },
                { type: 'optional', value: [{ type: 'text', value: ' list' }] },
            ] }
        ];

        for (const input of ['Add sweet potatoes', 'Put sweet potatoes']) {
            expect(patternMatcher.match(input, pattern, listMatchers))
                .to.deep.eq({
                    match: true,
                    variables: { item: 'sweet potatoes' }
                });
        }

        for (const input of [
            'Add sweet potatoes to shopping',
            'add sweet potatoes to shopping list',
            'add sweet potatoes To The shopping',
            'Add sweet potatoes to the shopping list',
            'Put sweet potatoes to shopping',
            'Put sweet potatoes to shopping list',
            'put sweet potatoes to the shopping',
            'Put sweet potatoes to the shopping List',
        ]) {
            expect(patternMatcher.match(input, pattern, listMatchers))
                .to.deep.eq({
                    match: true,
                    variables: {
                        item: 'sweet potatoes',
                        list: 'shopping',
                    }
                });
        }

        for (const input of [
            'Insert sweet potatoes to the shopping list',
            'Put', 'Add', 'Addsweet potatoes'
        ]) {
            expect(patternMatcher.match(input, pattern, listMatchers))
                .to.deep.eq({ match: false });
        }

        // Special case
        expect(patternMatcher.match('Add sweet potatoes into the shopping list', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: { item: 'sweet potatoes into the shopping list' }
            });
    });

    it('should match bang variables', () => {
        // {item} #{list!}
        const pattern = [
            { type: 'variable', value: 'item' },
            { type: 'text', value: ' #' },
            { type: 'variable', value: 'list', bang: true },
        ];

        expect(patternMatcher.match('Cabbages #shopping', pattern, listMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    item: 'Cabbages',
                    list: 'shopping'
                },
                bang: {
                    list: true,
                },
            });
    });
});