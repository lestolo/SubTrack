# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-10-04

### Fixed

- Bottom sheets (Settings, Add subscription) no longer appear halfway up and then jump: the initial focus scrolled the dialog before the slide-up animation started.
- Press feedback on the add button, upcoming cards and catalogue tiles now works (entrance animations no longer pin `transform`).

## [1.0.0] - 2026-10-04

### Added

- Subscription tracking stored locally in IndexedDB.
- Catalogue of ~120 popular services with logos from Simple Icons, plus custom subscriptions.
- Monthly, quarterly, yearly and custom billing frequencies with correct month-end handling.
- Multi-currency totals with optional manual exchange rates.
- Local renewal reminders (on open and via Periodic Background Sync) and `.ics` calendar export.
- Installable PWA with offline support and an animated "Add to Home Screen" guide.
- Italian and English interface, light and dark themes.
- JSON backup export and import.
