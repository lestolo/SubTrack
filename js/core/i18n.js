/*
 * Translations (Italian / English) and locale-aware formatting helpers.
 * To add a language: copy the `en` block, translate it and add the code to
 * LANGS. Keys missing in a language fall back to English.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  const LANGS = ['it', 'en'];

  const STRINGS = {
    en: {
      'app.tagline': 'All your subscriptions, one place',
      'nav.settings': 'Settings',
      'nav.add': 'Add subscription',
      'nav.close': 'Close',
      'nav.back': 'Back',
      'common.cancel': 'Cancel',

      'summary.monthly': 'Monthly spend',
      'summary.yearly': 'Yearly spend',
      'summary.active.one': '{n} active subscription',
      'summary.active.other': '{n} active subscriptions',
      'summary.approx': 'Approximate total using your exchange rates',
      'summary.mixed': 'Totals by currency',
      'summary.toggle': 'Switch between monthly and yearly',

      'upcoming.title': 'Coming up',
      'upcoming.none': 'No renewals in the next 30 days.',
      'list.title': 'Your subscriptions',
      'list.sort': 'Sort by',
      'sort.next': 'Next renewal',
      'sort.price': 'Monthly cost',
      'sort.name': 'Name',
      'list.paused': 'Paused',

      'empty.title': 'No subscriptions yet',
      'empty.text': 'Add your first subscription to see how much you spend every month.',
      'empty.cta': 'Add subscription',

      'when.today': 'Today',
      'when.tomorrow': 'Tomorrow',
      'when.inDays': 'In {n} days',
      'when.on': 'Renews {date}',

      'freq.weekly': 'Weekly',
      'freq.monthly': 'Monthly',
      'freq.quarterly': 'Quarterly',
      'freq.semiannual': 'Every 6 months',
      'freq.yearly': 'Yearly',
      'freq.custom': 'Custom',
      'freq.every': 'Every {n} {unit}',
      'unit.day.one': 'day', 'unit.day.other': 'days',
      'unit.week.one': 'week', 'unit.week.other': 'weeks',
      'unit.month.one': 'month', 'unit.month.other': 'months',
      'unit.year.one': 'year', 'unit.year.other': 'years',
      'per.month': '/mo',
      'per.year': '/yr',

      'picker.title': 'Add subscription',
      'picker.search': 'Search a service…',
      'picker.all': 'All',
      'picker.custom': 'Custom',
      'picker.customHint': 'Anything else',
      'picker.noResults': 'No match for “{q}”.',
      'picker.createCustom': 'Create “{q}” as custom',

      'form.new': 'New subscription',
      'form.edit': 'Edit subscription',
      'form.name': 'Name',
      'form.namePh': 'e.g. Gym, Magazine…',
      'form.price': 'Price',
      'form.currency': 'Currency',
      'form.frequency': 'Billing frequency',
      'form.every': 'Every',
      'form.start': 'Start date',
      'form.startHint': 'Date of the first charge: renewals are calculated from here.',
      'form.preview': 'Next renewal: {date} · ≈ {monthly}/mo',
      'form.category': 'Category',
      'form.color': 'Colour',
      'form.reminder': 'Reminder',
      'form.reminderNone': 'No reminder',
      'form.reminderSame': 'On the day',
      'form.reminderDays.one': '{n} day before',
      'form.reminderDays.other': '{n} days before',
      'form.notes': 'Notes',
      'form.notesPh': 'Plan, account, how to cancel…',
      'form.active': 'Active',
      'form.activeHint': 'Paused subscriptions are excluded from totals and reminders.',
      'form.save': 'Save',
      'form.delete': 'Delete',
      'form.calendar': 'Add to calendar',
      'form.confirmDelete': 'Delete “{name}”?',
      'form.errName': 'Enter a name.',
      'form.errPrice': 'Enter a valid price.',
      'form.errDate': 'Enter a valid date.',
      'form.errEvery': 'Enter a number between 1 and 999.',

      'cat.video': 'Video & TV',
      'cat.music': 'Music & audio',
      'cat.cloud': 'Cloud storage',
      'cat.productivity': 'Productivity',
      'cat.ai': 'AI',
      'cat.creative': 'Creative',
      'cat.gaming': 'Gaming',
      'cat.security': 'VPN & security',
      'cat.shopping': 'Shopping & food',
      'cat.reading': 'News & reading',
      'cat.fitness': 'Health & fitness',
      'cat.education': 'Education',
      'cat.telco': 'Phone & internet',
      'cat.finance': 'Finance',
      'cat.social': 'Social',
      'cat.other': 'Other',

      'settings.title': 'Settings',
      'settings.general': 'General',
      'settings.language': 'Language',
      'settings.langAuto': 'Automatic',
      'settings.theme': 'Theme',
      'settings.themeAuto': 'Automatic',
      'settings.themeLight': 'Light',
      'settings.themeDark': 'Dark',
      'settings.mainCurrency': 'Main currency',
      'settings.rates': 'Exchange rates',
      'settings.ratesHint': 'Optional. Enter how much 1 unit of each currency is worth in {main} to get a single total. Rates are never fetched from the internet.',
      'settings.ratesNone': 'All your subscriptions use {main}.',
      'settings.reminders': 'Reminders',
      'settings.notifications': 'Notifications',
      'settings.notifEnable': 'Enable',
      'settings.notifOn': 'On',
      'settings.notifDenied': 'Blocked in browser settings',
      'settings.notifUnsupported': 'Not supported by this browser',
      'settings.notifIos': 'On iPhone, install the app on the Home Screen first',
      'settings.notifHint': 'Reminders are checked on this device when the app opens and, where the system allows it, in the background. For alerts that are always on time, also add the calendar.',
      'settings.defaultReminder': 'Default reminder',
      'settings.testNotif': 'Send test notification',
      'settings.ics': 'Export to calendar (.ics)',
      'settings.icsHint': 'Imports all renewals as repeating events with an alert into your phone calendar.',
      'settings.data': 'Data & backup',
      'settings.export': 'Export backup',
      'settings.import': 'Import backup',
      'settings.wipe': 'Delete all data',
      'settings.wipeConfirm': 'Delete all subscriptions and settings from this device? This cannot be undone.',
      'settings.app': 'App',
      'settings.install': 'Install app',
      'settings.privacy': 'Your data never leaves this device: no account, no tracking, no server.',
      'settings.source': 'Source code',
      'settings.version': 'Version {v}',

      'install.title': 'Install SubTrack',
      'install.text': 'Add it to your Home Screen: it opens full screen, works offline and can remind you before renewals.',
      'install.cta': 'Install',
      'install.later': 'Not now',
      'install.gotIt': 'Got it',
      'install.ios1': 'Tap {icon} Share in the browser bar (on newer iOS: ⋯ then Share)',
      'install.ios2': 'Choose “Add to Home Screen”',
      'install.ios3': 'Tap “Add” and open SubTrack from the Home Screen',
      'install.generic': 'Open the browser menu and choose “Install app” or “Add to Home Screen”.',
      'install.done': 'SubTrack installed',

      'toast.saved': 'Subscription saved',
      'toast.deleted': '“{name}” deleted',
      'toast.undo': 'Undo',
      'toast.exported': 'Backup exported',
      'toast.imported.one': '{n} subscription imported',
      'toast.imported.other': '{n} subscriptions imported',
      'toast.invalidFile': 'Invalid backup file',
      'toast.notifOn': 'Notifications enabled',
      'toast.notifDenied': 'Notification permission denied',
      'toast.wiped': 'All data deleted',
      'toast.icsEmpty': 'No active subscriptions to export',
      'toast.updated': 'New version available',
      'toast.reload': 'Reload',

      'notif.title': '{name} renews {when}',
      'notif.today': 'today',
      'notif.tomorrow': 'tomorrow',
      'notif.inDays': 'in {n} days',
      'notif.testTitle': 'Notifications work!',
      'notif.testBody': 'You will be reminded before your subscriptions renew.',
      'history.title': 'Payment history',
      'history.open': 'Payment history',
      'history.paidSoFar': 'Paid so far',
      'history.count.one': '{n} charge since {date}',
      'history.count.other': '{n} charges since {date}',
      'history.none': 'No charges yet: the first one is on {date}.',
      'history.hint': 'Past charges are calculated from the start date and price. Tap a charge to confirm the amount you actually paid, or mark it as not charged.',
      'history.charges': 'Charges',
      'history.prices': 'Price changes',
      'history.showAll': 'Show all ({n})',
      'history.status.assumed': 'Calculated',
      'history.status.paid': 'Confirmed',
      'history.status.skipped': 'Not charged',
      'history.status.upcoming': 'Upcoming',
      'history.expected': 'expected {amount}',
      'charge.title': 'Charge of {date}',
      'charge.amount': 'Amount charged',
      'charge.confirm': 'Confirm payment',
      'charge.skip': 'It was not charged',
      'charge.reset': 'Back to automatic',
      'charge.saved': 'Charge updated',
      'price.apply': 'Apply the new price',
      'price.fromNext': 'From the next renewal ({date})',
      'price.fromLast': 'From the last charge ({date})',
      'price.all': 'To the whole history (correction)',
      'spend.title': 'Actual spending',
      'spend.last12': 'Last 12 months',
      'spend.ytd': 'This year',
      'spend.chart': 'Spending per month, last 12 months',
      'spend.only': 'Only {cur} charges are included. Set exchange rates in Settings to include other currencies.',
      'spend.none': 'No charges in the last 12 months.',
    },

    it: {
      'app.tagline': 'Tutti i tuoi abbonamenti, in un posto solo',
      'nav.settings': 'Impostazioni',
      'nav.add': 'Aggiungi abbonamento',
      'nav.close': 'Chiudi',
      'nav.back': 'Indietro',
      'common.cancel': 'Annulla',

      'summary.monthly': 'Spesa mensile',
      'summary.yearly': 'Spesa annuale',
      'summary.active.one': '{n} abbonamento attivo',
      'summary.active.other': '{n} abbonamenti attivi',
      'summary.approx': 'Totale approssimato con i tuoi tassi di cambio',
      'summary.mixed': 'Totali per valuta',
      'summary.toggle': 'Passa tra vista mensile e annuale',

      'upcoming.title': 'In arrivo',
      'upcoming.none': 'Nessun rinnovo nei prossimi 30 giorni.',
      'list.title': 'I tuoi abbonamenti',
      'list.sort': 'Ordina per',
      'sort.next': 'Prossimo rinnovo',
      'sort.price': 'Costo mensile',
      'sort.name': 'Nome',
      'list.paused': 'In pausa',

      'empty.title': 'Ancora nessun abbonamento',
      'empty.text': 'Aggiungi il primo abbonamento per vedere quanto spendi ogni mese.',
      'empty.cta': 'Aggiungi abbonamento',

      'when.today': 'Oggi',
      'when.tomorrow': 'Domani',
      'when.inDays': 'Tra {n} giorni',
      'when.on': 'Rinnovo il {date}',

      'freq.weekly': 'Settimanale',
      'freq.monthly': 'Mensile',
      'freq.quarterly': 'Trimestrale',
      'freq.semiannual': 'Semestrale',
      'freq.yearly': 'Annuale',
      'freq.custom': 'Personalizzata',
      'freq.every': 'Ogni {n} {unit}',
      'unit.day.one': 'giorno', 'unit.day.other': 'giorni',
      'unit.week.one': 'settimana', 'unit.week.other': 'settimane',
      'unit.month.one': 'mese', 'unit.month.other': 'mesi',
      'unit.year.one': 'anno', 'unit.year.other': 'anni',
      'per.month': '/mese',
      'per.year': '/anno',

      'picker.title': 'Aggiungi abbonamento',
      'picker.search': 'Cerca un servizio…',
      'picker.all': 'Tutti',
      'picker.custom': 'Personalizzato',
      'picker.customHint': 'Qualsiasi altro',
      'picker.noResults': 'Nessun risultato per “{q}”.',
      'picker.createCustom': 'Crea “{q}” come personalizzato',

      'form.new': 'Nuovo abbonamento',
      'form.edit': 'Modifica abbonamento',
      'form.name': 'Nome',
      'form.namePh': 'es. Palestra, Rivista…',
      'form.price': 'Prezzo',
      'form.currency': 'Valuta',
      'form.frequency': 'Frequenza di pagamento',
      'form.every': 'Ogni',
      'form.start': 'Data di inizio',
      'form.startHint': 'Data del primo addebito: i rinnovi vengono calcolati da qui.',
      'form.preview': 'Prossimo rinnovo: {date} · ≈ {monthly}/mese',
      'form.category': 'Categoria',
      'form.color': 'Colore',
      'form.reminder': 'Promemoria',
      'form.reminderNone': 'Nessun promemoria',
      'form.reminderSame': 'Il giorno stesso',
      'form.reminderDays.one': '{n} giorno prima',
      'form.reminderDays.other': '{n} giorni prima',
      'form.notes': 'Note',
      'form.notesPh': 'Piano, account, come disdire…',
      'form.active': 'Attivo',
      'form.activeHint': 'Gli abbonamenti in pausa sono esclusi da totali e promemoria.',
      'form.save': 'Salva',
      'form.delete': 'Elimina',
      'form.calendar': 'Aggiungi al calendario',
      'form.confirmDelete': 'Eliminare “{name}”?',
      'form.errName': 'Inserisci un nome.',
      'form.errPrice': 'Inserisci un prezzo valido.',
      'form.errDate': 'Inserisci una data valida.',
      'form.errEvery': 'Inserisci un numero da 1 a 999.',

      'cat.video': 'Video e TV',
      'cat.music': 'Musica e audio',
      'cat.cloud': 'Cloud storage',
      'cat.productivity': 'Produttività',
      'cat.ai': 'Intelligenza artificiale',
      'cat.creative': 'Creatività',
      'cat.gaming': 'Gaming',
      'cat.security': 'VPN e sicurezza',
      'cat.shopping': 'Shopping e cibo',
      'cat.reading': 'News e lettura',
      'cat.fitness': 'Salute e fitness',
      'cat.education': 'Formazione',
      'cat.telco': 'Telefono e internet',
      'cat.finance': 'Finanza',
      'cat.social': 'Social',
      'cat.other': 'Altro',

      'settings.title': 'Impostazioni',
      'settings.general': 'Generali',
      'settings.language': 'Lingua',
      'settings.langAuto': 'Automatica',
      'settings.theme': 'Tema',
      'settings.themeAuto': 'Automatico',
      'settings.themeLight': 'Chiaro',
      'settings.themeDark': 'Scuro',
      'settings.mainCurrency': 'Valuta principale',
      'settings.rates': 'Tassi di cambio',
      'settings.ratesHint': 'Facoltativo. Inserisci quanto vale 1 unità di ogni valuta in {main} per ottenere un totale unico. I tassi non vengono mai scaricati da internet.',
      'settings.ratesNone': 'Tutti i tuoi abbonamenti sono in {main}.',
      'settings.reminders': 'Promemoria',
      'settings.notifications': 'Notifiche',
      'settings.notifEnable': 'Attiva',
      'settings.notifOn': 'Attive',
      'settings.notifDenied': 'Bloccate nelle impostazioni del browser',
      'settings.notifUnsupported': 'Non supportate da questo browser',
      'settings.notifIos': 'Su iPhone, prima installa l’app nella schermata Home',
      'settings.notifHint': 'I promemoria vengono controllati su questo dispositivo all’apertura dell’app e, dove il sistema lo consente, in background. Per avvisi sempre puntuali aggiungi anche il calendario.',
      'settings.defaultReminder': 'Promemoria predefinito',
      'settings.testNotif': 'Invia notifica di prova',
      'settings.ics': 'Esporta nel calendario (.ics)',
      'settings.icsHint': 'Importa tutti i rinnovi come eventi ricorrenti con avviso nel calendario del telefono.',
      'settings.data': 'Dati e backup',
      'settings.export': 'Esporta backup',
      'settings.import': 'Importa backup',
      'settings.wipe': 'Elimina tutti i dati',
      'settings.wipeConfirm': 'Eliminare tutti gli abbonamenti e le impostazioni da questo dispositivo? L’operazione non è reversibile.',
      'settings.app': 'App',
      'settings.install': 'Installa app',
      'settings.privacy': 'I tuoi dati non lasciano mai questo dispositivo: nessun account, nessun tracciamento, nessun server.',
      'settings.source': 'Codice sorgente',
      'settings.version': 'Versione {v}',

      'install.title': 'Installa SubTrack',
      'install.text': 'Aggiungila alla schermata Home: si apre a schermo intero, funziona offline e può avvisarti prima dei rinnovi.',
      'install.cta': 'Installa',
      'install.later': 'Non ora',
      'install.gotIt': 'Ho capito',
      'install.ios1': 'Tocca {icon} Condividi nella barra del browser (su iOS recenti: ⋯ e poi Condividi)',
      'install.ios2': 'Scegli “Aggiungi alla schermata Home”',
      'install.ios3': 'Tocca “Aggiungi” e apri SubTrack dalla Home',
      'install.generic': 'Apri il menu del browser e scegli “Installa app” o “Aggiungi alla schermata Home”.',
      'install.done': 'SubTrack installata',

      'toast.saved': 'Abbonamento salvato',
      'toast.deleted': '“{name}” eliminato',
      'toast.undo': 'Annulla',
      'toast.exported': 'Backup esportato',
      'toast.imported.one': '{n} abbonamento importato',
      'toast.imported.other': '{n} abbonamenti importati',
      'toast.invalidFile': 'File di backup non valido',
      'toast.notifOn': 'Notifiche attivate',
      'toast.notifDenied': 'Permesso per le notifiche negato',
      'toast.wiped': 'Tutti i dati sono stati eliminati',
      'toast.icsEmpty': 'Nessun abbonamento attivo da esportare',
      'toast.updated': 'Nuova versione disponibile',
      'toast.reload': 'Ricarica',

      'notif.title': '{name} si rinnova {when}',
      'notif.today': 'oggi',
      'notif.tomorrow': 'domani',
      'notif.inDays': 'tra {n} giorni',
      'notif.testTitle': 'Le notifiche funzionano!',
      'notif.testBody': 'Riceverai un avviso prima del rinnovo dei tuoi abbonamenti.',
      'history.title': 'Storico pagamenti',
      'history.open': 'Storico pagamenti',
      'history.paidSoFar': 'Pagato finora',
      'history.count.one': '{n} addebito dal {date}',
      'history.count.other': '{n} addebiti dal {date}',
      'history.none': 'Ancora nessun addebito: il primo è il {date}.',
      'history.hint': 'Gli addebiti passati sono calcolati dalla data di inizio e dal prezzo. Tocca un addebito per confermare l’importo pagato davvero, o segnarlo come non addebitato.',
      'history.charges': 'Addebiti',
      'history.prices': 'Variazioni di prezzo',
      'history.showAll': 'Mostra tutti ({n})',
      'history.status.assumed': 'Calcolato',
      'history.status.paid': 'Confermato',
      'history.status.skipped': 'Non addebitato',
      'history.status.upcoming': 'In arrivo',
      'history.expected': 'previsto {amount}',
      'charge.title': 'Addebito del {date}',
      'charge.amount': 'Importo addebitato',
      'charge.confirm': 'Conferma pagamento',
      'charge.skip': 'Non è stato addebitato',
      'charge.reset': 'Torna al calcolo automatico',
      'charge.saved': 'Addebito aggiornato',
      'price.apply': 'Applica il nuovo prezzo',
      'price.fromNext': 'Dal prossimo rinnovo ({date})',
      'price.fromLast': 'Dall’ultimo addebito ({date})',
      'price.all': 'A tutto lo storico (correzione)',
      'spend.title': 'Spesa effettiva',
      'spend.last12': 'Ultimi 12 mesi',
      'spend.ytd': 'Da inizio anno',
      'spend.chart': 'Spesa per mese, ultimi 12 mesi',
      'spend.only': 'Sono inclusi solo gli addebiti in {cur}. Imposta i tassi di cambio nelle Impostazioni per includere le altre valute.',
      'spend.none': 'Nessun addebito negli ultimi 12 mesi.',
    },
  };

  let lang = 'en';

  function detect(pref) {
    if (LANGS.includes(pref)) return pref;
    const nav = (g.navigator && (g.navigator.languages || [g.navigator.language])) || [];
    for (const l of nav) {
      const code = String(l || '').slice(0, 2).toLowerCase();
      if (LANGS.includes(code)) return code;
    }
    return 'en';
  }

  function setLang(pref) {
    lang = detect(pref);
    return lang;
  }

  function t(key, vars) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  }

  /** Plural-aware lookup: uses `${key}.one` / `${key}.other`. */
  function tp(key, n, vars) {
    const form = new Intl.PluralRules(lang).select(n) === 'one' ? 'one' : 'other';
    return t(`${key}.${form}`, Object.assign({ n }, vars));
  }

  const moneyCache = new Map();
  function fmtMoney(amount, currency) {
    const k = `${lang}|${currency}`;
    let f = moneyCache.get(k);
    if (!f) {
      try {
        f = new Intl.NumberFormat(lang, { style: 'currency', currency });
      } catch {
        f = { format: (v) => `${v.toFixed(2)} ${currency}` };
      }
      moneyCache.set(k, f);
    }
    return f.format(amount);
  }

  function fmtDate(date, opts) {
    return new Intl.DateTimeFormat(lang, opts || { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function relDays(n, date) {
    if (n === 0) return t('when.today');
    if (n === 1) return t('when.tomorrow');
    if (n > 1 && n <= 30) return t('when.inDays', { n });
    return t('when.on', { date: fmtDate(date, { day: 'numeric', month: 'short' }) });
  }

  function freqLabel(freq) {
    const preset = ST.schedule.presetOf(freq);
    if (preset !== 'custom') return t(`freq.${preset}`);
    return t('freq.every', { n: freq.every, unit: tp(`unit.${freq.unit}`, freq.every).replace(/^\d+\s*/, '') });
  }

  ST.i18n = {
    LANGS,
    STRINGS,
    get lang() { return lang; },
    detect,
    setLang,
    t,
    tp,
    fmtMoney,
    fmtDate,
    relDays,
    freqLabel,
  };
})(typeof self !== 'undefined' ? self : globalThis);
