# Verify: Design system · spec 0003 · updated 2026-09-24
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Light and dark are driven by the operating system setting; toggle it in System Settings, or emulate `prefers-color-scheme` in the browser's rendering panel. Component checks run on `/styleguide` under `pnpm dev`, because the home and CV pages hold no components until their own specs are built. Print steps use the browser's print preview. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [x] `pnpm dev`, open `/` with the system in light mode, then dark mode → warm cream page with dark text, then warm dark page with cream text, no flash and no toggle anywhere; the browser UI colour follows (the theme-color metas) → AC-1, AC-6
- [x] On `/cv`, press Tab from the address bar → the first stop is the skip link, visible top left with the olive ring; Enter moves focus into `<main>` with no ring around it; keep tabbing → the footer `← home` link with a 2px olive ring offset 3px; on `/` the footer link is absent; click a link with the mouse → no ring → AC-6, AC-8
- [x] On `/styleguide`, Tab through every component → each link and button shows the olive ring in visual order; hover a `TextLink` → text and its 1px underline turn terracotta, the underline sits 0.2em below the baseline; `IconLink`, `Button`, and the footer link have no underline and turn terracotta; an external `IconLink` ends with the arrow icon → AC-7, AC-8
- [x] Emulate `prefers-contrast: more` on `/styleguide` → muted text takes the body colour and `TextLink` underlines are 2px → AC-12
- [x] Emulate `forced-colors: active` on `/styleguide` → links stay underlined, the focus ring shows, icons and borders still draw → AC-12
- [x] Emulate `prefers-reduced-motion: reduce` on `/styleguide` → the hover colour change is instant, nothing animates → AC-10
- [x] Narrow the window to 320px on `/styleguide` and `/cv` → no horizontal scrollbar, the footer keeps `← home` and the location readable, a long email or URL wraps instead of overflowing → AC-5
- [x] On `/styleguide` → a light panel and a dark panel side by side regardless of the system setting; every token as a swatch with its ratio and Lc; print values listed; both type surfaces; the spacing scale; every component and icon rendered once → AC-13
- [x] Print preview `/styleguide` in light mode and again in dark mode → white paper, near black ink, 18mm margins, no page padding beyond them, no skip link, no footer home link, no buttons, links as plain text, chips as plain text → AC-11
- [x] Open `/missing` → the 404 page shows `Not found`, a `TextLink` back home, and the footer → AC-15
- [x] Read `design.md` at the repo root → character, two surfaces rule, token roles with pointers, type scale, spacing and layout, components with rules, motion, print, hardening, do's and don'ts, responsive behaviour, design source → AC-14

