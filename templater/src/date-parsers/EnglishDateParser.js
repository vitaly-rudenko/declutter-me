const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export class EnglishDateParser {
  constructor({ references: { morningHours, eveningHours, nightHours } }) {
    this.timeOfDay = {
      morningHours,
      noonHours: 12,
      eveningHours,
      midnightHours: 24,
      nightHours,
    }
  }

  parse(rawInput, { forwardOnly = false } = {}) {
    const input = rawInput.toLowerCase()

    const reference = new Date()

    const [result, unit] = /** @type [Date, string] */ (
      this._parseTimeOfDay(input, { reference }) ||
      this._parseDayOfWeek(input, { reference }) ||
      this._parseRelativeDate(input, { reference }) ||
      this._parseRelativeTime(input, { reference }) ||
      this._parseDayOfWeekAndTimeOfDay(input, { reference }) ||
      [null, null]
    )

    if (result === null) return null

    if (forwardOnly && result.getTime() < reference.getTime()) {
      if (unit === null) return null
      const forwardResult = this._getRelativeDateTime(result, unit, 1)
      return forwardResult
    }

    return result
  }

  _parseTimeOfDay(input, { reference }) {
    let hours = null
    if (input === 'in the morning') hours = this.timeOfDay.morningHours
    if (input === 'at noon') hours = this.timeOfDay.noonHours
    if (input === 'in the evening') hours = this.timeOfDay.eveningHours
    if (input === 'at night') hours = this.timeOfDay.nightHours
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
    const inputDay = daysOfWeek.indexOf(input.slice(3))
    if (inputDay === -1) return null

    const offset = inputDay + 1 - reference.getDay()

    const date = new Date(reference)
    date.setDate(date.getDate() + offset)

    return [date, 'week']
  }

  _parseRelativeTime(input, { reference }) {
    if (input === 'now') return [new Date(reference), null]
    if (!input.startsWith('in ')) return null

    const [rawAmount, rawUnit] = input.slice(3).split(' ')
    
    const unit = this._parseUnit(rawUnit)
    if (unit === null) return null

    const amount = this._parseAmount(rawAmount)
    if (amount === null) return null

    const date = this._getRelativeDateTime(reference, unit, amount)
    if (date === null) return null

    return [date, unit]
  }

  _parseRelativeDate(input, { reference }) {
    if (input.endsWith(' ago')) {
      const [rawAmount, rawUnit] = input.split(' ')

      const unit = this._parseUnit(rawUnit)
      if (unit === null) return null

      const amount = this._parseAmount(rawAmount)
      if (amount === null) return null

      const date = this._getRelativeDateTime(reference, unit, -amount)
      if (date === null) return null

      return [date, null]
    }

    if (input.startsWith('last ') || input.startsWith('previous ')) {
      const unit = this._parseUnit(input.split(' ')[1])

      const date = this._getRelativeDateTime(reference, unit, -1)
      if (date === null) return null

      return [date, null]
    }

    if (input.startsWith('next ')) {
      const unit = this._parseUnit(input.split(' ')[1])

      const date = this._getRelativeDateTime(reference, unit, 1)
      if (date === null) return null

      return [date, null]
    }

    let offset = null
    if (input === 'day before yesterday') offset = -2
    if (input === 'yesterday') offset = -1
    if (input === 'today') offset = 0
    if (input === 'tomorrow') offset = 1
    if (input === 'day after tomorrow') offset = 2

    if (offset === null) return null

    const date = new Date(reference)
    date.setDate(date.getDate() + offset)

    return [date, null]
  }

  _parseDayOfWeekAndTimeOfDay(input, { reference }) {
    const parts = input.split(' ')

    const dateInput = parts.slice(0, 2).join(' ')
    const timeInput = parts.slice(2).join(' ')

    const [date, dateUnit] = this._parseDayOfWeek(dateInput, { reference }) || [null, null]
    if (date === null) return null

    const [dateTime] = this._parseShortTimeOfDay(timeInput, { reference: date }) || [null, null]
    if (dateTime === null) return null

    return [dateTime, dateUnit]
  }

  _parseShortTimeOfDay(input, { reference }) {
    let hours = null
    if (input === 'morning') hours = this.timeOfDay.morningHours
    if (input === 'at noon') hours = this.timeOfDay.noonHours
    if (input === 'evening') hours = this.timeOfDay.eveningHours
    if (input === 'night') hours = this.timeOfDay.nightHours
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

  _parseAmount(rawAmount) {
    if (rawAmount === 'an' || rawAmount === 'a') {
      return 1
    }

    const value = Number(rawAmount)

    if (Number.isInteger(value)) {
      return value
    }

    return null
  }

  _parseUnit(rawUnit) {
    if (rawUnit.startsWith('minute')) return 'minute'
    if (rawUnit.startsWith('hour')) return 'hour'
    if (rawUnit.startsWith('day')) return 'day'
    if (rawUnit.startsWith('week')) return 'week'
    if (rawUnit.startsWith('month')) return 'month'
    if (rawUnit.startsWith('year')) return 'year'
    return null
  }

  _getRelativeDateTime(reference, unit, amount) {
    if (!Number.isInteger(amount)) return null

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
}
