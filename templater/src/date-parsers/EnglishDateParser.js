const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export class EnglishDateParser {
  constructor({ references: { morningHours, eveningHours } }) {
    this.timeOfDay = {
      midnightHours: 0,
      morningHours,
      noonHours: 12,
      eveningHours,
    }
  }

  parse(input, { forwardOnly = false } = {}) {
    const reference = new Date()

    const [result, unit] = /** @type [Date, string] */ (
      this._parseTimeOfDay(input, { reference }) ||
      this._parseDayOfWeek(input, { reference }) ||
      this._parsePostponed(input, { reference }) ||
      [null, null]
    )

    if (result === null) return null

    if (forwardOnly && result.getTime() <= reference.getTime()) {
      const forwardResult = this._getPostponedDate(result, unit, 1)
      return forwardResult
    }

    return result
  }

  _parseTimeOfDay(input, { reference }) {
    let hours = null
    if (input === 'in the morning') hours = this.timeOfDay.morningHours
    if (input === 'at noon') hours = this.timeOfDay.noonHours
    if (input === 'in the evening') hours = this.timeOfDay.eveningHours
    if (input === 'at midnight') hours = this.timeOfDay.midnightHours

    if (hours === null) return null

    return [
      new Date(
        reference.getFullYear(),
        reference.getMonth(),
        reference.getDate(),
        hours,
        0, 0, 0
      ),
      'day'
    ]
  }

  _parseDayOfWeek(input, { reference }) {
    if (!input.startsWith('on ')) return null

    const offset = daysOfWeek.indexOf(input.slice(3)) + 1 - reference.getDay()

    return [
      this._merge(
        new Date(
          reference.getFullYear(),
          reference.getMonth(),
          reference.getDate() + offset,
          0, 0, 0, 0
        ),
        reference
      ),
      'week'
    ]
  }

  _parsePostponed(input, { reference }) {
    if (!input.startsWith('in ')) return null

    const [rawAmount, rawUnit] = input.slice(3).split(' ')
    
    let amount = null, unit = null
    if (rawUnit.startsWith('minute')) unit = 'minute'
    if (rawUnit.startsWith('hour')) unit = 'hour'
    if (rawUnit.startsWith('day')) unit = 'day'
    if (rawUnit.startsWith('week')) unit = 'week'
    if (rawUnit.startsWith('month')) unit = 'month'
    if (rawUnit.startsWith('year')) unit = 'year'

    if (rawAmount === 'an' || rawAmount === 'a') {
      amount = 1
    } else {
      amount = Number(rawAmount)
    }

    const postponedDate = this._getPostponedDate(reference, unit, amount)
    return postponedDate ? [postponedDate, unit] : null
  }

  _getPostponedDate(reference, unit, amount) {
    const date = new Date(reference)

    if (unit === 'minute')
      date.setMinutes(date.getMinutes() + amount)
    else if (unit === 'hour')
      date.setHours(date.getHours() + amount)
    else if (unit === 'day')
      date.setDate(date.getDate() + amount)
    else if (unit === 'week')
      date.setDate(date.getDate() + 7 * amount)
    else if (unit === 'month')
      date.setMonth(date.getMonth() + amount)
    else if (unit === 'year')
      date.setFullYear(date.getFullYear() + amount)
    else return null

    return date
  }

  _merge(date, time) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    )
  }
}
