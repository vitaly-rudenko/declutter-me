const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const PatternBuilder = require('../app/PatternBuilder');

describe('PatternBuilder', () => {
    /** @type {PatternBuilder} */
    let patternBuilder;

    beforeEach(() => {
        patternBuilder = new PatternBuilder();
    });

    describe('#build()', () => {
        it.only('should build pattern from the input string (simple)', () => {
            expect(patternBuilder.build('Buy {body}'))
                .to.eq([
                    { type: 'text', value: 'buy ' },
                    { type: 'variable', value: 'body' },
                ]);
        });

        it('should build pattern from the input string (complex)', () => {
            expect(patternBuilder.build('(Buy|Purchase) {body}[,] please[ #{tag!}][(!|.)]'))
                .to.eq([
                    {
                        type: 'variational',
                        value: [
                            { type: 'text', value: 'buy' },
                            { type: 'text', value: 'purchase' },
                        ]
                    },
                    { type: 'text', value: 'buy ' },
                    { type: 'variable', value: 'body' },
                    {
                        type: 'optional',
                        value: [{ type: 'text', value: ',' }]
                    },
                    { type: 'text', value: ' please' },
                    {
                        type: 'optional',
                        value: [
                            { type: 'text', value: ' #' },
                            { type: 'variable', value: 'tag', bang: true }
                        ]
                    },
                    {
                        type: 'optional',
                        value: [{
                            type: 'variational',
                            value: [
                                { type: 'text', value: '!' },
                                { type: 'text', value: '.' }
                            ]
                        }]
                    },
                ]);
        });
    });
});
