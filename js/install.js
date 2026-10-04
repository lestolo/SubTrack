/*
 * "Add to Home Screen" coaching.
 *
 * - Chromium (Android/desktop): captures `beforeinstallprompt` and offers a
 *   one-tap Install button.
 * - iOS / iPadOS: there is no install API, so an animated bubble points at the
 *   Share button and explains the three steps.
 * The bubble is non-modal so the user can tap the browser UI while it's open.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});
  const DISMISS_KEY = 'subtrack:install-dismissed';
  const SNOOZE_DAYS = 7;
  const SHOW_DELAY = 2500;

  let deferred = null;
  let bubble = null;
  let scheduled = false;

  const ua = navigator.userAgent;
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;

  function isStandalone() {
    return g.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  function snoozed() {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY));
      return at && Date.now() - at < SNOOZE_DAYS * 86400000;
    } catch {
      return false;
    }
  }

  function snooze() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage unavailable */ }
  }

  function available() {
    return !isStandalone() && (!!deferred || isIOS);
  }

  function maybeShow() {
    if (scheduled || bubble || !available() || snoozed()) return;
    scheduled = true;
    setTimeout(() => {
      // Don't cover an open sheet; try again later in the session.
      if (document.documentElement.classList.contains('sheet-open')) {
        scheduled = false;
        setTimeout(maybeShow, SHOW_DELAY);
        return;
      }
      show();
    }, SHOW_DELAY);
  }

  function phoneAnimation() {
    const { h } = ST.ui;
    const dots = [];
    for (let i = 0; i < 11; i++) dots.push(h('span', { class: 'app-dot' }));
    return h('div', { class: 'install-anim', 'aria-hidden': 'true' },
      h('div', { class: 'phone' },
        h('div', { class: 'phone-notch' }),
        h('div', { class: 'phone-grid' }, dots, h('span', { class: 'app-slot' }))),
      h('img', { class: 'fly-icon', src: 'icons/icon.svg', alt: '', width: 40, height: 40 }));
  }

  function stepText(key) {
    const { t, h, icon } = { t: ST.i18n.t, h: ST.ui.h, icon: ST.ui.icon };
    const parts = t(key).split('{icon}');
    return h('span', null, parts[0], parts.length > 1 ? icon('share', 'inline') : null, parts[1] || null);
  }

  function show(force) {
    const { h, icon } = ST.ui;
    const { t } = ST.i18n;
    if (bubble) return;
    const mode = deferred ? 'prompt' : isIOS ? (isIPad ? 'ipad' : 'ios') : 'generic';

    const close = h('button', { class: 'icon-btn bubble-close', type: 'button', 'aria-label': t('nav.close') }, icon('close'));
    let content;
    let actions;
    if (mode === 'prompt') {
      content = h('p', { text: t('install.text') });
      const install = h('button', { class: 'btn btn-primary', type: 'button', text: t('install.cta') });
      const later = h('button', { class: 'btn btn-ghost', type: 'button', text: t('install.later') });
      install.addEventListener('click', promptInstall);
      later.addEventListener('click', () => hide(true));
      actions = h('div', { class: 'btn-row' }, later, install);
    } else if (mode === 'generic') {
      content = h('div', null, h('p', { text: t('install.text') }), h('p', { class: 'muted', text: t('install.generic') }));
      const ok = h('button', { class: 'btn btn-primary', type: 'button', text: t('install.gotIt') });
      ok.addEventListener('click', () => hide(true));
      actions = h('div', { class: 'btn-row' }, ok);
    } else {
      content = h('div', null,
        h('p', { text: t('install.text') }),
        h('ol', { class: 'install-steps' },
          h('li', null, h('span', { class: 'step-n', text: '1' }), stepText('install.ios1')),
          h('li', null, h('span', { class: 'step-n', text: '2' }), h('span', null, icon('squarePlus', 'inline'), ' ', t('install.ios2'))),
          h('li', null, h('span', { class: 'step-n', text: '3' }), h('span', { text: t('install.ios3') }))));
      const ok = h('button', { class: 'btn btn-primary', type: 'button', text: t('install.gotIt') });
      ok.addEventListener('click', () => hide(true));
      actions = h('div', { class: 'btn-row' }, ok);
    }

    bubble = h('div', {
      class: `install-bubble mode-${mode}`,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': 'install-title',
    },
    close,
    h('div', { class: 'install-top' },
      phoneAnimation(),
      h('h3', { id: 'install-title', text: t('install.title') })),
    content,
    actions,
    mode === 'ios' || mode === 'ipad' ? h('div', { class: 'bubble-pointer' }, icon('back')) : null);

    close.addEventListener('click', () => hide(true));
    document.body.append(bubble);
    requestAnimationFrame(() => requestAnimationFrame(() => bubble && bubble.classList.add('show')));
    if (force) bubble.querySelector('.btn').focus();
  }

  function hide(userDismissed) {
    if (!bubble) return;
    if (userDismissed) snooze();
    const el = bubble;
    bubble = null;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }

  async function promptInstall() {
    if (!deferred) return;
    const ev = deferred;
    deferred = null;
    hide(false);
    ev.prompt();
    try {
      const { outcome } = await ev.userChoice;
      if (outcome !== 'accepted') snooze();
    } catch { /* ignored */ }
  }

  function init() {
    g.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (ST.app) ST.app.refreshInstallState();
      maybeShow();
    });
    g.addEventListener('appinstalled', () => {
      deferred = null;
      hide(false);
      ST.ui.toast(ST.i18n.t('install.done'));
      if (ST.app) ST.app.refreshInstallState();
    });
    maybeShow();
  }

  ST.install = {
    init,
    isIOS,
    isStandalone,
    available,
    /** Opens the install UI on demand (e.g. from Settings). */
    open() {
      if (deferred) promptInstall();
      else show(true);
    },
  };
})(window);
