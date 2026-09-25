# Verify: Home page · spec 0004 · updated 2026-09-24
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Light and dark follow the operating system setting; toggle it in System Settings, or emulate `prefers-color-scheme` in the browser's rendering panel. Page steps run on `pnpm preview` (the built site with real headers) unless a step says `pnpm dev`; the component steps run on `/styleguide` under `pnpm dev`. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [ ] `pnpm preview`, open `/` in light mode, then dark mode → the name as the page title and the h1, the bio right under it (8px, two lines at 640px), then `01 cv`, then `github @jorgergo ↗`, `linkedin in/jorgergo ↗`, `email jorgergo@icloud.com`, the footer `Toluca, MX · 2026` with no `← home`; nothing else on the page, no avatar, no cursor, no motion → AC-1, AC-2, AC-3, AC-5, AC-6
- [ ] Hover each row → the label (and the arrow) turns terracotta while the number or key stays muted; the whole row width is the link (the cursor is a pointer anywhere on the row) → AC-4
- [ ] Press Tab from the address bar → the skip link, then `01 cv`, `github`, `linkedin`, `email`, each with the 2px olive ring offset 3px, then focus leaves the page (no footer link on `/`); click a row with the mouse → no ring → AC-7
- [ ] Turn on VoiceOver (Safari) and read `/` → "Pages, navigation" with a list of 1 item whose link reads `cv` (no number spoken), then "Elsewhere, navigation" with a list of 3 items whose links read `github @jorgergo`, `linkedin in/jorgergo`, `email jorgergo@icloud.com` → AC-2, AC-3
- [ ] Narrow the window to 320px → no horizontal scrollbar; the email address moves whole to the line under `email` (it does not break mid word); widen to 330px → the address is back beside its key → AC-4, AC-6
- [ ] Measure the vertical gaps (rendering panel or a ruler) → header to Pages nav 56px, Pages nav to Elsewhere nav 56px, rows 4px apart, each row at least 40px tall → AC-4, AC-6
- [ ] Emulate `prefers-reduced-motion: reduce` → the hover colour change is instant → AC-5
- [ ] `pnpm dev`, open `/styleguide` → both panels show a `NavRow` list with `01 cv` (an `<ol>`) and one with `github @jorgergo ↗` (a `<ul>`), the spacing list shows `gap-1` and `gap-4`; hover and Tab through the rows → the same states as on `/` → AC-9
- [ ] Break step: in `src/content/cv.json` delete the LinkedIn profile, run `pnpm build`, open `dist/index.html` → only `github` and `email` rows; delete `profiles` entirely, build again → only the `email` row; restore the file → AC-3
- [ ] Break step: in `src/lib/cv-schema.ts` add `'Mastodon'` to `NETWORKS`, run `pnpm build` → `astro check` fails at the handle rules object (`satisfies Record<Network, …>`); restore → AC-8
- [ ] Read `design.md` → nine components, `NavRow` in the component list and on the interactive rows line, the spacing meanings `gap-2` (a heading and its subtitle), `gap-1` (between rows in a list), `gap-4` (a row's prefix to its label), the prefix widths, and `text-pretty` → AC-9

## Commands
- [ ] `pnpm build` → passes; `grep -c '<script' dist/index.html` → 0; `grep -o '<title>[^<]*' dist/index.html` → the name; `grep -o 'name="description" content="[^"]*' dist/index.html` → the bio → AC-1, AC-5
- [ ] `grep -o 'aria-label="[^"]*"' dist/index.html` → `Pages` and `Elsewhere`; `grep -c 'role=' dist/index.html` → 0; `grep -o '<ol[^>]*>\|<ul[^>]*>' dist/index.html` → one of each, no `role` attribute → AC-2, AC-3
- [ ] `grep -o 'href="[^"]*"' dist/index.html` → `/cv`, `https://github.com/jorgergo`, `https://www.linkedin.com/in/jorgergo/`, `mailto:jorgergo@icloud.com`, plus the shell's stylesheet, favicon, and font preload; `grep -c 'target=' dist/index.html` → 0 → AC-2, AC-3, AC-4
- [ ] `grep -o 'aria-hidden="true"[^<]*<\?[^>]*>01' dist/index.html` → the number span is hidden; `grep -o '>github<' dist/index.html` → the key is plain text with no `aria-hidden` on its span → AC-3, AC-4
- [ ] `pnpm preview` then `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8788/cv` → 200 for every href in the Pages nav (one line per href) → AC-10
- [ ] `grep -n 'SITE_NAV\|formatRowNumber' src/lib/site-nav.ts` → the list with the `cv` entry and the planned order comment, and the helper; `grep -n 'satisfies Record<Network' src/lib/cv-format.ts` → the handle rules; `grep -n 'export type Network' src/lib/cv-schema.ts` → the type → AC-2, AC-8
- [ ] `pnpm test` → `site-nav.test.ts` and the new `cv-format.test.ts` cases pass (`01`, `10`, `@jorgergo`, `in/jorgergo`) → AC-8
- [ ] `pnpm exec playwright test` → the `/` case in `e2e/site.spec.ts` passes with the name as title and the five Tab stops, the same origin request check, the 320px check, and the menu href 200 check; `e2e/styleguide.spec.ts` passes with the `NavRow` anatomy checks and `exact: true` link names → AC-5, AC-6, AC-7, AC-9, AC-10
- [ ] `pnpm lint`, `pnpm format:check` → clean (no redundant role warning, no arbitrary value, no `dark:`, no palette class) → AC-10
- [ ] `grep -rnE 'style="|define:vars|is:inline|set:html|target=' src/components/NavRow.astro src/pages/index.astro` → nothing → AC-4, AC-5

## Acceptance-criteria coverage
- AC-1: preview step, title and description greps · AC-2: preview and VoiceOver steps, landmark and list greps, `site-nav.ts` grep · AC-3: preview and VoiceOver steps, profile break step, href and key greps · AC-4: hover step, 320px step, gap measurements, hidden number grep, bans grep · AC-5: preview step, reduced motion step, script grep, Playwright · AC-6: preview step, 320px step, gap measurements, Playwright · AC-7: Tab step, Playwright · AC-8: `NETWORKS` break step, `satisfies` grep, `pnpm test` · AC-9: style guide step, `design.md` read, Playwright · AC-10: curl, Playwright, lint, format

## Known gaps (not AC failures)
- The VoiceOver list check is manual; axe does not test Safari's list heuristic, and the label in name rule is outside the WCAG tag set the Playwright axe pass runs.
- A social value wider than the whole column (over 28 characters at 320px) would overflow sideways; no current content is near that and the schema keeps the email a plain address.
- The 200 check covers the Pages nav only; external profile URLs are not fetched by the tests (they are yours to keep current in `cv.json`).
