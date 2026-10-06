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
