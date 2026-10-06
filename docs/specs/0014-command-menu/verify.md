# Verify: Command menu · spec 0014 · 2026-10-05
_Steps derived from spec 0014 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers and the CSP) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [x] On `/cv` at 1280×800, press Cmd+K (Mac) or Ctrl+K → the page is replaced by the sheet on the page ground: `menu` and `close` on top, `filter` with the cursor in its field, nine rows (`page home`, `page about`, `page cv · here`, `page projects`, `page contact`, `email` and your address, `github @jorgergo` with the arrow, `linkedin in/jorgergo` with the arrow, `download cv.pdf` with the download icon), then `↑ ↓ move · enter open · esc close`; nothing animates; check light, then dark → AC-1 to AC-3, AC-5, AC-6
- [x] Press Cmd+K again → it closes and focus returns where it was; open it, press Esc → it closes; open it, click `close` → it closes → AC-5, AC-6
- [x] Look at the footer on each page → `← home`, then `menu cmd k` (or `ctrl k`), then the city line; on `/` there is no `← home`; click `menu` → the sheet opens with the cursor in the field → AC-4, AC-6
- [x] Type `git` → only the GitHub row stays; press Enter → GitHub opens in the same tab; Back → the page shows with the menu closed → AC-7, AC-9
- [x] Open, type `page` → the five page rows; type `zzz` → no rows and `no match`; clear the field → nine rows; close and reopen → the field is empty → AC-7
- [x] Open, press ↓ → the first row has the olive ring; ↓ to the last row, ↓ again → it stays; ↑ back to the first, ↑ again → the field; on a row type `l` → the field takes the letter and the list narrows → AC-8
- [x] Open, choose `download cv.pdf` → the menu closes, the page stays, and `Jorge-Gonzalez-Ozorno-CV.pdf` downloads → AC-9
- [x] Open, Cmd click (Ctrl click elsewhere) `page about` → it opens in a new tab and the menu stays open on this page; type `git`, press Enter, then Back → the menu is closed, and reopening shows an empty field and nine rows → AC-7, AC-9
- [x] On an iPad with a keyboard (or a touch laptop in tablet mode), press Cmd+K → the cursor lands in the field; tap the corner `menu` → focus stays on `close` → AC-6
- [x] With the menu open, scroll the wheel or trackpad → the page behind does not move → AC-10
- [x] Open Firefox and press Ctrl+K (Cmd+K on a Mac) on the site → the menu opens, not the browser's search bar; do the same in Safari → AC-5
- [x] On a real iPhone (Safari), open `/cv` → the bordered `menu` button sits at the bottom right, its right edge in line with the text; scroll to the very end → it does not cover the footer; tap it → the sheet opens with no keyboard and all nine rows visible; tap `filter` → the keyboard opens and the page does not zoom; tap a row → it opens; the footer shows no `menu` button → AC-4, AC-6, AC-11
- [x] On the iPhone in landscape → the sheet scrolls inside itself and the page behind stays still → AC-10
- [x] Turn on VoiceOver (Safari, Mac), press Cmd+K → it announces the `menu` dialog and the `filter` field; type `proj` → it announces `1 row`; clear it, ↓ to `page cv` → `page cv, current page, link`; type `zzz` → `no match` once → AC-7, AC-8, AC-14
- [x] Disable JavaScript in the browser, reload `/about`, click the footer `menu` → the sheet opens with the title, `close`, and the nine rows, no field and no key line; Tab through the rows; Esc closes → AC-4, AC-7, AC-11
- [x] Print preview any page and `/cv` → no menu, no `menu` button, no corner button; the pages print as before → AC-12
- [x] Open the browser console on `pnpm preview`, use the menu on every page → no CSP violation and no error → AC-13
- [x] At 320px wide with the menu open → nothing scrolls sideways; the email row's address wraps under `email` as on `/contact` → AC-14
- [x] `pnpm dev`, open `/styleguide` → both panels show the menu at rest and the two new `NavRow` examples (`· here`, the download icon) → AC-17
- [x] Read `design.md` → twelve components, the `CommandMenu` rules, `NavRow`'s `current` and `download`, the corner button as the one fixed element, the menu hidden in print → AC-17
- [x] Break step (value sourcing): add `{ label: 'history', href: '/history' }` to `SITE_NAV`, run `pnpm test` and `pnpm build` → the menu lists `page history` after `page contact` with no menu edit (the home menu 200 test fails, as it should for a page that does not exist); restore → AC-1, AC-16
- [x] Break step (value sourcing): in `src/content/cv.json` delete `basics.profiles`, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → seven rows, and the tests pass with no edit; restore → AC-1, AC-16
- [x] Break step: remove `commandfor` from the footer button, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → the no script case fails; restore → AC-4
- [x] Break step: in `src/lib/command-menu.ts` make `isMenuShortcut` accept Shift, run `pnpm test` → the Shift refusal case fails; restore → AC-5, AC-15

