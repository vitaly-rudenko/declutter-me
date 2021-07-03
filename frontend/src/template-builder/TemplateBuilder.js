import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Container, TextField, Paper,
    Typography,
    List, ListItem, Divider, ListItemText, Button
} from '@material-ui/core'
import { HelpOutline } from '@material-ui/icons'
import PatternBuilder from '../utils/PatternBuilder';
import PatternMatcher from '../utils/PatternMatcher';
import copyToClipboard from 'copy-to-clipboard';
import { TemplateTester } from '../shared/TemplateTester';
import { InputTypeIcons } from '../shared/InputTypeIcons';
import './TemplateBuilder.css';
import { useHistory, useLocation } from 'react-router-dom';

const COLORS = ['orange', 'yellow', 'green', 'blue', 'purple'];

const EXAMPLE_RAW_PATTERN = '(buy|purchase)[ {Kg:number} kg of] {Item:text}[ #{Type:word}]'
const EXAMPLE_TEST = 'Buy 5 kg of tomatoes #vegetable'

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
        setIsCopiedTimeoutId(setTimeout(() => setIsCopied(false), 5000));
    }, [rawPattern, isCopiedTimeoutId]);

    const useExample = useCallback(() => {
        setRawPattern(EXAMPLE_RAW_PATTERN);
        setTest(EXAMPLE_TEST);
    }, []);

    const onPatternChange = useCallback((event) => {
        setRawPattern(event.target.value);
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
        <Typography variant="h5">Template builder</Typography>
        <TextField
            onChange={onPatternChange}
            inputRef={patternFieldRef}
            spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
            label="Your template" size="small" classes={{ root: 'template-builder__template-field' }} variant="outlined" fullWidth multiline
            value={rawPattern}
        />
        {rawPattern && <Button variant="contained" color="primary" onClick={copy} tabIndex={-1}>{isCopied ? 'Copied!' : 'Copy'}</Button>}
        {!rawPattern && <Button variant="contained" color="default" onClick={useExample}>Load example</Button>}
        {rawPattern && <>
            <Divider/>
            <Typography variant="h5">Template tester</Typography>
            <TemplateTester test={test} setTest={setTest} rawPatterns={[rawPattern].filter(Boolean)}/>
        </>}
        {combinations && combinations.length > 0 && <>
            <Divider/>
            <Typography variant="h5">Message examples</Typography>
            <List component={Paper} elevation={0}>
                {combinations.map((combination, i) => {
                    return <Fragment key={JSON.stringify(combination) + ':' + i}>
                        {i > 0 && <Divider />}
                        <Combination combination={combination} />
                    </Fragment>;
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
            }).map((token, i) => <Fragment key={tokenKey + i}>{token}</Fragment>)}
        />
    </ListItem>;
};

const adjectives = [
    'cruel',
    'spotted',
    'noxious',
    'upbeat',
    'cheerful',
    'public',
    'visible',
    'bustling',
    'additional',
    'ambiguous',
    'burly',
    'bashful',
    'overconfident',
    'colossal',
    'high-pitched',
    'available',
    'ubiquitous',
    'receptive',
    'unsuitable',
    'eatable',
    'grateful',
    'assorted',
    'permissible',
    'fortunate',
    'inconclusive',
    'suitable',
    'snobbish',
    'tiny',
    'straight',
    'muddled',
    'eastern',
    'fallacious',
    'handsome',
    'elfin',
    'scientific',
    'workable',
    'electric',
    'hideous',
    'rotten',
    'fretful',
    'first',
    'meek',
    'fierce',
    'thoughtless',
    'clear',
    'lonely',
    'squalid',
    'logical',
    'dull',
    'picayune',
];

const nouns = [
    'strategy',
    'administration',
    'magazine',
    'establishment',
    'sympathy',
    'ability',
    'highway',
    'technology',
    'transportation',
    'wedding',
    'contribution',
    'republic',
    'introduction',
    'confusion',
    'decision',
    'guidance',
    'possession',
    'proposal',
    'perception',
    'statement',
    'direction',
    'combination',
    'instance',
    'weakness',
    'housing',
    'temperature',
    'atmosphere',
    'literature',
    'construction',
    'passenger',
    'preference',
    'intention',
    'failure',
    'control',
    'department',
    'setting',
    'candidate',
    'championship',
    'reception',
    'boyfriend',
    'internet',
    'assignment',
    'relationship',
    'version',
    'audience',
    'secretary',
    'impression',
    'expression',
    'marriage',
    'customer',
];

const databaseNames = ['shopping', 'notes', 'todo_list', 'reminders', 'recipes'];

function getExampleFor(inputType) {
    if (inputType === 'database') {
        return getNextItem(databaseNames);
    }

    if (inputType === 'text') {
        return generateText();
    }

    if (inputType === 'word') {
        return getNextItem(nouns);
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
        (getNextInt() % 3) % 2 === 1 && 'the',
        getNextItem(adjectives),
        getNextItem(nouns),
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
