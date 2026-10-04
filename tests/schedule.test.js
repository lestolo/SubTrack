import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ST, d, iso } from './helpers.js';

const { schedule } = ST;
const M = { every: 1, unit: 'month' };

test('parseISO rejects invalid dates', () => {
  assert.equal(schedule.parseISO('2026-02-30'), null);
  assert.equal(schedule.parseISO('nope'), null);
  assert.equal(iso(schedule.parseISO('2024-02-29')), '2024-02-29');
});

test('start in the future is the next renewal', () => {
  assert.equal(iso(schedule.nextRenewal('2026-12-01', M, d('2026-10-04'))), '2026-12-01');
});

test('renewal on the reference day counts as today', () => {
  assert.equal(iso(schedule.nextRenewal('2026-01-04', M, d('2026-10-04'))), '2026-10-04');
});

test('monthly from the 31st clamps to month end without drifting', () => {
  const start = '2026-01-31';
  assert.equal(iso(schedule.nextRenewal(start, M, d('2026-02-01'))), '2026-02-28');
  assert.equal(iso(schedule.nextRenewal(start, M, d('2026-03-01'))), '2026-03-31');
  assert.equal(iso(schedule.nextRenewal(start, M, d('2026-04-01'))), '2026-04-30');
  assert.equal(iso(schedule.nextRenewal('2024-01-31', M, d('2024-02-01'))), '2024-02-29');
});

test('quarterly, yearly, weekly and daily periods', () => {
  assert.equal(iso(schedule.nextRenewal('2026-01-15', { every: 3, unit: 'month' }, d('2026-05-01'))), '2026-07-15');
  assert.equal(iso(schedule.nextRenewal('2024-02-29', { every: 1, unit: 'year' }, d('2025-01-01'))), '2025-02-28');
  assert.equal(iso(schedule.nextRenewal('2028-02-29', { every: 1, unit: 'year' }, d('2031-03-01'))), '2032-02-29');
  assert.equal(iso(schedule.nextRenewal('2026-10-01', { every: 1, unit: 'week' }, d('2026-10-04'))), '2026-10-08');
  assert.equal(iso(schedule.nextRenewal('2026-10-01', { every: 10, unit: 'day' }, d('2026-10-12'))), '2026-10-21');
});

test('long-running daily subscription stays exact', () => {
  assert.equal(iso(schedule.nextRenewal('2000-01-01', { every: 1, unit: 'day' }, d('2026-10-04'))), '2026-10-04');
});

test('DST transitions do not shift days', () => {
  // Europe DST changes on the last Sunday of March / October.
  assert.equal(iso(schedule.nextRenewal('2026-03-20', { every: 1, unit: 'week' }, d('2026-03-30'))), '2026-04-03');
  assert.equal(schedule.diffDays(d('2026-10-24'), d('2026-10-26')), 2);
});

test('previousRenewal and occurrencesBetween', () => {
  assert.equal(iso(schedule.previousRenewal('2026-01-31', M, d('2026-03-15'))), '2026-02-28');
  assert.equal(schedule.previousRenewal('2026-12-01', M, d('2026-10-01')), null);
  const occ = schedule.occurrencesBetween('2026-01-31', M, d('2026-02-01'), d('2026-05-31')).map(iso);
  assert.deepEqual(occ, ['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
});

test('monthlyCost normalises every unit', () => {
  assert.equal(schedule.monthlyCost(120, { every: 1, unit: 'year' }), 10);
  assert.equal(schedule.monthlyCost(30, { every: 3, unit: 'month' }), 10);
  assert.ok(Math.abs(schedule.monthlyCost(1, { every: 1, unit: 'day' }) - 30.436875) < 1e-9);
  assert.equal(schedule.monthlyCost(10, { every: 0, unit: 'month' }), 0);
});

test('presetOf maps known frequencies', () => {
  assert.equal(schedule.presetOf({ every: 3, unit: 'month' }), 'quarterly');
  assert.equal(schedule.presetOf({ every: 2, unit: 'month' }), 'custom');
});
