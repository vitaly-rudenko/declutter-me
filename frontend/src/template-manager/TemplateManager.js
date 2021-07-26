import { Button, Container, Divider, Link, List, ListItem, ListItemText, Paper, TextField, Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import copyToClipboard from 'copy-to-clipboard';
import { TemplateTester } from '../shared/TemplateTester';
import { useHistory, useLocation } from 'react-router-dom';
import { useLocalize } from '../useLocalize';
import pako from 'pako';
import base64url from 'base64url';
import './TemplateManager.css';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return [...result];
};

function encodeTemplates(templates) {
    return base64url.fromBase64(
        Buffer.from(
            pako.deflate(
                JSON.stringify(templates.map(t => JSON.stringify(t)))
            )
        ).toString('base64')
    );
}

function decodeTemplates(templates) {
    return JSON.parse(pako.inflate(base64url.toBuffer(templates), { to: 'string' }));
}

function formatPattern(pattern) {
    return pattern.replace(/\n/g, '\\n')
}

export const TemplateManager = () => {
    const { localize } = useLocalize();
    const { pathname, search } = useLocation();
    const history = useHistory();

    const defaultTemplates = useMemo(() => {
        const params = new URLSearchParams(search);
        const rawTemplates = params.get('templates');
        try {
            const result = decodeTemplates(rawTemplates);
            if (!Array.isArray(result)) {
                return [];
            }
            return result;
        } catch (error) {
            return [];
        }
    }, [search]);
    const defaultTest = useMemo(() => new URLSearchParams(search).get('test') || '', [search])
    
    const [test, setTest] = useState(defaultTest);
    const [templates, setTemplates] = useState(defaultTemplates);

    const [isCopied, setIsCopied] = useState(false);
    const copyValue = useMemo(() => `/templates reorder${templates.map(t => '\n' + t.pattern.replace(/\n/g, '\\n')).join('')}`, [templates]);
    const [isCopiedTimeoutId, setIsCopiedTimeoutId] = useState(null)
    const copyFieldRef = useRef(null)
    const copy = useCallback(() => {
        setIsCopied(true);
        copyToClipboard(copyValue);

        if (copyFieldRef.current) {
            const target = copyFieldRef.current;
            target.setSelectionRange(0, target.value.length);
            target.focus();
        }

        clearTimeout(isCopiedTimeoutId);
        setIsCopiedTimeoutId(setTimeout(() => setIsCopied(false), 3000));
    }, [copyValue, isCopiedTimeoutId]);

    const onDragEnd = useCallback((result) => {
        if (!result.destination) {
            return;
        }

        setIsCopied(false);

        setTemplates(reorder(
            templates,
            result.source.index,
            result.destination.index
        ));
    }, [templates]);

    useEffect(() => {
        const params = new URLSearchParams();

        if (templates.length > 0) {
            params.set('templates', encodeTemplates(templates))
        }

        if (test) {
            params.set('test', test);
        }

        history.push({
            pathname,
            search: params.toString(),
        });
    }, [history, pathname, test, templates]);

    return <Container classes={{ root: 'page template-manager' }} maxWidth="lg" component={Paper} elevation={5}>
        <Typography variant="h5">{localize('manager.managerTitle')}</Typography>
        <Typography variant="caption" dangerouslySetInnerHTML={{
            __html: localize('manager.managerCaptionHtml')
        }}></Typography>
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
                {(provided) => (
                    <div className="template-manager__template-list-wrapper" {...provided.droppableProps} ref={provided.innerRef}>
                        <List classes={{ root: 'template-manager__template-list' }}>
                            {templates.map((template, index) => (
                                <Draggable key={template.pattern} draggableId={template.pattern} index={index}>
                                    {(provided) => (
                                        <div className="template-manager__template-list-item-wrapper" ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}>
                                            <ListItem component={Paper} variant="outlined" classes={{ root: 'template-manager__template-list-item' }}>
                                                <ListItemText
                                                    classes={{ primary: 'template-manager__template-list-item--primary' }}
                                                    primary={`${index + 1}) ${formatPattern(template.pattern)}`}
                                                />
                                            </ListItem>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </List>
                    </div>
                )}
            </Droppable>
        </DragDropContext>
        <Typography variant="body1" component="h1">
            <span dangerouslySetInnerHTML={{
                __html: localize('manager.copyResultHtml')
            }}></span> <b><Link target="_blank" href="https://t.me/declutterme_bot">@declutterme_bot</Link></b>:
        </Typography>
        <TextField
            inputRef={copyFieldRef}
            spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
            value={copyValue} variant="outlined"
            multiline fullWidth
        />
        <Button variant="contained" color="primary" onClick={copy}>{isCopied ? localize('manager.copied') : localize('manager.copy')}</Button>
        <Divider />
        <Typography variant="h5">{localize('manager.testerTitle')}</Typography>
        <TemplateTester test={test} setTest={setTest} rawPatterns={templates.map(t => t.pattern)} />
    </Container>;
};
