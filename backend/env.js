import dotenv from 'dotenv'

if (process.env.USE_NATIVE_ENV !== 'true') {
  console.log('Using .env file')
  dotenv.config()
}

export const redisUrl = require(process.env.REDIS_URL)
export const postgresUrl = require(process.env.DATABASE_URL)
export const useWebhooks = process.env.USE_WEBHOOKS === 'true'
export const debugChatId = require(process.env.DEBUG_CHAT_ID)
export const telegramBotToken = require(process.env.TELEGRAM_BOT_TOKEN)

export const useTestMode = process.env.USE_TEST_MODE === 'true'
export const logLevel = process.env.LOG_LEVEL || 'info'

/** @returns {string} */
function require(value) {
  if (!value) throw new Error('Required environment variable is missing')
  return value
}