## Commands
- [x] `pnpm build` → passes; `dist/cv.pdf` still passes its two page and three font checks → AC-12
- [x] `for f in dist/*.html; do echo "$f $(grep -o '<script' "$f" | wc -l)"; done` → 1 for each page (the attribute rules, no `role`, `target`, or `style`, are checked by the page tests, since the compressed HTML holds the inline script on the same line) → AC-13, AC-14
- [x] `for f in dist/*.html; do echo "$f $(grep -o '<dialog id="command-menu"' "$f" | wc -l)"; done` → 1 for each page → AC-2
- [x] `pnpm test` → the `command-menu.test.ts` tables and the `commandMenuRows` cases pass → AC-1, AC-15
- [x] `pnpm lint` and `pnpm format:check` → pass → AC-16
- [x] `pnpm exec playwright test` → the five script tests, the new stops, the home footer text, the `command menu` block, and the style guide checks pass → AC-13, AC-14, AC-16, AC-17

## Added by the build · /develop · 2026-10-05
- [x] On `/cv`, press Cmd+K and type `git` at once, then press ↓ right away → the letters stay in the field and focus stays on the GitHub row; nothing resets a frame later, because `toggle` runs the open steps only for an open the browser made → AC-6, AC-7, AC-8
- [x] Open the menu and type `here` → no row matches and `no match` shows: the `· here` marker and the icons are not part of any row's text → AC-7
- [x] In a browser without invoker commands (Safari before 26.2, Chrome before 135) with JavaScript on, click the footer `menu` → the sheet opens with the cursor in the field, and `close` closes it, since the script wires both buttons itself → AC-4, AC-6
- [x] `pnpm dev`, `/styleguide` at 320px → nothing scrolls sideways; the two Command menu panels shrink to the column (`min-w-0`), the filter field narrows, and the email row wraps under its key → AC-17

## Build measurements · /develop · 2026-10-05
_Taken during the build, so `/check verify` can compare without running them again. Nothing above is ticked: that is for `/check verify`._

- Gate on macOS: `pnpm lint` and `pnpm format:check` clean; `pnpm test` 560 passing; `pnpm build` logs `[cv-pdf] cv.pdf: 2 pages, 64 kB`; `pnpm exec wrangler deploy --dry-run` reads 23 files; `pnpm exec playwright test` 405 passing (333 site, 72 style guide) → AC-12, AC-16
- The menu script is 2,649 bytes. Astro inlines it as the one `<script type="module">` in each of the six built pages, with its hash in the CSP meta, and writes no `/_astro/*.js` file. Page sizes with the closed dialog: `index.html` 14,936 bytes, `about.html` 15,212, `cv.html` 31,930, `projects.html` 20,524, `contact.html` 15,242, `404.html` 13,081 → AC-2, AC-13
- `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` on `pnpm preview` → `attempt 1/10: every check passed` → AC-13
- Proof (task 1), on a scratch page built and served by `pnpm preview`: in Linux Chromium, Firefox, and WebKit (the `mcr.microsoft.com/playwright:v1.63.0-noble` image, reaching the Mac through `host.docker.internal`) and in macOS Chromium and WebKit, a `commandfor` button opened the dialog with JavaScript off, and Esc and `close` closed it; with JavaScript on, the inlined module ran under the hashed CSP with no console error, `toggle` fired with `open` then `closed`, the `command` event fired, and focus landed on `close`. Playwright's macOS Firefox build does not start on macOS 27 (`Could not find profile folder`, with or without the sandbox), so Firefox ran in the image → AC-4, AC-6, AC-13
- Found by the page tests: Chromium fires `toggle` about a frame after `showModal()`. Running the open steps there for the script's own opens wiped text typed after Cmd+K and pulled focus back from a row to the field. The script now skips `toggle` for an open it made (commit `08b2b57`) → AC-6, AC-7, AC-8
- On the built `/cv` at 1280×800 on a Mac in dark: Cmd+K showed the sheet as the spec's composition draws it, focus in the field, `page cv · here`, the arrows on GitHub and LinkedIn, the download icon on `cv.pdf`, and the key line; the footer read `← home  menu cmd k  Toluca, MX · 2026`, and the console was empty → AC-2, AC-3, AC-4, AC-5

## Not run by the build
The UI and manual steps above (a real iPhone and an iPad with a keyboard, VoiceOver, Firefox and Safari by hand, print preview by hand, the old browser step) and the break steps are left for `/check verify`.

## Verified · /check verify · 2026-10-05
_PASS: all 17 acceptance criteria met. The machine steps ran on the built site through `wrangler dev`; you ran the hand steps on an iPhone and marked the rest proved._

