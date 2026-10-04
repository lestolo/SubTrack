/*
 * IndexedDB storage. Everything stays in the browser of this device.
 *
 * Stores:
 *   subscriptions  keyPath "id"
 *   settings       keyPath "key"  ({ key, value })
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  const DB_NAME = 'subtrack';
  const DB_VERSION = 1;
  const BACKUP_FORMAT = 'subtrack-backup';
  const BACKUP_VERSION = 1;

  const CURRENCIES = [
    'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK',
    'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'TRY', 'BRL', 'MXN', 'ARS',
    'INR', 'CNY', 'HKD', 'SGD', 'KRW', 'ZAR', 'AED', 'ILS',
  ];

  const DEFAULT_SETTINGS = {
    lang: 'auto',
    theme: 'auto',
    currency: 'EUR',
    rates: {},
    defaultReminder: 1,
    notifications: false,
    notified: {},
    sort: 'next',
    view: 'monthly',
  };

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = g.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        // Another tab upgraded the schema: close so it can proceed.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
    });
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function tx(storeNames, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(storeNames, mode);
      let result;
      Promise.resolve(fn(t)).then((r) => { result = r; }, reject);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    });
  }

  // ---------- Validation ----------

  const HEX = /^[0-9a-f]{6}$/i;

  function str(v, max) {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  }

  /** Returns a clean subscription object, or null if unusable. */
  function sanitize(input) {
    if (!input || typeof input !== 'object') return null;
    const { schedule, catalog } = ST;
    const name = str(input.name, 80);
    const price = Math.round(Number(input.price) * 100) / 100;
    const startDate = str(input.startDate, 10);
    const freq = {
      every: Number(input.freq && input.freq.every),
      unit: input.freq && input.freq.unit,
    };
    if (!name || !Number.isFinite(price) || price < 0 || price > 1e7) return null;
    if (!schedule.parseISO(startDate) || !schedule.isValidFreq(freq)) return null;

    const catalogId = typeof input.catalogId === 'string' && catalog.get(input.catalogId)
      ? input.catalogId : null;
    const currency = CURRENCIES.includes(input.currency) ? input.currency : 'EUR';
    const category = catalog.CATEGORIES.includes(input.category) ? input.category : 'other';
    const color = HEX.test(input.color || '') ? input.color.toUpperCase() : '6B7280';
    const reminder = Number.isInteger(input.reminder) && input.reminder >= -1 && input.reminder <= 30
      ? input.reminder : 1;
    const now = Date.now();
    const id = typeof input.id === 'string' && /^[\w-]{8,64}$/.test(input.id)
      ? input.id : uuid();

    return {
      id,
      catalogId,
      name,
      price,
      currency,
      freq,
      startDate,
      category,
      color,
      reminder, // -1 = none, 0 = same day, n = days before
      notes: str(input.notes, 1000),
      active: input.active !== false,
      createdAt: Number.isFinite(input.createdAt) ? input.createdAt : now,
      updatedAt: now,
    };
  }

  function uuid() {
    if (g.crypto && g.crypto.randomUUID) return g.crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  // ---------- Subscriptions ----------

  function getAll() {
    return tx('subscriptions', 'readonly', (t) => promisify(t.objectStore('subscriptions').getAll()));
  }

  function put(sub) {
    const clean = sanitize(sub);
    if (!clean) return Promise.reject(new Error('Invalid subscription'));
    return tx('subscriptions', 'readwrite', (t) => {
      t.objectStore('subscriptions').put(clean);
      return clean;
    });
  }

  function remove(id) {
    return tx('subscriptions', 'readwrite', (t) => {
      t.objectStore('subscriptions').delete(id);
    });
  }

  // ---------- Settings ----------

  async function getSettings() {
    const rows = await tx('settings', 'readonly', (t) => promisify(t.objectStore('settings').getAll()));
    const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    for (const { key, value } of rows) {
      if (key in DEFAULT_SETTINGS) out[key] = value;
    }
    return out;
  }

  function setSetting(key, value) {
    if (!(key in DEFAULT_SETTINGS)) return Promise.reject(new Error(`Unknown setting: ${key}`));
    return tx('settings', 'readwrite', (t) => {
      t.objectStore('settings').put({ key, value });
    });
  }

  // ---------- Backup ----------

  async function exportBackup() {
    const [subscriptions, settings] = await Promise.all([getAll(), getSettings()]);
    delete settings.notified;
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      settings,
      subscriptions,
    };
  }

  /** Merges a backup into the database (same id = overwritten). Returns count. */
  async function importBackup(data) {
    if (!data || data.format !== BACKUP_FORMAT || !Array.isArray(data.subscriptions)) {
      throw new Error('Invalid backup');
    }
    const subs = data.subscriptions.map(sanitize).filter(Boolean);
    const s = data.settings || {};
    const settings = {};
    if (['auto', ...ST.i18n.LANGS].includes(s.lang)) settings.lang = s.lang;
    if (['auto', 'light', 'dark'].includes(s.theme)) settings.theme = s.theme;
    if (CURRENCIES.includes(s.currency)) settings.currency = s.currency;
    if (Number.isInteger(s.defaultReminder) && s.defaultReminder >= -1 && s.defaultReminder <= 30) {
      settings.defaultReminder = s.defaultReminder;
    }
    if (s.rates && typeof s.rates === 'object') {
      settings.rates = {};
      for (const [cur, rate] of Object.entries(s.rates)) {
        if (CURRENCIES.includes(cur) && Number.isFinite(rate) && rate > 0) settings.rates[cur] = rate;
      }
    }
    await tx(['subscriptions', 'settings'], 'readwrite', (t) => {
      const so = t.objectStore('subscriptions');
      for (const sub of subs) so.put(sub);
      const st = t.objectStore('settings');
      for (const [key, value] of Object.entries(settings)) st.put({ key, value });
    });
    return subs.length;
  }

  function wipe() {
    return tx(['subscriptions', 'settings'], 'readwrite', (t) => {
      t.objectStore('subscriptions').clear();
      t.objectStore('settings').clear();
    });
  }

  ST.db = {
    CURRENCIES,
    DEFAULT_SETTINGS,
    open,
    sanitize,
    getAll,
    put,
    remove,
    getSettings,
    setSetting,
    exportBackup,
    importBackup,
    wipe,
  };
})(typeof self !== 'undefined' ? self : globalThis);
