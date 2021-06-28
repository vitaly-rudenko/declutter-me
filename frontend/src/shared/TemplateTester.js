import React, { useCallback, useMemo, useState } from 'react';
import { Button, Chip, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@material-ui/core';
import { InputTypeIcons } from './InputTypeIcons';
import RussianDateParser from '../utils/date-parsers/RussianDateParser';
import EntryMatchers from '../utils/entries/EntryMatchers';
import PatternMatcher from '../utils/PatternMatcher';
import PatternBuilder from '../utils/PatternBuilder';
import './TemplateTester.css';

function useMemoUnlessFailed(callback, dependencies) {
    return useMemo(() => {
        try {
            return callback();
        } catch (error) { }

        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callback, ...dependencies]);
}

export const TemplateTester = ({ defaultTest = '', rawPatterns }) => {
    const [test, setTest] = useState(defaultTest);
    
    const isTesting = useMemo(() => test && rawPatterns?.length > 0, [test, rawPatterns]);

    const [rawPattern, match] = useMemoUnlessFailed(
        () => {
            if (isTesting) {
                for (const rawPattern of rawPatterns) {
                    try {
                        const pattern = new PatternBuilder().build(rawPattern);
        
                        const match = new PatternMatcher().match(
                            test,
                            pattern,
                            new EntryMatchers({ dateParser: new RussianDateParser() })
                        );
        
                        if (match) {
                            return [rawPattern, match];
                        }
                    } catch (error) {}
                }
            }

            return [null, null];
        },
        [test, rawPatterns, isTesting]
    );

    const fields = useMemoUnlessFailed(() => match?.fields, [match]);

    const onTestChange = useCallback((event) => {
        setTest(event.target.value);
    }, [setTest]);

    return <>
        <TextField
            onChange={onTestChange}
            label="Telegram message" size="small" spellCheck={false} variant="outlined" fullWidth multiline
            error={Boolean(isTesting && !match)}
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
                                        root: 'template-tester__field-name'
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
                                            key={field.name + ':' + value} className="template-tester__multiselect-chip" label={value}
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
            {rawPatterns.length > 1 && <Paper classes={{ root: 'template-tester__template' }} variant="outlined">{rawPattern}</Paper>}
        </>}
    </>
};

function ellipsis(text, length) {
    if (text.length <= length + 9) {
        return text;
    }

    return text.slice(0, length) + '...' + text.slice(-6);
}
