# Verify: Contact page · spec 0011 · 2026-09-26
_Steps derived from spec 0011 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [x] Open `/` → the menu reads `01 about`, `02 cv`, `03 projects`, `04 contact` (the old social rows still below it until spec 0008 lands); click `04 contact` → `/contact` loads → AC-8
- [x] On `/contact` at 1280×800 in light, then dark → `contact`, then 24px below it three rows: `email` and your address, `github` and `@jorgergo` with the arrow, `linkedin` and `in/jorgergo` with the arrow; keys in muted grey in one 80px column, values in the body colour, upright (not italic); no intro, no button, no form; the footer with `← home` and `Toluca, MX · 2026` → AC-4, AC-5
- [x] Hover each row → the value turns terracotta, the key stays muted → AC-5
- [x] Resize to 320px wide → the address drops whole under `email`, starting at the key's left edge, right under it with no more space than between two lines of text, so it reads as part of the `email` row, not the `github` row; `github` and `linkedin` stay on one line each; nothing scrolls sideways; widen slowly → the address returns beside its key once the row fits → AC-6
- [x] Press Tab from the address bar → the skip link, the email row, the GitHub row, the LinkedIn row, `← home`, each with the 2px olive ring offset 3px → AC-7
- [x] Click the email row → your mail app opens a message to your address; click GitHub and LinkedIn → each opens in the same tab → AC-4, AC-5
- [x] Turn on VoiceOver (Safari) and read `/contact` → heading level 1 `contact`, then three links in order that read `email jorgergo@icloud.com`, `github @jorgergo`, `linkedin in/jorgergo`, with no italic or number spoken (Safari does not announce them as a list; that is the known cost) → AC-5, AC-7
- [x] Print preview `/contact` in Chrome under a dark system setting → paper colours, the heading and three rows, the footer city line; no skip link and no `← home` → AC-9
- [x] View source → `<title>Contact · Jorge González Ozorno</title>`, the description `How to reach Jorge: email, GitHub, or LinkedIn.`, the canonical `https://jorgergo.dev/contact`, `og:image` `https://jorgergo.dev/og/contact.png`; open that image → the `CONTACT` card with your name, role, `jorgergo.dev/contact`, and `Toluca, MX` → AC-1, AC-2
- [x] Break step (value sourcing): in `src/content/cv.json` delete `basics.profiles`, run `pnpm build` → `dist/contact.html` has one row, the email, with no arrow, and the description `How to reach Jorge: email.`; `pnpm exec playwright test --project site -g "contact"` passes with no edit; restore → AC-2, AC-3, AC-5, AC-10
- [x] Break step (value sourcing): in `src/content/cv.json` swap the order of the two profiles, run `pnpm build` and `pnpm exec playwright test --project site -g "contact"` → the rows read email, linkedin, github, the description `email, LinkedIn, or GitHub`, and the tests pass with no edit; restore → AC-3, AC-10
- [x] Break step: set `basics.email` to `ana@example.com`, run `pnpm build` → the email row reads `ana@example.com` with `href="mailto:ana@example.com"`, and `pnpm exec playwright test --project site -g "contact"` passes with no edit; restore → AC-3, AC-10
- [x] Break step: set `basics.email` to a valid 28 character address (`aaaaaaaaaaaaaaaa@example.com`), run `pnpm build` → it fails on `basics.email`; with 27 (`aaaaaaaaaaaaaaa@example.com`) it builds, and at 320px the address sits under its key inside the viewport; restore → AC-6, AC-12
- [x] Break step: remove the `/contact` line from `check_pages` in `.github/scripts/smoke.sh`, run `pnpm exec playwright test --project site -g "smoke"` → the `/contact` one byte and immutable cases fail; restore → AC-11
- [x] `pnpm dev`, open `/styleguide` → the share card section shows the home, CV, About, Projects, and Contact cards, then the icons → AC-10
- [x] Read `design.md` → the `NavRow` line names `/contact`, `formatContactRows`, the `address`, and email first; the Source section lists contact; eleven components → AC-10

## Commands
- [x] `pnpm build` → passes; `dist/contact.html` and `dist/og/contact.png` exist → AC-1, AC-2
- [x] `grep -c '<script\|role=\|target=\|style="' dist/contact.html` → 0; `grep -o '<address[^>]*>' dist/contact.html` → one `address` with `not-italic`; `grep -c '<nav' dist/contact.html` → 0 → AC-4, AC-7
- [x] `grep -c -i 'ford\|liverpool\|daimler' dist/contact.html` → 0 (the page test's `employersNamed` check is the durable guard) → AC-4
- [x] `grep -n "'contact'" src/lib/site-nav.ts src/lib/site-meta.ts` → the `SITE_NAV` row last, the `SHARE_PAGES` row last → AC-2, AC-8
- [x] `pnpm test` → the `formatContactRows`, `NETWORKS` key width, `formatChannelList`, `DESCRIPTIONS.contact`, `pageMeta('contact')`, and email cap cases pass; `site-nav.test.ts` passes unchanged → AC-2, AC-3, AC-8, AC-12
- [x] `pnpm exec playwright test` → the `/contact` `PAGES` entry, the share tag loop, the `contact page` block, the five path loops, the home menu checks with no edit, and `e2e/styleguide.spec.ts` with eight images pass → AC-4 to AC-11
- [x] With `pnpm preview` running, `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → passes; `grep -n 'contact' .github/scripts/smoke.sh e2e/helpers.ts` → the page check, the card fetch, and `contact.html` in `SMOKE_FILES` → AC-11
- [x] `pnpm lint` and `pnpm format:check` → clean → AC-10

## Acceptance-criteria coverage
- AC-1: view source step, Playwright · AC-2: view source step, the no profiles break step, `pnpm test` · AC-3: the three break steps, `pnpm test` · AC-4: preview step, click step, greps · AC-5: preview, hover, and VoiceOver steps · AC-6: 320px step, Playwright · AC-7: Tab and VoiceOver steps, greps, Playwright · AC-8: menu step, grep, `pnpm test` · AC-9: print step, Playwright · AC-10: style guide step, `design.md` read, break steps, gate · AC-11: smoke break step, smoke run, grep · AC-12: email cap break step, `pnpm test`

## Known gaps (not AC failures)
- Safari's VoiceOver does not announce the rows as a list: Tailwind's reset removes the markers and the list sits outside a `<nav>` (spec 0011's Decision records the choice). The VoiceOver step is manual; axe does not test Safari's list heuristic.
- The mail app step depends on your machine having a default mail handler; the `mailto:` href is what the page tests check.
