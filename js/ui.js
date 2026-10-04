/*
 * Small UI toolkit: safe DOM builder, logos, bottom sheets, toasts.
 * User-provided text is only ever inserted with textContent.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = g.matchMedia('(prefers-reduced-motion: reduce)');

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
        else if (k === 'style') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k in el && typeof v !== 'string') el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, children);
    return el;
  }

  function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  // Stroke icons (24x24, Feather-style geometry).
  const ICONS = {
    plus: ['M12 5v14', 'M5 12h14'],
    close: ['M18 6 6 18', 'M6 6l12 12'],
    back: ['M15 18l-6-6 6-6'],
    search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'M21 21l-4.35-4.35'],
    calendar: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
    bell: ['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
    trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
    upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
    share: ['M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7', 'M16 6l-4-4-4 4', 'M12 2v13'],
    squarePlus: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', 'M12 8v8', 'M8 12h8'],
    phone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M11 18h2'],
    code: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
    chevron: ['M9 18l6-6-6-6'],
  };

  function icon(name, cls) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', `i ${cls || ''}`.trim());
    for (const d of ICONS[name] || []) {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.append(p);
    }
    return svg;
  }

  // ---------- Logos ----------

  function brandColor(item) {
    const ic = item.icon && ST.icons[item.icon];
    return (ic && ic.h) || item.color;
  }

  function isLight(hex) {
    const n = parseInt(hex, 16);
    const [r, gr, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * gr + 0.0722 * b > 0.45;
  }

  function initials(name) {
    const words = String(name).replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('').toUpperCase();
    return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
  }

  /** Logo tile for a subscription or catalogue item. */
  function logo(entity, size) {
    const item = entity.catalogId ? ST.catalog.get(entity.catalogId) : (entity.icon !== undefined ? entity : null);
    const color = (entity.color || (item && brandColor(item)) || '6B7280').replace('#', '');
    const tile = h('div', {
      class: `logo${size ? ` logo-${size}` : ''}${isLight(color) ? ' is-light' : ''}`,
      style: { '--brand': `#${color}` },
      'aria-hidden': 'true',
    });
    const ic = item && item.icon && ST.icons[item.icon];
    if (ic) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', ic.p);
      svg.append(p);
      tile.append(svg);
    } else {
      tile.append(h('span', { text: initials(entity.name) }));
    }
    return tile;
  }

  // ---------- Bottom sheets ----------

  const openSheets = [];

  function sheet({ title, body, footer, className, onClose, back }) {
    const { t } = ST.i18n;
    const titleId = `sheet-title-${Math.random().toString(36).slice(2, 8)}`;
    const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('nav.close') }, icon('close'));
    const backBtn = back
      ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('nav.back') }, icon('back'))
      : null;
    const head = h('header', { class: 'sheet-head' },
      h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      backBtn,
      h('h2', { id: titleId, text: title }),
      closeBtn);
    const scroller = h('div', { class: 'sheet-body' }, body);
    const panel = h('div', { class: 'sheet-panel' }, head, scroller, footer ? h('footer', { class: 'sheet-foot' }, footer) : null);
    const dlg = h('dialog', { class: `sheet ${className || ''}`.trim(), 'aria-labelledby': titleId }, panel);

    let closed = false;
    function close(reason) {
      if (closed) return Promise.resolve();
      closed = true;
      dlg.classList.remove('open');
      return new Promise((resolve) => {
        const done = () => {
          dlg.close();
          dlg.remove();
          const i = openSheets.indexOf(api);
          if (i >= 0) openSheets.splice(i, 1);
          if (!openSheets.length) document.documentElement.classList.remove('sheet-open');
          if (onClose) onClose(reason);
          resolve();
        };
        if (reducedMotion.matches) done();
        else setTimeout(done, 260);
      });
    }

    closeBtn.addEventListener('click', () => close('close'));
    if (backBtn) backBtn.addEventListener('click', () => { close('back'); back(); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close('cancel'); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close('backdrop'); });
    enableDragToClose(head, panel, () => close('swipe'));

    document.body.append(dlg);
    dlg.showModal();
    // Fallback for browsers without overflow: clip, where focusing the
    // off-screen close button scrolls the dialog (see css dialog.sheet).
    dlg.scrollTop = 0;
    document.documentElement.classList.add('sheet-open');
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('open')));

    const api = { el: dlg, body: scroller, close };
    openSheets.push(api);
    return api;
  }

  function enableDragToClose(handle, panel, onClose) {
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      startY = lastY = e.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      panel.classList.add('dragging');
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy = Math.max(0, e.clientY - startY);
      velocity = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT);
      lastY = e.clientY;
      lastT = e.timeStamp;
      panel.style.setProperty('transform', `translateY(${dy}px)`);
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      const dy = e.clientY - startY;
      panel.style.removeProperty('transform');
      if (dy > 120 || (dy > 30 && velocity > 0.6)) onClose();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function confirm(message, confirmLabel) {
    const { t } = ST.i18n;
    return new Promise((resolve) => {
      let answer = false;
      const yes = h('button', { class: 'btn btn-danger', type: 'button', text: confirmLabel });
      const no = h('button', { class: 'btn btn-ghost', type: 'button', text: t('common.cancel') });
      const s = sheet({
        title: message,
        className: 'sheet-confirm',
        body: h('div'),
        footer: h('div', { class: 'btn-row' }, no, yes),
        onClose: () => resolve(answer),
      });
      yes.addEventListener('click', () => { answer = true; s.close(); });
      no.addEventListener('click', () => s.close());
      yes.focus();
    });
  }

  // ---------- Toasts ----------

  function toast(message, opts) {
    const o = opts || {};
    const host = document.getElementById('toasts');
    const el = h('div', { class: 'toast', role: 'status' }, h('span', { text: message }));
    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    };
    if (o.action) {
      el.append(h('button', {
        class: 'toast-action',
        type: 'button',
        text: o.action,
        on: { click: () => { dismiss(); o.onAction(); } },
      }));
    }
    host.append(el);
    requestAnimationFrame(() => el.classList.add('show'));
    timer = setTimeout(dismiss, o.duration || (o.action ? 6000 : 2800));
    return dismiss;
  }

  function haptic(ms) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms || 8); } catch { /* not allowed */ }
    }
  }

  function download(filename, mime, content) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = h('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  ST.ui = { h, append, icon, logo, brandColor, isLight, initials, sheet, confirm, toast, haptic, download, reducedMotion };
})(window);
