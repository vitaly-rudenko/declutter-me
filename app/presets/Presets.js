class Presets {
    get({ value, inputType, outputType }, presets) {
        if (inputType && outputType) {
            return { value, inputType, outputType };
        }

        if (presets) {
            if (!Array.isArray(presets)) console.log('!!!', presets)
            for (const preset of presets) {
                const result = preset.get({ value, inputType, outputType });
                if (result) return result;
            }
        }

        return { value, inputType: 'text', outputType: 'title' };
    }
}

module.exports = Presets;
