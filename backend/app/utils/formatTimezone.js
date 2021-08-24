export function formatTimezone(timezoneOffsetMinutes) {
    const offset = Math.abs(timezoneOffsetMinutes);

    const timezoneHours = Math.trunc(offset / 60);
    const timezoneMinutes = (offset - timezoneHours * 60);

    return (timezoneOffsetMinutes >= 0 ? '+' : '-') + String(timezoneHours).padStart(2, '0') + ':' + String(timezoneMinutes).padStart(2, '0');
}