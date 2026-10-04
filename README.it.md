<div align="center">

<img src="icons/icon.svg" alt="Logo SubTrack" width="96" height="96">

# SubTrack

**Tutti i tuoi abbonamenti in un posto solo: privata, offline-first, installabile.**

[![CI](https://github.com/lestolo/subscription-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/lestolo/subscription-tracker/actions/workflows/ci.yml)
[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-6D5EF5.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-ready-8B5CF6)
![Nessuna dipendenza](https://img.shields.io/badge/dipendenze-0-1F9D55)

[English](README.md) · **Italiano**

<img src="docs/screenshots/home-light.png" alt="Schermata principale" width="240">
<img src="docs/screenshots/catalog.png" alt="Catalogo servizi" width="240">
<img src="docs/screenshots/home-dark.png" alt="Tema scuro" width="240">

</div>

## Funzionalità

- **Catalogo di ~120 servizi popolari** con logo: Netflix, Disney+, Amazon Prime, Spotify, iCloud+, Google One, Microsoft 365, Adobe Creative Cloud, ChatGPT, Claude, PlayStation Plus, operatori telefonici italiani e altri ancora, divisi per categoria e con ricerca istantanea.
- **Abbonamenti personalizzati**: qualsiasi nome, colore a scelta e monogramma automatico.
- **Frequenza flessibile**: mensile, trimestrale, annuale o personalizzata ("ogni 4 mesi", "ogni 2 settimane", …). Le date di fine mese sono gestite correttamente (31 gen → 28/29 feb → 31 mar).
- **Multivaluta**: ogni abbonamento ha la sua valuta. I totali sono mostrati per valuta, oppure come totale unico nella valuta principale se inserisci i tuoi tassi di cambio (i tassi non vengono mai scaricati da internet).
- **Dashboard**: spesa mensile o annuale, rinnovi dei prossimi 30 giorni, ordinamento per rinnovo, costo o nome, e pausa degli abbonamenti senza eliminarli.
- **Promemoria**: notifiche locali più un **export nel calendario (.ics)** con avvisi, per promemoria affidabili su qualsiasi telefono.
- **PWA installabile**: funziona offline e si apre a schermo intero. Una guida animata mostra come aggiungere l'app alla schermata Home su iOS e Android.
- **Interfaccia bilingue**: italiano e inglese, con rilevamento automatico e selettore manuale.
- **UX mobile-first**: bottom sheet chiudibili con uno swipe, aree di tocco ampie, feedback aptico, supporto alle safe area, tema chiaro e scuro, e rispetto di `prefers-reduced-motion`.
- **Backup**: export e import dei dati in JSON. L'eliminazione si può annullare.
- **Zero dipendenze, zero build**: HTML, CSS e JavaScript puri.

## Avvio rapido

Serve un qualsiasi web server statico. Per lo sviluppo locale: [Node.js](https://nodejs.org) ≥ 20 (facoltativo, solo per il server di sviluppo e i test).

```bash
git clone https://github.com/lestolo/subscription-tracker.git
cd subscription-tracker
npm start            # avvia l'app su http://localhost:8080
```

Va bene anche qualsiasi altro server statico, ad esempio `python3 -m http.server 8080`.

> Service worker e notifiche richiedono un **contesto sicuro**: `http://localhost` funziona per lo sviluppo, ma in produzione serve **HTTPS**.

## Pubblicazione

L'app è una cartella di file statici, senza build e senza variabili d'ambiente.

### Vercel

[![Deploy con Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flestolo%2Fsubscription-tracker)

1. Importa il repository su Vercel.
2. Framework preset: **Other**. Build command: *nessuno*. Output directory: `.` (root).
3. Pubblica. [`vercel.json`](vercel.json) imposta già gli header di sicurezza (CSP, HSTS e altri) e la cache corretta per `sw.js`.

### Self-hosting

Copia il contenuto del repository (puoi escludere `tests/`, `tools/`, `docs/` e `.github/`) su qualsiasi hosting statico HTTPS: GitHub Pages, Netlify, Cloudflare Pages, nginx, Apache o Caddy. Tutti i percorsi sono relativi, quindi l'app funziona anche in una sottocartella (ad esempio `https://example.com/subtrack/`).

Impostazioni consigliate per il server:

- servi `sw.js` con `Cache-Control: no-cache`;
- servi `manifest.webmanifest` come `application/manifest+json`;
- invia gli stessi header di sicurezza di [`vercel.json`](vercel.json).

Nel [README in inglese](README.md#self-hosting) trovi un esempio di configurazione nginx.

## Come funzionano i promemoria

SubTrack **non ha un backend**, quindi non usa il Web Push (che richiede un server e chiavi VAPID). I promemoria vengono invece calcolati sul dispositivo:

| Meccanismo | Quando scatta | Piattaforme |
| --- | --- | --- |
| Controllo all'apertura o al ritorno nell'app | Ogni volta che apri l'app o ci torni | Tutti i browser che supportano le notifiche |
| Periodic Background Sync | In background, circa ogni 12 ore, a discrezione del browser | Chromium su Android, solo con app installata |
| **Export calendario (.ics)** | Alle 09:00 del giorno del promemoria, gestito dall'app calendario | Qualsiasi calendario, su telefono o desktop |

Ogni rinnovo viene notificato **una sola volta**. Su **iPhone/iPad** le notifiche delle web app richiedono iOS/iPadOS 16.4 o successivi e l'app deve prima essere **aggiunta alla schermata Home**. La guida nell'app spiega come fare.

Per promemoria sempre puntuali usa **Impostazioni → Esporta nel calendario**: ogni abbonamento diventa un evento ricorrente con avviso, con le date di fine mese gestite correttamente.

## Privacy e sicurezza

- **I tuoi dati restano sul tuo dispositivo**, in IndexedDB. Niente account, analytics, cookie o richieste a terze parti.
- Tutte le risorse, loghi compresi, sono incluse localmente. L'app non fa chiamate di rete oltre al caricamento dei propri file.
- Una **Content Security Policy** restrittiva blocca script inline e origini esterne. L'input dell'utente viene sempre mostrato come testo, e i backup importati sono validati campo per campo.
- **Se cancelli i dati del sito dal browser, perdi i tuoi abbonamenti.** Esporta un backup ogni tanto.
- Il repository non contiene segreti, chiavi API o dati personali. Mantieni questa regola anche nei contributi; vedi [SECURITY.md](SECURITY.md).

## Sviluppo

```bash
npm test             # esegue i test (non serve installare nulla)
npm start            # server di sviluppo locale
```

**Aggiungere un servizio al catalogo:** aggiungi una riga a `RAW` in [`js/core/catalog.js`](js/core/catalog.js). Se il marchio esiste su [simpleicons.org](https://simpleicons.org), indica lo slug ed esegui `npm run icons` per includere il logo. Altrimenti usa `null` e verrà mostrato un monogramma.

**Aggiungere una lingua:** copia il blocco `en` in [`js/core/i18n.js`](js/core/i18n.js), traducilo e aggiungi il codice a `LANGS`. Un test verifica che tutte le lingue abbiano le stesse chiavi.

**Nuova release:** incrementa `ST.VERSION` in [`js/core/version.js`](js/core/version.js). Questo rinomina la cache offline, così le app installate scaricano i nuovi file e mostrano l'avviso "Nuova versione disponibile".

## Contribuire

I contributi sono benvenuti. Leggi [CONTRIBUTING.md](CONTRIBUTING.md) e il [Codice di condotta](CODE_OF_CONDUCT.md). Segnala bug e idee tramite le [GitHub Issues](https://github.com/lestolo/subscription-tracker/issues).

## Crediti e marchi

- Le icone dei marchi provengono da [Simple Icons](https://simpleicons.org) (CC0-1.0).
- Tutti i nomi di prodotti, loghi e marchi appartengono ai rispettivi proprietari. Sono usati solo per identificare i servizi, e il loro uso non implica alcuna approvazione. I marchi non disponibili in Simple Icons sono mostrati come monogramma colorato.
- SubTrack è un progetto indipendente e non è affiliato a nessuno dei servizi elencati.

## Licenza

[MIT](LICENSE)
