import { createMuiTheme, CssBaseline, Fab, ThemeProvider } from '@material-ui/core';
import { Brightness4 } from '@material-ui/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TemplateBuilder } from './template-builder/TemplateBuilder';
import './App.css';

export const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem('v1.theme') ?? 'dark');
    const muiTheme = useMemo(() => createMuiTheme({
        palette: {
            type: theme,
            primary: {
                main: theme === 'dark' ? '#fff' : '#000'
            }
        },
    }), [theme]);

    const switchTheme = useCallback(() => {
        if (theme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    }, [theme, setTheme]);

    useEffect(() => {
        localStorage.setItem('v1.theme', theme);
    }, [theme]);

    return <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <TemplateBuilder></TemplateBuilder>
        <Fab size="small" classes={{ root: 'switch-theme-button' }} onClick={switchTheme}><Brightness4/></Fab>
    </ThemeProvider>;
}
