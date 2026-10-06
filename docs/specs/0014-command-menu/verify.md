# Verify: Command menu · spec 0014 · 2026-10-05
_Steps derived from spec 0014 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers and the CSP) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [ ] On `/cv` at 1280×800, press Cmd+K (Mac) or Ctrl+K → the page is replaced by the sheet on the page ground: `menu` and `close` on top, `filter` with the cursor in its field, nine rows (`page home`, `page about`, `page cv · here`, `page projects`, `page contact`, `email` and your address, `github @jorgergo` with the arrow, `linkedin in/jorgergo` with the arrow, `download cv.pdf` with the download icon), then `↑ ↓ move · enter open · esc close`; nothing animates; check light, then dark → AC-1 to AC-3, AC-5, AC-6
- [ ] Press Cmd+K again → it closes and focus returns where it was; open it, press Esc → it closes; open it, click `close` → it closes → AC-5, AC-6
- [ ] Look at the footer on each page → `← home`, then `menu cmd k` (or `ctrl k`), then the city line; on `/` there is no `← home`; click `menu` → the sheet opens with the cursor in the field → AC-4, AC-6
- [ ] Type `git` → only the GitHub row stays; press Enter → GitHub opens in the same tab; Back → the page shows with the menu closed → AC-7, AC-9
- [ ] Open, type `page` → the five page rows; type `zzz` → no rows and `no match`; clear the field → nine rows; close and reopen → the field is empty → AC-7
- [ ] Open, press ↓ → the first row has the olive ring; ↓ to the last row, ↓ again → it stays; ↑ back to the first, ↑ again → the field; on a row type `l` → the field takes the letter and the list narrows → AC-8
- [ ] Open, choose `download cv.pdf` → the menu closes, the page stays, and `Jorge-Gonzalez-Ozorno-CV.pdf` downloads → AC-9
- [ ] Open, Cmd click (Ctrl click elsewhere) `page about` → it opens in a new tab and the menu stays open on this page; type `git`, press Enter, then Back → the menu is closed, and reopening shows an empty field and nine rows → AC-7, AC-9
- [ ] On an iPad with a keyboard (or a touch laptop in tablet mode), press Cmd+K → the cursor lands in the field; tap the corner `menu` → focus stays on `close` → AC-6
- [ ] With the menu open, scroll the wheel or trackpad → the page behind does not move → AC-10
- [ ] Open Firefox and press Ctrl+K (Cmd+K on a Mac) on the site → the menu opens, not the browser's search bar; do the same in Safari → AC-5
- [ ] On a real iPhone (Safari), open `/cv` → the bordered `menu` button sits at the bottom right, its right edge in line with the text; scroll to the very end → it does not cover the footer; tap it → the sheet opens with no keyboard and all nine rows visible; tap `filter` → the keyboard opens and the page does not zoom; tap a row → it opens; the footer shows no `menu` button → AC-4, AC-6, AC-11
- [ ] On the iPhone in landscape → the sheet scrolls inside itself and the page behind stays still → AC-10
- [ ] Turn on VoiceOver (Safari, Mac), press Cmd+K → it announces the `menu` dialog and the `filter` field; type `proj` → it announces `1 row`; clear it, ↓ to `page cv` → `page cv, current page, link`; type `zzz` → `no match` once → AC-7, AC-8, AC-14
- [ ] Disable JavaScript in the browser, reload `/about`, click the footer `menu` → the sheet opens with the title, `close`, and the nine rows, no field and no key line; Tab through the rows; Esc closes → AC-4, AC-7, AC-11
- [ ] Print preview any page and `/cv` → no menu, no `menu` button, no corner button; the pages print as before → AC-12
- [ ] Open the browser console on `pnpm preview`, use the menu on every page → no CSP violation and no error → AC-13
- [ ] At 320px wide with the menu open → nothing scrolls sideways; the email row's address wraps under `email` as on `/contact` → AC-14
- [ ] `pnpm dev`, open `/styleguide` → both panels show the menu at rest and the two new `NavRow` examples (`· here`, the download icon) → AC-17
- [ ] Read `design.md` → twelve components, the `CommandMenu` rules, `NavRow`'s `current` and `download`, the corner button as the one fixed element, the menu hidden in print → AC-17
- [ ] Break step (value sourcing): add `{ label: 'history', href: '/history' }` to `SITE_NAV`, run `pnpm test` and `pnpm build` → the menu lists `page history` after `page contact` with no menu edit (the home menu 200 test fails, as it should for a page that does not exist); restore → AC-1, AC-16
- [ ] Break step (value sourcing): in `src/content/cv.json` delete `basics.profiles`, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → seven rows, and the tests pass with no edit; restore → AC-1, AC-16
- [ ] Break step: remove `commandfor` from the footer button, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → the no script case fails; restore → AC-4
- [ ] Break step: in `src/lib/command-menu.ts` make `isMenuShortcut` accept Shift, run `pnpm test` → the Shift refusal case fails; restore → AC-5, AC-15

## Commands
- [ ] `pnpm build` → passes; `dist/cv.pdf` still passes its two page and three font checks → AC-12
- [ ] `for f in dist/*.html; do echo "$f $(grep -o '<script' "$f" | wc -l)"; done` → 1 for each page (the attribute rules, no `role`, `target`, or `style`, are checked by the page tests, since the compressed HTML holds the inline script on the same line) → AC-13, AC-14
- [ ] `for f in dist/*.html; do echo "$f $(grep -o '<dialog id="command-menu"' "$f" | wc -l)"; done` → 1 for each page → AC-2
- [ ] `pnpm test` → the `command-menu.test.ts` tables and the `commandMenuRows` cases pass → AC-1, AC-15
- [ ] `pnpm lint` and `pnpm format:check` → pass → AC-16
- [ ] `pnpm exec playwright test` → the five script tests, the new stops, the home footer text, the `command menu` block, and the style guide checks pass → AC-13, AC-14, AC-16, AC-17

## Added by the build · /develop · 2026-10-05
- [ ] On `/cv`, press Cmd+K and type `git` at once, then press ↓ right away → the letters stay in the field and focus stays on the GitHub row; nothing resets a frame later, because `toggle` runs the open steps only for an open the browser made → AC-6, AC-7, AC-8
- [ ] Open the menu and type `here` → no row matches and `no match` shows: the `· here` marker and the icons are not part of any row's text → AC-7
- [ ] In a browser without invoker commands (Safari before 26.2, Chrome before 135) with JavaScript on, click the footer `menu` → the sheet opens with the cursor in the field, and `close` closes it, since the script wires both buttons itself → AC-4, AC-6
- [ ] `pnpm dev`, `/styleguide` at 320px → nothing scrolls sideways; the two Command menu panels shrink to the column (`min-w-0`), the filter field narrows, and the email row wraps under its key → AC-17

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
