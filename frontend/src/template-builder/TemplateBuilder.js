import React, { useCallback, useMemo, useState } from 'react'
import {
    Container, TextField, Table, TableContainer, Paper, TableBody, TableHead, TableRow, TableCell, Chip, Link,
    Typography, Button,
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

const COLORS = ['orange', 'yellow', 'green', 'blue', 'purple'];

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
        } catch (error) { }

        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callback, ...dependencies]);
}

export const TemplateBuilder = () => {
    resetRandom();

    const [rawPattern, setRawPattern] = useState('(buy|purchase)[ {Kg:number} kg of] {Item:text}[ #{Type:word}]');
    const pattern = useMemoUnlessFailed(() => new PatternBuilder().build(rawPattern), [rawPattern]);
    const combinations = useMemoUnlessFailed(() => new PatternMatcher().getPatternCombinations(pattern)?.filter(c => c.length > 0), [pattern]);

    const [test, setTest] = useState('Buy 5 kg of tomatoes #vegetable');
    const isTesting = useMemo(() => test && rawPattern, [test, rawPattern]);
    const match = useMemoUnlessFailed(
        () => isTesting && new PatternMatcher().match(test, pattern, new EntryMatchers({ dateParser: new RussianDateParser() })),
        [test, pattern, isTesting]
    );

    const fields = useMemoUnlessFailed(() => match?.fields, [match]);

    const onPatternChange = useCallback((event) => {
        setRawPattern(event.target.value);
    }, [setRawPattern]);

    const onTestChange = useCallback((event) => {
        setTest(event.target.value);
    }, [setTest]);

    return <Container classes={{ root: 'template-builder' }} maxWidth="lg" component={Paper} elevation={5}>
        <Typography variant="h5">Template builder</Typography>
        <TextField
            onChange={onPatternChange}
            label="Your template" size="small" spellCheck={false} classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
            value={rawPattern}
        />
        {rawPattern && <>
            <Divider/>
            <Typography variant="h5">Template tester</Typography>
            <TextField
                onChange={onTestChange}
                label="Telegram message" size="small" spellCheck={false} variant="outlined" fullWidth multiline
                error={isTesting && !match}
                value={test}
            />
            {match && <>
                <TableContainer component={Paper} variant="outlined">
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
                                        startIcon={<InputTypeIcon />}
                                    >{field.name || 'Database'}</Button></TableCell>
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
                </TableContainer>
            </>}
        </>}
        {combinations && combinations.length > 0 && <>
            <Divider/>
            <Typography variant="h5">Message examples</Typography>
            <List component={Paper} elevation={0}>
                {combinations.map((combination, i) => {
                    return <>
                        {i > 0 && <Divider />}
                        <Combination combination={combination} />
                    </>;
                })}
            </List>
            <Typography variant="caption">
                All examples are generated automatically, therefore some of them may not work as expected.
                Double check your templates with the <b>Template tester</b>!
            </Typography>
        </>}
    </Container>;
};

const Combination = ({ combination }) => {
    let tokenExampleIndex = 0;

    return <ListItem classes={{ root: 'template-builder__combination-list-item' }}>
        <ListItemText
            classes={{
                primary: 'template-builder__combination-list-item--primary'
            }}
            primary={combination.map((token) => {
                if (token.type === 'text') {
                    return <span className='template-builder__token-example-text'>{token.value}</span>;
                }

                if (token.type === 'variable') {
                    const color = COLORS[tokenExampleIndex % COLORS.length];
                    const className = `template-builder__token-example--${color}`;
                    tokenExampleIndex++;

                    const inputType = token.inputType || '';
                    const invalid = !InputTypeIcons[inputType];
                    const IconClass = InputTypeIcons[inputType] || HelpOutline;

                    const example = getExampleFor(inputType);
                    const space = ''.padEnd(Math.max(0, token.value.length - example.length + 2), ' ');

                    return <span
                        className={'template-builder__token-example ' + (invalid
                            ? 'template-builder__token-example--invalid'
                            : className)}
                    >
                        <span className="template-builder__token-example-label">
                            <IconClass className="template-builder__token-example-icon" />
                            {token.value}
                        </span>
                        {example}
                        {space && <span className='template-builder__token-example-space'>{space}</span>}
                    </span>;
                }

                throw new Error(`Unsupported token type: ${token.type}`);
            })}
        />
    </ListItem>;
};

const adjectives = [
    'big',
    'crazy',
    'happy',
    'small',
    'lovely',
    'fast'
]

const shortNouns = [
    'cat',
    'dog',
    'human',
    'mouse',
    'wolf',
    'whale',
    'robot'
];

const longNouns = [
    'transportation',
    'entertainment',
    'responsibility',
    'recommendation',
    'communication',
    'administration',
    'understanding',
    'establishment'
];

const articles = ['a', 'the'];

const databaseNames = ['shopping', 'notes', 'todo_list', 'reminders', 'recipes'];

function getExampleFor(inputType) {
    if (inputType === 'database') {
        return getNextItem(databaseNames);
    }

    if (inputType === 'text') {
        return generateText();
    }

    if (inputType === 'word') {
        return getNextItem(longNouns);
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
        return String(getNextNumber());
    }

    return inputType;
}

function generateText() {
    return [
        getNextItem(articles),
        getNextItem(adjectives),
        getNextItem(shortNouns),
    ].filter(Boolean).join(' ');
}

let randomIndex = 0;
function resetRandom() {
    randomIndex = 0;
}

function getNextNumber() {
    return (getNextInt() * 46) % 64;
}

function getNextItem(array) {
    return array[getNextInt() % array.length];
}

function getNextInt() {
    randomIndex++;
    return randomIndex;
}

function ellipsis(text, length) {
    if (text.length <= length + 9) {
        return text;
    }

    return text.slice(0, length) + '...' + text.slice(-6);
}
