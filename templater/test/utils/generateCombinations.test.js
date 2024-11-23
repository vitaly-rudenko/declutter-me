import chai from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { generateCombinations } from '../../src/utils/generateCombinations.js';

const { expect } = chai;
chai.use(deepEqualInAnyOrder);

describe('generateCombinations()', () => {
    it('should generate combinations', () => {
        expect(generateCombinations([]))
            .to.deep.equalInAnyOrder([]);

        expect(generateCombinations(['a']))
            .to.deep.equalInAnyOrder([
                ['a'],
            ]);

        expect(generateCombinations(['a', 'b']))
            .to.deep.equalInAnyOrder([
                ['a', 'b'],
                ['b', 'a'],
            ]);

        expect(generateCombinations(['a', 'b', 'c']))
            .to.deep.equalInAnyOrder([
                ['a', 'b', 'c'],
                ['a', 'c', 'b'],
                ['b', 'a', 'c'],
                ['b', 'c', 'a'],
                ['c', 'a', 'b'],
                ['c', 'b', 'a'],
            ]);
    });

    it('should generate combinations for complex objects', () => {
        expect(generateCombinations([['a']]))
            .to.deep.equalInAnyOrder([
                [['a']],
            ]);

        expect(generateCombinations([['a'], ['b', 'c']]))
            .to.deep.equalInAnyOrder([
                [['a'], ['b', 'c']],
                [['b', 'c'], ['a']],
            ]);

        expect(generateCombinations([[], ['b'], ['c', 'd']]))
            .to.deep.equalInAnyOrder([
                [[], ['b'], ['c', 'd']],
                [[], ['c', 'd'], ['b']],
                [['b'], [], ['c', 'd']],
                [['b'], ['c', 'd'], []],
                [['c', 'd'], [], ['b']],
                [['c', 'd'], ['b'], []],
            ]);
    });
});
