# Verify, feat/page-entrance-motion, 2026-11-06

**Run by**: `/check verify page entrance motion` (Opus 5.5), a session started from the build session
**Build checked**: the uncommitted tree on `feat/page-entrance-motion` (base `57db9bd`), built here with `pnpm build` on Node 26.10.0
**Spec**: [0016](../specs/0016-page-entrance-motion/index.md), checklist [verify.md](../specs/0016-page-entrance-motion/verify.md)

## /check verify page entrance motion · FAIL

**FAIL: 1 of 23 steps failed and 1 could not run. 14 of 15 acceptance criteria are met; AC-12 fails at runtime on deep links.**

**Update 2026-11-07: the iOS Simulator step has now run and passed** (see [iOS Simulator step, run 2026-11-07](#ios-simulator-step-run-2026-11-07)), so the one open item is the deep link.

**Update 2026-11-08: PASS.** The deep link fix (AC-16) lands every `/cv` section exactly where reduced motion does in five browsers, and both new break steps fail the suite as the spec says. Every step in `verify.md` is now ticked. See [Rerun, 2026-11-08](#rerun-2026-11-08-deep-links-ac-16).

Next: `/debug page entrance motion` for the deep link below. After the fix, rerun the deep link step; everything else is already proven.

Failing or owed:

- **AC-12, the step "Open `/cv#experience` directly"**: once the entrance settles, the target heading ends 20px above the top of the window, so `Experience` is cut off and only its rule line shows. The browser scrolls to the anchor while its section still sits on the start frame (20px lower), then the section rises 20px into place and takes the heading out of view. With reduced motion the same link lands exactly right. Measured on `/cv#experience`, `#projects`, and `#education` (each lands 20px low; `#skills` is near the page end and cannot scroll that far, so it lands right):

  | Browser | Motion on: `scrollY`, heading top | Reduced motion: `scrollY`, heading top |
  |---|---|---|
  | macOS Chromium headless shell 153 | 421, −20px | 401, 0px |
  | macOS full Chromium 153, headless and in a visible window | 421, −20px | 401, 0px |
  | Linux Chromium 153 (Docker) | 421, −20px | 401, 0px |
  | Firefox 155 (Docker) | 421, −20px | 401, 0px |
  | WebKit 26.6 (Docker) | 421, −20px | 401, 0px |
  | Android Chrome 133 (emulator, 412px wide) | 594, −20px | not measured |

  Layout itself never shifts (layout shift total 0 on every page), so this is not a layout bug. It is the paint offset deciding where a fragment link lands. The spec's Consequences expected only a view that "can stay empty for up to 350ms", not a lasting offset. No page test covers it. → run `/debug`. A CSS only lead you may weigh there: skip the entrance on the block that holds the target (for example `:has(:target)`), or accept and document the offset in the spec. That choice is yours.
- **The iOS Simulator step, not run on 2026-11-06, passed on 2026-11-07**: on the first day `xcrun simctl` hung and the simulator's screen froze. It answered again the next day, and the step ran then; see the section below.
- **Left for you, optional**: Windows scrollbars (Linux classic scrollbars are proven below; the step allows either), and a side by side look at t3.gg for feel (the numbers match exactly, see step 1).

Ran via `pnpm preview` on 8787 (real `_headers` and CSP), driven by Playwright scripts in macOS Chromium, by the Playwright Docker image (`v1.63.0-noble`) for Firefox, WebKit, and Linux Chromium with classic scrollbars, by Android Chrome over adb's DevTools socket, plus the full gate. Break steps ran in an APFS clone. Nothing in this tree changed except this report and the `verify.md` ticks.

## Gates

| Command | Result |
|---|---|
| `pnpm build` | exit 0; `astro check` 0 errors, 0 warnings (64 files); `cv.pdf: 2 pages, 64 kB`, so `checkCvPdf` passed |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm test` | 589 passed (12 files); `entrance.test.ts` covers 0, 1, 7, 8, 20, −1, 2.5, NaN, and the eight names |
| `pnpm exec playwright test` | 491 passed in 40.4s, 0 failed, 0 flaky; 59 of them in the `page entrance` block |

## Steps in verify.md

| Step | Verdict | Evidence |
|---|---|---|
| `/` at 1280×800, order, under a second, t3.gg, light then dark | passed | Frozen timeline seeks, both schemes: at 0ms all six blocks at opacity 0, then each starts exactly 50ms after the one before (header, four rows, footer); all at 1.00 by 750ms. Real playback settles in 850ms. t3.gg measured today: 8 blocks, 600ms, `cubic-bezier(0.16, 1, 0.3, 1)`, `translateY(20px)`, 50ms apart, last end 950ms, the same numbers (it fills `forwards` from an `opacity-0` class, which the spec chose not to copy) |
| `/about` at 10% | passed | Chromium animation clock at 0.1: blocks first move at 0, 497, 997, … 2997ms, and the last four (two items, the closing line, the footer) all at 3497ms |
| `/cv` order, sections past the sixth with it, footer with them | passed | Computed steps: name row 0, address 1, sections 2 to 7, then the seventh and eighth sections and the footer all at step 7 (delay 0.35s); span 950ms |
| `/projects`, `/contact`, `/nope` | passed | Steps in reading order with the footer last; spans 850, 800, 750ms; `/nope` answers 404 with the page |
| Back and Forward do not replay, a reload does | passed | Android Chrome 133: after Back and after Forward, `pageshow` reports `persisted: true`, the navigation entry is still the first `navigate`, and no animation runs; after a reload, 11 animations run. Every Playwright driven engine (Chromium, Firefox, WebKit) never restores from the page cache at all, so they replay on Back; that is the tool, not the site |
| Touch layout, corner `menu` button from the first frame | passed | Chromium touch context, entrance frozen at its first frame: on all six pages the corner button computes opacity 1 and no animation; tapping it while every row is still at opacity 0 opens the menu. Android Chrome: the button shows at opacity 1 with no animation |
| Click `about` fast; Tab at once | passed | A click 36ms after load, row at opacity 0, opens `/about`; the same with the entrance frozen. Tab at once: the first Tab lands on the skip link (by design), the second on `01 about` at opacity 0.00 with a solid 2px accent ring, 0.95 at 282ms, 1.00 when settled |
| No scrollbar flash (Windows, or Linux classic scrollbars) | passed on Linux | Linux Chromium with `--hide-scrollbars` removed: on `/` and `/contact` no frame of the real entrance overflows (0 of 95 and 0 of 93), the frozen sweep every 25ms finds none, and the 150ms screenshot shows no bar. Windows not run |
| OS Reduce motion | passed | Emulated `prefers-reduced-motion: reduce` (the media feature the OS switch sets) in Chromium, Firefox, and WebKit on all six pages: no animation at DOMContentLoaded or load, every block `animation-name: none`, delay `0s`, opacity 1, `translate: none`. The OS switch itself was not flipped |
| Print during the entrance, `/cv` and `/about` | passed | Chromium `page.pdf` taken 100ms into a frozen entrance (screen opacities `0.69 0.43 0.00 …`) is identical in text, span colours, fonts, and page count to a print of the still page; every span alpha 255, every `/ca` 1. Firefox and WebKit: print media at 100ms puts every block on every page at `none`, opacity 1, `translate: none`. The browser's print dialog itself was not opened |
| `dist/cv.pdf` with PyMuPDF | passed | 2 pages, 103 text spans, alpha 255 each, graphics state `/ca 1` only, faces `IBMPlexMono-Medium`, `IBMPlexMono-Regular`, `IBMPlexSans-Regular`, colours `#1a1815`, `#4a4540`, `#4f5a2c`; rendered pages read solid |
| JavaScript off | passed | Chromium with JavaScript disabled: every block computes `enter` with its delay and `backwards`; the frozen seeks read `0.00 …` at 0ms, `0.83 0.69 0.43 0 0 0` at 150ms, all 1.00 at 950ms |
| No CSP violation on `pnpm preview` | passed | A `securitypolicyviolation` listener and the console on all six pages in macOS Chromium, Linux Chromium, Firefox, WebKit, and Android Chrome: no violation anywhere. The only console lines are the 404 of `/nope` itself and Firefox noting it does not support the layout shift observer |
| `/cv#experience` directly | **failed** | See Failing or owed above |
| Firefox and WebKit: first step, reduced motion, print | passed | Both engines: the same computed values, delays, and spans as Chromium on all six pages; the start frame at 0ms and the same cascade table; reduced motion and print as above. WebKit reads two pages before their stylesheet loads at DOMContentLoaded (harmless, the stylesheet blocks the first paint); reread after load, both pass |
| iOS Simulator, `/` and `/cv` | passed (2026-11-07) | See [iOS Simulator step, run 2026-11-07](#ios-simulator-step-run-2026-11-07) |
| Android emulator (Chrome), `/` and `/cv` | passed | Chrome 133, 412×811, coarse pointer, motion on: exact values, spans 850 and 950ms, layout shift 0, no sideways frame on either page, no vertical overflow on `/`. A screen recording at 44 fps shows the header, then each row, settling by about 600ms, with no flash |
| 320px `/about`, nothing sideways | passed | Frozen sweeps every 25ms from 0 to 975ms on all six pages in macOS Chromium, Linux Chromium, Firefox, and WebKit: no frame scrolls sideways |
| `review-animations` findings fixed or answered | passed | I did not see the earlier review's own output, so I applied the skill's ten standards to the change myself. No code finding: a strong custom ease out, `opacity` and `translate` only, a 50ms stagger, no exit, nothing interactive animated, hover stays colour. The four challenges the build session reported (600ms over the 300ms UI budget, a replay on every page load, nothing at all under reduced motion, the step 7 cap) are each written into the spec as your decisions with their tradeoffs (Consequences and "Your picks"), so they are answered, not open |
| `design.md` Motion and spec 0003 AC-10 | passed | `design.md` records the entrance in its character line and Motion section and no longer says motion is limited to colour; spec 0003 AC-10 carries its Amended by 0016 note, the token table holds the four variables, and the motion library rule reads as AC-15 says; spec 0015 carries both notes |
| Break: remove `footerStep` | passed | In the clone, without it on `/contact`: 1 failed, the `/contact` timing test (footer not last) |
| Break: `animation-fill-mode: both` | passed | 26 failed, among them the built stylesheet test, the `/` timing test, and every JavaScript off test (fill not `backwards`); every "once settled" wait times out, since a filled animation never leaves `getAnimations()` |
| Break: drop `screen and` | passed | 7 failed: the built stylesheet test and the printing mid entrance test on all six pages |

The clone's untouched baseline passed all 59 `page entrance` tests first, so each failure above comes from its break alone.

## Acceptance criteria

| AC | Verdict | Evidence |
|---|---|---|
| AC-1 motion values | met | Built CSS holds `--motion-enter:.6s`, `--motion-enter-rise:20px`, `--motion-enter-step:50ms`, `--motion-enter-ease:cubic-bezier(.16, 1, .3, 1)`; every block computes 0.6s on that curve in five browsers; colour transitions still read `color` and border colour only |
| AC-2 the animation | met | Built CSS: `@keyframes enter{0%{opacity:0;translate:0 var(--motion-enter-rise)}}` with no end frame, the utility only inside `@media screen and (prefers-reduced-motion:no-preference)`, fill `backwards`; the start frame holds during the delay in Chromium, Firefox, and WebKit |
| AC-3 nothing hidden at rest | met | After settling, every block is at opacity 1 and `translate: none` in all five browsers; the suite's cancel test passes; `opacity-0` appears in the built pages only on the command menu's own fade and focus line, never on a block |
| AC-4 the helper | met | `entrance.ts` imports nothing; Vitest passes; no `enter-<n>` class is written by hand anywhere in `src/` outside `entrance.ts` |
| AC-5 the blocks | met | Every page's blocks in the Composition order from step 0; a fifth project added to `cv.json` in the clone, with no code or test edit, gave `/projects` steps 0 to 6 and all 59 entrance tests still passed |
| AC-6 the footer | met | The footer is the last block on all six pages; `src/pages/_dev` passes no `footerStep`; the first break step fails the suite |
| AC-7 what stays still | met | The corner button, skip link, `<main>`, the page wrapper, and the menu carry no animation (my touch probe and the suite); iteration count 1; no animation after scrolling `/cv` to the end; hovering a link starts only colour transitions; Back and Forward do not replay (Android Chrome) |
| AC-8 timing | met | Real playback spans 850ms on `/` and `/projects`, 800ms on `/contact`, 750ms on the 404 page, 950ms on `/about` and `/cv`, in macOS Chromium, Linux Chromium, Firefox, WebKit, and Android Chrome |
| AC-9 reduced motion | met | No animation from the first read in three engines; built CSS holds `animation-delay:0s!important` in the reduced motion rule |
| AC-10 print and PDF | met | Prints taken mid entrance match still prints; `dist/cv.pdf` all at full ink; `render-pdf.ts:81` emulates reduced motion before `page.goto` on line 82; `checkCvPdf` passed in the build |
| AC-11 no script, no CSP change | met | One `<script>` per built page; no `style="` in any built page; no CSP violation in five browsers; `package.json` and the lockfile unchanged; the entrance plays with JavaScript off |
| AC-12 the page works during the entrance | **not met** | Links work from the first frame by click, tap, and Tab; layout shift 0; no scrollbar on pages that fit; nothing sideways at 320px. But a deep link to an entering block lands 20px low for good in every engine (see above) |
| AC-13 accessibility | met | axe WCAG 2.2 AA after settling, light and dark, six pages on the real CSP: 0 violations (18 to 22 passing rules a page); the entrance ends under a second; the diff adds no `role` and no `target` |
| AC-14 page tests | met | `reducedMotion: 'reduce'` in the shared `use` block; the menu fade test (`site.spec.ts:5608`) and the link colour test (`styleguide.spec.ts:798`) emulate motion; `freezeEntrance` and `pageSettled` in `e2e/helpers.ts`; the `page entrance` block reads the `/cv` count from `main section`; all five commands pass |
| AC-15 docs | met | See the docs and `review-animations` steps |

Specced surfaces: all built and live (the six pages' blocks, `src/lib/entrance.ts` with its tests, `footerStep` on `BaseLayout`, the CSS in `global.css`, the PDF guard, the test default and helpers). None missing.

## iOS Simulator step, run 2026-11-07

**Passed.** In Safari on the iPhone 17 simulator (iOS 26.3, Safari 26.3, a 402×714 CSS px view at 3x), the entrance plays smoothly on `/` and `/cv`. No frame overflows vertically on `/`, and no frame on either page overflows sideways.

**Build**: the `dist/` in this checkout as rebuilt at 12:39 on 2026-11-07. It adds the AC-16 `:target` rule to `enter-*` (the deep link fix in progress); the entrance itself is the one checked above.

**How**: `pnpm preview` on 8787 for screen recordings (`xcrun simctl io recordVideo`, 60 fps). A copy of `dist/` in the scratchpad, served on 8791, adds one read only script to the `<head>` of `/` and `/cv`. That script reads every frame and posts the readings back; it changes nothing on the page.

| Check | `/`, 3 loads | `/cv`, 3 loads |
|---|---|---|
| Blocks and timing | 6 animations: `enter`, 600ms, `cubic-bezier(0.16, 1, 0.3, 1)`, `backwards`, delays 0 to 250ms in 50ms steps, footer last. Settles in 850ms on every load | 11 animations, delays 0 to 350ms, the last three sections and the footer together at 350ms. Settles in 950ms on every load |
| Frames while animating | 51 per load, 17ms apart (median), the longest 18ms | 55 to 57 per load, 17ms apart. The first (cold) load had two long frames, 39 and 34ms, at 100 and 150ms; the next two had none over 23ms |
| Vertical scroll | `scrollHeight` 714 equals `clientHeight` 714 on all 231 frames | `scrollHeight` 5172 on every frame: the page is long, and the entrance never changes its height |
| Sideways | `scrollWidth` 402 equals `clientWidth` 402, `scrollX` 0, on every frame | the same |
| Layout | footer `offsetTop` 602 on every frame | footer `offsetTop` 5051 on every frame |

- **Recordings**: frames taken every 100ms show, on `/`, the header first, then each row, then the footer. On `/cv` they show the name row, the contact line, then the sections in order, all settled within a second. The corner `menu` button is at full ink from the first frame. The strip along the right edge, where iOS draws its scroll indicator, holds exactly the page colour from the first painted frame to the end on both pages (0 pixels change), so no indicator ever shows.
- **Early tap**: a probe copy plays the entrance 50 times slower. Tapping `04 contact` 6.8s in, while it still computed opacity 0 and `translate: 0px 20px`, opened `/contact`.
- **Deep links, an extra on this build**: the deep link step itself names Chromium, Firefox, and WebKit, and still has to be rerun there. On the iPhone, all eight `/cv` section links land with motion on exactly where they land with the entrance off. The entrance off copy is one whose entrance media query never matches. Both give the same `scrollY` and a heading top of 0, or 19 on `#skills`, which sits at the end of the page, in both. The target block computes a rise of `0px` and every other block `20px`. A hash change after the page settles starts no animation: 0 animations over 40 frames. Safari sometimes jumps to the top for one or two frames in the first 60ms of a load, then returns to the target. That happened in 5 of 24 loads with motion on and in 4 of 16 with the entrance off, so it is Safari's own behaviour, not the entrance's.
- **Not covered**: a real iPhone, since the simulator draws on the Mac's GPU and its frame timing is not a phone's. Dark appearance was not checked either; the simulator stayed in light.

## For /check review

- No page test can lock the Back and Forward rule: Playwright's Chromium, Firefox, and WebKit never restore from the page cache, so only a real browser (here Android Chrome) shows it.
- The app's built in browser pane, while hidden, landed `/cv#experience` correctly. It defers the fragment scroll until the entrance has ended, so do not take that as proof of a fix; a visible Chromium window lands 20px low.
- The same offset will hit any future anchor that points into an entering block (the History page, scope row 17, if it links to sections).
- The fill mode break is caught by the fill and timing tests, not by the hidden at rest test (which cancels every animation first); `verify.md` already allows either.
- `about.items` is at its schema cap of 7, so the "a row added takes its step" check used a project instead.

## Updates

- `verify.md`: ticked 21 steps, the 18 UI steps marked passed above and all 3 break steps; left the `/cv#experience` step (failed) and the iOS Simulator step (not run) unticked.
- Scope: `Verify it` on row 19 left unticked (the verdict is FAIL, and this run writes only this report and the ticks).
- Spec: `**Status**: In Progress` unchanged.
- 2026-11-07: ticked the iOS Simulator step in `verify.md`. Scope and spec status unchanged, since the deep link step is still open. Its evidence (probe readings, recordings, frame strips, the tap screenshot) sits in `/private/tmp/claude-501/-Users-jorgergo-Documents-GitHub-portfolio/d4d754e2-2d8d-4f98-b005-d902093b1739/scratchpad/ios/ev/`, which is temporary.

Raw evidence (JSON, screenshots, PDFs, the Android recording) sits in this session's scratchpad, `/private/tmp/claude-501/-Users-jorgergo-Documents-GitHub-portfolio/d4d754e2-2d8d-4f98-b005-d902093b1739/scratchpad/ev/`, which is temporary.

## Rerun, 2026-11-08: deep links (AC-16)

**PASS: the open deep link step and the two new break steps all passed, the gate is green, so all 16 acceptance criteria are met.** AC-12 now holds too, since its fragment clause points at AC-16.

**Build checked**: the uncommitted tree on `feat/page-entrance-motion` (base `57db9bd`), with the `&:is(:target, :has(:target))` rule in `enter-*`, built here on Node 26.10.0.

### Gate

| Command | Result |
|---|---|
| `pnpm build` | exit 0; `astro check` 0 errors, 0 warnings (64 files); `cv.pdf: 2 pages, 64 kB` |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm test` | 589 passed (12 files) |
| `pnpm exec playwright test` | 493 passed, 0 failed (the two new deep link tests among them; 61 in the `page entrance` block) |

### The deep link step

Run on `pnpm preview` (8787, byte identical to `dist/` for `/`, `/cv`, `/about`, `/contact`, `/projects`) at 1280×800. For each of the eight `/cv` sections, a fresh load of `about:blank` then `/cv#<id>`, read every frame of the real entrance, then the settled landing, then the same with reduced motion.

| Browser | Settled landing, motion on vs reduced motion | Heading during the fade | First frame | Hash change, then Back three times |
|---|---|---|---|---|
| macOS Chromium headless shell 153 | identical on all 8 ids (`#experience` 401, `#projects` 1396, `#education` 2041; heading top within 0.5px of 0) | same top on every frame (topMin equals topMax) | target block: `enter`, 0.6s, the AC-1 curve, `backwards`, its step's delay, opacity 0, `translate: 0px`; next block `0px 20px` | 0 animations two frames after and 300ms after each move; Back restores each earlier target with 0 animations |
| macOS full Chromium 153 | identical on all 8 | same top on every frame | same | same |
| Linux Chromium 153 (Docker) | identical on all 8 | same top on every frame | same | same |
| Firefox 155 (Docker) | identical on all 8 | same top on every frame | same | same |
| WebKit 26.6 (macOS and Docker) | identical on all 8 | same top on every frame once scrolled | same | same |

- WebKit sets `:target` one frame later than the others: its first frame (about 17ms) is still at scroll 0 with the block at its 20px start, but at opacity 0 inside its delay, and the next frame scrolls and drops the rise. Nothing visible moves.
- `#skills` sits at the end of the page, so it lands at the end of the scroll range in both modes (heading top 217px), as the step allows.
- Screenshots of `/cv#experience` once settled show the `EXPERIENCE` heading at the very top of the window in every engine.
- `/cv#main` (the skip link's target): no block drops its rise, `<main>` has no animation, and it lands at the same `scrollY` (40) with motion on and off.
- No CSP violation in Chromium or Firefox. WebKit logs "Refused to apply a stylesheet" twice, once per `page.screenshot`, which is Playwright's injected style, not the site.

### Break steps (APFS clone, removed afterwards)

| Step | Result |
|---|---|
| Baseline | 61 of 61 `page entrance` tests passed |
| Delete the `&:is(:target, :has(:target))` rule | 3 failed: the built stylesheet test, the landing test (`#summary scrollY`, received 20), and the first frame test (rise received 20) |
| `animation: none` in place of `--motion-enter-rise: 0px` | 3 failed: the built stylesheet test, the landing test on its hash change (`#experience`, `running` received 1, an entrance replayed), and the first frame test (`duration` 0s, name not `enter`) |

### Updates on 2026-11-08

- `verify.md`: ticked the deep link step and both AC-16 break steps. Every step is now ticked.
- Scope row 19: ticked `Verify it`. The next box is `Test it`.
- Spec 0016 `**Status**`: left at `In Progress`, since the GA workflow still owes `/test`, a fresh model `/check review`, and `/document`.

### For /check review

- `AGENTS.md`'s page entrance rule does not yet mention the AC-16 rule (the block holding a fragment target never rises). That is the `/sync` follow-up listed in the spec.
- WebKit wraps the CV prose a little narrower than Chromium and Firefox (lines end near 895px instead of 936px). It is not from this change, and it does not move any landing, but it is worth knowing if a WebKit layout test is ever added.
