# Verify: Command menu as a panel · spec 0015 · 2026-10-13
_Steps derived from spec 0015 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers and the CSP) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`. The iPhone steps use the iOS Simulator against `pnpm preview` on this Mac (a simulator reaches the Mac's localhost with no setup).

## UI / manual
- [x] On `/cv` at 1280×800, press Cmd+K (Mac) or Ctrl+K → the page stays in view, dimmed; a 512px panel opens about a seventh of the way down, fading in quickly; the field row shows `search pages and links` with the cursor in it, a 2px olive line under it, and `esc` on the right; below, `pages` (`home` selected with a `›` and a pale ground, `about`, `cv` with `here`, `projects`, `contact`), `contact` (`email` and your address, `github @jorgergo ↗`, `linkedin in/jorgergo ↗`), `file` (`cv.pdf download` with the icon); no shadow, square 2px corners; check light, then dark → AC-1 to AC-3, AC-5 to AC-8, AC-12
- [x] Type `git` → only `contact` and the GitHub row stay, the GitHub row selected, and the panel's top does not move; press Enter → GitHub opens in the same tab; Back → the page shows with the menu closed → AC-2, AC-8, AC-10, AC-13
- [x] Open, type `zzz` → no group, `no match`; clear the field → all three groups, `home` selected; close and reopen → the field is empty → AC-8, AC-10
- [x] Open, move the mouse over `projects` → it takes the selection while the cursor stays in the field; press Enter → `/projects` opens → AC-8
- [x] Open, rest the mouse over the middle of the list without moving it, type `git` → the GitHub row stays selected as rows slide under the cursor; then move the mouse → the row under it takes the selection → AC-8
- [x] On Windows (or Linux with classic scrollbars), on the long `/cv`, open and close the menu → the page behind does not shift sideways → AC-2
- [x] Open, press ↓ → `about` is selected and focused, with no olive ring; ↓ to `cv.pdf`, ↓ again → it stays; ↑ back to `home`, ↑ again → the field, with `home` still selected; on a row type `l` → the field takes the letter → AC-7, AC-9
- [x] Open, press Shift+Tab → focus moves from the field to `esc` (it comes first in the DOM); press Enter → it closes and focus returns where it was → AC-5, AC-13
- [x] Open, click the dimmed page → it closes; open, press in the field, drag out onto the dimmed page and release → it stays open; open, click the panel's padding beside a heading → it stays open → AC-11
- [x] Open, choose `cv.pdf` → the menu closes, the page stays, and the PDF downloads under your name → AC-13
- [x] Open, Cmd click (Ctrl click elsewhere) `about` → it opens in a new tab and the menu stays open → AC-13
- [x] Turn on Reduce motion in the operating system, open the menu → it appears at once with no fade; turn it off again → AC-12
- [x] With the menu open, scroll the wheel or trackpad → the page behind does not move → AC-13
- [x] Turn on VoiceOver (Safari, Mac), press Cmd+K → it announces the `menu` dialog and the `search pages and links` field; type `proj` → it announces `1 row, enter opens projects`; ↓ to `cv` → `cv, current page, link`; jump by heading → `pages`, `contact`, `file` → AC-6, AC-10, AC-14 (accepted 2026-10-14 without a VoiceOver run; the live region strings are covered by the page tests)
- [x] Turn on forced colours (Windows High Contrast, or emulate `forced-colors: active` in Chromium), open the menu → the selected row still shows its `›` → AC-7
- [x] Disable JavaScript, reload `/about`, click the footer `menu` → the panel opens with `esc` focused, the groups of links, and no field; Tab through the rows (each shows the selected look as it gets focus); Esc closes → AC-5, AC-7, AC-13
- [x] In the iOS Simulator (iPhone 17, iOS 26), open `/cv` in Safari, tap the corner `menu` → a sheet rises from the bottom edge, fading in from a little lower, all nine rows above the field, `close` on the right, no keyboard, nothing selected; tap the dimmed strip above → it closes → AC-4, AC-11, AC-12
- [x] In the same simulator, open the sheet, tap the field → the keyboard opens with the field just above it and the page does not zoom; type `git` → the `contact` heading, the GitHub row (now selected), and the field stay in view above the keyboard; tap `go` → GitHub opens → AC-4, AC-8
- [x] Repeat the two simulator steps on the iPhone SE simulator (iOS 18), the smallest screen → the sheet fits or its rows scroll inside it, and the field stays above the keyboard → AC-4
- [x] In the iPad simulator, tap the corner `menu` → a 512px sheet centred on the bottom edge → AC-4
- [x] On an Android phone or emulator (Chrome), open the sheet, tap the field, type `git` → the field and the GitHub row stay above the keyboard → AC-4
- [x] In the iPhone simulator, open the sheet, tap `close` with VoiceOver off → the olive line never shows on the field row while only `close` has focus; tap the field → the line shows above the field and `home` is selected → AC-5, AC-8
- [x] On a phone width in landscape → the sheet's rows scroll inside it, the field stays at its foot, and the page behind stays still → AC-4, AC-13 (accepted 2026-10-14 on Chromium and WebKit touch emulation; not seen in iOS Safari)
- [x] Print preview any page and `/cv` → no menu and no menu buttons; the pages print as before → AC-13
- [x] Open the browser console on `pnpm preview`, use the menu on every page → no CSP violation and no error → AC-13
- [x] At 320px wide, open the menu on a fine pointer and in a touch emulation → nothing scrolls sideways, and the email address stays whole → AC-14
- [x] `pnpm dev`, open `/styleguide` → both panels show the panel at rest with the field and `home` selected, and no `NavRow` examples in that section → AC-17
- [x] Read `design.md` → the panel and the sheet, the `scrim` exception, the selected row in place of the ring, the field's line, the fade, `NavRow` without `current` and `download` → AC-17
- [x] Break step (value sourcing): add `{ label: 'history', href: '/history' }` to `SITE_NAV`, run `pnpm test` and `pnpm build` → the `pages` group lists `history` after `contact` with no menu edit (the home menu 200 test fails, as it should for a page that does not exist); restore → AC-1, AC-16
- [x] Break step (value sourcing): in `src/content/cv.json` delete `basics.profiles`, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → the `contact` group holds the email row alone, and the tests pass with no edit; restore → AC-1, AC-16
- [x] Break step: in `src/styles/global.css` set the light `--color-line` to `#8a8272`, run `pnpm test` → the contrast test fails and names `selected row: fg on line` in light (about 3.7:1); restore → AC-7
- [x] Break step: remove the `pointerdown` guard from the click outside handler, run `pnpm build` and `pnpm exec playwright test --project site -g "command menu"` → the drag case fails; restore → AC-11
- [x] Break step: in `src/lib/command-menu.ts` make `nextFocus` send ↓ from the field to the selected row instead of the next one, run `pnpm test` → the table case fails; restore → AC-9
