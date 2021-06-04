const chai = require('chai');
const PatternMatcher = require('../../app/PatternMatcher');
const NoteMatchers = require('../../app/notes/NoteMatchers');

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

    it('should allow matching multiple tags (from the start)', () => {
        // [#{tag} ][#{tag} ][#{tag} ]{note}
        const pattern = [
            { type: 'optional', value: [
                { type: 'text', value: '#' },
                { type: 'variable', value: 'tag' },
                { type: 'text', value: ' ' },
            ] },
            { type: 'optional', value: [
                { type: 'text', value: '#' },
                { type: 'variable', value: 'tag' },
                { type: 'text', value: ' ' },
            ] },
            { type: 'optional', value: [
                { type: 'text', value: '#' },
                { type: 'variable', value: 'tag' },
                { type: 'text', value: ' ' },
            ] },
            { type: 'variable', value: 'note' },
        ];

        expect(patternMatcher.match('my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note'
                }
            });

        expect(patternMatcher.match('#my-tag-1 my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: 'my-tag-1'
                }
            });

        expect(patternMatcher.match('#my-tag-1 #my-tag-2 my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: ['my-tag-1', 'my-tag-2']
                }
            });
        
        expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                }
            });
        
        expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: '#my-tag-4 my note',
                    tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                }
            });

        expect(patternMatcher.match('#my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5 my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: '#my-tag-4 #my-tag-5 my note',
                    tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                }
            });
    });
    
    it('should allow matching multiple tags (from the end)', () => {
        // save {note}[ #{tag}][ #{tag}][ #{tag}]
        const pattern = [
            { type: 'text', value: 'save ' },
            { type: 'variable', value: 'note' },
            { type: 'optional', value: [
                { type: 'text', value: ' #' },
                { type: 'variable', value: 'tag' }
            ] },
            { type: 'optional', value: [
                { type: 'text', value: ' #' },
                { type: 'variable', value: 'tag' }
            ] },
            { type: 'optional', value: [
                { type: 'text', value: ' #' },
                { type: 'variable', value: 'tag' }
            ] },
        ];

        expect(patternMatcher.match('Save my note', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note'
                }
            });

        expect(patternMatcher.match('Save my note #my-tag-1', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: 'my-tag-1'
                }
            });
        
        expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: ['my-tag-1', 'my-tag-2']
                }
            });

        expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note',
                    tag: ['my-tag-1', 'my-tag-2', 'my-tag-3']
                }
            });
        
        expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note #my-tag-1',
                    tag: ['my-tag-2', 'my-tag-3', 'my-tag-4']
                }
            });
        
        expect(patternMatcher.match('Save my note #my-tag-1 #my-tag-2 #my-tag-3 #my-tag-4 #my-tag-5', pattern, noteMatchers))
            .to.deep.eq({
                match: true,
                variables: {
                    note: 'my note #my-tag-1 #my-tag-2',
                    tag: ['my-tag-3', 'my-tag-4', 'my-tag-5']
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