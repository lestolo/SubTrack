# Security Policy

## Supported versions

Only the latest release (the `main` branch) receives security fixes.

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub's
[private vulnerability reporting](https://github.com/lestolo/subscription-tracker/security/advisories/new)
(*Security* tab → *Report a vulnerability*). Don't open a public issue.

Please include:

- a description of the issue and its impact;
- steps to reproduce or a proof of concept;
- affected browsers or platforms.

You can expect an initial response within 7 days. Once a fix is released, we'll credit you in the advisory unless you prefer to stay anonymous.

## Scope and design

SubTrack is a static, client-only web app:

- all data is stored locally in the browser (IndexedDB) and never sent anywhere;
- there is no backend, no authentication and no third-party requests;
- a strict Content Security Policy is applied (see `index.html` and `vercel.json`).

Relevant issues include XSS (for example through imported backup files or subscription names), CSP bypasses, service-worker cache poisoning, and anything that could make data leave the device.

## Secrets

This repository must never contain API keys, tokens, credentials or personal data. If you find any, please report it as described above.
