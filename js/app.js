/*
 * SubTrack - main application controller.
 */
(function (g) {
  'use strict';
  const ST = g.ST;
  const { db, schedule, catalog, i18n, ui, reminders } = ST;
  const { h, append, icon, logo, sheet, toast, haptic } = ui;
  const t = (...a) => i18n.t(...a);

  const state = {
    subs: [],
    settings: null,
    registration: null,
  };

  const $ = (id) => document.getElementById(id);

  // ---------- Boot ----------

  async function boot() {
    try {
      state.settings = await db.getSettings();
      state.subs = await db.getAll();
    } catch (err) {
      console.error(err);
      document.getElementById('main').replaceChildren(
        h('p', { class: 'fatal', text: 'IndexedDB is not available (private browsing?). SubTrack cannot store data in this browser.' }));
      return;
    }
    applyLanguage();
    applyTheme();
    bindStatic();
    render();
    registerServiceWorker();
    ST.install.init();
    handleLaunchAction();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        render(); // Day may have changed while in background.
        runReminders();
      }
    });
  }

  function applyLanguage() {
    i18n.setLang(state.settings.lang);
    document.documentElement.lang = i18n.lang;
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of document.querySelectorAll('[data-i18n-label]')) {
      el.setAttribute('aria-label', t(el.dataset.i18nLabel));
      el.setAttribute('title', t(el.dataset.i18nLabel));
    }
    const sort = $('sort');
    sort.replaceChildren(...['next', 'price', 'name'].map((v) =>
      h('option', { value: v, text: t(`sort.${v}`), selected: state.settings.sort === v })));
  }

  const themeQuery = g.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const pref = state.settings.theme;
    const root = document.documentElement;
    if (pref === 'auto') delete root.dataset.theme;
    else root.dataset.theme = pref;
    const dark = pref === 'dark' || (pref === 'auto' && themeQuery.matches);
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
      m.setAttribute('content', dark ? '#0B0B10' : '#F4F4F8');
    }
  }
  themeQuery.addEventListener('change', () => state.settings && applyTheme());

  function bindStatic() {
    $('btn-add').addEventListener('click', () => { haptic(); openPicker(); });
    $('btn-empty-add').addEventListener('click', () => openPicker());
    $('btn-settings').addEventListener('click', () => openSettings());
    $('sort').addEventListener('change', async (e) => {
      state.settings.sort = e.target.value;
      await db.setSetting('sort', e.target.value);
      renderList();
    });
  }

  function handleLaunchAction() {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      history.replaceState(null, '', location.pathname);
      openPicker();
    }
  }

  async function saveSetting(key, value) {
    state.settings[key] = value;
    await db.setSetting(key, value);
  }

  // ---------- Derived data ----------

  function enrich(sub, today) {
    const next = schedule.nextRenewal(sub.startDate, sub.freq, today);
    return {
      sub,
      next,
      days: next ? schedule.diffDays(today, next) : Infinity,
      monthly: schedule.monthlyCost(sub.price, sub.freq),
    };
  }

  function convert(amount, from) {
    const main = state.settings.currency;
    if (from === main) return amount;
    const rate = state.settings.rates[from];
    return rate > 0 ? amount * rate : null;
  }

  function totals(rows) {
    const byCur = new Map();
    for (const r of rows) {
      if (!r.sub.active) continue;
      byCur.set(r.sub.currency, (byCur.get(r.sub.currency) || 0) + r.monthly);
    }
    const main = state.settings.currency;
    let converted = 0;
    let complete = true;
    for (const [cur, v] of byCur) {
      const c = convert(v, cur);
      if (c == null) complete = false;
      else converted += c;
    }
    const currencies = [...byCur.keys()];
    return {
      byCur,
      single: currencies.length <= 1,
      converted: complete ? converted : null,
      mainCur: currencies.length === 1 ? currencies[0] : main,
    };
  }

  // ---------- Render ----------

  function render() {
    const today = schedule.today();
    const rows = state.subs.map((s) => enrich(s, today));
    const empty = rows.length === 0;
    $('empty').hidden = !empty;
    $('summary').hidden = empty;
    $('upcoming-section').hidden = empty;
    $('list-section').hidden = empty;
    if (empty) return;
    renderSummary(rows);
    renderUpcoming(rows);
    renderList(rows);
  }

  function renderSummary(rows) {
    const yearly = state.settings.view === 'yearly';
    const mult = yearly ? 12 : 1;
    const tot = totals(rows);
    const activeCount = rows.filter((r) => r.sub.active).length;
    const main = state.settings.currency;

    let amount;
    let extra = null;
    if (tot.single) {
      const [[cur, v] = [main, 0]] = [...tot.byCur];
      amount = h('p', { class: 'amount', text: i18n.fmtMoney(v * mult, cur) });
    } else if (tot.converted != null) {
      amount = h('p', { class: 'amount' }, h('span', { class: 'approx', text: '≈ ' }), i18n.fmtMoney(tot.converted * mult, main));
      extra = h('p', { class: 'summary-note', text: t('summary.approx') });
    } else {
      const sorted = [...tot.byCur].sort(([a], [b]) => (a === main ? -1 : b === main ? 1 : a.localeCompare(b)));
      amount = h('div', { class: 'amount-multi' },
        sorted.map(([cur, v]) => h('p', { class: 'amount amount-sm', text: i18n.fmtMoney(v * mult, cur) })));
      extra = h('p', { class: 'summary-note', text: t('summary.mixed') });
    }

    const seg = h('div', { class: 'seg seg-sm', role: 'group', 'aria-label': t('summary.toggle') },
      ['monthly', 'yearly'].map((v) => h('button', {
        type: 'button',
        class: state.settings.view === v ? 'active' : '',
        'aria-pressed': String(state.settings.view === v),
        text: t(`freq.${v}`),
        on: {
          click: async () => {
            if (state.settings.view === v) return;
            haptic();
            await saveSetting('view', v);
            render();
          },
        },
      })));

    // ui.append skips null children; native replaceChildren() would render
    // a missing note as the text "null".
    $('summary').replaceChildren();
    append($('summary'), [
      h('div', { class: 'summary-top' },
        h('p', { class: 'summary-label', text: t(yearly ? 'summary.yearly' : 'summary.monthly') }),
        seg),
      amount,
      extra,
      h('p', { class: 'summary-count', text: i18n.tp('summary.active', activeCount) }),
    ]);
  }

  function renderUpcoming(rows) {
    const soon = rows
      .filter((r) => r.sub.active && r.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 12);
    const host = $('upcoming');
    if (!soon.length) {
      host.replaceChildren(h('p', { class: 'muted upcoming-none', text: t('upcoming.none') }));
      return;
    }
    host.replaceChildren(...soon.map((r) => h('button', {
      type: 'button',
      class: `up-card${r.days <= 1 ? ' is-urgent' : ''}`,
      on: { click: () => openForm({ sub: r.sub }) },
    },
    logo(r.sub, 'sm'),
    h('span', { class: 'up-name', text: r.sub.name }),
    h('span', { class: 'up-when', text: i18n.relDays(r.days, r.next) }),
    h('span', { class: 'up-price', text: i18n.fmtMoney(r.sub.price, r.sub.currency) }))));
  }

  function renderList(rowsArg) {
    const today = schedule.today();
    const rows = rowsArg || state.subs.map((s) => enrich(s, today));
    const sort = state.settings.sort;
    const cmp = {
      next: (a, b) => a.days - b.days || a.sub.name.localeCompare(b.sub.name),
      price: (a, b) => (convert(b.monthly, b.sub.currency) ?? b.monthly) - (convert(a.monthly, a.sub.currency) ?? a.monthly),
      name: (a, b) => a.sub.name.localeCompare(b.sub.name, i18n.lang),
    }[sort] || (() => 0);
    rows.sort((a, b) => (b.sub.active - a.sub.active) || cmp(a, b));

    $('list').replaceChildren(...rows.map((r) => {
      const { sub } = r;
      const meta = sub.active
        ? `${i18n.freqLabel(sub.freq)} · ${i18n.relDays(r.days, r.next)}`
        : i18n.freqLabel(sub.freq);
      return h('li', null, h('button', {
        type: 'button',
        class: `sub-row${sub.active ? '' : ' is-paused'}`,
        on: { click: () => openForm({ sub }) },
      },
      logo(sub),
      h('span', { class: 'sub-main' },
        h('span', { class: 'sub-name', text: sub.name }),
        h('span', { class: 'sub-meta' },
          sub.active ? null : h('span', { class: 'badge', text: t('list.paused') }),
          meta)),
      h('span', { class: 'sub-price' },
        h('span', { class: 'price', text: i18n.fmtMoney(sub.price, sub.currency) }),
        sub.freq.unit !== 'month' || sub.freq.every !== 1
          ? h('span', { class: 'per', text: `≈ ${i18n.fmtMoney(r.monthly, sub.currency)}${t('per.month')}` })
          : null)));
    }));
  }

  // ---------- Catalogue picker ----------

  function openPicker() {
    let category = 'all';
    let query = '';

    const search = h('input', {
      type: 'search',
      class: 'input search-input',
      placeholder: t('picker.search'),
      'aria-label': t('picker.search'),
      autocomplete: 'off',
      enterkeyhint: 'search',
    });
    const chips = h('div', { class: 'chips', role: 'tablist' });
    const grid = h('div', { class: 'catalog-grid' });

    const usedCats = new Set(catalog.ITEMS.map((i) => i.category));
    const cats = ['all', ...catalog.CATEGORIES.filter((c) => usedCats.has(c))];
    chips.append(...cats.map((c) => h('button', {
      type: 'button',
      role: 'tab',
      class: `chip${c === category ? ' active' : ''}`,
      dataset: { cat: c },
      text: c === 'all' ? t('picker.all') : t(`cat.${c}`),
      on: {
        click: (e) => {
          category = c;
          for (const b of chips.children) {
            b.classList.toggle('active', b === e.currentTarget);
            b.setAttribute('aria-selected', String(b === e.currentTarget));
          }
          draw();
        },
      },
    })));

    const s = sheet({
      title: t('picker.title'),
      className: 'sheet-tall',
      body: h('div', { class: 'picker' },
        h('div', { class: 'search-wrap' }, icon('search'), search),
        chips,
        grid),
    });

    function norm(v) {
      return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function draw() {
      const q = norm(query);
      const items = catalog.ITEMS
        .filter((i) => (q ? norm(i.name).includes(q) || i.id.includes(q) : category === 'all' || i.category === category))
        .sort((a, b) => a.name.localeCompare(b.name, i18n.lang));

      const tiles = [];
      if (!q) {
        tiles.push(h('button', {
          type: 'button',
          class: 'cat-tile cat-custom',
          on: { click: () => { s.close(); openForm({ custom: '', back: openPicker }); } },
        },
        h('div', { class: 'logo logo-add', 'aria-hidden': 'true' }, icon('plus')),
        h('span', { class: 'cat-name', text: t('picker.custom') }),
        h('span', { class: 'cat-hint', text: t('picker.customHint') })));
      }
      for (const item of items) {
        tiles.push(h('button', {
          type: 'button',
          class: 'cat-tile',
          on: { click: () => { haptic(); s.close(); openForm({ item, back: openPicker }); } },
        },
        logo(item),
        h('span', { class: 'cat-name', text: item.name }),
        h('span', { class: 'cat-hint', text: t(`cat.${item.category}`) })));
      }
      if (q) {
        tiles.push(h('div', { class: 'no-results' },
          items.length ? null : h('p', { class: 'muted', text: t('picker.noResults', { q: query.trim() }) }),
          h('button', {
            type: 'button',
            class: 'btn btn-secondary',
            text: t('picker.createCustom', { q: query.trim() }),
            on: { click: () => { s.close(); openForm({ custom: query.trim(), back: openPicker }); } },
          })));
      }
      grid.replaceChildren(...tiles);
    }

    search.addEventListener('input', () => {
      query = search.value;
      chips.hidden = !!query.trim();
      draw();
    });
    draw();
    // Only autofocus on devices with a fine pointer: on phones the keyboard
    // would cover the catalogue.
    if (g.matchMedia('(pointer: fine)').matches) search.focus();
  }

  // ---------- Add / edit form ----------

  function parsePrice(v) {
    const s = String(v).trim().replace(/\s/g, '');
    if (!s) return NaN;
    // Accept both "1.234,56" and "1,234.56" and "12,99".
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let n = s;
    if (lastComma > lastDot) n = s.replace(/\./g, '').replace(',', '.');
    else n = s.replace(/,/g, '');
    return /^\d+(\.\d+)?$/.test(n) ? Number(n) : NaN;
  }

  function field(labelText, control, hint) {
    const id = control.id || (control.id = `f-${Math.random().toString(36).slice(2, 8)}`);
    return h('div', { class: 'field' },
      h('label', { for: id, text: labelText }),
      control,
      hint ? h('p', { class: 'hint', text: hint }) : null,
      h('p', { class: 'error', 'aria-live': 'polite' }));
  }

  function select(options, value) {
    return h('select', { class: 'input' },
      options.map(([v, label]) => h('option', { value: String(v), text: label, selected: String(v) === String(value) })));
  }

  function reminderOptions() {
    return [
      [-1, t('form.reminderNone')],
      [0, t('form.reminderSame')],
      ...[1, 2, 3, 5, 7, 14].map((n) => [n, i18n.tp('form.reminderDays', n)]),
    ];
  }

  function currencyOptions() {
    let names = null;
    try { names = new Intl.DisplayNames([i18n.lang], { type: 'currency' }); } catch { /* old browser */ }
    return db.CURRENCIES.map((c) => [c, names ? `${c} · ${names.of(c)}` : c]);
  }

  /**
   * opts: { sub } to edit, { item } from catalogue, { custom: 'name' } for custom.
   */
  function openForm(opts) {
    const editing = !!opts.sub;
    const item = opts.item || (opts.sub && opts.sub.catalogId && catalog.get(opts.sub.catalogId)) || null;
    const base = opts.sub || {
      catalogId: item ? item.id : null,
      name: item ? item.name : (opts.custom || ''),
      price: '',
      currency: state.settings.currency,
      freq: { every: 1, unit: 'month' },
      startDate: schedule.toISO(schedule.today()),
      category: item ? item.category : 'other',
      color: item ? ui.brandColor(item) : '6D5EF5',
      reminder: state.settings.defaultReminder,
      notes: '',
      active: true,
    };
    let freq = { ...base.freq };

    const header = h('div', { class: 'form-hero' });
    const name = h('input', { class: 'input', type: 'text', value: base.name, maxlength: 80, placeholder: t('form.namePh'), autocomplete: 'off', required: true });
    const price = h('input', {
      class: 'input input-price',
      type: 'text',
      inputmode: 'decimal',
      value: base.price === '' ? '' : String(base.price).replace('.', i18n.lang === 'it' ? ',' : '.'),
      placeholder: i18n.lang === 'it' ? '9,99' : '9.99',
      autocomplete: 'off',
    });
    // Codes only: the narrow select next to the price can't fit names.
    const currency = select(db.CURRENCIES.map((c) => [c, c]), base.currency);
    currency.setAttribute('aria-label', t('form.currency'));
    currency.classList.add('input-currency');
    const start = h('input', { class: 'input', type: 'date', value: base.startDate, required: true });
    const category = select(catalog.CATEGORIES.map((c) => [c, t(`cat.${c}`)]), base.category);
    const color = h('input', { class: 'input input-color', type: 'color', value: `#${base.color}` });
    const reminder = select(reminderOptions(), base.reminder);
    const notes = h('textarea', { class: 'input', rows: 3, maxlength: 1000, placeholder: t('form.notesPh') });
    notes.value = base.notes || '';
    const active = h('input', { type: 'checkbox', role: 'switch', class: 'switch', checked: base.active });

    // Frequency: segmented presets + custom "every N unit".
    const presets = ['monthly', 'quarterly', 'yearly', 'custom'];
    const presetOf = (f) => {
      const p = schedule.presetOf(f);
      return presets.includes(p) ? p : 'custom';
    };
    let preset = presetOf(freq);
    const every = h('input', { class: 'input input-every', type: 'number', inputmode: 'numeric', min: 1, max: 999, value: freq.every });
    const unit = select(schedule.UNITS.map((u) => [u, i18n.tp(`unit.${u}`, 2)]), freq.unit);
    const customRow = h('div', { class: 'custom-freq', hidden: preset !== 'custom' },
      h('span', { text: t('form.every') }), every, unit);
    const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': t('form.frequency') },
      presets.map((p) => h('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': String(p === preset),
        class: p === preset ? 'active' : '',
        dataset: { preset: p },
        text: t(`freq.${p}`),
        on: { click: () => setPreset(p) },
      })));
    const freqError = h('p', { class: 'error', 'aria-live': 'polite' });

    function setPreset(p) {
      preset = p;
      for (const b of seg.children) {
        const on = b.dataset.preset === p;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', String(on));
      }
      customRow.hidden = p !== 'custom';
      if (p !== 'custom') freq = { ...schedule.PRESETS[p] };
      else {
        freq = { every: Math.max(1, parseInt(every.value, 10) || 1), unit: unit.value };
        every.focus();
      }
      every.value = freq.every;
      unit.value = freq.unit;
      updatePreview();
    }

    const updateCustom = () => {
      if (preset !== 'custom') return;
      freq = { every: parseInt(every.value, 10), unit: unit.value };
      updatePreview();
    };
    every.addEventListener('input', updateCustom);
    unit.addEventListener('change', updateCustom);

    const preview = h('p', { class: 'preview', 'aria-live': 'polite' });
    function updatePreview() {
      const p = parsePrice(price.value);
      const next = schedule.nextRenewal(start.value, freq);
      if (!next || !Number.isFinite(p)) {
        preview.textContent = '';
        preview.hidden = true;
        return;
      }
      preview.hidden = false;
      preview.textContent = t('form.preview', {
        date: i18n.fmtDate(next, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
        monthly: i18n.fmtMoney(schedule.monthlyCost(p, freq), currency.value),
      });
    }

    function drawHero() {
      const preview = {
        name: name.value || '?',
        catalogId: base.catalogId,
        color: base.catalogId ? base.color : color.value.slice(1),
      };
      header.replaceChildren(logo(preview, 'lg'), h('p', { class: 'hero-name', text: name.value || t('form.new') }));
    }

    for (const el of [price, start]) el.addEventListener('input', updatePreview);
    currency.addEventListener('change', updatePreview);
    name.addEventListener('input', drawHero);
    color.addEventListener('input', drawHero);

    const priceWrap = h('div', { class: 'field' },
      h('label', { for: 'f-price', text: t('form.price') }),
      h('div', { class: 'price-row' }, Object.assign(price, { id: 'f-price' }), currency),
      h('p', { class: 'error', 'aria-live': 'polite' }));

    const nameField = field(t('form.name'), name);
    const startField = field(t('form.start'), start, t('form.startHint'));

    const form = h('form', { class: 'form', novalidate: true },
      header,
      nameField,
      priceWrap,
      h('div', { class: 'field' },
        h('span', { class: 'label', text: t('form.frequency') }),
        seg, customRow, freqError),
      startField,
      preview,
      h('div', { class: 'field-grid' },
        field(t('form.category'), category),
        base.catalogId ? null : field(t('form.color'), color)),
      field(t('form.reminder'), reminder),
      field(t('form.notes'), notes),
      editing ? h('label', { class: 'switch-row' },
        h('span', null, h('span', { class: 'label', text: t('form.active') }), h('span', { class: 'hint', text: t('form.activeHint') })),
        active) : null);

    const saveBtn = h('button', { class: 'btn btn-primary btn-block', type: 'submit', text: t('form.save') });
    saveBtn.setAttribute('form', 'sub-form');
    form.id = 'sub-form';
    const footer = h('div', { class: 'form-actions' },
      editing ? h('div', { class: 'btn-row' },
        h('button', {
          class: 'btn btn-ghost', type: 'button',
          on: { click: () => exportIcs([opts.sub], opts.sub.name) },
        }, icon('calendar'), t('form.calendar')),
        h('button', {
          class: 'btn btn-ghost danger', type: 'button',
          on: { click: () => removeSub(opts.sub, s) },
        }, icon('trash'), t('form.delete'))) : null,
      saveBtn);

    const s = sheet({
      title: editing ? t('form.edit') : t('form.new'),
      className: 'sheet-tall',
      body: form,
      footer,
      back: !editing && opts.back ? opts.back : null,
    });

    function setError(fieldEl, msg) {
      const err = fieldEl.querySelector('.error');
      err.textContent = msg || '';
      fieldEl.classList.toggle('has-error', !!msg);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const p = parsePrice(price.value);
      const errs = [
        [nameField, name.value.trim() ? '' : t('form.errName')],
        [priceWrap, Number.isFinite(p) && p >= 0 ? '' : t('form.errPrice')],
        [startField, schedule.parseISO(start.value) ? '' : t('form.errDate')],
      ];
      for (const [f, m] of errs) setError(f, m);
      const freqOk = schedule.isValidFreq(freq);
      freqError.textContent = freqOk ? '' : t('form.errEvery');
      const firstBad = errs.find(([, m]) => m);
      if (firstBad || !freqOk) {
        haptic(30);
        const target = firstBad ? firstBad[0].querySelector('input,select') : every;
        target.focus();
        return;
      }
      const data = {
        ...(opts.sub || {}),
        catalogId: base.catalogId,
        name: name.value,
        price: p,
        currency: currency.value,
        freq,
        startDate: start.value,
        category: category.value,
        color: base.catalogId ? base.color : color.value.slice(1),
        reminder: parseInt(reminder.value, 10),
        notes: notes.value,
        active: editing ? active.checked : true,
      };
      try {
        const saved = await db.put(data);
        const i = state.subs.findIndex((x) => x.id === saved.id);
        if (i >= 0) state.subs[i] = saved;
        else state.subs.push(saved);
        haptic(12);
        s.close('saved');
        render();
        afterSave(editing);
      } catch (err) {
        console.error(err);
        toast(String(err.message || err));
      }
    });

    drawHero();
    updatePreview();
    if (!editing && !base.name && g.matchMedia('(pointer: fine)').matches) name.focus();
  }

  function afterSave(editing) {
    const canAsk = 'Notification' in g && reminders.permission() === 'default' && !state.settings.notifications;
    if (!editing && canAsk && state.subs.length === 1) {
      toast(t('toast.saved'), { action: t('settings.notifEnable'), onAction: enableNotifications });
    } else {
      toast(t('toast.saved'));
    }
    runReminders();
  }

  async function removeSub(sub, s) {
    const ok = await ui.confirm(t('form.confirmDelete', { name: sub.name }), t('form.delete'));
    if (!ok) return;
    await db.remove(sub.id);
    state.subs = state.subs.filter((x) => x.id !== sub.id);
    s.close('deleted');
    render();
    haptic(20);
    toast(t('toast.deleted', { name: sub.name }), {
      action: t('toast.undo'),
      onAction: async () => {
        const restored = await db.put(sub);
        state.subs.push(restored);
        render();
      },
    });
  }

  // ---------- Notifications ----------

  function notificationStatus() {
    if (!('Notification' in g) || !('serviceWorker' in navigator)) {
      return ST.install.isIOS && !ST.install.isStandalone() ? 'ios' : 'unsupported';
    }
    const p = reminders.permission();
    if (p === 'denied') return 'denied';
    if (p === 'granted' && state.settings.notifications) return 'on';
    return 'off';
  }

  async function enableNotifications() {
    const status = notificationStatus();
    if (status === 'ios') {
      ST.install.open();
      return false;
    }
    if (status === 'unsupported') {
      toast(t('settings.notifUnsupported'));
      return false;
    }
    let perm = reminders.permission();
    if (perm === 'default') perm = await g.Notification.requestPermission();
    if (perm !== 'granted') {
      toast(t('toast.notifDenied'));
      return false;
    }
    await saveSetting('notifications', true);
    await registerPeriodicSync();
    toast(t('toast.notifOn'));
    runReminders();
    return true;
  }

  async function registerPeriodicSync() {
    const reg = state.registration;
    if (!reg || !reg.periodicSync) return;
    try {
      const perm = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (perm.state === 'granted') {
        await reg.periodicSync.register('renewal-check', { minInterval: 12 * 60 * 60 * 1000 });
      }
    } catch { /* not available */ }
  }

  async function runReminders() {
    if (!state.registration || !state.settings.notifications) return;
    try {
      await reminders.check(state.registration);
      state.settings = await db.getSettings();
    } catch (err) {
      console.warn('Reminder check failed', err);
    }
  }

  async function testNotification() {
    if (notificationStatus() !== 'on' && !(await enableNotifications())) return;
    const reg = state.registration || (await navigator.serviceWorker.ready);
    reg.showNotification(t('notif.testTitle'), {
      body: t('notif.testBody'),
      icon: 'icons/icon-192.png',
      badge: 'icons/badge-96.png',
      tag: 'subtrack-test',
    });
  }

  // ---------- Service worker ----------

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
      state.registration = reg;
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            toast(t('toast.updated'), {
              action: t('toast.reload'),
              duration: 15000,
              onAction: () => sw.postMessage('skipWaiting'),
            });
          }
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
      await navigator.serviceWorker.ready;
      state.registration = await navigator.serviceWorker.getRegistration() || reg;
      if (state.settings.notifications) registerPeriodicSync();
      runReminders();
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  }

  // ---------- Export / import ----------

  function exportIcs(subs, label) {
    const active = subs.filter((s) => s.active);
    if (!active.length) {
      toast(t('toast.icsEmpty'));
      return;
    }
    const safe = (label || 'subtrack').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'subtrack';
    ui.download(`${safe}.ics`, 'text/calendar;charset=utf-8', ST.ics.build(active));
  }

  async function exportBackup() {
    const data = await db.exportBackup();
    ui.download(`subtrack-backup-${schedule.toISO(schedule.today())}.json`, 'application/json', JSON.stringify(data, null, 2));
    toast(t('toast.exported'));
  }

  function importBackup() {
    const input = h('input', { type: 'file', accept: 'application/json,.json' });
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('too large');
        const n = await db.importBackup(JSON.parse(await file.text()));
        state.settings = await db.getSettings();
        state.subs = await db.getAll();
        applyLanguage();
        applyTheme();
        render();
        toast(i18n.tp('toast.imported', n));
        return n;
      } catch (err) {
        console.warn(err);
        toast(t('toast.invalidFile'));
      }
      return 0;
    });
    input.click();
  }

  // ---------- Settings ----------

  let settingsSheet = null;

  function openSettings() {
    settingsSheet = sheet({
      title: t('settings.title'),
      className: 'sheet-tall',
      body: settingsBody(),
      onClose: () => { settingsSheet = null; },
    });
  }

  function refreshSettings() {
    if (!settingsSheet) return;
    const top = settingsSheet.body.scrollTop;
    settingsSheet.body.replaceChildren(settingsBody());
    settingsSheet.body.scrollTop = top;
    const title = settingsSheet.el.querySelector('.sheet-head h2');
    title.textContent = t('settings.title');
  }

  function group(title, ...rows) {
    return h('section', { class: 'set-group' },
      h('h3', { text: title }),
      h('div', { class: 'set-card' }, rows));
  }

  function row(label, control, hint) {
    const id = `s-${Math.random().toString(36).slice(2, 8)}`;
    if (control && control.matches && control.matches('select,input')) control.id = id;
    return h('div', { class: 'set-row' },
      h('div', { class: 'set-text' },
        h('label', { for: control && control.id ? id : null, text: label }),
        hint ? h('p', { class: 'hint', text: hint }) : null),
      control);
  }

  function actionRow(iconName, label, onClick, cls, hint) {
    return h('button', { type: 'button', class: `set-row set-action ${cls || ''}`.trim(), on: { click: onClick } },
      icon(iconName),
      h('span', { class: 'set-text' }, h('span', { text: label }), hint ? h('span', { class: 'hint', text: hint }) : null),
      icon('chevron', 'chev'));
  }

  function settingsBody() {
    const st = state.settings;

    const lang = select([['auto', t('settings.langAuto')], ['it', 'Italiano'], ['en', 'English']], st.lang);
    lang.addEventListener('change', async () => {
      await saveSetting('lang', lang.value);
      applyLanguage();
      render();
      refreshSettings();
    });

    const theme = select([['auto', t('settings.themeAuto')], ['light', t('settings.themeLight')], ['dark', t('settings.themeDark')]], st.theme);
    theme.addEventListener('change', async () => {
      await saveSetting('theme', theme.value);
      applyTheme();
    });

    const cur = select(currencyOptions(), st.currency);
    cur.classList.add('select-compact');
    cur.addEventListener('change', async () => {
      await saveSetting('currency', cur.value);
      render();
      refreshSettings();
    });

    // Exchange rates for currencies in use other than the main one.
    const used = [...new Set(state.subs.map((s) => s.currency))].filter((c) => c !== st.currency).sort();
    const rateRows = used.map((c) => {
      const input = h('input', {
        class: 'input input-rate',
        type: 'text',
        inputmode: 'decimal',
        placeholder: '—',
        value: st.rates[c] ? String(st.rates[c]) : '',
        'aria-label': `1 ${c} = ? ${st.currency}`,
      });
      input.addEventListener('change', async () => {
        const v = parsePrice(input.value);
        const rates = { ...state.settings.rates };
        if (Number.isFinite(v) && v > 0) rates[c] = v;
        else delete rates[c];
        input.value = rates[c] ? String(rates[c]) : '';
        await saveSetting('rates', rates);
        render();
      });
      return h('div', { class: 'set-row rate-row' },
        h('span', { class: 'rate-label', text: `1 ${c} =` }), input, h('span', { class: 'rate-cur', text: st.currency }));
    });

    // Notifications.
    const status = notificationStatus();
    let notifControl;
    if (status === 'on') notifControl = h('span', { class: 'pill pill-ok', text: t('settings.notifOn') });
    else if (status === 'off') {
      notifControl = h('button', { type: 'button', class: 'btn btn-primary btn-sm', text: t('settings.notifEnable') });
      notifControl.addEventListener('click', async () => { await enableNotifications(); refreshSettings(); });
    } else if (status === 'ios') {
      notifControl = h('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: t('settings.install') });
      notifControl.addEventListener('click', () => ST.install.open());
    } else notifControl = h('span', { class: 'pill' , text: '—' });

    const notifHint = {
      on: t('settings.notifHint'),
      off: t('settings.notifHint'),
      denied: t('settings.notifDenied'),
      unsupported: t('settings.notifUnsupported'),
      ios: t('settings.notifIos'),
    }[status];

    const defReminder = select(reminderOptions(), st.defaultReminder);
    defReminder.addEventListener('change', () => saveSetting('defaultReminder', parseInt(defReminder.value, 10)));

    const fileHint = h('p', { class: 'set-foot', text: t('settings.privacy') });

    return h('div', { class: 'settings' },
      group(t('settings.general'),
        row(t('settings.language'), lang),
        row(t('settings.theme'), theme),
        row(t('settings.mainCurrency'), cur)),
      group(t('settings.rates'),
        h('p', { class: 'set-note', text: used.length ? t('settings.ratesHint', { main: st.currency }) : t('settings.ratesNone', { main: st.currency }) }),
        rateRows),
      group(t('settings.reminders'),
        row(t('settings.notifications'), notifControl, notifHint),
        row(t('settings.defaultReminder'), defReminder),
        status === 'on' ? actionRow('bell', t('settings.testNotif'), testNotification) : null,
        actionRow('calendar', t('settings.ics'), () => exportIcs(state.subs, 'subtrack'), null, t('settings.icsHint'))),
      group(t('settings.data'),
        actionRow('download', t('settings.export'), exportBackup),
        actionRow('upload', t('settings.import'), importBackup),
        actionRow('trash', t('settings.wipe'), wipeAll, 'danger')),
      group(t('settings.app'),
        ST.install.available() ? actionRow('phone', t('settings.install'), () => { settingsSheet && settingsSheet.close(); ST.install.open(); }) : null,
        h('a', { class: 'set-row set-action', href: ST.REPO_URL, target: '_blank', rel: 'noopener noreferrer' },
          icon('code'), h('span', { class: 'set-text', text: t('settings.source') }), icon('chevron', 'chev'))),
      h('div', { class: 'privacy' }, icon('shield'), fileHint),
      h('p', { class: 'set-foot muted', text: `SubTrack · ${t('settings.version', { v: ST.VERSION })} · MIT` }));
  }

  async function wipeAll() {
    const ok = await ui.confirm(t('settings.wipeConfirm'), t('form.delete'));
    if (!ok) return;
    await db.wipe();
    state.subs = [];
    state.settings = await db.getSettings();
    applyLanguage();
    applyTheme();
    render();
    if (settingsSheet) settingsSheet.close();
    toast(t('toast.wiped'));
  }

  ST.app = {
    refreshInstallState: refreshSettings,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
