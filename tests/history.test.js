import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ST, d } from './helpers.js';

const { history, db } = ST;

function sub(extra) {
  return db.sanitize({
    name: 'Netflix', price: 10, currency: 'EUR', startDate: '2026-01-31',
    freq: { every: 1, unit: 'month' }, ...extra,
  });
}

test('legacy subscription gets a single-entry price history', () => {
  const s = sub();
  assert.deepEqual(s.priceHistory, [{ from: '2026-01-31', price: 10 }]);
  assert.deepEqual(s.charges, {});
  assert.equal(s.pausedAt, null);
});

test('past charges are derived from the schedule, upcoming ones are flagged', () => {
  const list = history.charges(sub(), d('2026-06-30'), d('2026-04-15'));
  assert.deepEqual(list.map((c) => c.iso),
    ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30']);
  assert.deepEqual(list.map((c) => c.status),
    ['assumed', 'assumed', 'assumed', 'upcoming', 'upcoming', 'upcoming']);
  const sum = history.summary(sub(), d('2026-04-15'));
  assert.equal(sum.total, 30);
  assert.equal(sum.count, 3);
  assert.equal(history.summary(sub({ startDate: '2026-12-01' }), d('2026-04-15')).count, 0);
});

test('price changes only apply from their date', () => {
  const s = sub({ priceHistory: [{ from: '2026-01-31', price: 10 }, { from: '2026-03-31', price: 12 }] });
  assert.equal(s.price, 12, 'current price is the latest entry');
  assert.equal(history.priceAt(s, '2026-02-28'), 10);
  assert.equal(history.priceAt(s, '2026-03-31'), 12);
  assert.equal(history.priceAt(s, '2025-01-01'), 10, 'before the first entry uses the first price');
  assert.equal(history.summary(s, d('2026-04-15')).total, 32);
});

test('withPrice: from a date, or correcting the whole history', () => {
  const s = sub();
  const next = history.withPrice(s, 13, '2026-04-30');
  assert.deepEqual(next, [{ from: '2026-01-31', price: 10 }, { from: '2026-04-30', price: 13 }]);
  const s2 = sub({ priceHistory: next });
  // A later change replaces entries on/after its date.
  assert.deepEqual(history.withPrice(s2, 11, '2026-03-31'),
    [{ from: '2026-01-31', price: 10 }, { from: '2026-03-31', price: 11 }]);
  assert.deepEqual(history.withPrice(s2, 9, 'all'), [{ from: '2026-01-31', price: 9 }]);
  // Same price as before the date: no new entry.
  assert.deepEqual(history.withPrice(s, 10, '2026-04-30'), [{ from: '2026-01-31', price: 10 }]);
});

test('confirmed and skipped charges override the computed amount', () => {
  const s = sub({ charges: {
    '2026-02-28': { status: 'paid', amount: 10.5 },
    '2026-03-31': { status: 'skipped' },
    '2026-05-31': { status: 'paid', amount: 99 }, // future: ignored
  } });
  const list = history.charges(s, d('2026-05-31'), d('2026-04-15'));
  assert.deepEqual(list.map((c) => [c.status, c.amount]),
    [['assumed', 10], ['paid', 10.5], ['skipped', 0], ['upcoming', 10], ['upcoming', 10]]);
  assert.equal(history.summary(s, d('2026-04-15')).total, 20.5);
  assert.equal(history.summary(s, d('2026-04-15')).count, 2);
});

test('paused subscriptions stop charging; resuming skips the gap', () => {
  const s = sub({ active: false, pausedAt: '2026-02-15' });
  assert.equal(history.summary(s, d('2026-06-01')).count, 1);
  const gap = history.skippedWhilePaused(s, d('2026-04-30'));
  assert.deepEqual(Object.keys(gap), ['2026-02-28', '2026-03-31']);
  // pausedAt is dropped when active.
  assert.equal(sub({ active: true, pausedAt: '2026-02-15' }).pausedAt, null);
});

test('monthly buckets per currency for the last N months', () => {
  const a = sub();
  const b = db.sanitize({ name: 'X', price: 120, currency: 'USD', startDate: '2025-03-10', freq: { every: 1, unit: 'year' } });
  const buckets = history.monthly([a, b], 4, d('2026-04-15'));
  assert.deepEqual(buckets.map((x) => x.key), ['2026-01', '2026-02', '2026-03', '2026-04']);
  assert.equal(buckets[0].byCur.get('EUR'), 10);
  assert.equal(buckets[2].byCur.get('USD'), 120);
  assert.equal(buckets[3].byCur.size, 0, 'April charge is upcoming (30th)');
});

test('sanitize rejects malformed history and charges', () => {
  const s = sub({
    priceHistory: [{ from: 'nope', price: 5 }, { from: '2026-02-30', price: 5 }, { from: '2026-03-01', price: -1 }],
    charges: { '__proto__': { status: 'paid' }, '2026-02-28': { status: 'evil' }, '2026-03-31': { status: 'paid', amount: 'x' } },
  });
  assert.deepEqual(s.priceHistory, [{ from: '2026-01-31', price: 10 }]);
  assert.deepEqual(s.charges, { '2026-03-31': { status: 'paid' } });
});
