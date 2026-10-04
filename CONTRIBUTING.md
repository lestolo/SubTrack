# Contributing to SubTrack

Thanks for taking the time to contribute! 🎉 Issues and pull requests in English or Italian are both welcome.

## Ground rules

- **Never commit secrets or personal data**: no API keys, tokens, e-mail addresses, real subscription data or `.env` files. The app is designed to run without any secrets.
- Keep the project **dependency-free and build-free**: plain HTML, CSS and JavaScript that runs as-is in the browser.
- Keep it **private by design**: no analytics, no third-party requests, no remote fonts or CDNs.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started

```bash
git clone https://github.com/<your-user>/subscription-tracker.git
cd subscription-tracker
npm start   # http://localhost:8080
npm test
```

## Making changes

1. Open an issue first for larger changes so we can agree on the approach.
2. Create a branch from `main`: `git checkout -b feat/short-description`.
3. Keep logic that doesn't touch the DOM in `js/core/` and cover it with tests in `tests/`.
4. Every user-facing string must go through `js/core/i18n.js` and exist in **all** languages (a test enforces this).
5. Never insert user-provided text with `innerHTML`: use the `h()` helper or `textContent`.
6. If you change any file listed in `sw.js` → `ASSETS`, or add a new one, bump `ST.VERSION` in `js/core/version.js` so installed apps update.
7. Run `npm test` and try the app on a phone-sized viewport, in both light and dark mode.
8. Use [Conventional Commits](https://www.conventionalcommits.org/) for messages, e.g. `feat: add Revolut to catalogue`, `fix: month-end renewal on leap years`.

## Adding services to the catalogue

Edit `RAW` in `js/core/catalog.js`: `[id, name, category, brandColor, simpleIconsSlug | null]`.

- `id`: lowercase, unique, no spaces.
- `brandColor`: hex without `#`.
- If the brand is on [simpleicons.org](https://simpleicons.org), set the slug and run `npm run icons`; otherwise use `null`.
- Please don't add prices: they change too often and differ by country.

## Reporting bugs

Use the [bug report template](https://github.com/lestolo/subscription-tracker/issues/new?template=bug_report.yml) and include your device, OS and browser version. Remove personal data from screenshots and exported files.

## Security issues

Please **don't** open a public issue; see [SECURITY.md](SECURITY.md).