- Gate: `pnpm lint` and `pnpm format:check` clean; `pnpm test` 560 passing; `pnpm build` logs `[cv-pdf] cv.pdf: 2 pages, 64 kB` with the three Plex faces; `astro check` 0 errors, 0 warnings, 1 hint (`keyCode` deprecated, used on purpose for Safari's composition key); `pnpm exec playwright test` 405 passing (333 site, 71 style guide, the dev server setup) → AC-12, AC-16
- `dist/`: each of the six pages holds one `<script type="module">` (2,649 bytes, the same on every page, its hash in that page's CSP: 6 hashes against 5 on the live site), one `<dialog id="command-menu">`, no `role`, `target`, `style`, or `autofocus` under `body`, and no `/_astro/*.js` file; the script writes no markup; the viewport meta has no `viewport-fit` → AC-2, AC-11, AC-13, AC-14
- Desktop Chromium on macOS, `/cv` at 1280×800, light and dark: Cmd+K draws the sheet as the composition shows, focus in the field, nine rows in order, `· here` on `cv`, the arrow on GitHub and LinkedIn, the download icon on `cv.pdf`; the dialog and its `::backdrop` take the `html` ground (`rgb(242, 237, 227)` light, `rgb(27, 25, 22)` dark), no shadow, no radius, no running animation. Rows, `close`, and the field are 40px tall, the footer button 24px; a focused row shows the 2px ring offset 3px → AC-1 to AC-3, AC-5, AC-6, AC-14
- The footer on every page reads `← home menu cmd k Toluca, MX · 2026` (no `← home` on `/`); the button's accessible name is `menu` with `aria-keyshortcuts` `Meta+K Control+K`. In Chromium a click puts focus in the field one frame later, on the `toggle` event; WebKit at once → AC-4, AC-6
- Filter: `page` 5 rows (`5 rows`), `PROJ` 1, `zzz` none with `no match` shown and announced, `here` none, a cleared field 9 with the live region empty, and every reopen starts empty. Arrows, Enter, a letter on a row, the PDF download (`Jorge-Gonzalez-Ozorno-CV.pdf`, byte identical to `dist/cv.pdf`, the page left in place), Cmd, Shift, and middle clicks (menu kept open), and Back after a page row and after GitHub (menu closed, empty, nine rows) all behave as specced → AC-7 to AC-9
- The page behind holds still under the wheel and PageDown while open (`overflow: hidden` on `html`); at 320px nothing scrolls sideways and the email wraps under its key → AC-10, AC-14
- JavaScript off on `/about`: the footer button opens the dialog with no field and no key line, nine links Tab in order, Esc closes → AC-4, AC-7
- Print with print media on all five pages, menu closed and open: no `menu`, `close`, or `filter` text on paper, `/cv` two pages; the dialog, the footer button, and the corner button compute `display: none` → AC-12
- No console error or CSP violation on any page while using the menu, and no `.js` request → AC-13
- WebKit on macOS: Cmd+K opens with its default cancelled. iPhone 15 emulation: the corner button 24px from the right and bottom, clear of the footer at the end of `/cv`, a tap opens with focus on `close` and no key line, the field 16px; in landscape the sheet scrolls inside itself while the page stays put. iPad Pro 11 emulation: Cmd+K focuses the field, a corner tap leaves focus on `close` → AC-4, AC-6, AC-10, AC-11
- Linux, in `mcr.microsoft.com/playwright:v1.63.0-noble`: Firefox 155, WebKit 26.6, and Chromium 153 each open by Ctrl+K and Cmd+K with focus in the field, filter, move by arrows, close by Esc and `close`, open from the footer button, lock the page, log no error, and open by the footer button with JavaScript off → AC-4, AC-5, AC-7, AC-10
- Without invoker commands, simulated in Chromium (`commandForElement` removed and the browser's own handling cancelled): the script's own wiring opened the menu with focus in the field, `close` closed it, and focus came back to the footer button → AC-4, AC-6
- `/styleguide` on `astro dev`, at 1280 and 320px: the `Command menu` section comes last, both panels show the sheet at rest (field and key line shown) and the two `NavRow` examples, the page keeps one `#command-menu`, and nothing scrolls sideways → AC-17
- Break steps, in a throwaway git worktree: `isMenuShortcut` accepting Shift fails `refuses Shift`; `history` in `SITE_NAV` puts `page history` after `page contact` in the built menu with no menu edit, and also fails three cases in `site-nav.test.ts` that pin today's pages (the planned order, the nine rows, the seven rows); no `basics.profiles` builds seven rows and the 39 `command menu` page tests pass unedited; no `commandfor` on the footer button fails the no script case and three others → AC-1, AC-4, AC-5, AC-15, AC-16
- Hand steps (iPhone, iPad, VoiceOver, Firefox and Safari by hand, an old browser): run and confirmed by you → AC-4 to AC-8, AC-10, AC-11, AC-14

Noted for `/check review`: in Chromium the `close` event fires about 8ms after Esc, so a reopen inside that window has its typed text wiped by the late reset (reproduced twice; not in WebKit, not with a 10ms gap). In WebKit's iPhone emulation, `close` showed the focus ring right after a tap.
