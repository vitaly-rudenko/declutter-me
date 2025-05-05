import { Token } from './parse-template.js'

type VariableDefinitionMap = {
    [variableName: string]: {
        type: Extract<Token, { type: 'variable' }>['input']['type'],
    }
}

export function extractVariableDefinitionsFromPattern(tokens: Token[]): VariableDefinitionMap {
    const result: VariableDefinitionMap = {}

    for (const token of tokens) {
        if (token.type === 'variable') {
            appendVariables(result, { [token.value]: { type: token.input.type } })

            if (token.input.type === 'match') {
                appendVariables(result, extractVariableDefinitionsFromPattern(token.input.match))
            }
        } else if (token.type === 'optional') {
            appendVariables(result, extractVariableDefinitionsFromPattern(token.value))
        } else if (token.type === 'variational') {
            for (const variation of token.value) {
                appendVariables(result, extractVariableDefinitionsFromPattern(variation))
            }
        }
    }

    return result
}

function appendVariables(variables1: VariableDefinitionMap, variables2: VariableDefinitionMap) {
    for (const [variableName, variableDefinition] of Object.entries(variables2)) {
        if (variableName in variables1) {
            throw new Error(`Variable is already defined: ${variableName}`)
        }

        variables1[variableName] = variableDefinition
    }
}
