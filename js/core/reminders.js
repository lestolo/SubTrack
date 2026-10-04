/*
 * Local renewal reminders. Runs both in the page (on open / when it becomes
 * visible) and in the service worker (Periodic Background Sync, where
 * supported). No server and no push service are involved.
 *
 * Each renewal is notified at most once: sent reminders are remembered in the
 * "notified" setting as { "<subId>|<YYYY-MM-DD>": "<YYYY-MM-DD>" }.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  function permission() {
    return typeof g.Notification !== 'undefined' ? g.Notification.permission : 'unsupported';
  }

  /** Renewals that should be announced today. Pure, exported for tests. */
  function due(subs, today, notified) {
    const { schedule } = ST;
    const out = [];
    for (const sub of subs) {
      if (!sub.active || !(sub.reminder >= 0)) continue;
      const next = schedule.nextRenewal(sub.startDate, sub.freq, today);
      if (!next) continue;
      const days = schedule.diffDays(today, next);
      const key = `${sub.id}|${schedule.toISO(next)}`;
      if (days <= sub.reminder && !notified[key]) out.push({ sub, next, days, key });
    }
    return out;
  }

  function text(item) {
    const { t, fmtMoney, fmtDate } = ST.i18n;
    const when = item.days === 0 ? t('notif.today')
      : item.days === 1 ? t('notif.tomorrow')
        : t('notif.inDays', { n: item.days });
    return {
      title: t('notif.title', { name: item.sub.name, when }),
      body: `${fmtMoney(item.sub.price, item.sub.currency)} · ${fmtDate(item.next, { weekday: 'long', day: 'numeric', month: 'long' })}`,
    };
  }

  /**
   * Shows due notifications through the given ServiceWorkerRegistration.
   * Returns the number of notifications shown.
   */
  async function check(registration) {
    const { db, schedule, i18n } = ST;
    if (!registration || permission() !== 'granted') return 0;
    const settings = await db.getSettings();
    if (!settings.notifications) return 0;
    i18n.setLang(settings.lang);

    const today = schedule.today();
    const notified = {};
    // Forget renewals older than a week to keep the map small.
    const cutoff = schedule.toISO(schedule.addDays(today, -7));
    for (const [k, v] of Object.entries(settings.notified || {})) {
      if (v >= cutoff) notified[k] = v;
    }

    const items = due(await db.getAll(), today, notified);
    for (const item of items) {
      const { title, body } = text(item);
      await registration.showNotification(title, {
        body,
        tag: item.key,
        icon: 'icons/icon-192.png',
        badge: 'icons/badge-96.png',
        data: { url: './' },
      });
      notified[item.key] = schedule.toISO(item.next);
    }
    await db.setSetting('notified', notified);
    return items.length;
  }

  ST.reminders = { permission, due, text, check };
})(typeof self !== 'undefined' ? self : globalThis);
