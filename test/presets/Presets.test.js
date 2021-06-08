const { expect } = require('chai');
const { spy, stub } = require('sinon');
const Presets = require('../../app/presets/Presets');

describe('Presets', () => {
    /** @type {Presets} */
    let presets;

    beforeEach(() => {
        presets = new Presets();
    });

    describe('get()', () => {
        let presets1, presets2, presets3

        beforeEach(() => {
            presets1 = createPresetsMock(1);
            presets2 = createPresetsMock(2);
            presets3 = createPresetsMock(3);

            function createPresetsMock(id) {
                return {
                    get: () => ({
                        value: `fake-value-${id}`,
                        inputType: `fake-input-${id}`,
                        outputType: `fake-output-${id}`,
                    })
                }
            }
        })

        it('should return as is when input & output types are provided', () => {
            const value = 'my-value';
            const inputType = 'my-input-type';
            const outputType = 'my-output-type';

            expect(
                presets.get({ value, inputType, outputType }, [])
            ).to.deep.eq({ value, inputType, outputType })

            expect(
                presets.get({ value, inputType, outputType }, [presets1, presets2, presets3])
            ).to.deep.eq({ value, inputType, outputType })
        });

        it('should use first matching preset', () => {
            const value = 'my-value';
            const inputType = 'my-input-type';
            const outputType = 'my-output-type';

            expect(
                presets.get({ value, inputType }, [presets1, presets2, presets3])
            ).to.deep.eq({
                value: 'fake-value-1',
                inputType: 'fake-input-1',
                outputType: 'fake-output-1',
            })

            stub(presets1, 'get').returns(null)

            expect(
                presets.get({ value }, [presets1, presets2, presets3])
            ).to.deep.eq({
                value: 'fake-value-2',
                inputType: 'fake-input-2',
                outputType: 'fake-output-2',
            })

            stub(presets2, 'get').returns(null)

            expect(
                presets.get({ value, outputType }, [presets1, presets2, presets3])
            ).to.deep.eq({
                value: 'fake-value-3',
                inputType: 'fake-input-3',
                outputType: 'fake-output-3',
            })
        })

        it('should return default preset when non are matching', () => {
            const value = 'my-value';

            expect(
                presets.get({ value }, [])
            ).to.deep.eq({ value, inputType: 'text', outputType: 'title' })
            
            stub(presets1, 'get').returns(null)
            stub(presets2, 'get').returns(null)
            stub(presets3, 'get').returns(null)

            expect(
                presets.get({ value }, [presets1, presets2, presets3])
            ).to.deep.eq({ value, inputType: 'text', outputType: 'title' })
        })
    });
});
