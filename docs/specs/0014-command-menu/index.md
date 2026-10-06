# 0014. Command menu as a full page sheet of keyed links

**Date**: 2026-10-05
**Status**: In Progress

## Summary

Every page gets a menu you open with Cmd+K or Ctrl+K, with a `menu` button in the footer on a computer, or with a small `menu` button fixed at the bottom right on a phone. It opens as a sheet that covers the page in the page's own colours: the title `menu`, a `filter` field, then nine keyed rows (the five pages, your email, GitHub, and LinkedIn, and the CV PDF), drawn with the same `NavRow` the contact page uses. Typing narrows the rows, the arrow keys move between them, and Enter follows one. It is the site's first JavaScript, a small bundled script, and the buttons still open the menu without it, because the browser's own `<dialog>` and invoker commands (`commandfor`, an HTML attribute that lets a button open a dialog with no script) do that part.

## Requirements

**User stories**:
- As a keyboard visitor, I want Cmd+K or Ctrl+K to jump me to any page, contact, or the CV PDF, so that I never scroll to a footer or back to the home page.
- As a phone visitor deep in the CV, I want a menu button I can reach without scrolling, so that the rest of the site is one tap away.
- As a screen reader user, I want a named dialog of plain links that says which page I am on, so that the menu works like the rest of the site.
- As the site owner, I want the rows built from `SITE_NAV` and `cv.json`, so that a new page or profile shows up in the menu with no menu edit.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: A new exported `commandMenuRows(basics, routePattern)` in `src/lib/site-nav.ts` returns `readonly MenuRow[]`, where `MenuRow` is `{ readonly key: string; readonly label: string; readonly href: string; readonly current: boolean; readonly download?: string | undefined }`, in this order: a home row (`key: 'page'`, `label: 'home'`, `href: '/'`), then one row per `SITE_NAV` entry (`key: 'page'`, its `label` and `href`); then each `formatContactRows(basics)` row with its `key`, `label`, and `href` unchanged; then one PDF row, `key: 'download'`, `label` `CV_PDF_PATH` without its leading slash (`cv.pdf`), `href` `CV_PDF_PATH`, `download` `cvPdfFileName(basics.name)`. `current` is true only on the page row whose `href` equals `routePattern`, so `/cv` marks `cv`, `/` marks `home`, and `/404` or `/styleguide` marks none; every other row has `current: false` and only the PDF row has `download`. Today that is nine rows. Vitest in `src/lib/site-nav.test.ts`, with inline fixtures, covers today's nine rows exactly; `current` for `/`, `/cv`, and `/404`; `profiles` missing (seven rows); the PDF row's file name for an accented name; and the two literal keys, `page` and `download`, at most 8 characters with no whitespace, so they fit `NavRow`'s `w-20` column. The contact keys rely on spec 0011's existing `NETWORKS` case in `src/lib/cv-format.test.ts`, which this spec does not repeat.
- **AC-2**: A new `src/components/CommandMenu.astro`, rendered once by `BaseLayout` after the page column on every page (the four pages, `/cv`, the 404 page, and the dev only style guide), calls `getCv()` itself, as `SiteFooter` does, and draws a closed `<dialog id="command-menu" aria-labelledby="command-menu-title">`. The dialog is the sheet: it fills the viewport on the page ground (`m-0 size-full max-h-none max-w-none border-0 bg-bg p-0 text-fg`), scrolls its own content with `overflow-y-auto overscroll-contain`, never prints (`print:hidden`), and draws no shadow, radius, or colour outside the six tokens. Its `::backdrop` takes the page ground too (`backdrop:bg-bg`), so no strip of the browser's default dark backdrop shows when iOS Safari's toolbar collapses. Inside, a `max-w-content` column with `BaseLayout`'s padding (`mx-auto px-6 pt-10 pb-20`) holds, `gap-6` apart: (1) a row with `<h2 id="command-menu-title" class="text-lg font-medium">menu</h2>` on the left and a `close` button on the right (`text-sm`, at least 40px tall, `commandfor="command-menu" command="close"`, colour changes like the footer link); (2) a `<label>` with the `hidden` attribute, holding a muted `filter` in a `w-20` column, `gap-x-4`, then a `type="text"` input (16px, `min-h-10`, `flex-1`, a `muted` bottom border and no other border, transparent ground, `autocomplete="off"`, `spellcheck="false"`, `autocapitalize="off"`, `enterkeyhint="go"`); (3) one `<ul class="flex flex-col gap-1">` of `NavRow kind="key"`, one per `commandMenuRows` row, in order; (4) a `<p>` with `hidden` and `aria-hidden="true"` reading `no match` in muted; (5) an `sr-only` `<p aria-live="polite">`, empty; (6) a `<p>` with `hidden`, `text-xs text-muted pointer-coarse:hidden`, reading `↑ ↓ move · enter open · esc close`. Opening and closing are instant: no transition or animation on the dialog or its content.
- **AC-3**: `NavRow` gains two optional props. `current` puts `aria-current="page"` on the link and, after the label, a muted `text-sm` span `· here` with `aria-hidden="true"`. `download` writes the `download` attribute on the link and draws the `Download` icon (`size-4 shrink-0`) after the label in place of the arrow. Rows without them render exactly as today, so the home and `/contact` tests pass with no edit.
- **AC-4**: Two buttons open the menu, and each device shows exactly one. The footer button lives in `SiteFooter`, after `← home` when that shows and before the city line: `<button type="button" commandfor="command-menu" command="show-modal" aria-keyshortcuts="Meta+K Control+K">` reading `menu`, a space in the markup, then an `aria-hidden` span `data-shortcut-hint` (`text-muted empty:hidden`), so its text reads `menu cmd k` or `menu ctrl k` once the script fills the hint while its accessible name stays `menu`; styled like the footer link (`inline-flex min-h-6 items-center gap-2`, colour changes on hover and focus), hidden on touch screens (`pointer-coarse:hidden`) and in print. The corner button lives in `BaseLayout` after the page column: a `Button` reading `menu` with `bg-bg`, `commandfor="command-menu" command="show-modal"`, inside a wrapper `fixed right-6 bottom-6 z-10 hidden pointer-coarse:block print:hidden`, so it shows only when touch is the main input. `Button` gains optional `commandfor` and `command` props, written on its `<button>` only. With JavaScript off, either button opens the dialog in a browser with invoker commands; with JavaScript on, the script wires both buttons itself when `commandForElement` is missing from `HTMLButtonElement.prototype`, so they work in every engine.
- **AC-5**: Cmd+K or Ctrl+K (either modifier on every platform, with no Alt or Shift, not a key repeat, not during IME composition, which means neither `isComposing` nor `keyCode` 229) opens the closed menu with `showModal()` and closes the open one, and prevents the browser's own use of the shortcut. The letter is matched on `event.key` (`k` in any case), so it follows a Latin keyboard layout; when `event.key` is not a Latin letter (a Cyrillic or Greek layout), the physical key `event.code === 'KeyK'` matches instead. Esc and `close` close it. The script fills every `[data-shortcut-hint]` with `shortcutHint(navigator.platform)`: `cmd k` on a platform starting with `Mac`, `iPhone`, `iPad`, or `iPod`, `ctrl k` otherwise; without the script the span stays empty and hidden. The script binds once per page and does nothing when the page has no `#command-menu`.
- **AC-6**: Opening by the shortcut always puts focus in the filter field, since a keyboard is there by definition (an iPad with a keyboard included). Opening by a button puts focus in the field on a fine pointer (`matchMedia('(pointer: fine)')`); on a coarse pointer the script leaves focus where the dialog put it, on its first focusable element (`close`), so no on screen keyboard opens and all nine rows stay visible. The script's own open paths (the shortcut and the buttons it wires itself) focus right after `showModal()`; an open the browser does itself (an invoker button) runs the same open steps on the dialog's `toggle` event. The dialog has no `autofocus`. Closing returns focus to the element that had it before, the dialog's own behaviour. The key line stays on fine pointers only, so an iPad with a keyboard opens the menu without it (accepted).
- **AC-7**: The script removes `hidden` from the filter label and the key line when it runs. Each `input` event filters the rows: a row stays when `rowMatches(text, query)` holds, where `text` is the text of the row link's children, skipping every element with `aria-hidden="true"` (the `· here` marker and the icons), joined with a space, whitespace collapsed, and trimmed (`page cv`, `github @jorgergo`, the link's accessible name), and the match is a case insensitive substring of the trimmed query; an empty query keeps every row. With no row left, the `no match` line shows. The live region reads `formatMatchCount(count, query)`: empty for an empty query, `no match`, `1 row`, or `N rows`. The reset (an empty field, every row shown, the `no match` line hidden, the live region empty) runs at the start of every open and again on the `close` event, so each open starts with all nine rows, even on a page the browser's page cache restored with a filter typed.
- **AC-8**: Inside the open menu, ↓ from the field focuses the first visible row; ↓ and ↑ move between visible rows and stop at the last; ↑ from the first row returns to the field, and ↑ from the field stays there (`nextFocus`). ↓ on `close` focuses the field, and ↑ on `close` does nothing. Tab and Shift+Tab move through the dialog natively. Enter in the field calls the first visible row's `click()`, so it closes and follows exactly as a click does (nothing when no row is left, and nothing during IME composition, `isComposing` or `keyCode` 229, as Safari reports the Enter that ends a composition); Enter on a row follows it. A printable key on a row (`key.length === 1` with no Ctrl, Meta, or Alt, so Cmd+C still copies) moves focus to the field, and the character lands there.
- **AC-9**: A plain activation of a row (a primary click or Enter, with no Ctrl, Meta, Shift, or Alt) closes the dialog first, in one delegated `click` listener on the row list that calls `dialog.close()` without `preventDefault()`, then the link runs: a page row loads that page (the current page's row reloads it), and Back returns to a page whose menu is closed; the email row opens the mail app; the PDF row saves the file named `cvPdfFileName(basics.name)` and leaves the page in place with the menu closed. A modified click (Cmd, Ctrl, or Shift click, or a middle click) leaves the menu open and the page as it is, while the browser opens the link where the visitor asked.
- **AC-10**: While the menu is open, the page behind does not scroll: `src/styles/global.css` adds `html:has(dialog[open]) { overflow: hidden; }` in its base layer. A sheet taller than the viewport (a phone in landscape) scrolls inside the dialog only.
- **AC-11**: The corner button sits 24px from the right and bottom edges and never covers the footer at the end of a page: it takes the bottom 64px, inside the 80px below the footer (`pb-20`). The viewport meta stays as it is (no `viewport-fit=cover`), so iOS keeps fixed elements clear of the home indicator with no safe area rule.
- **AC-12**: In print, the dialog, the footer button, and the corner button never show; every page prints as today, and `dist/cv.pdf` still passes `checkCvPdf` (two Letter pages, the three Plex faces).
- **AC-13**: Each built page ships exactly one script, the menu's bundled module from `CommandMenu.astro`: Astro inlines it with its hash added to the CSP meta, or writes one `/_astro/*.js` file that `'self'` allows, by its size. No `is:inline`, no `set:html`, no `innerHTML`: the script only toggles `hidden`, sets `textContent`, moves focus, and calls `showModal()` and `close()`. Using the menu on `pnpm preview` logs no CSP violation. The five "ships no script" page tests become "ships one script, the menu's": each built page holds exactly one `<script type="module"`, and the page requests at most that script's `src` as its only `.js`, both derived from `dist/`.
- **AC-14**: With the menu open, every page passes an axe WCAG 2.2 AA check in light and dark. The dialog's accessible name is `menu`, no element under `body` has a `role` attribute, no link has `target`, and no element has `style`. Rows, `close`, and the corner button are at least 40px tall, the footer button at least 24px. Every focus stop in the dialog shows the 2px accent ring offset 3px. At 320px the open menu does not scroll sideways, and the email row wraps under its key as it does on `/contact`. The field's bottom border is `muted`, the pair the contrast test already holds at 3:1 for the button border.
- **AC-15**: A new `src/lib/command-menu.ts` imports nothing, so the client bundle carries no content code, and exports `COMMAND_MENU_ID` (`'command-menu'`), `rowMatches`, `formatMatchCount`, `shortcutHint`, `isComposingKey`, `isMenuShortcut`, and `nextFocus`, with Vitest in `src/lib/command-menu.test.ts` tagged with these AC ids: substring, case, trim, and empty query cases; the four count strings; `MacIntel`, `iPhone`, `iPad`, `Win32`, `Linux x86_64`, and `''` for the hint; `isComposingKey` true for `isComposing` and for `keyCode` 229; Meta+K, Ctrl+K, uppercase `K`, and a Cyrillic `к` with `code` `KeyK` accepted, and the Alt, Shift, repeat, composing, other letter, and Latin `t` with `code` `KeyK` (a Dvorak layout) refusals; and the `nextFocus` table (field to first, last stays last, first to field, ↑ from the field stays in the field, ↓ from the field with no rows stays in the field). `BaseLayout`, `SiteFooter`, and `CommandMenu` all take the id from `COMMAND_MENU_ID`.
- **AC-16**: Page tests: `e2e/site.spec.ts` updates the five script tests (AC-13), adds the footer button stop to every `PAGES` entry (after `← home`, and after the home menu rows on `/`), labelled `button "menu <hint>"` (the stop's text, which `tabOrder` reads; its accessible name stays `menu`) with the hint from `shortcutHint` on the page's `navigator.platform`, read after the hint span has filled, and updates the home footer text test; a new `command menu` block, tagged `spec 0014`, covers AC-2 and AC-4 to AC-14, including a touch context (`hasTouch`, `isMobile`) that first asserts `matchMedia('(pointer: coarse)')` matches, for the corner button and the coarse pointer focus, a context with JavaScript disabled for the invoker open, the PDF download event, a modified click, Back after a page row, and 320px. In tests the command menu's rows are `COMMAND_ROWS`, derived from `commandMenuRows`, and the home page's list keeps `MENU_ROWS`. `focusables` in `e2e/helpers.ts` keeps only rendered elements (`checkVisibility()`), so the closed dialog's controls and the hidden corner button drop out of every Tab order expectation, and the style guide's Tab test (`e2e/styleguide.spec.ts`, "Tab visits every link and button") expects the footer `menu` button as its last stop instead of `← home`. Every expectation derives from `commandMenuRows`, `SITE_NAV`, `formatContactRows`, and `cv.json`, so a valid content edit needs no test edit. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass.
- **AC-17**: `/styleguide` gains a `Command menu` section after its existing sections, with its own `SectionHeading`, holding a light and a dark panel (the `PANELS` scheme classes). Each panel shows `CommandMenu`'s `preview`, which draws the same content in a plain `<div>` with no ids and no `hidden` field or key line, then two `NavRow` examples, one with `current` and one with `download`. `e2e/styleguide.spec.ts` checks both, scoped to that section and to each panel the way the existing panel tests are, so the existing per panel counts do not change. `design.md` records `CommandMenu` as the twelfth component (the sheet, the keyed rows, the filter field, the words, the two triggers and the one per device rule, the corner button as the site's one fixed element, no motion, hidden in print) and `NavRow`'s two new props, and says "command menu" for this dialog and "home menu" for the `SITE_NAV` list on `/`.

## Decision

**Chosen option**: Option 1: a hand built `<dialog>` sheet of keyed `NavRow` links, opened by invoker command buttons, with a small bundled script for the shortcut, the filter, and the arrow keys.

The menu is plain HTML that the browser opens and closes; the script adds the keyboard layer on top and never builds markup.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Your picks in the interview: pages, contacts, and the PDF (no CV sections); a filter field; Cmd or Ctrl+K toggles, Esc closes; every page, 404 included; the current page kept and marked; substring matching; a muted `no match` line; a suggested design, compared on the bench; the sheet (bench 1A); keyed rows (2A); a corner button on phones with the footer button on computers (3B); no motion; hand built over a library; invoker command buttons with the script adding the rest; real links with arrows moving focus; touch as the phone rule (`pointer: coarse`); one button per device; the hint per platform, written by the script; the bench words; no keyboard on phones at open; an empty field on every open; close, then follow the link; the page locked while open; no References section.

Settled while writing (each with the runner up):

- **The rows come from one pure helper, `commandMenuRows`, in `src/lib/site-nav.ts`.** The menu is site navigation, the rule has branches (current page, the PDF row), and `AGENTS.md` puts a branch in a Vitest covered helper. It reuses `SITE_NAV`, `formatContactRows`, `CV_PDF_PATH`, and `cvPdfFileName`, so nothing is written twice. Runner up: building the list inline in `CommandMenu.astro`.
- **The home row is a literal in the helper, not a `SITE_NAV` entry.** `SITE_NAV` draws the numbered home menu, which must not list itself. Runner up: a `HOME` export in `site-nav.ts`, one more name for one row.
- **Client helpers live apart, in `src/lib/command-menu.ts`, which imports nothing.** `site-nav.ts` now imports content code (through `cv-format.ts`); keeping the client's imports in a module with no imports keeps the schema and Zod out of the browser bundle. Runner up: one module for both, which relies on tree shaking to keep the bundle small.
- **`CommandMenu` reads `getCv()` itself**, the exception `SiteFooter` already has, so `BaseLayout` stays free of content. Runner up: passing `basics` through `BaseLayout`, which would make every page hand it in.
- **The current page comes from `Astro.routePattern`**, as `SiteFooter` reads it, because with `build.format: 'file'` the pathname is `/index.html` at build time.
- **The filter text is the link's accessible name** (its text without the `aria-hidden` parts), so what you see, what you type, and what a screen reader hears agree, and the `· here` marker and the icons never match. Runner up: a `data-filter` attribute, a second copy of the label to keep in step.
- **The field and the key line ship `hidden`, and the script reveals them.** Without the script they would be a field that does nothing and keys that do nothing; the dialog is closed at load, so revealing them moves nothing on screen. Runner up: always visible.
- **The live region is separate from the visible `no match` line, which is `aria-hidden`**, so the empty state is announced once. Runner up: making the visible line the live region, which then says nothing for `3 rows`.
- **No `autofocus` on the dialog.** The jsx-a11y lint preset forbids it, and the dialog's own rule (its first focusable element, `close`) already keeps the phone keyboard down; the script moves focus to the field after the shortcut or on a fine pointer. Runner up: `autofocus` on the dialog with a lint exception.
- **The script's own opens focus at once; the `toggle` event covers the browser's.** The shortcut and the buttons the script wires call the open steps right after `showModal()`; an invoker button's open runs them on `toggle` (when `newState` is `open`). Task 1 proves `toggle` fires for an invoker open in all three engines; if one lacks it, the `command` event replaces it. The reset also runs at the start of every open, not only on `close`, because `close` fires a task later and a page can enter the browser's page cache before it runs (found by the cross check).
- **Only a plain activation closes the menu.** A Cmd, Ctrl, or middle click opens the link elsewhere at the visitor's request, so the menu stays open and they keep their place. Runner up: closing on every click, which leaves the visitor on a closed menu after a new tab opens.
- **A non Latin layout falls back to the physical K key**, so Cmd+K still works on a Cyrillic or Greek keyboard, while a Latin layout such as Dvorak keeps its own `k`. Runner up: `event.key` alone, which loses the shortcut on those layouts.
- **The script polyfills the buttons where invoker commands are missing** (a `click` handler calling `showModal()` or `close()` from each button's `command`), so a script that runs never leaves a dead button. Runner up: relying on support alone, which fails in an older Safari.
- **`type="text"`, not `type="search"`.** A search field draws its own clear button in WebKit and Chromium, and Esc first clears it before the dialog closes. Runner up: `search`, which adds a semantic hint screen readers rarely use.
- **The footer hint is inside the button**, so the target is wider and the hint reads as part of it, and the button carries `aria-keyshortcuts` so screen readers hear the keys while the visible hint stays `aria-hidden`. Runner up: the hint as a sibling span.
- **The corner button aligns with the column edge, `right-6 bottom-6`** (24px, the page's side padding), not 16px as on the bench, so it lines up with the text above it.
- **The script stays inline or external by Astro's own size rule**, and the tests read which from `dist/`. Runner up: forcing an external file, a config change for about 2 KB.
- **`CommandMenu` is the twelfth component and takes a `preview` prop** for the style guide, which needs the sheet at rest in both schemes without a second dialog id. Runner up: a separate `CommandMenuBody` component, one more file for one page.

## Rationale

Reasoning, the options weighed, the bench, and the measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The bench at https://claude.ai/artifact/PehqDEvq5rDJE3eDWRrvCM (private), built on 2026-10-05 from the six tokens, Plex Mono and Plex Sans, and the real rows, with 360 × 640 phone frames in light and dark and a full size `<dialog>` demo. You chose surface 1A (sheet), rows 2A (keyed), and trigger 3B (corner on phones). The bench drew the corner button 16px from the edges; the build uses 24px (see *Settled while writing*). Tokens, type, and components otherwise come from `design.md` and spec 0003, unchanged.

### Composition

The open sheet on `/cv`, in the 640px column, top aligned:

```
menu                                  close

filter    ______________________________

page      home
page      about
page      cv · here
page      projects
page      contact
email     jorgergo@icloud.com
github    @jorgergo ↗
linkedin  in/jorgergo ↗
download  cv.pdf ⤓

↑ ↓ move · enter open · esc close
```

The key line shows on keyboard devices only. The footer on a computer reads `← home   menu ctrl k   Toluca, MX · 2026` (`cmd k` on a Mac; no `← home` on `/`). On a phone the footer reads as today, and a bordered `menu` button sits fixed at the bottom right.

### Data model sketch

No stored data and no `cv.json` change. The rows are derived at build time:

| Shape (module) | Fields |
|---|---|
| `MenuRow` (`src/lib/site-nav.ts`) | `key: string` (`page`, a contact key, or `download`; at most 8 characters), `label: string`, `href: string`, `current: boolean`, `download?: string` (the PDF row only) |

Runtime state lives in the DOM only: the dialog's `open`, the field's value, and each row's `hidden`. Nothing is stored in the browser.

### State transitions

```
closed ──(footer or corner button, Cmd/Ctrl+K)──▶ open
open ──(Esc, close, Cmd/Ctrl+K, following a row)──▶ closed
open ──(input)──▶ open, rows filtered
```

Every open and every close resets the filter; an open by the shortcut, or by a button on a fine pointer, focuses the field.

### API surface

Build time and client side only, no HTTP beyond the static files.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `commandMenuRows` (`src/lib/site-nav.ts`) | `(basics: { readonly name: string } & Parameters<typeof formatContactRows>[0], routePattern: string) => readonly MenuRow[]` | the nine rows today | none; no `profiles` gives seven |
| `COMMAND_MENU_ID` (`src/lib/command-menu.ts`) | `'command-menu'` | the dialog id the buttons point at | none |
| `rowMatches` | `(text: string, query: string) => boolean` | substring match, case insensitive, trimmed query | none |
| `formatMatchCount` | `(count: number, query: string) => string` | `''`, `no match`, `1 row`, `N rows` | none |
| `shortcutHint` | `(platform: string) => 'cmd k' \| 'ctrl k'` | the hint text | none |
| `isComposingKey` | `(event: Pick<KeyboardEvent, 'isComposing' \| 'keyCode'>) => boolean` | true during IME composition (`isComposing`, or `keyCode` 229) | none |
| `isMenuShortcut` | `(event: Pick<KeyboardEvent, 'key' \| 'code' \| 'metaKey' \| 'ctrlKey' \| 'altKey' \| 'shiftKey' \| 'repeat' \| 'isComposing' \| 'keyCode'>) => boolean` | whether to toggle: `k` on `key`, or `KeyK` on `code` when `key` is not a Latin letter | none |
| `nextFocus` | `(index: number, count: number, key: 'ArrowDown' \| 'ArrowUp') => number` | the next row index, `-1` for the field (↑ from `-1` stays `-1`) | none |
| `CommandMenu` (`src/components/CommandMenu.astro`) | `preview?: boolean` | the dialog and its script, or the static preview | the `getCv()` throw (spec 0002) |
| `NavRow` | adds `current?: boolean`, `download?: string` | the row | none |
| `Button` | adds `commandfor?: string`, `command?: 'show-modal' \| 'close'` | the button | none |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render the rows | keys, labels, hrefs, order | `commandMenuRows`: the home literal, `SITE_NAV`, `formatContactRows(basics)`, `CV_PDF_PATH` |
| Render the rows | the current marker | `commandMenuRows` comparing each page `href` with `Astro.routePattern` |
| Render the PDF row | the saved file name | `cvPdfFileName(basics.name)` (spec 0013) |
| Render the rows | the arrow, the download icon | `NavRow`: the arrow for an `http(s)` href (spec 0004), the icon when `download` is set (this spec) |
| Render the sheet and buttons | `menu`, `close`, `filter`, `no match`, `· here`, the key line, the button labels | literals in `CommandMenu`, `NavRow`, `SiteFooter`, and `BaseLayout`, the bench words you kept |
| Render the buttons | the dialog id | `COMMAND_MENU_ID` |
| Run the script | the footer hint | `shortcutHint(navigator.platform)` |
| Filter | each row's text | the text of the row link's children that are not `aria-hidden="true"`, joined with a space, whitespace collapsed and trimmed |
| Filter | the announcement | `formatMatchCount(visible rows, field value)` |
| Open | where focus goes | the open path and `matchMedia('(pointer: fine)')`: the field after the shortcut or on a fine pointer, else left on `close` |
| Click a row | whether the menu closes | the click event: closes only with no Ctrl, Meta, Shift, or Alt (a middle click fires no `click`) |
| Open | whether the script wires the buttons | `'commandForElement' in HTMLButtonElement.prototype` |
| Show a trigger | which button shows | `pointer-coarse:`: the corner button, else the footer button |

### Key invariants

- One dialog per page, one script per page, one visible trigger per device.
- The menu's rows always equal `commandMenuRows(basics, routePattern)`: no row is written by hand in a component or a test.
- Every key fits the `w-20` column (8 characters at most), checked by Vitest.
- The script never creates elements or writes HTML; the build writes every element, and the script only shows, hides, focuses, and fills text.
- With JavaScript off, the page is today's page plus a closed dialog of links that the buttons open where invoker commands exist.
- Colours only from the six tokens; no new token, no arbitrary value, no `dark:` variant, no motion.
- The corner button is the only fixed element on the site, and it never covers the footer at the end of a page.

### Security model

A public static site with no users. The filter text never leaves the page: no request, no storage, no URL change. The script writes no markup (no `innerHTML`, no `set:html`), so content cannot inject anything through it. The CSP policy itself is unchanged: Astro hashes the inline script into the meta tag, or `'self'` covers an external one. No new header, permission, or third party. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `styleguide.spec` is `e2e/styleguide.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Rows helper (Vitest): today's nine rows, `current` per route, no profiles, the accented file name, key widths, verifies **AC-1**.
- Client helpers (Vitest): match, count, hint, shortcut, and focus tables, verifies **AC-5**, **AC-7**, **AC-8**, **AC-15**.
- Happy path (`site.spec`): on every page Ctrl+K opens the sheet with focus in the field, the rows equal `commandMenuRows`, typing `git` leaves the GitHub row, Enter follows it; Ctrl+K and Esc close it and focus returns, verifies **AC-2**, **AC-5** to **AC-8**.
- Row anatomy (`site.spec`, `styleguide.spec`): `aria-current` and `· here` on the current page only, the download attribute and icon on the PDF row, arrows on the `https` rows, verifies **AC-3**.
- Buttons (`site.spec`): the footer button opens it on a desktop context and the corner button is hidden; in a touch context the corner button shows 24px from the edges, the footer button is hidden, and opening leaves the field unfocused with the key line hidden, verifies **AC-4**, **AC-6**, **AC-11**.
- Failure case, no script (`site.spec`, `verify`): with JavaScript disabled the footer button still opens the dialog, the field and key line stay hidden, the rows are links, and Esc closes it, verifies **AC-4**, **AC-7**.
- Keys and pick (`site.spec`): ↓ ↑ through the visible rows and back to the field, a letter on a row lands in the field, the PDF row closes the dialog and fires a download named `cvPdfFileName`, a Ctrl click on a row leaves the menu open, Back after a page row shows a closed menu with an empty field, verifies **AC-7** to **AC-9**.
- Empty state (`site.spec`): `zzz` shows `no match` and the live region says it; reopening starts empty with nine rows, verifies **AC-7**.
- Scroll lock and 320px (`site.spec`): `html` computes `overflow: hidden` while open; no sideways scroll at 320px with the menu open, verifies **AC-10**, **AC-14**.
- Script and CSP (`site.spec`, `verify`): one module script per built page, the request lists derived from `dist/`, no CSP violation on `pnpm preview`, verifies **AC-13**.
- Accessibility (`site.spec`): axe in light and dark with the menu open, the dialog name, no `role`, sizes, the ring, verifies **AC-14**.
- Print (`site.spec`): under print media the dialog and both buttons are not displayed, and the CV PDF checks pass unchanged, verifies **AC-12**.
- Tab order (`site.spec`): every page's stops gain `button "menu <hint>"` in the footer, verifies **AC-16**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the menu ships whole in one merge, the smallest complete menu a visitor can use, after a proof that the platform does what the design leans on.

1. [x] Proof first: on a scratch page, a `<dialog>` opened by a `<button commandfor command="show-modal">` like the one `Button` will render; confirm `astro check` accepts the attributes (Astro 7's types list them), the built page opens and closes the dialog with JavaScript disabled in Chromium, Firefox, and WebKit (install the two extra Playwright browsers locally for this check only; CI stays Chromium), the dialog's `toggle` event fires for an invoker open in all three, and Astro's bundled script runs on `pnpm preview` under the hashed CSP with no violation. If WebKit cannot open the dialog without a script, stop and return to `/architect`; if only `toggle` is missing, use the `command` event as *Settled while writing* says. Delete the scratch page, satisfies **AC-4**, **AC-6**, **AC-13**.
2. [x] Helpers: create `src/lib/command-menu.ts` (`COMMAND_MENU_ID`, `rowMatches`, `formatMatchCount`, `shortcutHint`, `isComposingKey`, `isMenuShortcut`, `nextFocus`) with `src/lib/command-menu.test.ts`; add `MenuRow` and `commandMenuRows` to `src/lib/site-nav.ts` with the AC-1 cases in `src/lib/site-nav.test.ts`, satisfies **AC-1**, **AC-5**, **AC-7**, **AC-8**, **AC-15**.
3. [ ] Components: add `current` and `download` to `NavRow`, and `commandfor` and `command` to `Button`; create `src/components/CommandMenu.astro` (the AC-2 markup, the `preview` prop, a Spec 0014 comment, and the bundled `<script>` for AC-4 to AC-9); add the footer button to `SiteFooter`; add the corner button wrapper and `<CommandMenu />` to `BaseLayout` after the page column; add the scroll lock rule to `src/styles/global.css`, satisfies **AC-2** to **AC-12**.
4. [ ] Page tests: make `focusables` in `e2e/helpers.ts` keep only rendered elements; update the five script tests, the `PAGES` stops (waiting for the hint), and the home footer text test in `e2e/site.spec.ts`, and the last stop of the style guide's Tab test in `e2e/styleguide.spec.ts`; add `COMMAND_ROWS` and the `command menu` block (desktop, touch, and no script contexts, download, a modified click, Back, 320px, axe, print, CSP), satisfies **AC-12** to **AC-14**, **AC-16**.
5. [ ] Style guide, docs, and the gate: the new `Command menu` section after the existing ones, with the `CommandMenu` preview and the two `NavRow` examples in a light and a dark panel, and its `styleguide.spec` checks scoped to that section; the `design.md` lines; then `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`, and the steps in [verify.md](verify.md), satisfies **AC-16**, **AC-17**.

## Consequences

**Positive**:
- Any page, contact, or the PDF is one shortcut or one tap away from anywhere, including 8.7 screens down `/cv` on a phone.
- No dependency and no new pattern for visitors: the rows are `NavRow` links, the same rows as `/contact`, so the site keeps one interaction.
- The menu degrades well: without JavaScript the buttons still open a list of links, and the script never builds markup.
- A new page in `SITE_NAV` or a new profile in `cv.json` joins the menu with no menu or test edit.

**Negative / tradeoffs**:
- The site is no longer script free. Every page carries about 2 KB of module script, and five tests that guarded "no script" now guard "one script". Specs 0004, 0005, and 0008 to 0011 recorded "no script" for their pages; this spec replaces that rule for every page.
- The corner button is the site's first fixed element: on a phone it covers the end of a line as text scrolls under it.
- Every page's HTML now carries the nine menu links in a closed dialog, so search engines see the same links on every page.
- The shortcut takes Ctrl+K from the browser (the search bar shortcut in Chromium and Firefox) while a page of the site has focus.
- The footer button changes the Tab order of every page, and the `PAGES` stops and the home footer test change with it.
- Invoker commands are recent (Chrome 135, Firefox 144, Safari 26.2 as of this writing); in an older browser with the script blocked, the buttons do nothing.

**Neutral**:
- `CommandMenu` joins `SiteFooter` as a component that reads `getCv()` itself; the `AGENTS.md` rule that lists the callers needs that line (for `/sync`).
- The spec 0001 follow up item (hotkeypad against a hand built dialog) is settled here, spec 0004's (pages from `SITE_NAV`, socials from the profiles) is built here, and spec 0005's (CV section jump targets) is declined, since the menu lists pages, contacts, and the PDF only.
- `pointer-coarse:` is the site's first input media variant; `xs` stays the only width breakpoint.

## Follow-up

- [ ] `/sync`: the `AGENTS.md` rules gain the menu (one script per page, `CommandMenu` among the `getCv()` callers, `commandMenuRows` for the rows, the one fixed element), and the "no script" lines in specs 0004, 0005, and 0008 to 0011 point here.
- [ ] If a CV section jump is ever wanted, add `#experience` and the other section ids as rows through `commandMenuRows`; the list would outgrow a 640px phone screen, so revisit the sheet's spacing then.
