import React from 'react'
import {
    Container, TextField, Table, TableContainer, Paper, TableBody, TableHead, TableRow, TableCell, Chip, Link,
    Card, CardContent, Typography, Button
} from '@material-ui/core'
import {
    TextFields, TextFormat, LooksOne, Link as LinkIcon,
    Storage, Phone, CalendarToday, AlternateEmail, Schedule,
} from '@material-ui/icons'
import Field from '../utils/fields/Field';
import PatternBuilder from '../utils/PatternBuilder';
import PatternMatcher from '../utils/PatternMatcher';
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

const fields = [
    new Field({ name: 'database', inputType: 'database', value: 'characters' }),
    new Field({ name: 'Name', inputType: 'word', value: 'Jon Snow' }),
    new Field({ name: 'Description', inputType: 'text', value: 'A character in the Game of Thrones' }),
    new Field({ name: 'Type', inputType: 'word', value: 'main' }),
    new Field({ name: 'Tags', inputType: 'word', value: ['man', 'young'] }),
    new Field({ name: 'E-mail', inputType: 'email', value: 'jon.snow@example.com' }),
    new Field({ name: 'URL', inputType: 'url', value: 'https://en.wikipedia.org/wiki/Jon_Snow_(character)' }),
    // new Field({ name: 'Phone Number', inputType: 'phone', value: '+1234567890' }),
    // new Field({ name: 'Birthday', inputType: 'date', value: '1996.08.01 12:00' }),
];

export const TemplateBuilder = () => {
    const databaseField = fields.find(field => field.inputType === 'database');
    const databaseFields = fields.filter(field => field.inputType !== 'database');

    const rawPattern = '{name:text}: {description:text} #{type:word}[ #{tags:word}][ #{tags:word}][ {e-mail:email}][ {url:url}]';
    const pattern = new PatternBuilder().build(rawPattern);
    const combinations = new PatternMatcher().getPatternCombinations(pattern);

    console.log(combinations);

    return <div className="template-builder">
        <Container maxWidth="lg">
            <form className="template-builder__form" noValidate autoComplete="off">
                <TextField
                    label="Template" size="small" spellCheck={false} classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
                    value={rawPattern}
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

                                    if (!InputTypeIcon) {
                                        throw new Error('Invalid input type: ' + field.inputType)
                                    }

                                    return <TableCell><Button disableRipple
                                        classes={{
                                            root: 'template-builder__field-name'
                                        }}
                                        startIcon={<InputTypeIcon/>}
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
                                            : field.inputType === 'url'
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
