# Verify: Page entrance motion · spec 0016 · 2026-10-29
_Steps derived from spec 0016 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers and the CSP) unless a step says otherwise. To watch the motion slowly, open the browser's Animations panel and set it to 10%. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. The iPhone steps use the iOS Simulator against `pnpm preview` on this Mac. The Firefox and WebKit steps run in the Playwright Docker image against `pnpm preview`, since macOS Firefox does not launch here.

## UI / manual
- [x] On `/` at 1280×800, reload → the name and tagline rise and fade in first, then the four rows one after another, then the footer, all settled in under a second; compare with t3.gg side by side; check light, then dark → AC-1, AC-2, AC-5, AC-6, AC-8
- [x] Slow the Animations panel to 10% and reload `/about` → the blocks start 50ms apart in reading order, and the last four start together → AC-5, AC-8
- [x] Reload `/cv` → the name row, then the contact line, then the sections in order; the sections past the sixth arrive with the sixth, and the footer with them → AC-5, AC-6
- [x] Reload `/projects`, `/contact`, and a missing path such as `/nope` → each enters in order, with the footer last → AC-5, AC-6
- [x] Open a page, then press Back and Forward → a page restored from the browser's cache does not replay; a reload does → AC-7
- [x] On the touch layout, reload any page → the corner `menu` button is there from the first frame and tapping it early opens the menu → AC-7, AC-12
- [x] Reload `/`, and click `about` as fast as you can → it opens; reload again and press Tab at once → focus lands on a row, and its ring turns solid as the row settles → AC-12
- [x] On Windows, or Linux with classic scrollbars, reload `/` and `/contact` → no vertical scrollbar flashes during the entrance → AC-12
- [x] Turn on Reduce motion in the operating system, reload each page → everything is there on the first frame with no delay; turn it off again → AC-9
- [x] Press Cmd+P during the entrance on `/cv` and on `/about` → every block in the preview is at full ink → AC-10
- [x] Open `dist/cv.pdf`, or render it with PyMuPDF → all text is solid, on two pages, in the Plex faces → AC-10
- [x] Disable JavaScript, reload `/` → the entrance still plays → AC-11
- [x] On `pnpm preview`, reload each page with the console open → no CSP violation → AC-11
- [x] At 1280×800 with motion on, open `/cv#experience`, `/cv#projects`, and `/cv#education` directly, in Chromium, Firefox, and WebKit → the targeted section fades in place without rising, and once settled its heading sits at the very top of the window (or as high as the end of the scroll range lets it), at the same `scrollY` as with reduced motion; then change the hash to another section, and press Back → nothing replays → AC-12, AC-16
- [x] In Firefox and WebKit (Playwright Docker image), repeat the first step, the reduced motion step, and the print step → the same result → AC-2, AC-9, AC-10
- [x] In the iOS Simulator (iPhone 17, iOS 26), open `/` and `/cv` in Safari → the entrance plays smoothly, with no scrollbar flash and no sideways scroll → AC-2, AC-12
- [x] On the Android emulator (Chrome), open `/` and `/cv` → the same → AC-2, AC-12
- [x] At 320px wide, reload `/about` → nothing scrolls sideways at any moment → AC-12
- [x] Run the `review-animations` skill on the finished change → its findings are fixed or answered → AC-15
- [x] Read the Motion section of `design.md` and spec 0003 AC-10 → both describe the entrance, its four variables, and the narrowed `motion` package rule → AC-15

## Break steps
- [x] Remove `footerStep` from one page, run the page tests → the `page entrance` block fails on that page; restore it → AC-6
- [x] Write `animation-fill-mode: both` in the utility, run the page tests → the hidden at rest or fill test fails; restore it → AC-2, AC-3
- [x] Drop `screen and` from the media query, run the page tests → the printing mid entrance test fails; restore it → AC-10
- [x] Delete the `&:is(:target, :has(:target))` rule from `enter-*`, run the page tests → the built stylesheet test and both deep link tests fail, the landing test 20px off; restore it → AC-16
- [x] Write `animation: none` in place of its `--motion-enter-rise: 0px`, run the page tests → the built stylesheet test and both deep link tests fail, the landing test on its hash change, since an entrance replays; restore it → AC-16
