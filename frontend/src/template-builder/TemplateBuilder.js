import React, { useCallback, useMemo, useState } from 'react'
import {
    Container, TextField, Table, TableContainer, Paper, TableBody, TableHead, TableRow, TableCell, Chip, Link,
    Card, CardContent, Typography, Button,
    List, ListItem, Divider, ListItemText
} from '@material-ui/core'
import {
    TextFields, TextFormat, LooksOne, Link as LinkIcon,
    Storage, Phone, CalendarToday, AlternateEmail, Schedule,
    HelpOutline,
} from '@material-ui/icons'
import PatternBuilder from '../utils/PatternBuilder';
import PatternMatcher from '../utils/PatternMatcher';
import './TemplateBuilder.css';
import EntryMatchers from '../utils/entries/EntryMatchers';
import RussianDateParser from '../utils/date-parsers/RussianDateParser';

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

function useMemoUnlessFailed(callback, dependencies) {
    return useMemo(() => {
        try {
            return callback();
        } catch (error) {}

        return null;
    }, dependencies);
}

export const TemplateBuilder = () => {
    const [rawPattern, setRawPattern] = useState('{name:text}: {description:text} #{type:word}[ #{tags:word}][ #{tags:word}][ {e-mail:email}][ {url:url}]');
    const pattern = useMemoUnlessFailed(() => new PatternBuilder().build(rawPattern), [rawPattern]);
    const combinations = useMemoUnlessFailed(() => new PatternMatcher().getPatternCombinations(pattern), [pattern]);

    const [test, setTest] = useState('Jon Snow: A character in the Game of Thrones #main #man #young jon.snow@example.com https://en.wikipedia.org/wiki/Jon_Snow_(character)');
    const match = useMemoUnlessFailed(
        () => new PatternMatcher().match(test, pattern, new EntryMatchers({ dateParser: new RussianDateParser() })),
        [test, pattern]
    );

    const databaseField = useMemoUnlessFailed(() => match.fields?.find(f => f.inputType === 'database'), [match]);
    const fields = useMemoUnlessFailed(() => match.fields?.filter(f => f.inputType !== 'database'), [match]);

    console.log({ rawPattern, pattern, combinations, test, match, databaseField, fields });

    const onPatternChange = useCallback((event) => {
        setRawPattern(event.target.value);
    }, [setRawPattern]);

    const onTestChange = useCallback((event) => {
        setTest(event.target.value);
    }, [setTest]);

    return <div className="template-builder">
        <Container maxWidth="lg">
            <form className="template-builder__form" noValidate autoComplete="off">
                <TextField
                    onChange={onPatternChange}
                    label="Template" size="small" spellCheck={false} classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
                    value={rawPattern}
                />
                <TextField
                    onChange={onTestChange}
                    label="Test" size="small" spellCheck={false} variant="outlined" fullWidth multiline
                    error={!match?.match}
                    value={test}
                />
                {match?.match && <Chip
                    variant="outlined"
                    color={databaseField?.value ? 'primary' : 'default'}
                    label={databaseField?.value ?? 'Default database'}
                />}
                {match?.match && <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {fields.map((field) => {
                                    const InputTypeIcon = InputTypeIcons[field.inputType];

                                    if (!InputTypeIcon) {
                                        throw new Error('Invalid input type: ' + field.inputType)
                                    }

                                    return <TableCell key={field.name}><Button disableRipple
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
                                {fields.map((field) => {
                                    return <TableCell key={field.name}>{(
                                        Array.isArray(field.value)
                                            ? field.value.map(value => <Chip
                                                key={field.name + ':' + value} className="template-builder__multiselect-chip" label={value}
                                                variant="outlined"
                                            />)
                                            : field.inputType === 'url'
                                                ? <Link href={field.value} title={field.value}>{ellipsis(field.value, 35)}</Link>
                                                : field.value
                                    )}</TableCell>
                                })}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>}
                <List component={Paper}>
                    {combinations && combinations.length > 0 && combinations.map((combination, i) => {
                        return <>
                            {i > 0 && <Divider/>}
                            <Combination key={i} combination={combination} />
                        </>;
                    })}
                </List>
            </form>
        </Container>
    </div>
};

const Combination = ({ combination }) => {
    return <ListItem>
        <ListItemText
            primary={combination.map((token) => {
                if (token.type === 'text') {
                    return <span>{token.value}</span>;
                }

                if (token.type === 'variable') {
                    const invalid = !InputTypeIcons[token.inputType];
                    return <span
                        className={
                            invalid
                                ? 'template-builder__token-example--invalid'
                                : 'template-builder__token-example--variable'}
                    >
                        {getExampleFor(token.inputType)}
                    </span>;
                }

                throw new Error(`Unsupported token type: ${token.type}`);
            })}
            secondary={combination.map((token) => {
                if (token.type === 'text') {
                    return <Chip classes={{ root: 'template-builder__token' }} size="small" variant="outlined"
                        label={token.value.replace(/ /g, ' · ')} />;
                }

                if (token.type === 'variable') {
                    const invalid = !InputTypeIcons[token.inputType];
                    const IconClass = InputTypeIcons[token.inputType] || HelpOutline;

                    return <Chip
                        classes={{ root: 'template-builder__token' }}
                        icon={<IconClass/>}
                        color={invalid ? 'secondary' : 'primary'}
                        size="small"
                        variant="outlined"
                        label={token.value || 'database'}
                    />;
                }

                throw new Error(`Unsupported token type: ${token.type}`);
            })}
        />
    </ListItem>;
};

const adjectives = [
    'beautiful',
    'elegant',
    'amazing',
    'creative',
    'squished',
    'popular'
];

const nouns = [
    'mouse',
    'cat',
    'keyboard',
    'sun',
    'grass',
    'human',
    'tablet',
    'plane'
];

const verbs = [
    'ate',
    'jumped over',
    'looked at',
    'attacked',
    'protected',
    'greeted',
    'joined forces with',
];

const articles = ['a', 'the'];

const databaseNames = ['shopping', 'notes', 'todo_list', 'reminders', 'recipes'];

function getExampleFor(inputType) {
    if (inputType === 'database') {
        return getRandom(databaseNames);
    }

    if (inputType === 'text') {
        return generateText();
    }

    if (inputType === 'word') {
        return capitalize(getRandom(nouns))
    }

    if (inputType === 'url') {
        return 'https://example.com/jon-snow';
    }

    if (inputType === 'email') {
        return 'jon.snow@example.com';
    }

    if (inputType === 'phone') {
        return '+380123456789';
    }

    if (inputType === 'number') {
        return Math.round(46 + Math.random() * (146 - 46));
    }

    return inputType;
}

function generateText() {
    return capitalize([
        getRandom(adjectives),
        getRandom(nouns),
        getRandom(verbs),
        getRandom(articles),
        getRandom(nouns),
    ].filter(Boolean).join(' '));
}

function capitalize(text) {
    return text[0].toUpperCase() + text.slice(1);
}

function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function ellipsis(text, length) {
    if (text.length <= length + 9) {
        return text;
    }

    return text.slice(0, length) + '...' + text.slice(-6);
}
