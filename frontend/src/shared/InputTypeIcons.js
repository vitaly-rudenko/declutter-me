import {
    TextFields, TextFormat, LooksOne,
    Storage, Phone, AlternateEmail,
    Code, LinkOff,
} from '@material-ui/icons'
import { InputType } from '@vitalyrudenko/templater';

export const InputTypeIcons = {
    [InputType.TEXT]: TextFields,
    [InputType.URL]: LinkOff,
    [InputType.EMAIL]: AlternateEmail,
    [InputType.PHONE]: Phone,
    [InputType.NUMBER]: LooksOne,
    [InputType.DATABASE]: Storage,
    [InputType.WORD]: TextFormat,
    [InputType.MATCH]: Code,
};
