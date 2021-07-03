import { Button, Container, Divider, Link, List, ListItem, ListItemText, Paper, TextField, Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import copyToClipboard from 'copy-to-clipboard';
import { TemplateTester } from '../shared/TemplateTester';
import './TemplateManager.css';
import { useHistory, useLocation } from 'react-router-dom';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return [...result];
};

export const TemplateManager = () => {
    const { pathname, search } = useLocation();
    const history = useHistory();

    const defaultTemplates = useMemo(() => {
        const params = new URLSearchParams(search);
        const rawTemplates = params.get('templates');
        try {
            const result = JSON.parse(rawTemplates);
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
    // const [templates, setTemplates] = useState([
    //     { pattern: 'buy [{quantity:number} (kg|piece[s]) of]{item:text}' },
    //     { pattern: 'watch {name:text}[ #{type:word}]' },
    //     { pattern: '[to]do {task:text}' },
    //     { pattern: 'contact {first name:word}[ {last name:word}][ {phone:phone}][ {e-mail:email}][ {website:url}]' },
    //     { pattern: '[#{:database} ][note ]{note:text}[ #{tags:word}][ #{tags:word}][ #{tags:word}]' },
    // ]);

    const [isCopied, setIsCopied] = useState(false);
    const copyValue = useMemo(() => `/reorder-templates${templates.map(t => '\n' + t.pattern).join('')}`, [templates]);
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
        setIsCopiedTimeoutId(setTimeout(() => setIsCopied(false), 5000));
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
            params.set('templates', JSON.stringify(templates));
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
        <Typography variant="h5">Template manager</Typography>
        <Typography variant="caption">
            Drag templates to change their order.
            Templates on the top of the list have higher priority.
            <br/>
            Use the <b>Template tester</b> to check that proper template is used for the provided message.
        </Typography>
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
                                                    primary={`${index + 1}) ${template.pattern}`}
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
            Just paste this into your chat with <b><Link target="_blank" href="https://t.me/declutterme_bot">@declutterme_bot</Link></b> to save:
        </Typography>
        <TextField
            inputRef={copyFieldRef}
            spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off"
            value={copyValue} variant="outlined"
            multiline fullWidth
        />
        <Button variant="contained" color="primary" onClick={copy}>{isCopied ? 'Copied!' : 'Copy'}</Button>
        <Divider />
        <Typography variant="h5">Template tester</Typography>
        <TemplateTester test={test} setTest={setTest} rawPatterns={templates.map(t => t.pattern)} />
    </Container>;
};
