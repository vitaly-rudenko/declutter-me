import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Container, TextField, Paper,
    Typography,
    List, ListItem, Divider, ListItemText, Button
} from '@material-ui/core'
import { HelpOutline } from '@material-ui/icons'
import { InputType, PatternBuilder, PatternMatcher } from '@vitalyrudenko/templater';
import copyToClipboard from 'copy-to-clipboard';
import { TemplateTester } from '../shared/TemplateTester.js';
import { InputTypeIcons } from '../shared/InputTypeIcons.js';
import { useHistory, useLocation } from 'react-router-dom';
import { useLocalize } from '../useLocalize.js';
import './TemplateBuilder.css';

const COLORS = ['orange', 'yellow', 'green', 'blue', 'purple'];

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

    const { pathname, search } = useLocation();
    const { localize } = useLocalize();

    const history = useHistory();

    const defaultRawPattern = useMemo(() => new URLSearchParams(search).get('pattern') || '', [search])
    const defaultTest = useMemo(() => new URLSearchParams(search).get('test') || '', [search])

    const [test, setTest] = useState(defaultTest);
    const [rawPattern, setRawPattern] = useState(defaultRawPattern);
    const pattern = useMemoUnlessFailed(() => new PatternBuilder().build(rawPattern), [rawPattern]);
    const combinations = useMemoUnlessFailed(() => new PatternMatcher().getPatternCombinations(pattern)?.filter(c => c.length > 0), [pattern]);

    const [isCopied, setIsCopied] = useState(false);
    const [isCopiedTimeoutId, setIsCopiedTimeoutId] = useState(null)
    const patternFieldRef = useRef(null)
    const copy = useCallback(() => {
        setIsCopied(true);
        copyToClipboard(rawPattern);

        if (patternFieldRef.current) {
            const target = patternFieldRef.current;
            target.setSelectionRange(0, target.value.length);
            target.focus();
        }

        clearTimeout(isCopiedTimeoutId);
        setIsCopiedTimeoutId(setTimeout(() => setIsCopied(false), 3000));
    }, [rawPattern, isCopiedTimeoutId]);

    const useExample = useCallback(() => {
        setRawPattern(localize('builder.rawPattern'));
        setTest(localize('builder.test'));
    }, [localize]);

    const onPatternChange = useCallback((event) => {
        setRawPattern(event.target.value);
        setIsCopied(false);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        
        if (rawPattern) {
            params.set('pattern', rawPattern);
        }

        if (test) {
            params.set('test', test);
        }

        history.push({
            pathname,
            search: params.toString(),
        });
    }, [history, pathname, test, rawPattern]);

    return <Container classes={{ root: 'page template-builder' }} maxWidth="lg" component={Paper} elevation={5}>
        <Typography variant="h5">{localize('builder.builderTitle')}</Typography>
        <TextField
            onChange={onPatternChange}
            inputRef={patternFieldRef}
            spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
            label={localize('builder.builderPlaceholder')} size="small" classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
            value={rawPattern}
        />
        {rawPattern && <Button variant="contained" color="primary" onClick={copy} tabIndex={-1}>{isCopied ? localize('builder.copied') : localize('builder.copy')}</Button>}
        {!rawPattern && <Button variant="contained" color="default" onClick={useExample}>{localize('builder.loadExample')}</Button>}
        {rawPattern && <>
            <Divider/>
            <Typography variant="h5">{localize('builder.testerTitle')}</Typography>
            <TemplateTester test={test} setTest={setTest} rawPatterns={[rawPattern].filter(Boolean)}/>
        </>}
        {combinations && combinations.length > 0 && <>
            <Divider/>
            <Typography variant="h5">{localize('builder.examplesTitle')}</Typography>
            <List component={Paper} elevation={0}>
                {combinations.map((combination, i) => {
                    return <Fragment key={JSON.stringify(combination) + ':' + i}>
                        {i > 0 && <Divider />}
                        <Combination combination={combination} />
                    </Fragment>;
                })}
            </List>
            <Typography variant="caption" dangerouslySetInnerHTML={{
                __html: localize('builder.examplesCaptionHtml')
            }}></Typography>
        </>}
    </Container>;
};

const Combination = ({ combination }) => {
    const { get } = useLocalize();

    const tokenKey = JSON.stringify(combination) + ':token:';
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
                    const value = token.value || '';

                    const example = getExampleFor(inputType, get);
                    const space = ''.padEnd(Math.max(0, value.length - example.length + 2), ' ');

                    return <span
                        className={'template-builder__token-example ' + (invalid
                            ? 'template-builder__token-example--invalid'
                            : className)}
                    >
                        <span className="template-builder__token-example-label">
                            <IconClass className="template-builder__token-example-icon" />
                            {value}
                        </span>
                        {example}
                        {space && <span className='template-builder__token-example-space'>{space}</span>}
                    </span>;
                }

                throw new Error(`Unsupported token type: ${token.type}`);
            }).map((token, i) => <Fragment key={tokenKey + i}>{token}</Fragment>)}
        />
    </ListItem>;
};

function getExampleFor(inputType, get) {
    if (inputType === InputType.DATABASE) {
        return getNextItem(get('builder.databaseNames'));
    }

    if (inputType === InputType.TEXT) {
        return generateText(get);
    }

    if (inputType === InputType.WORD) {
        return getNextItem(get('builder.nouns'));
    }

    if (inputType === InputType.URL) {
        return 'https://example.com/jon-snow';
    }

    if (inputType === InputType.EMAIL) {
        return 'jon.snow@example.com';
    }

    if (inputType === InputType.PHONE) {
        return '+380123456789';
    }

    if (inputType === InputType.NUMBER) {
        return String(getNextNumber());
    }

    if (inputType === InputType.MATCH) {
        return '<not supported>';
    }

    return inputType;
}

function generateText(get) {
    return [
        (getNextInt() % 3) % 2 === 1 && get('builder.article'),
        getNextItem(get('builder.adjectives')),
        getNextItem(get('builder.nouns')),
    ].filter(Boolean).join(' ');
}

let randomIndex = null;
resetRandom();

function resetRandom() {
    randomIndex = new Date().getDate();
}

function getNextNumber() {
    return Math.floor(getNextInt() * Math.PI ** Math.PI) % 64;
}

function getNextItem(array) {
    return array[Math.floor(getNextInt() * Math.PI) % array.length];
}

function getNextInt() {
    randomIndex++;
    return randomIndex;
}
