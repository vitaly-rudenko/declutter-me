import React, { useCallback, useMemo } from 'react';
import { Button, Chip, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@material-ui/core';
import { InputTypeIcons } from './InputTypeIcons.js';
import { EntryMatchers, PatternMatcher, PatternBuilder } from '@vitalyrudenko/templater';
import { useLocalize } from '../useLocalize.js';
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

function formatPattern(pattern) {
    return pattern.replace(/\n/g, '\\n')
}

export const TemplateTester = ({ test, setTest, rawPatterns }) => {
    const { localize } = useLocalize();
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
                            new EntryMatchers()
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
            spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
            onChange={onTestChange}
            label={localize('tester.messagePlaceholder')} size="small" variant="outlined" fullWidth multiline
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

                                return <TableCell key={'tester:name:' + field.name}><Button disableRipple
                                    classes={{
                                        root: 'template-tester__field-name'
                                    }}
                                    startIcon={<InputTypeIcon />}
                                >{field.name || localize('tester.database')}</Button></TableCell>
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            {fields.map((field) => {
                                return <TableCell key={'tester:value:' + field.name}>{(
                                    Array.isArray(field.value)
                                        ? field.value.map(value => <Chip
                                            key={'tester:value:' + field.name + ':' + value} className="template-tester__multiselect-chip" label={value}
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
            {rawPatterns.length > 1 && <Paper classes={{ root: 'template-tester__template' }} variant="outlined">
                {`${rawPatterns.indexOf(rawPattern) + 1}) ${formatPattern(rawPattern)}`}
            </Paper>}
        </>}
    </>
};

function ellipsis(text, length) {
    if (text.length <= length + 9) {
        return text;
    }

    return text.slice(0, length) + '...' + text.slice(-6);
}
