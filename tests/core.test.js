import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { ST, d } from './helpers.js';

const base = {
  name: 'Netflix', price: 12.99, currency: 'EUR', startDate: '2026-01-31',
  freq: { every: 1, unit: 'month' }, category: 'video', color: 'E50914', reminder: 2,
  catalogId: 'netflix',
};

test('sanitize accepts valid input and rejects bad data', () => {
  const s = ST.db.sanitize(base);
  assert.equal(s.name, 'Netflix');
  assert.equal(s.active, true);
  assert.equal(ST.db.sanitize({ ...base, price: -1 }), null);
  assert.equal(ST.db.sanitize({ ...base, startDate: '2026-13-01' }), null);
  assert.equal(ST.db.sanitize({ ...base, freq: { every: 1, unit: 'hour' } }), null);
  assert.equal(ST.db.sanitize({ ...base, name: '   ' }), null);
});

test('sanitize neutralises unexpected values', () => {
  const s = ST.db.sanitize({ ...base, color: 'red;background:url(x)', currency: 'XXX', category: 'evil', catalogId: '__proto__' });
  assert.equal(s.color, '6B7280');
  assert.equal(s.currency, 'EUR');
  assert.equal(s.category, 'other');
  assert.equal(s.catalogId, null);
});

test('catalogue ids are unique and safe to use as file names', () => {
  const ids = ST.catalog.ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate catalogue ids');
  for (const id of ids) assert.match(id, /^[a-z0-9]+$/, `bad catalogue id ${id}`);
});

test('bundled brand logos match the catalogue and are inert', async () => {
  const dir = new URL('../icons/brands/', import.meta.url);
  const files = new Set((await readdir(dir)).filter((f) => f.endsWith('.svg')));
  const expected = new Set();
  for (const item of ST.catalog.ITEMS) {
    const src = ST.catalog.logoPath(item);
    if (!item.logo) {
      assert.equal(src, null);
      continue;
    }
    assert.match(item.logo, /^[a-z0-9-]+:[a-z0-9-]+$/, `bad logo source for ${item.id}`);
    assert.equal(src, `icons/brands/${item.id}.svg`);
    expected.add(`${item.id}.svg`);
  }
  assert.deepEqual([...files].sort(), [...expected].sort(), 'run npm run logos');
  for (const f of files) {
    const svg = await readFile(new URL(f, dir), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* viewBox="[\d.\- ]+">/, f);
    assert.doesNotMatch(svg, /<script|<foreignObject|\son\w+\s*=|javascript:|(?:href|src)\s*=\s*["'](?!#)/i, f);
  }
});

test('reminders.due respects reminder window and dedup', () => {
  ST.i18n.setLang('it');
  const sub = ST.db.sanitize(base);
  const today = d('2026-03-29');
  let due = ST.reminders.due([sub], today, {});
  assert.equal(due.length, 1);
  assert.equal(due[0].days, 2);
  assert.match(ST.reminders.text(due[0]).title, /Netflix si rinnova tra 2 giorni/);
  assert.equal(ST.reminders.due([sub], today, { [due[0].key]: '2026-03-31' }).length, 0);
  assert.equal(ST.reminders.due([sub], d('2026-03-20'), {}).length, 0);
  assert.equal(ST.reminders.due([{ ...sub, active: false }], today, {}).length, 0);
  assert.equal(ST.reminders.due([{ ...sub, reminder: -1 }], today, {}).length, 0);
});

test('ics export builds month-end safe rules and alarms', () => {
  ST.i18n.setLang('en');
  const sub = ST.db.sanitize({ ...base, notes: 'Plan; family, 4K' });
  const out = ST.ics.build([sub], new Date(Date.UTC(2026, 9, 4, 12)));
  assert.match(out, /^BEGIN:VCALENDAR\r\n/);
  assert.match(out, /DTSTART;VALUE=DATE:20260131/);
  assert.match(out, /RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=28,29,30,31;BYSETPOS=-1/);
  assert.match(out, /TRIGGER:-PT39H/);
  assert.match(out, /Plan\; family\\, 4K/);
  assert.ok(out.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75));
  assert.equal(ST.ics.rrule({ every: 1, unit: 'year' }, d('2024-02-29')),
    'RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=28,29;BYSETPOS=-1');
});

test('ics folding keeps multibyte characters intact', () => {
  const line = `SUMMARY:${'è'.repeat(80)}`;
  const folded = ST.ics.fold(line);
  assert.equal(folded.replace(/\r\n /g, ''), line);
});

test('both languages define the same keys', () => {
  const { STRINGS } = ST.i18n;
  assert.deepEqual(Object.keys(STRINGS.it).sort(), Object.keys(STRINGS.en).sort());
});
