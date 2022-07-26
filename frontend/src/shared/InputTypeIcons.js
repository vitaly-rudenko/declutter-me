import {
    TextFields, TextFormat, LooksOne,
    Storage, Phone, CalendarToday, AlternateEmail, Schedule,
    Code, LinkOff,
} from '@material-ui/icons'
import { InputType } from '@vitalyrudenko/templater';

export const InputTypeIcons = {
    [InputType.TEXT]: TextFields,
    [InputType.URL]: LinkOff,
    [InputType.EMAIL]: AlternateEmail,
    [InputType.PHONE]: Phone,
    [InputType.NUMBER]: LooksOne,
    [InputType.DATE]: CalendarToday,
    [InputType.DATABASE]: Storage,
    [InputType.WORD]: TextFormat,
    [InputType.FORWARD_DATE]: Schedule,
    [InputType.MATCH]: Code,
};
