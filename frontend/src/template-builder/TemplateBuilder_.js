import React from 'react'
import { Container, TextField, Card, CardContent, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import {
    TextFields, TextFormat, LocalOffer, LooksOne, Link,
    Storage, Phone, FormatAlignLeft, CalendarToday, AlternateEmail, EventNote, FormatListBulleted, Schedule,
} from '@material-ui/icons'
import Field from '../utils/fields/Field';

const InputTypeIcons = {
    'text': TextFields,
    'url': Link,
    'email': AlternateEmail,
    'phone': Phone,
    'number': LooksOne,
    'date': CalendarToday,
    // ---
    'database': Storage,
    'word': TextFormat,
    'future_date': Schedule,
}

const OutputTypeIcons = {
    'text': FormatAlignLeft,
    'url': Link,
    'email': AlternateEmail,
    'phone': Phone,
    'number': LooksOne,
    // ---
    'date': EventNote,
    'title': TextFields,
    'select': LocalOffer,
    'multi_select': FormatListBulleted,
}

const fields = [
    new Field({ name: 'database', inputType: 'database', value: 'shopping' }),
    new Field({ name: 'Name', inputType: 'word', outputType: 'title', value: 'Jon' }),
    new Field({ name: 'Surname', inputType: 'word', outputType: 'text', value: 'Snow' }),
    new Field({ name: 'Description', inputType: 'text', outputType: 'text', value: 'A character in the Game of Thrones' }),
    new Field({ name: 'Type', inputType: 'word', outputType: 'select', value: 'main' }),
    new Field({ name: 'Tags', inputType: 'word', outputType: 'multi_select', value: ['man', 'young'] }),
    new Field({ name: 'URL', inputType: 'url', outputType: 'url', value: 'https://en.wikipedia.org/wiki/Jon_Snow_(character)' }),
    new Field({ name: 'E-mail', inputType: 'email', outputType: 'email', value: 'jon.snow@example.com' }),
    new Field({ name: 'Phone Number', inputType: 'phone', outputType: 'phone', value: '+1234567890' }),
];

export const TemplateBuilder = () => {
    return <div className="template-builder">
        <Container maxWidth="md">
            <form noValidate autoComplete="off">
                <TextField label="Template" variant="outlined" fullWidth />
                <TextField label="Test" variant="outlined" fullWidth />
                <Card>
                    <CardContent>
                        <List dense>
                            {fields.map((field) => {
                                const InputTypeIcon = InputTypeIcons[field.inputType];
                                const OutputTypeIcon = OutputTypeIcons[field.outputType];

                                if (!InputTypeIcon) {
                                    throw new Error('Invalid input type: ' + field.inputType)
                                }

                                return <ListItem key={field.name}>
                                    {OutputTypeIcon
                                        ? <ListItemIcon><OutputTypeIcon/></ListItemIcon>
                                        : <ListItemIcon><InputTypeIcon/></ListItemIcon>}
                                    <ListItemText
                                        primary={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                                        secondary={field.outputType ? `${field.inputType} → ${field.outputType}` : field.inputType}
                                    />
                                </ListItem>;
                            })}
                        </List>
                    </CardContent>
                </Card>
            </form>
        </Container>
    </div>
}
