import chai from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { squashCombinations } from '../../src/utils/squashCombinations.js';

const { expect } = chai;
chai.use(deepEqualInAnyOrder);

describe('squashCombinations()', () => {
    it('should squash combinations', () => {
        expect(squashCombinations([
            ['a'],
        ])).to.deep.equalInAnyOrder([
            ['a'],
        ]);

        expect(squashCombinations([
            ['a', 'b'],
        ])).to.deep.equalInAnyOrder([
            ['a'],
            ['b'],
        ]);

        expect(squashCombinations([
            ['a'],
            ['c']
        ])).to.deep.equalInAnyOrder([
            ['a', 'c'],
        ]);

        expect(squashCombinations([
            ['a', 'b'],
            ['c']
        ])).to.deep.equalInAnyOrder([
            ['a', 'c'],
            ['b', 'c'],
        ]);

        expect(squashCombinations([
            ['a', 'b'],
            ['c', 'd']
        ])).to.deep.equalInAnyOrder([
            ['a', 'c'],
            ['a', 'd'],
            ['b', 'c'],
            ['b', 'd'],
        ]);
    });
});
