import { MatchResult } from "./templater/match";

export function transformMatchResultToVariables(matchResult: MatchResult) {
    const variables: Record<string, string | number> = {}
    for (const [variableName, { value }] of Object.entries(matchResult)) {
        variables[variableName] = value
    }
    return variables
}
