import { Button, Container, Paper, Typography } from '@material-ui/core';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { useLocalize } from '../useLocalize.js';
import './Timezone.css'

function getTimezone() {
    const date = new Date()
    const timezoneOffsetMinutes = -date.getTimezoneOffset();

    const offset = Math.abs(timezoneOffsetMinutes);

    const timezoneHours = Math.trunc(offset / 60);
    const timezoneMinutes = (offset - timezoneHours * 60);

    return (timezoneOffsetMinutes >= 0 ? '+' : '-') + String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
}

export const Timezone = () => {
    const timezone = useMemo(() => getTimezone(), []);
    const { localize } = useLocalize();

    const [isCopied, setIsCopied] = useState(false);
    const [isCopiedTimeoutId, setIsCopiedTimeoutId] = useState(null)
    const timezoneFieldRef = useRef(null)
    const copy = useCallback(() => {
        setIsCopied(true);
        copyToClipboard(timezone);

        if (timezoneFieldRef.current) {
            const range = document.createRange();
            range.selectNode(timezoneFieldRef.current);
            window.getSelection().addRange(range);
        }

        clearTimeout(isCopiedTimeoutId);
        setIsCopiedTimeoutId(setTimeout(() => setIsCopied(false), 3000));
    }, [timezone, isCopiedTimeoutId]);

    return <Container classes={{ root: 'page' }} maxWidth="xs" component={Paper} elevation={5}>
        <Typography innerRef={timezoneFieldRef} variant="h1" align="center">{timezone}</Typography>
        <Button fullWidth variant="contained" color="primary" onClick={copy}>{isCopied ? localize('timezone.copied') : localize('timezone.copy')}</Button>
    </Container>
}
