import React from 'react'
import {
    Container, TextField, Table, TableContainer, Paper, TableBody, TableHead, TableRow, TableCell, Chip, Link,
    Card, CardContent, Typography, Button
} from '@material-ui/core'
import {
    TextFields, TextFormat, LocalOffer, LooksOne, Link as LinkIcon,
    Storage, Phone, FormatAlignLeft, CalendarToday, AlternateEmail, EventNote, FormatListBulleted, Schedule,
} from '@material-ui/icons'
import Field from '../utils/fields/Field';
import './TemplateBuilder.css';

const InputTypeIcons = {
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
}

const OutputTypeIcons = {
    'text': FormatAlignLeft,
    'url': LinkIcon,
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
    new Field({ name: 'database', inputType: 'database', value: 'characters' }),
    new Field({ name: 'Name', inputType: 'word', outputType: 'title', value: 'Jon Snow' }),
    new Field({ name: 'Description', inputType: 'text', outputType: 'text', value: 'A character in the Game of Thrones' }),
    new Field({ name: 'Type', inputType: 'word', outputType: 'select', value: 'main' }),
    new Field({ name: 'Tags', inputType: 'word', outputType: 'multi_select', value: ['man', 'young'] }),
    new Field({ name: 'URL', inputType: 'url', outputType: 'url', value: 'https://en.wikipedia.org/wiki/Jon_Snow_(character)' }),
    new Field({ name: 'E-mail', inputType: 'email', outputType: 'email', value: 'jon.snow@example.com' }),
    new Field({ name: 'Phone Number', inputType: 'phone', outputType: 'phone', value: '+1234567890' }),
    new Field({ name: 'Birthday', inputType: 'date', outputType: 'date', value: '1996.08.01 12:00' }),
];

export const TemplateBuilder = () => {
    const databaseField = fields.find(field => field.inputType === 'database');
    const databaseFields = fields.filter(field => field.inputType !== 'database');

    return <div className="template-builder">
        <Container maxWidth="xl">
            <form className="template-builder__form" noValidate autoComplete="off">
                <TextField
                    label="Template" size="small" spellCheck={false} classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
                    value="{Name:text:text}: {Description:text:text} #{Type:word:select}[ #{Tags:word:multi_select}][ #{Tags:word:multi_select}][ {E-mail:email:email}][ {URL:url:url}]"
                />
                <TextField
                    label="Test" size="small" spellCheck={false} variant="outlined" fullWidth multiline
                    value="Jon Snow: A character in the Game of Thrones #main #man #young jon.snow@example.com https://en.wikipedia.org/wiki/Jon_Snow_(character)"
                />
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Database
                        </Typography>
                        <Typography variant="h5" component="h2">
                            {databaseField?.value ?? 'Not specified!'}
                        </Typography>
                    </CardContent>
                </Card>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {databaseFields.map((field) => {
                                    const InputTypeIcon = InputTypeIcons[field.inputType];
                                    const OutputTypeIcon = OutputTypeIcons[field.outputType];

                                    if (!InputTypeIcon) {
                                        throw new Error('Invalid input type: ' + field.inputType)
                                    }

                                    return <TableCell><Button disableRipple
                                        classes={{
                                            root: 'template-builder__field-name'
                                        }}
                                        startIcon={OutputTypeIcon ? <OutputTypeIcon/> : <InputTypeIcon/>}
                                    >{field.name}</Button></TableCell>
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                {databaseFields.map((field) => {
                                    return <TableCell>{(
                                        Array.isArray(field.value)
                                            ? field.value.map(value => <Chip className="template-builder__multiselect-chip" label={value} />)
                                            : field.outputType === 'select'
                                                ? <Chip label={field.value} />
                                                : field.outputType === 'url'
                                                    ? <><Link href={field.value} title={field.value}>{ellipsis(field.value, 35)}</Link></>
                                                    : field.value
                                    )}</TableCell>
                                })}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </form>
        </Container>
    </div>
}

function ellipsis(text, length) {
    if (text.length <= length + 9) {
        return text;
    }

    return text.slice(0, length) + '...' + text.slice(-6);
}
