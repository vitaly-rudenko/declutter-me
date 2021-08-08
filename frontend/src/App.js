import { createTheme, CssBaseline, Fab, ThemeProvider } from '@material-ui/core';
import { Brightness4 } from '@material-ui/icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';
import { TemplateManager } from './template-manager/TemplateManager.js';
import { TemplateBuilder } from './template-builder/TemplateBuilder.js';
import { Timezone } from './timezone/Timezone.js';
import './App.css';

const version = require('../package.json').version;

export const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem('v1.theme') ?? 'dark');
    const muiTheme = useMemo(() => createTheme({
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
        <HashRouter basename='/'>
            <Switch>
                <Route path="/" component={() => <Redirect to="/en/builder" />} exact />
                <Route path="/builder" component={() => <Redirect to="/en/builder" />} exact />
                <Route path="/timezone" component={() => <Redirect to="/en/timezone" />} exact />
                <Route path='/:language/builder' component={TemplateBuilder} />
                <Route path='/:language/manager' component={TemplateManager} />
                <Route path='/:language/timezone' component={Timezone} />
            </Switch>
        </HashRouter>
        <Fab size="small" color="primary" classes={{ root: 'switch-theme-button' }} onClick={switchTheme}><Brightness4/></Fab>
        <div id="version">{version}</div>
    </ThemeProvider>;
}
