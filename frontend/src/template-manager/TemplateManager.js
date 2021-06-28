import { Container, Divider, List, ListItem, ListItemText, Paper, Typography } from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TemplateTester } from '../shared/TemplateTester';
import './TemplateManager.css';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

export const TemplateManager = () => {
    const [templates, setTemplates] = useState([
        { pattern: 'купить [{количество:number} (шт[ук[и]]|гр[ам[м]]|кг|кило[грам[м]]) ]{товар:text}' },
        { pattern: 'посмотреть {название:text}[ #{тип:word}]' },
        { pattern: '(сделать|задача) {задача:text}' },
        { pattern: 'контакт {имя:word} {фамилия:word}[ {телефон:phone}][ {эл. почта:email}][ {сайт:url}]' },
        { pattern: '[#{:database} ][заметка ]{заметка:text}[ #{теги:word}][ #{теги:word}][ #{теги:word}]' },
    ]);

    const onDragEnd = useCallback((result) => {
        if (!result.destination) {
        return;
        }

        setTemplates(reorder(
            templates,
            result.source.index,
            result.destination.index
        ));
    }, [templates, setTemplates]);

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
        <Divider />
        <Typography variant="h5">Template tester</Typography>
        <TemplateTester rawPatterns={templates.map(t => t.pattern)} />
    </Container>;
};
