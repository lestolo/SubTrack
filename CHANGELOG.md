# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.1] - 2026-10-04

### Changed

- The repository was renamed from `subscription-tracker` to `SubTrack`: links in the app (Settings → Source code), READMEs and community files now point to the new address.

## [1.1.0] - 2026-10-04

### Added

- Payment history for each subscription: past charges are calculated from the start date, frequency and price, and the total paid so far is shown.
- Confirm the amount actually paid for any charge, or mark it as not charged.
- Price history: when the price changes you choose whether it applies from the next renewal, from the last charge, or to the whole history.
- Pausing a subscription stops its charges; resuming marks the renewals in between as not charged.
- "Actual spending" section with the last 12 months and year to date, plus a monthly bar chart.
- Price history and confirmed charges are included in the JSON backup.

### Fixed

- The billing frequency selector overflowed the screen on narrow phones (iPhone SE/mini).

## [1.0.2] - 2026-10-04

### Fixed

- The spending summary showed the text "null" under the total when all subscriptions use the same currency.

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
