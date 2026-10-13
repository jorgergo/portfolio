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
- A command menu on every page (see spec 0014). Cmd+K or Ctrl+K opens and closes it, and so does a `menu` button: in the footer on a computer, or fixed at the bottom right on a touch screen (the site's first fixed element). It covers the page as a sheet of nine keyed links: the five pages, your email, GitHub, LinkedIn, and the CV PDF. Typing narrows the rows, the arrow keys move between them, and Enter follows one. The current page shows `· here`, and the menu never prints.
- The menu still opens with JavaScript off. Both buttons use invoker commands (`commandfor`, `command="show-modal"`), so the browser opens the `<dialog>` itself; the filter field and the key line stay hidden until the script runs, and where a browser lacks invoker commands the script wires the buttons.
- `commandMenuRows(basics, routePattern)` in `src/lib/site-nav.ts` builds the rows from `SITE_NAV`, `formatContactRows`, and the PDF path, so a new page or profile joins the menu with no menu edit. The client rules live in `src/lib/command-menu.ts`, which imports nothing, so the browser bundle carries no schema code.
- `NavRow` gains `current` (`aria-current="page"`) and `download` (the attribute and a download icon) props, and `Button` gains `commandfor` and `command`. Rows and buttons without them render as before.
- `/styleguide` gains a `Command menu` section with the sheet at rest in light and dark.
- Vitest cases for both menu helper modules, and a `command menu` block in `e2e/site.spec.ts` covering desktop, touch, and JavaScript off, the PDF download, modified clicks, Back, 320px, axe in light and dark, print, and CSP.

### Changed

- Markdown code highlighting is off (`syntaxHighlight: false`), because the site's CSP blocks the inline styles Shiki writes.
- The site is no longer script free: every page ships one module script, the menu's (2,649 bytes), which Astro inlines with its hash in the page's CSP meta. The five "ships no script" page tests now check for exactly that one script.
- Cmd+K and Ctrl+K open the menu instead of doing what the browser would do (Ctrl+K focuses the search bar in Chromium and Firefox) while a page of the site has focus.
- Every page's Tab order gains the footer `menu` button, and `focusables` in `e2e/helpers.ts` now counts only rendered elements.
