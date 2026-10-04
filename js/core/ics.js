/*
 * iCalendar (.ics, RFC 5545) export: one repeating all-day event per active
 * subscription, with an alarm at 09:00 on the reminder day. Calendar apps on
 * the phone then fire the reminder reliably, even with the web app closed.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  function esc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  /** Folds lines longer than 75 octets (RFC 5545 §3.1). */
  function fold(line) {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out = [];
    let cur = '';
    let len = 0;
    for (const ch of line) {
      const n = new TextEncoder().encode(ch).length;
      if (len + n > (out.length ? 74 : 75)) {
        out.push(cur);
        cur = '';
        len = 0;
      }
      cur += ch;
      len += n;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  function ymd(d) {
    return ST.schedule.toISO(d).replace(/-/g, '');
  }

  function stamp(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /** RRULE that keeps month-end dates correct (e.g. the 31st -> last day). */
  function rrule(freq, start) {
    const map = { day: 'DAILY', week: 'WEEKLY', month: 'MONTHLY', year: 'YEARLY' };
    let r = `RRULE:FREQ=${map[freq.unit]};INTERVAL=${freq.every}`;
    const day = start.getDate();
    if ((freq.unit === 'month' || freq.unit === 'year') && day > 28) {
      const days = [];
      for (let d = 28; d <= day; d++) days.push(d);
      if (freq.unit === 'year') r += `;BYMONTH=${start.getMonth() + 1}`;
      r += `;BYMONTHDAY=${days.join(',')};BYSETPOS=-1`;
    }
    return r;
  }

  function alarm(reminder, description) {
    // All-day events start at 00:00; fire at 09:00 local on the reminder day.
    const hours = reminder * 24 - 9;
    const trigger = hours > 0 ? `-PT${hours}H` : `PT${-hours}H`;
    return [
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(description)}`,
      `TRIGGER:${trigger}`,
      'END:VALARM',
    ];
  }

  function build(subs, now) {
    const { schedule, i18n } = ST;
    const dtstamp = stamp(now || new Date());
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SubTrack//Subscription Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:SubTrack',
    ];
    for (const sub of subs) {
      if (!sub.active) continue;
      const start = schedule.parseISO(sub.startDate);
      if (!start) continue;
      const price = i18n.fmtMoney(sub.price, sub.currency);
      const summary = `${sub.name} · ${price}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${sub.id}@subtrack`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${ymd(start)}`,
        `DTEND;VALUE=DATE:${ymd(schedule.addDays(start, 1))}`,
        rrule(sub.freq, start),
        `SUMMARY:${esc(summary)}`,
        'TRANSP:TRANSPARENT',
      );
      const desc = [i18n.freqLabel(sub.freq), sub.notes].filter(Boolean).join('\n');
      if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      if (sub.reminder >= 0) lines.push(...alarm(sub.reminder, summary));
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  ST.ics = { build, rrule, fold, esc };
})(typeof self !== 'undefined' ? self : globalThis);
