# Verify: Home page redesign · spec 0008 · updated 2026-09-26
_Steps derived from spec 0008 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`. Task 1 (the bio and the derived menu tests) is verified on its own when it merges; the rest after task 5.

## UI / manual
- [ ] Task 1 merged: open `/` → the old layout with the new bio, and no `Ford` anywhere on the page; view source → the meta description and `og:description` are the new bio → AC-1
- [ ] Break step (task 1): in `src/lib/site-nav.ts` add `{ label: 'about', href: '/about' }` before `cv`, run `pnpm exec playwright test --project site` → only the menu 200 check fails (on `/about`); the Tab stop and row text tests pass because they derive from `SITE_NAV`; restore → AC-6, AC-10
- [ ] `pnpm preview`, open `/` at 1280×800 in light, then dark → the name, the tagline `build things, from scratch` in muted grey 8px below, then `01 about`, `02 cv`, `03 contact`, the block in the middle of the window with every line starting at the same left edge; the footer at the bottom with its rule and `Toluca, MX · 2026`, no `← home`; no social rows, no bio, no top bar, no cursor, no motion → AC-3, AC-4, AC-5, AC-7
- [ ] Measure (rendering panel or a ruler) → header to menu 56px, name to tagline 8px; the block's left and right edges are equally far from the window edges; the space above the name inside `<main>` equals the space below `03 contact` → AC-3, AC-4
- [ ] Resize to 320×640 → no horizontal scrollbar, the name wraps to two lines, the tagline stays on one; resize to 320×400 → the name starts at the top padding and you can scroll down to the last row and the footer → AC-4, AC-7
- [ ] Open `/cv` and an unknown path → both look exactly as before (full width, top aligned) → AC-4
- [ ] Press Tab from the address bar → the skip link, `01 about`, `02 cv`, `03 contact`, each with the 2px olive ring offset 3px, then focus leaves the page; hover a row → the terracotta label spans the block's width, not the column's → AC-6
- [ ] Turn on VoiceOver (Safari) and read `/` → heading level 1 with your name, the tagline, then "Pages, navigation" with a list of 3 items whose links read `about`, `cv`, `contact` (no numbers spoken) → AC-3, AC-5, AC-6
- [ ] Break step: in `src/content/cv.json` set `basics.tagline` to a 28 character string, run `pnpm build` → it fails at `basics.tagline`; delete the field, build again → it fails; restore → AC-2
- [ ] Break step: in `src/lib/site-nav.ts` remove the `contact` row, run `pnpm exec playwright test --project site -g "the Pages nav holds a contact row"` → it fails; restore → AC-5
- [ ] Read `design.md` → the muted role names the home tagline, `gap-2` reads "the home h1 and the tagline", the `text-pretty` example names the tagline, the centred home block rule, spec 0008 in the home pointers, eleven components → AC-9

## Commands
- [ ] After task 1: `pnpm build && grep -c Ford dist/index.html` → 0; `grep -o 'name="description" content="[^"]*' dist/index.html` → the new bio → AC-1
- [ ] `grep -n 'tagline' src/lib/cv-schema.ts src/content/cv.json` → `tagline: 27` in `CV_LIMITS` (with the 272px basis in its comment), `tagline: text(CV_LIMITS.tagline)` in `basics`, and the value in `cv.json` → AC-2
- [ ] `grep -o 'aria-label="[^"]*"' dist/index.html` → `Pages` only; `grep -c 'mailto:\|github.com\|linkedin.com' dist/index.html` → 0; `grep -c '<script' dist/index.html` → 0; `grep -c 'role=\|target=\|style="' dist/index.html` → 0 → AC-3, AC-7
- [ ] `grep -o '<main[^>]*>' dist/index.html dist/cv.html` → `flex-1 justify-center self-center` on the home `<main>` only → AC-4
- [ ] `grep -n 'projects\|portfolio' src/lib/site-nav.ts src/lib/site-nav.test.ts` → `projects` in the planned order comment and the test's `planned` array, no `portfolio`; the list holds `about`, `cv`, `contact` → AC-5
- [ ] `grep -n 'formatProfileHandle' src/pages/index.astro` → nothing; `pnpm test` → the `formatRowNumber`, `formatProfileHandle`, site nav, and new tagline cases pass → AC-2, AC-8
- [ ] `pnpm exec playwright test` → the `/` case and the home page block pass (Tab stops, composition, centring, `at 320×400 main is its content height and the page scrolls`, the tagline at 320px, `the Pages nav holds a contact row`, the menu 200 check); `e2e/styleguide.spec.ts` passes untouched → AC-3 to AC-8, AC-10
- [ ] `pnpm build`, `pnpm lint`, `pnpm format:check` → clean → AC-10

## Acceptance-criteria coverage
- AC-1: task 1 page step, the `Ford` and description greps · AC-2: tagline break step, schema grep, `pnpm test` · AC-3: preview step, gap measurements, VoiceOver, landmark and link greps · AC-4: preview step, measurements, 320px steps, `/cv` step, `<main>` grep · AC-5: preview step, VoiceOver, `contact` break step, site nav grep · AC-6: task 1 break step, Tab step, VoiceOver, Playwright · AC-7: preview step, 320px step, script and attribute greps · AC-8: `formatProfileHandle` grep, `pnpm test`, style guide spec · AC-9: `design.md` read · AC-10: task 1 break step, Playwright, build, lint, format

## Known gaps (not AC failures)
- The `Ford` check is a one time grep, not a page test, so a content edit never forces a test edit; the durable guard is AC-3's exact `<main>` text.
- The VoiceOver list check is manual; axe does not test Safari's list heuristic.
- Spec 0004's 320px email wrap test leaves `/` with the social rows; the Contact page spec carries it.