## Commands
- [x] `pnpm build` → passes; `find dist -name '*.woff2' | wc -l` → 4 (Plex Mono 400 and 500, Plex Sans 400 and 500, latin); the build makes no network request for fonts (run it once with the network off) → AC-3
- [x] `grep -c 'rel="preload"' dist/index.html` → 1, and it points at the Plex Mono 400 file; `grep -o 'https://[a-z0-9.-]*' dist/index.html | sort -u` lists no font host → AC-3
- [x] `pnpm preview`, open `/` and `/cv` → the browser console shows no CSP violation; `grep -o "style-src[^;]*" dist/index.html` includes a hash for the Font style → AC-3
- [x] `find dist -iname '*styleguide*'` → nothing → AC-13
- [x] `grep -rn 'dark:' src --include='*.astro'` → nothing; `grep -rnE '#[0-9a-fA-F]{6}' src --include='*.astro'` → nothing; `grep -rnE 'text-(stone|neutral|zinc|gray|slate|amber|orange)-' src --include='*.astro'` → nothing; `grep -rnE '\[[^]]+\]' src/components src/layouts` → no arbitrary value classes → AC-1
- [x] `grep -n 'light-dark' src/styles/global.css` → the six colour tokens; `grep -n 'color-scheme' src/styles/global.css src/layouts/BaseLayout.astro` → `:root { color-scheme: light dark; }` and the `<meta name="color-scheme">` → AC-1, AC-6
- [x] `grep -n 'theme-color' dist/index.html` → two metas, `#f2ede3` with the light media query and `#1b1916` with the dark one; `grep -n 'parseColorTokens' src/layouts/BaseLayout.astro` → the metas are computed → AC-1, AC-6, AC-12
- [x] `grep -n 'name="description"' dist/index.html dist/cv.html dist/404.html` → the bio on the first two, `This page does not exist.` on the last → AC-6
- [x] `grep -n '@page' src/styles/global.css` → `margin: 18mm`; `grep -n 'font-size: 11pt' src/styles/global.css` → inside the print block → AC-11
- [x] `ls src/components src/components/icons` → `SkipLink.astro`, `SiteFooter.astro`, `TextLink.astro`, `SectionHeading.astro`, `TagChip.astro`, `IconLink.astro`, `Button.astro`, `Prose.astro`; `GitHub.astro`, `LinkedIn.astro`, `Mail.astro`, `ArrowUpRight.astro`, `Download.astro`; `grep -n 'Tabler\|Lucide' README.md` → the Credits section → AC-9
- [x] `grep -rn 'target=' src/components src/layouts src/pages` → nothing (every link opens in the same tab); `grep -n 'routePattern' src/components/SiteFooter.astro` → the home link check → AC-6, AC-7
- [x] `grep -n 'motion-\|default-transition' src/styles/global.css` → `--motion-quick: 150ms`, `--motion-base: 250ms`, `--motion-slow: 400ms`, `--motion-ease`, `--default-transition-duration: 150ms`, `--default-transition-timing-function`; `grep -n 'prefers-reduced-motion' src/styles/global.css` → the global rule; `grep -rn 'duration-' src/components src/layouts` → nothing → AC-10
- [x] `pnpm test` → the contrast test passes; then set the light muted value to `#8d8576` in `global.css`, run `pnpm test` → fails naming `meta: muted on bg (light)`; restore → AC-2
- [x] `pnpm exec vitest run src/lib/contrast.test.ts` → the reference fixtures pass: `#888888` on `#ffffff` gives 3.545:1 and Lc 63.06; `#ffffff` on `#888888` gives Lc −68.54; `#000000` on `#aaaaaa` gives Lc 58.15; `#aaaaaa` on `#000000` gives Lc −56.24; black on white gives 21:1 → AC-2
- [x] `grep -rnE 'style="|define:vars|is:inline|set:html' src` → nothing → AC-15
- [x] `pnpm lint`, `pnpm format:check` → clean; `pnpm dev` and visit `/`, `/cv` → each renders through the shell and shows `Jorge González Ozorno` in the styled h1 → AC-4, AC-15

## Acceptance-criteria coverage
- AC-1: system mode step, `dark:` and hex greps, `light-dark` grep, computed metas grep · AC-2: `pnpm test`, break step, fixtures · AC-3: build counts, offline build, preload, preview console · AC-4: dev pages step · AC-5: 320px step · AC-6: keyboard step, metas, descriptions, `routePattern` grep · AC-7: style guide hover step, `target=` grep · AC-8: keyboard steps · AC-9: components listing, credits grep · AC-10: reduced motion step, motion greps · AC-11: print preview, `@page` and 11pt greps · AC-12: contrast and forced colours steps, theme-color grep · AC-13: style guide step, dist search · AC-14: `design.md` read · AC-15: 404 step, bans grep, lint, format, dev pages

## Known gaps (not AC failures)
- An automated axe pass over the built pages waits for Playwright (spec 0003 follow up); until then rendered contrast on real pages is checked by the token test plus the manual steps above.
- APCA is a candidate method in the WCAG 3 draft, checked here as a regression floor (Lc 55) on secondary text; the requirement of record is WCAG 2.2 AA.
- Browsers older than 2024 (no `light-dark()`) show black text on white; there is no step for them because they are out of scope.
