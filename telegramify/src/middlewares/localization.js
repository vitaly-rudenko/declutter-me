const DEFAULT_LOCALE = 'uk'

export const withLocalization = ({ getUserLocale, localization }) => {
  /** @param {import('telegraf').Context} context */
  return async (context, next) => {
    const { userId } = context.state

    const locale = await getUserLocale(userId)

    context.state.localize = (message, replacements = null) => {
      return localization.localize(locale ?? DEFAULT_LOCALE, message, replacements)
    }

    return next()
  }
}
