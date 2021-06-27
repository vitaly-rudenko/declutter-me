import { createMuiTheme, CssBaseline, ThemeProvider } from '@material-ui/core';
import './App.css';
import { TemplateBuilder } from './template-builder/TemplateBuilder';

export const App = () => {
    const theme = createMuiTheme({
        palette: {
            type: 'dark',
        },
    });

    return <ThemeProvider theme={theme}>
        <CssBaseline />
        <TemplateBuilder></TemplateBuilder>
    </ThemeProvider>;
}
