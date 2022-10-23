export class MatchError extends Error {
    constructor(code, data = {}) {
        super(`Match error: ${code}`)

        this.code = code
        this.data = data
    }
}
