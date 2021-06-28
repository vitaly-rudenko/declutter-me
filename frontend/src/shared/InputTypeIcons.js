import {
    TextFields, TextFormat, LooksOne, Link as LinkIcon,
    Storage, Phone, CalendarToday, AlternateEmail, Schedule,
} from '@material-ui/icons'

export const InputTypeIcons = {
    'text': TextFields,
    'url': LinkIcon,
    'email': AlternateEmail,
    'phone': Phone,
    'number': LooksOne,
    'date': CalendarToday,
    // ---
    'database': Storage,
    'word': TextFormat,
    'future_date': Schedule,
};
