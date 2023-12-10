/**
* @param {T} values
* @returns {T}
* @template T
*/
export function parsePhases(values, parents = []) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      return [
        key,
        typeof value !== 'object'
          ? [...parents, key].join(':')
          : parsePhases(value, [...parents, key]),
      ]
    })
  )
}
