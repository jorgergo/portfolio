# Verify: Projects page · spec 0010 · updated 2026-09-26
_Steps derived from spec 0010 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [ ] Open `/` → the menu reads `01 about`, `02 cv`, `03 projects` (plus `04 contact` if it has shipped); click `03 projects` → `/projects` loads → AC-7
- [ ] On `/projects` at 1280×800 in light, then dark → `projects`, then four rows between hairlines (one above each row and one under the last): TRACSUR Tickets, jorgergo.dev, FinTech AI, Medpal; each name in medium with `status · 2026 – now` in grey at the right on the same baseline; the description in the body colour; the chips; then `code ↗` or a grey `private`; only `jorgergo.dev`'s name is underlined; no intro line, no image → AC-2, AC-5, AC-6
- [ ] Resize to 320px wide → each meta drops under its name, left aligned and on one line; descriptions and chips wrap; nothing scrolls sideways → AC-6, AC-8
- [ ] Press Tab from the address bar → the skip link, `jorgergo.dev`, its `code`, FinTech AI's `code`, `← home`, each with the 2px olive ring offset 3px; hover a `code` link → text and arrow turn terracotta → AC-8
- [ ] Turn on VoiceOver (Safari), open the links rotor on `/projects` → `jorgergo.dev`, `code for jorgergo.dev`, `code for FinTech AI`, `home`; read the page → heading level 1 `projects`, then one level 2 heading per project, the chips as separate items (Safari does not announce the lists; that is the known cost) → AC-6, AC-8
- [ ] Print preview `/projects` in Chrome under a dark system setting → paper colours, the rows with their hairlines, chips as plain words, `jorgergo.dev` in plain ink with no underline, the footer city line present, no skip link and no `← home` → AC-8
- [ ] View source → `<title>Projects · Jorge González Ozorno</title>`, the description `What Jorge has built, with the stack behind each project and where it stands.`, the canonical `https://jorgergo.dev/projects`, the share tags with `og:image` `https://jorgergo.dev/og/projects.png`; open that image → the `PROJECTS` card with your name, role, `jorgergo.dev/projects`, and `Toluca, MX` → AC-4
- [ ] Open `/cv` → a `PROJECTS` section right after Experience with TRACSUR Tickets (not linked) and jorgergo.dev (linked), each dated `Sep 2026 – Present`, its description, and a grey `·` separated technologies line; no status, no chips; print preview keeps each entry whole → AC-9
- [ ] `grep -c -i 'ford\|liverpool\|daimler' dist/projects.html` after `pnpm build` → `0` → key invariant (no employer)
- [ ] Break step: set FinTech AI's `status` to `live` with no `url`, run `pnpm build` → it fails with `a live project needs a url, the site a visitor can open; see spec 0010`; restore → AC-1
- [ ] Break step: add `"cv": true` to FinTech AI, run `pnpm build` → it fails on that project's `cv` with `at most 2 projects may set cv; see spec 0010`; restore → AC-1
- [ ] Break step: copy one project five times (nine in all, names changed), run `pnpm build` → it fails on the array size; restore → AC-1
- [ ] Break step: make one description 121 characters, run `pnpm build` → it fails on that description's length; restore → AC-1
- [ ] Break step: set Medpal's `source` to `http://github.com/medipalmx/medpal`, run `pnpm build` → it fails on `source`; restore → AC-1
- [ ] Break step: flip TRACSUR to `live` with `url` `https://example.com`, reword two descriptions within the caps, and add a fifth project, run `pnpm test` and `pnpm exec playwright test --project site` → both pass with no test edit; restore → AC-11
- [ ] Break step: give TRACSUR `status` `done` and `endDate` `2026-11`, run `pnpm build` → `/projects` still lists it first and the CV still lists it first; restore → AC-3, AC-5, AC-9
- [ ] Break step: remove `"cv": true` from both projects, run `pnpm build` and `pnpm exec playwright test --project site` → `/cv` has no Projects section and the tests pass with no edit; restore → AC-9, AC-11

## Commands
- [ ] `pnpm build` → passes (`astro check` then `astro build`), `dist/projects.html` and `dist/og/projects.png` exist → AC-1, AC-4
- [ ] `pnpm lint` → zero warnings → AC-11
- [ ] `pnpm format:check` → clean → AC-11
- [ ] `pnpm test` → the new `cv-schema.test.ts`, `cv-format.test.ts`, and `site-meta.test.ts` cases pass, `site-nav.test.ts` passes with `projects` in the planned order → AC-1, AC-3, AC-4, AC-7
- [ ] `pnpm exec playwright test` → the `/projects` `PAGES` entry, the share tag loop for `/projects`, the `projects page` block, the CV Projects checks, and the home menu checks pass → AC-4 to AC-9
- [ ] `grep -n "'projects'" src/lib/site-nav.ts src/lib/site-meta.ts` → the `SITE_NAV` row after `cv`, the `SHARE_PAGES` row after `cv` → AC-4, AC-7
- [ ] `grep -c 'font-sans' src/pages/projects.astro` → `0` → AC-8
- [ ] With `pnpm preview` running on the built site, `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → passes; `grep -n 'projects' .github/scripts/smoke.sh e2e/helpers.ts` → the `/projects` page check, the `/og/projects.png` check, and `projects.html` in `SMOKE_FILES` → AC-10
- [ ] `pnpm dev`, open `/styleguide` → the share card section shows the home, CV, About, and Projects cards, then the icons → AC-11

## Acceptance-criteria coverage
AC-1 · AC-2 · AC-3 · AC-4 · AC-5 · AC-6 · AC-7 · AC-8 · AC-9 · AC-10 · AC-11: each has at least one step above.

## Known gaps (not AC failures)
- Safari's VoiceOver does not announce the rows or the chips as lists; the level 2 headings carry the structure.
- External `code` links are not fetched by any test, so a repository that goes private later shows a GitHub 404 until `source` is set to `private`.
