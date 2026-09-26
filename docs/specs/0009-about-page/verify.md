# Verify: About page · spec 0009 · updated 2026-09-26
_Steps derived from spec 0009 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [x] Open `/` → the menu reads `01 about`, `02 cv`; click `01 about` → `/about` loads → AC-8
- [x] On `/about` at 1280×800 in light, then dark → `about`, the intro line, seven lines each opened by a grey `›` with the text 20px in and wrapped rows under the text, then the closing sentence with the underlined address; everything but the markers in the body colour; the footer with `← home` and `Toluca, MX · 2026`; no photo, no heading other than `about`, no rows under the closing → AC-4, AC-5, AC-6, AC-7
- [ ] Zoom into a marker on Mac Safari and Chrome → the `›` has the same weight and shape as the Plex Mono text beside it, not a system face → AC-6
- [x] Resize to 320px wide → every line wraps under its own text, the address stays readable, nothing scrolls sideways → AC-6, AC-9
- [x] Press Tab from the address bar → the skip link, the email link, `← home`, each with the 2px olive ring offset 3px; hover the email → terracotta text and underline → AC-9
- [ ] Turn on VoiceOver (Safari) and read `/about` → heading level 1 `about`, the intro, the seven lines with no marker spoken (Safari does not announce them as a list; that is the known cost), then the closing with its link `jorgergo@icloud.com` → AC-6, AC-9
- [x] Print preview `/about` in Chrome under a dark system setting → paper colours, the heading, intro, markers, lines, and closing on one page; the address in plain ink with no underline; the footer city line present; no skip link and no `← home` → AC-10
- [x] View source → `<title>About · Jorge González Ozorno</title>`, the description `What Jorge cares about, at work and away from it.`, the canonical `https://jorgergo.dev/about`, the share tags with `og:image` `https://jorgergo.dev/og/about.png`; open that image → the `ABOUT` card with your name, role, `jorgergo.dev/about`, and `Toluca, MX` → AC-1, AC-2
- [x] `grep -c -i 'ford\|liverpool\|daimler' dist/about.html` after `pnpm build` → `0` → key invariant (no employer)
- [x] Break step: add an eighth line to `about.items` in `src/content/cv.json`, run `pnpm build` → it fails on `about.items` with the array size message; restore → AC-3
- [x] Break step: change `about.closing` to `If you would like to work with me, send me an email.`, run `pnpm build` → it fails with `closing must hold {email} exactly once, where basics.email goes; see spec 0009`; restore → AC-3
- [x] Break step: make one line 101 characters, run `pnpm build` → it fails on that item's length; restore → AC-3
- [x] Break step: reword two lines and the intro within the caps, run `pnpm test` and `pnpm exec playwright test --project site` → both pass with no test edit; restore → AC-11

## Commands
- [x] `pnpm build` → passes (`astro check` then `astro build`), `dist/about.html` and `dist/og/about.png` exist → AC-1, AC-2, AC-3
- [x] `pnpm lint` → zero warnings → AC-11
- [x] `pnpm format:check` → clean → AC-11
- [x] `pnpm test` → the new `cv-schema.test.ts` and `site-meta.test.ts` cases pass, `site-nav.test.ts` passes with `about` first → AC-2, AC-3, AC-8, AC-11
- [x] `pnpm exec playwright test` → the `/about` `PAGES` entry, the share tag loop for `/about`, the `about page` block, and the home menu checks pass → AC-1, AC-5 to AC-10
- [x] `grep -n "'about'" src/lib/site-nav.ts src/lib/site-meta.ts` → the `SITE_NAV` row first, the `SHARE_PAGES` row between `home` and `cv` → AC-2, AC-8
- [x] `grep -c 'font-sans' src/pages/about.astro` → `0` → AC-9
- [x] With `pnpm preview` running on the built site, `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → passes; `grep -n 'about' .github/scripts/smoke.sh e2e/helpers.ts` → the `/about` page check, the `/og/about.png` check, and `about.html` in `SMOKE_FILES` → AC-12
- [x] `pnpm dev`, open `/styleguide` → the share card section shows the home, CV, and About cards, then the icons → AC-11

## Value sourcing (added by /develop)
Each step changes one source in `src/content/cv.json`, runs `pnpm build`, checks `dist/`, then restores the file (copy your own saved `cv.json` back if it holds uncommitted edits).
- [x] Set `basics.name` to `Ana Ruiz` → `dist/about.html` has `<title>About · Ana Ruiz</title>`, the description `What Ana cares about, at work and away from it.`, and `og:image:alt` `About, Ana Ruiz, Full Stack Developer`; `dist/og/about.png` draws `Ana Ruiz` → AC-1, AC-2
- [x] Set `basics.email` to `ana@example.com` → the closing's link reads `ana@example.com` with `href="mailto:ana@example.com"`; `pnpm exec playwright test --project site -g "about page"` passes with no test edit → AC-7
- [x] Set `about.closing` to `Email me at {email} any time.` → the sentence renders as `Email me at `, the link, then ` any time.` with one space on each side of the address → AC-7
- [x] Set `about.closing` to `Write to me ({email}).` → the sentence renders `Write to me (`, the link, then `).`, with no space inside the parentheses (`TextLink` adds no whitespace of its own) → AC-7
- [x] Set `basics.location.city` to `Mexico City` → `dist/og/about.png` ends its footer with `Mexico City, MX` on one row → AC-2
- [x] `pnpm exec playwright test --project site -g "smoke check"` → the `/about` rows pass: one byte off `dist/about.html`, an immutable cache on `/about`, and `/og/about.png` served as `image/jpeg` each fail the smoke run → AC-12

## Acceptance-criteria coverage
AC-1 · AC-2 · AC-3 · AC-4 · AC-5 · AC-6 · AC-7 · AC-8 · AC-9 · AC-10 · AC-11 · AC-12: each has at least one step above.

## Known gaps (not AC failures)
- Safari's VoiceOver does not announce the lines as a list (the marker is a hidden span, not a CSS marker); the lines still read in order.
- The CDP font check runs in Chromium only; the Safari look is checked by eye above.
