const parseTimezoneOffsetMinutes = (value) => {
    if (value === 'UTC' || value === 'GMT') {
        return 0;
    }

    if (value.startsWith('GMT')) {
        value = value.slice('GMT'.length);
    }

    if (value.startsWith('UTC')) {
        value = value.slice('UTC'.length);
    }

    const [hours, minutes] = value.split(':').map(Number);

    if (!Number.isInteger(hours)) {
        return null;
    }

    const sign = hours >= 0 ? 1 : -1;

    return hours * 60 + sign * (Number.isInteger(minutes) ? minutes : 0);
}

module.exports = parseTimezoneOffsetMinutes;
