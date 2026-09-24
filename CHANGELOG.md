# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- One content file, `src/content/cv.json`, now holds your profile, socials, and full CV. It loads as the `cv` content collection and every build checks it against a strict schema (see spec 0002).
- The build stops with the exact field path when the CV has a mistake: a missing required field, an unknown key such as `higlights`, a date not in `YYYY-MM` form, a link that is not `https`, an unknown country code, an end date before its start date, text past the length caps in `CV_LIMITS`, or two profiles for the same network.
- `getCv()` returns the typed CV data, and pure helpers format it for pages: month and date ranges (`Jan 2023 – Present`), newest first sorting for roles and awards, and `City, Country` locations.
- An optional `basics.image` avatar, processed by `astro:assets` (adds `sharp` for image builds).
- The home and CV placeholder pages show your name from `cv.json`.
- A Vitest suite of 101 unit tests for the CV schema and format helpers, run with `pnpm test` and on every push and PR in CI.

### Changed

- Markdown code highlighting is off (`syntaxHighlight: false`), because the site's CSP blocks the inline styles Shiki writes.
