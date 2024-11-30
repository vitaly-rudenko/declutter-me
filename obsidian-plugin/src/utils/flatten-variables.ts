import { Variable, VariableMap } from 'src/plugin/common';

export function flattenVariables(variables: Variable[]) {
    const result: VariableMap = {}
    for (const { name, value } of variables) {
        result[name] = value
    }
    return result
}
