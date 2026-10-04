// Loads the browser "core" scripts into globalThis.ST for Node tests.
await import('../js/core/version.js');
await import('../js/core/catalog.js');
await import('../js/core/icons.js');
await import('../js/core/schedule.js');
await import('../js/core/i18n.js');
await import('../js/core/db.js');
await import('../js/core/reminders.js');
await import('../js/core/ics.js');
await import('../js/core/history.js');

export const ST = globalThis.ST;
export const d = (s) => ST.schedule.parseISO(s);
export const iso = (date) => ST.schedule.toISO(date);
