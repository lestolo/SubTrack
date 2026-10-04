/*
 * Billing-date maths. Pure functions, no DOM, usable from the page, the
 * service worker and Node tests.
 *
 * Dates are handled as local calendar days ("YYYY-MM-DD" strings) so that
 * time zones and DST never shift a renewal to the wrong day.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  const UNITS = ['day', 'week', 'month', 'year'];
  const PRESETS = {
    weekly: { every: 1, unit: 'week' },
    monthly: { every: 1, unit: 'month' },
    quarterly: { every: 3, unit: 'month' },
    semiannual: { every: 6, unit: 'month' },
    yearly: { every: 1, unit: 'year' },
  };
  const AVG_DAYS_PER_MONTH = 365.2425 / 12;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }

  function today() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /** Adds whole months, clamping to the last day (Jan 31 + 1 month = Feb 28/29). */
  function addMonths(date, months) {
    const total = date.getFullYear() * 12 + date.getMonth() + months;
    const y = Math.floor(total / 12);
    const m = total - y * 12;
    return new Date(y, m, Math.min(date.getDate(), daysInMonth(y, m)));
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  /** The k-th billing date after `start` (k = 0 is the start itself). */
  function nthOccurrence(start, freq, k) {
    const n = freq.every * k;
    switch (freq.unit) {
      case 'day': return addDays(start, n);
      case 'week': return addDays(start, n * 7);
      case 'month': return addMonths(start, n);
      case 'year': return addMonths(start, n * 12);
      default: throw new Error(`Unknown unit: ${freq.unit}`);
    }
  }

  function diffDays(a, b) {
    // Round to absorb DST hour shifts between two local midnights.
    return Math.round((b - a) / 86400000);
  }

  function isValidFreq(freq) {
    return !!freq && UNITS.includes(freq.unit) &&
      Number.isInteger(freq.every) && freq.every >= 1 && freq.every <= 999;
  }

  /**
   * First billing date on or after `from` (defaults to today).
   * Returns a Date or null for invalid input.
   */
  function nextRenewal(startISO, freq, from) {
    const r = nextWithIndex(startISO, freq, from);
    return r ? r.date : null;
  }

  function nextWithIndex(startISO, freq, from) {
    const start = parseISO(startISO);
    if (!start || !isValidFreq(freq)) return null;
    const ref = from || today();
    if (start >= ref) return { date: start, k: 0, start };

    // Estimate k from elapsed days, then correct (months have uneven length).
    const periodDays = {
      day: freq.every,
      week: freq.every * 7,
      month: freq.every * AVG_DAYS_PER_MONTH,
      year: freq.every * 365.2425,
    }[freq.unit];
    let k = Math.max(0, Math.floor(diffDays(start, ref) / periodDays) - 1);
    let d = nthOccurrence(start, freq, k);
    while (d < ref) d = nthOccurrence(start, freq, ++k);
    return { date: d, k, start };
  }

  /** Billing date immediately before `next` (or null if that's the start). */
  function previousRenewal(startISO, freq, from) {
    const r = nextWithIndex(startISO, freq, from);
    if (!r || r.k === 0) return null;
    return nthOccurrence(r.start, freq, r.k - 1);
  }

  /** All billing dates within [from, to] inclusive. */
  function occurrencesBetween(startISO, freq, from, to) {
    const r = nextWithIndex(startISO, freq, from);
    const out = [];
    if (!r) return out;
    // Each date is computed from the start (no cumulative month-end drift).
    for (let k = r.k, d = r.date; d <= to; d = nthOccurrence(r.start, freq, ++k)) {
      out.push(d);
    }
    return out;
  }

  /** Normalises a price to its average monthly cost. */
  function monthlyCost(price, freq) {
    if (!isValidFreq(freq) || !Number.isFinite(price)) return 0;
    switch (freq.unit) {
      case 'day': return (price * AVG_DAYS_PER_MONTH) / freq.every;
      case 'week': return (price * AVG_DAYS_PER_MONTH) / (7 * freq.every);
      case 'month': return price / freq.every;
      case 'year': return price / (12 * freq.every);
      default: return 0;
    }
  }

  function presetOf(freq) {
    for (const [name, p] of Object.entries(PRESETS)) {
      if (p.every === freq.every && p.unit === freq.unit) return name;
    }
    return 'custom';
  }

  ST.schedule = {
    UNITS,
    PRESETS,
    toISO,
    parseISO,
    today,
    addDays,
    addMonths,
    diffDays,
    isValidFreq,
    nthOccurrence,
    nextRenewal,
    previousRenewal,
    occurrencesBetween,
    monthlyCost,
    presetOf,
  };
})(typeof self !== 'undefined' ? self : globalThis);
