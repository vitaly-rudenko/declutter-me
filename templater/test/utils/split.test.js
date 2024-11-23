import { expect } from 'chai';
import { split } from '../../index.js';

describe('split()', () => {
    it('should split the string with spaces properly', () => {
        expect(split('  ', ' '))
            .to.deep.eq(['', '', '']);

        expect(split('Hello ', ' '))
            .to.deep.eq(['Hello', '']);

        expect(split('Hello World!', ' '))
            .to.deep.eq(['Hello', 'World!']);

        expect(split(' Hello', ' '))
            .to.deep.eq(['', 'Hello']);

        expect(split('', ' '))
            .to.deep.eq(['']);
        
        expect(split('Hello', ''))
            .to.deep.eq(['H', 'e', 'l', 'l', 'o']);
    });

    it('should split the string regardless of its case', () => {
        expect(split('hel LO World lo Hey Lo hete lO teeHee', ' lo '))
            .to.deep.eq(['hel', 'World', 'Hey', 'hete', 'teeHee']);
    });
});
