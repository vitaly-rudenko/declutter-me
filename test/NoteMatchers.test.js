const chai = require('chai');
const PatternMatcher = require('../app/PatternMatcher');
const NoteMatchers = require('../app/NoteMatchers');

const { expect } = chai;

describe('NoteMatchers', () => {
    /** @type {PatternMatcher} */
    let patternMatcher;
    /** @type {NoteMatchers} */
    let noteMatchers;

    beforeEach(() => {
        patternMatcher = new PatternMatcher();
        noteMatchers = new NoteMatchers();
    });

    it('should match simple pattern', () => {
        // #{tag} {note}
        const pattern = [
            { type: 'text', value: '#' },
            { type: 'variable', value: 'tag' },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'note' },
        ];

        expect(patternMatcher.match('#ideas Draw fan-art of Haruhi', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    tag: 'ideas',
                    note: 'Draw fan-art of Haruhi'
                }
            });
        
        expect(patternMatcher.match('#my-ideas Write HTML parser', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    tag: 'my-ideas',
                    note: 'Write HTML parser'
                }
            });
        
        expect(patternMatcher.match('Write HTML parser', pattern, noteMatchers))
            .to.deep.eq({ match: false });
        
        expect(patternMatcher.match('# Write HTML parser', pattern, noteMatchers))
            .to.deep.eq({ match: false });
    });

    it('should separate variables properly', () => {
        // {note} #{tag}
        const pattern = [
            { type: 'variable', value: 'note' },
            { type: 'text', value: ' #' },
            { type: 'variable', value: 'tag' },
        ];
        
        expect(patternMatcher.match('Draw fan-art of Haruhi #art-ideas', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    tag: 'art-ideas',
                    note: 'Draw fan-art of Haruhi'
                }
            });

        expect(patternMatcher.match('Write an app in Go #my #idea', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    tag: 'idea',
                    note: 'Write an app in Go #my'
                }
            });
        
        expect(patternMatcher.match('Write an app in Go potatoes #my idea', pattern, noteMatchers))
            .to.deep.eq({ match: false });
    });

    it('should separate variables properly in complete sentences', () => {
        // save {note} to the {tag} notes
        const pattern = [
            { type: 'text', value: 'save ' },
            { type: 'variable', value: 'note' },
            { type: 'text', value: ' to the ' },
            { type: 'variable', value: 'tag' },
            { type: 'text', value: ' notes' },
        ];

        expect(patternMatcher.match('Save Pygmalion effect to the idea notes', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'Pygmalion effect',
                    tag: 'idea',
                }
            });
    });

    it('should match complex patterns', () => {
        // (add|save) {note}[ to[ the] {tag}[ notes]]
        const pattern = [
            { type: 'variational', value: [
                [{ type: 'text', value: 'add' }],
                [{ type: 'text', value: 'save' }],
            ] },
            { type: 'text', value: ' ' },
            { type: 'variable', value: 'note' },
            { type: 'optional', value: [
                { type: 'text', value: ' to' },
                { type: 'optional', value: [{ type: 'text', value: ' the' }] },
                { type: 'text', value: ' ' },
                { type: 'variable', value: 'tag' },
                { type: 'optional', value: [{ type: 'text', value: ' notes' }] },
            ] }
        ];

        for (const input of ['Add my unique idea', 'save my unique idea']) {
            expect(patternMatcher.match(input, pattern, noteMatchers), input)
                .to.deep.eq({
                    match: true,
                    variables: { note: 'my unique idea' }
                });
        }

        for (const input of [
            'Add my unique idea to my-ideas',
            'Add my unique idea to my-ideas notes',
            'add my unique idea To The my-ideas',
            'Add my unique idea to the my-ideas notes',
            'Save my unique idea to my-ideas',
            'Save my unique idea to my-ideas notes',
            'save my unique idea to the my-ideas',
            'Save my unique idea to the my-ideas Notes',
        ]) {
            expect(patternMatcher.match(input, pattern, noteMatchers), input)
                .to.deep.eq({
                    match: true,
                    variables: {
                        note: 'my unique idea',
                        tag: 'my-ideas',
                    }
                });
        }

        for (const input of [
            'Insert my unique idea to the my-ideas notes',
            'Save', 'Add', 'Addmy unique idea'
        ]) {
            expect(patternMatcher.match(input, pattern, noteMatchers), input)
                .to.deep.eq({ match: false });
        }

        // Special case
        expect(patternMatcher.match('Add my unique idea into the my-ideas notes', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: { note: 'my unique idea into the my-ideas notes' }
            });
    });
});