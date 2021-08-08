import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import chai, { expect } from 'chai';
import { Field, InputType } from '@vitalyrudenko/templater';
import { mergeFields } from '../../app/utils/mergeFields.js';

chai.use(deepEqualInAnyOrder);

describe('mergeFields()', () => {
    it('should merge fields', () => {
        expect(mergeFields([], []))
            .to.deep.equal([]);
        
        expect(
            mergeFields([
                new Field({ inputType: InputType.DATABASE, value: 'my-database' }),
            ], [
                new Field({ name: 'my-field', value: 'my-value' }),
            ])
        ).to.deep.equalInAnyOrder([
            new Field({ inputType: InputType.DATABASE, value: 'my-database' }),
            new Field({ name: 'my-field', value: 'my-value' }),
        ]);

        expect(
            mergeFields([
                new Field({ inputType: InputType.DATABASE, value: 'my-database-old' }),
                new Field({ name: 'my-field-1', value: 'my-value-1' }),
                new Field({ name: 'my-field-3', value: 'my-value-3-old' }),
            ], [
                new Field({ inputType: InputType.DATABASE, value: 'my-database-new' }),
                new Field({ name: 'my-field-2', value: 'my-value-2' }),
                new Field({ name: 'my-field-3', value: 'my-value-3-new' }),
            ])
        ).to.deep.equalInAnyOrder([
            new Field({ inputType: InputType.DATABASE, value: 'my-database-new' }),
            new Field({ name: 'my-field-1', value: 'my-value-1' }),
            new Field({ name: 'my-field-2', value: 'my-value-2' }),
            new Field({ name: 'my-field-3', value: 'my-value-3-new' }),
        ]);
    });
});
