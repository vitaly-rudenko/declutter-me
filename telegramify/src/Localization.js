export class Localization {
  /** @param {Record<string, Record<string, any>>} messages */
  constructor(messages, logger = console) {
    this._messages = messages
    this._logger = logger
  }

  /** @returns {string | string[]} */
  get(messageKey, locale) {
    const path = messageKey.split('.')
  
    let result = this._messages[locale]
    while (result && path.length > 0) {
      result = result[path.shift()]
    }
  
    if (!result) {
      this._logger.warn({ messageKey, locale }, 'Could not find localization key')
    }
  
    return result ?? messageKey
  }
  
  /** @returns {string} */
  localize(locale, messageKey, replacements = null) {
    let result = this.get(messageKey, locale)
  
    if (Array.isArray(result)) {
      result = result.map((item, index, array) => (
        item.endsWith('\\')
          ? item.slice(0, -1)
          : (index === array.length - 1) ? item : `${item}\n`
      )).join('')
    }
  
    if (replacements) {
      for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), value)
      }
    }
  
    return result
  }
}


