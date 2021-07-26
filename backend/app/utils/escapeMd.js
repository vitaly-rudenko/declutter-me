import { markdownEscapes } from 'markdown-escapes';

const ESCAPE_REGEX = new RegExp(`(?<!\\\\)([\\${markdownEscapes.join('\\')}])`, 'g');

export const escapeMd = (string) =>  {
    return string.replace(ESCAPE_REGEX, '\\$1');
}