import moment from 'moment'

export function processTemplate(template: string, now = new Date()) {
  return template
    .replace(/\{\{date(?::(.+?))?\}\}/g, (_, dateFormat) => moment(now).format(dateFormat || 'YYYY-MM-DD'))
    .replace(/\{\{time(?::(.+?))?\}\}/g, (_, timeFormat) => moment(now).format(timeFormat || 'HH:mm'))
}
