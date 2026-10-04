/*
 * Payment history.
 *
 * Past charges are derived from the billing schedule (start date + frequency)
 * and the subscription's price history. The user can override any single
 * charge: confirm the amount actually paid, or mark it as not charged.
 *
 * Data kept on each subscription (see db.sanitize):
 *   priceHistory  [{ from: 'YYYY-MM-DD', price }]  sorted by `from`; a price
 *                 applies to charges on or after its date. Charges before the
 *                 first entry use the first price.
 *   charges       { 'YYYY-MM-DD': { status: 'paid' | 'skipped', amount? } }
 *   pausedAt      'YYYY-MM-DD' | null - no charges after this date.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  function priceAt(sub, iso) {
    const hist = sub.priceHistory;
    if (!hist || !hist.length) return sub.price;
    let price = hist[0].price;
    for (const entry of hist) {
      if (entry.from <= iso) price = entry.price;
      else break;
    }
    return price;
  }

  /**
   * All charges of a subscription from its start up to `until` (inclusive).
   * Each item: { date, iso, amount, currency, status }
   * status: 'assumed' (computed), 'paid' (confirmed), 'skipped', 'upcoming'.
   */
  function charges(sub, until, today) {
    const { schedule } = ST;
    const start = schedule.parseISO(sub.startDate);
    if (!start) return [];
    const ref = today || schedule.today();
    const todayISO = schedule.toISO(ref);
    let end = until || ref;
    const paused = sub.pausedAt && schedule.parseISO(sub.pausedAt);
    if (paused && paused < end) end = paused;

    const out = [];
    for (const date of schedule.occurrencesBetween(sub.startDate, sub.freq, start, end)) {
      const iso = schedule.toISO(date);
      const override = sub.charges && sub.charges[iso];
      const base = priceAt(sub, iso);
      let status = iso > todayISO ? 'upcoming' : 'assumed';
      let amount = base;
      if (override && status !== 'upcoming') {
        status = override.status;
        amount = override.status === 'skipped' ? 0
          : (Number.isFinite(override.amount) ? override.amount : base);
      }
      out.push({ date, iso, amount, expected: base, currency: sub.currency, status });
    }
    return out;
  }

  /** Charges actually counted as spent (paid or assumed, not upcoming/skipped). */
  function isSpent(c) {
    return c.status === 'paid' || c.status === 'assumed';
  }

  /** { total, count, since } for one subscription up to today. */
  function summary(sub, today) {
    const list = charges(sub, today, today).filter(isSpent);
    return {
      total: list.reduce((s, c) => s + c.amount, 0),
      count: list.length,
      since: list.length ? list[0].date : null,
    };
  }

  /**
   * Spending per calendar month for the `months` months ending with the
   * current one. Returns [{ key: 'YYYY-MM', date, byCur: Map }].
   */
  function monthly(subs, months, today) {
    const { schedule } = ST;
    const ref = today || schedule.today();
    const buckets = [];
    const index = new Map();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      const key = schedule.toISO(d).slice(0, 7);
      const b = { key, date: d, byCur: new Map() };
      buckets.push(b);
      index.set(key, b);
    }
    for (const sub of subs) {
      for (const c of charges(sub, ref, ref)) {
        if (!isSpent(c)) continue;
        const b = index.get(c.iso.slice(0, 7));
        if (b) b.byCur.set(c.currency, (b.byCur.get(c.currency) || 0) + c.amount);
      }
    }
    return buckets;
  }

  /**
   * New price history after changing the price.
   * mode: 'all'  - correct every past charge (single entry from the start);
   *       an ISO date - the new price applies from that date onwards.
   */
  function withPrice(sub, price, mode) {
    const hist = (sub.priceHistory && sub.priceHistory.length)
      ? sub.priceHistory : [{ from: sub.startDate, price: sub.price }];
    if (mode === 'all') return [{ from: sub.startDate, price }];
    const kept = hist.filter((e) => e.from < mode);
    if (!kept.length) return [{ from: sub.startDate, price }];
    if (kept[kept.length - 1].price === price) return kept;
    return [...kept, { from: mode, price }];
  }

  /**
   * Charges to mark as skipped when a paused subscription is resumed:
   * every billing date after the pause, up to and excluding today.
   */
  function skippedWhilePaused(sub, today) {
    const { schedule } = ST;
    const paused = sub.pausedAt && schedule.parseISO(sub.pausedAt);
    if (!paused) return {};
    const ref = today || schedule.today();
    const out = {};
    const from = schedule.addDays(paused, 1);
    const to = schedule.addDays(ref, -1);
    if (from > to) return out;
    for (const d of schedule.occurrencesBetween(sub.startDate, sub.freq, from, to)) {
      out[schedule.toISO(d)] = { status: 'skipped' };
    }
    return out;
  }

  ST.history = { priceAt, charges, isSpent, summary, monthly, withPrice, skippedWhilePaused };
})(typeof self !== 'undefined' ? self : globalThis);
