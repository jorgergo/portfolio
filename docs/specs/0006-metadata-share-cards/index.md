# 0006. Page metadata and share cards generated from the content

**Date**: 2026-09-25
**Status**: In Progress

## Summary

Every page gets a proper title and description, and the home and CV pages get a canonical link (the one official address of a page) plus Open Graph tags (the tags LinkedIn, X, WhatsApp, and chat apps read to draw a link preview). Each of those two pages gets its own 1200×630 share card, drawn at build time by Satori (a library that turns a layout into an image) from `cv.json`, the colour tokens, and the Plex Mono files you already ship, then saved as a PNG by sharp. The favicon becomes a `J` in Plex Mono that switches with light and dark, and a 180px Apple icon covers iOS home screens. Nothing new runs in the browser, and every word and colour still comes from one place, so editing `cv.json` updates the titles, descriptions, and cards on the next build. Content that would break a card fails the build instead: the name, role, and city may use only letters the card font draws, each part of the name fits its line, and the footer fits its row.

## Requirements

**User stories**:
- As a recruiter who gets your link on LinkedIn, X, or WhatsApp, I want a clean preview with your name, your role, and what the link opens (home or CV), so that I know it is you and what I will see before I click.
- As someone searching your name, I want a result titled with your name and role and a description that says what the page holds, so that I pick the right link.
- As a visitor with many tabs open, I want a favicon I can spot, in light and in dark, so that I find your tab again.
- As the site owner, I want every title, description, card, and icon to come from `cv.json`, the tokens, and one `site` value, so that one edit updates everything and nothing drifts.
- As the builder of a later page (about, contact, portfolio), I want one table row and one description rule to give the page its title, card, and tags, so that I never write head tags by hand.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `astro.config.mjs` sets `site: 'https://jorgergo.dev'` (no trailing slash). Every absolute URL in this spec and the card footer derive from it, so Go live confirms or changes this one value and nothing else.
- **AC-2**: `CV_LIMITS` in `src/lib/cv-schema.ts` gains `name: 30` and `label: 27`, and `basics.name` and `basics.label` use them through `text()`, so a longer value fails `pnpm build` through the schema. Vitest schema cases cover each cap: the value at the cap passes and one character over fails.
- **AC-3**: `formatPageTitle(basics, page?)` in `src/lib/site-meta.ts` returns `` `${name} · ${label}` `` when no page label is given and `` `${page} · ${name}` `` when one is. `/` reads `Jorge González Ozorno · Full Stack Developer`, `/cv` reads `CV · Jorge González Ozorno`, and the 404 page reads `Not found · Jorge González Ozorno`. Every `<title>` and `og:title` comes from it; the dev only style guide keeps `Style guide`.
- **AC-4**: The description of `/` is `basics.bio`. The description of `/cv` is `` `The CV of ${name}, ${label}: ${sections}.` ``, where `sections` is an English list with a serial comma of `experience`, `education`, then `skills` when `skills` has an entry, then `technologies` when `technologies` has an entry. Today it reads `The CV of Jorge González Ozorno, Full Stack Developer: experience, education, skills, and technologies.` The 404 description stays `This page does not exist.` The two rules live in `DESCRIPTIONS`, a record keyed by `SharePageKey` with `satisfies`, so a row added to `SHARE_PAGES` without a rule fails `astro check`. No two rows produce the same title or the same description.
- **AC-5**: `BaseLayout` gains one optional prop, `share?: ShareMeta`. When it is given, the head carries, in this order right after the description meta: `<link rel="canonical" href>`, then `og:type` `website`, `og:site_name` (the name), `og:title` (equal to `<title>`), `og:description` (equal to the description meta), `og:url` (equal to the canonical), `og:image`, `og:image:type` `image/png`, `og:image:width` `1200`, `og:image:height` `630`, `og:image:alt`, and `twitter:card` `summary_large_image`. `/` gives `https://jorgergo.dev/` and `https://jorgergo.dev/og/home.png`; `/cv` gives `https://jorgergo.dev/cv` and `https://jorgergo.dev/og/cv.png`. The canonical comes from the row's `path`, never from `Astro.url` (which reads `/cv.html` during the build). The alt text is the card's words in reading order: `Jorge González Ozorno, Full Stack Developer` and `CV, Jorge González Ozorno, Full Stack Developer`. The 404 page and the style guide carry none of these tags. No `og:locale` (the protocol default `en_US` matches `lang="en"`) and no `twitter:site` (no X profile exists in `NETWORKS`).
- **AC-6**: `src/pages/og/[page].png.ts` builds one PNG per `SHARE_PAGES` row through `getStaticPaths`, so `pnpm build` writes `dist/og/home.png` and `dist/og/cv.png`, each 1200×630 and under 300 KB (the bench measured 38 KB and 39 KB). It renders with Satori using the Plex Mono 400 and 500 `.woff` files from `@fontsource/ibm-plex-mono` and rasterizes with sharp. The same URLs answer under `pnpm dev` with `Content-Type: image/png`.
- **AC-7**: The card layout is the balanced size from the bench (see *Card design*). On the light `bg` token with 80px padding: a top group of the page label (CV card only: uppercase, 28px, tracking `0.1em`, `accent`, 32px above the name), the name (72px, weight 500, `fg`, line height 1.2), and the role (`basics.label`, 40px, `muted`, line height 1.3, 12px below the name); a bottom group pinned to the bottom edge of a 2px `line` rule, 24px of space, then one row (28px, `muted`, line height 1.3) with the host and path on the left (`jorgergo.dev`, `jorgergo.dev/cv`) and `City, CC` on the right (`Toluca, MX`). All text is Plex Mono, and every colour comes from the light tokens that `parseColorTokens` reads from `global.css`, never a literal. Your name sits on one line today; a name at the 30 character cap wraps to at most three lines (a long middle part between two short ones takes three, measured in `render-image.test.ts`) and the role still clears the rule.
- **AC-8**: `src/pages/favicon.svg.ts` generates `/favicon.svg`, and `public/favicon.svg` is deleted. It is a 32 unit tile with radius 6 in the light `bg`, holding the first letter of `basics.name` (`J`) in Plex Mono 500 at 26px in the light `fg`, drawn as vector paths (no font file, no text element). A `<style>` element inserted right after the opening `<svg>` tag sets the two fills to the dark `bg` and `fg` inside `@media (prefers-color-scheme: dark)`. It answers with `Content-Type: image/svg+xml`.
- **AC-9**: `src/pages/apple-touch-icon.png.ts` generates `/apple-touch-icon.png`: 180×180, opaque, square corners (iOS rounds them), the same `J` at 136px in the light `fg` on the light `bg`. Every page links it with `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` right after the favicon link.
- **AC-10**: Every rule above with a branch or a format lives in a pure function in `src/lib/site-meta.ts` (`SHARE_PAGES`, `sharePage`, `formatPageTitle`, `formatSectionList`, `DESCRIPTIONS`, `pageMeta`, `cardContent`, `footerLength`) or `src/lib/share-card.ts` (`cardPalette`, `iconPalette`, `monogram`, `cardTree`, `iconTree`, `withDarkFills`, `parseUnicodeRange`, `missingGlyphs`), covered by Vitest files beside them tagged with these AC ids. Their signatures are in *API surface*. Only `src/lib/render-image.ts` (font reads, Satori, sharp) and the three endpoint files touch the file system or a native library.
- **AC-11**: No page gains a `<script>` or a request: `/` still requests only what spec 0004 AC-5 lists and `/cv` only what spec 0005 AC-12 lists (pages never load the cards or the Apple icon). `pnpm preview` shows no CSP violation, and `public/_headers` is unchanged.
- **AC-12**: The dev only `/styleguide` gains one `Share cards and icons` section below the scheme panels, headed by a `SectionHeading`, that shows: `<img src="/og/home.png" width="1200" height="630" class="h-auto w-full" alt="Home share card">` and the same for `/og/cv.png` with `alt="CV share card"` (the attributes keep the aspect ratio, the two standard utilities scale it to the column); then `/favicon.svg` with `width="16" height="16" alt="Favicon at 16px"` and `width="32" height="32" alt="Favicon at 32px"`; then `/apple-touch-icon.png` with `width="60" height="60" alt="Apple touch icon at 60px"`. `design.md` gains a `Share cards and icons` section with the rules in *Card design*.
- **AC-13**: `e2e/site.spec.ts` derives every expected title, description, canonical, and Open Graph value from `cv.json` through `site-meta.ts` (as the `/cv` cases already do), with the `PAGES` table titles updated. For each `SHARE_PAGES` row, the page answers 200 and its `og:image`, rewritten to the local origin, answers 200 `image/png` with a body under 300 KB whose PNG size (width and height from the IHDR chunk, the first data block of the file) is 1200×630. Two new helpers in `e2e/helpers.ts` do this: `toLocal(url, base)` keeps the path and query of an absolute URL and swaps in the test server's origin, and `pngSize(bytes)` reads the big endian width and height at bytes 16 to 23 (no sharp import in `e2e/`). `/favicon.svg` answers `image/svg+xml` and contains `prefers-color-scheme: dark`; `/apple-touch-icon.png` has a PNG size of 180×180; the 404 page has no canonical and no `og:` tag. `e2e/styleguide.spec.ts` checks that the new section's images load. `pnpm build`, `pnpm lint`, `pnpm format:check`, and `pnpm test` pass.
- **AC-14** (checked after Go live): pasting `https://jorgergo.dev/cv` into LinkedIn's Post Inspector, a new X post, and a WhatsApp chat shows the CV card and the CV title; the home URL shows the home card.

Added after the review of 2026-09-25, which rendered three kinds of schema valid content into broken cards:

- **AC-15**: `basics.name`, `basics.label`, and `basics.location.city` accept only characters the card font draws. `FONT_SUBSET = 'latin' satisfies keyof typeof unicode` in `src/lib/share-card.ts` (with `unicode` the default import of `@fontsource/ibm-plex-mono/unicode.json`; a misspelled subset fails `astro check`) names the subset once: `render-image.ts` builds both font paths from it, and `CARD_GLYPHS` is `parseUnicodeRange(unicode[FONT_SUBSET])`, the ranges the font package itself lists for that file (today `U+0000-00FF`, `U+2000-206F`, and a few single code points such as `U+0131` and `U+20AC`). `missingGlyphs(text)` returns each character outside `CARD_GLYPHS` once, in order. In `cv-schema.ts`, a `cardText(max)` helper is `text(max)` followed by a `superRefine` that adds one issue when `missingGlyphs` returns any: `characters outside the card font (<subset>): <characters joined by ", ">; see spec 0006` (for example `… (latin): Ł, Ż; see spec 0006`). `name`, `label`, and `city` use `cardText`; no new check sets `abort`, so a value that breaks two rules reports both in one build. `monogram(name)` uppercases the first character only when the result is exactly one character inside `CARD_GLYPHS`, and otherwise keeps it as written (`ÿ` would uppercase to `Ÿ`, outside the subset, and `ß` to `SS`, two letters). Vitest cases: `parseUnicodeRange('U+0000-00FF,U+0131')` gives `[[0x0, 0xff], [0x131, 0x131]]`; `Łukasz Żółkiewski` fails naming `Ł` and `Ż`; `Seán O’Brien` and `Zoë` pass (the curly apostrophe is `U+2019`, inside the subset); a Cyrillic city fails; a 31 character name holding `Ł` reports two issues; `monogram` keeps `ÿ` and `ß`.
- **AC-16**: `CV_LIMITS.namePart = 24`. Every part of `basics.name` holds at most 24 characters: the name line is 1040px and Plex Mono advances 43.2px per glyph at 72px. The parts are the trimmed name split at whitespace and right after each hyphen (where Satori also breaks a line), exactly `name.split(/\s+|(?<=-)/).filter(Boolean)`, so a doubled or trailing hyphen leaves no empty part. A second `superRefine` on `name` fails `pnpm build` with `a name part holds <n> characters, over 24 (one card line); see spec 0006`. Every count in AC-2, AC-16, and AC-17 is in code points (single Unicode characters); inside the card subset, which sits below `U+FFFF`, that equals the UTF-16 units `z.string().max()` counts. A separately typed accent (a letter plus `U+0308`) counts as two, which can only make a rule stricter, never let a wider line through; no text is normalized. Vitest schema cases: a 24 character part passes, 25 fails, `Wolfeschlegel-Steinhausenberg` (29 characters with a hyphen) passes. `render-image.test.ts` renders a 24 character part and that hyphenated name with no ink in the padding and the role above the rule.
- **AC-17**: `CV_LIMITS.city = 24` caps `basics.location.city`. `FOOTER_BUDGET = 60` in `src/lib/site-meta.ts` is the most characters the footer's two sides hold together: 61 columns of 16.8px (28px Plex Mono) fit the 1040px row, and one stays free, so at least 32px separates them. `footerLength(content)` returns the characters of `footerStart` plus `footerEnd`, and `/og/[page].png.ts` throws `the <key> card footer holds <n> characters, over 60; shorten basics.location.city, the site host, or the page path; see spec 0006` when it passes the budget. Today the CV card uses 25 (`jorgergo.dev/cv` and `Toluca, MX`); a 24 character city with the planned `/portfolio` path leaves the host up to 22 characters. Vitest cases: the city cap at 24 and 25 in `cv-schema.test.ts`, `footerLength` of today's two cards, and a `render-image.test.ts` card at exactly 60 characters (left `jorgergo.dev/portfolio`, right a city with no inner space plus `, MX`) whose footer text band, the rows from `ruleTop + 26` (the 2px rule and 24px of space) to 550 (the bottom padding), has a widest blank run of columns of at least 32px (the probe measured 36px; the space inside `, MX` is about 25px). A small footer scan helper beside `cardLayout` finds that run.
- **AC-18**: Unit tests never read the live `cv.json`, except `cv-schema.test.ts`, which checks that it parses: `site-meta.test.ts`, `share-card.test.ts`, and `render-image.test.ts` hold today's words in inline fixtures. A schema valid content edit, such as `basics.label` set to `Senior Full Stack Developer`, leaves `pnpm test` and `pnpm exec playwright test` passing with no test edit (the unit test side of spec 0005 AC-16).

## Decision

**Chosen option**: Option 1: Satori at build time, rasterized by sharp, from one page table and pure helpers.

Titles, descriptions, and share tags come from one table (`SHARE_PAGES`) and pure helpers; the cards and icons are drawn on every build by Satori from `cv.json`, the parsed tokens, and the Plex Mono `.woff` files, and saved by the sharp you already have.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`)

Settled while writing (each with the runner up):

- **One page table, `SHARE_PAGES`, in `src/lib/site-meta.ts`**, exactly `[{ key: 'home', path: '/' }, { key: 'cv', path: '/cv', label: 'CV' }] as const satisfies readonly SharePage[]`. A row is `{ key, path, label? }`; the key names the card file and the description rule, the path gives the canonical, the label is both the title prefix and the card label. It is site structure like `SITE_NAV`, kept separate because the menu holds only linked pages in lowercase and has no home row. Runner up: one merged table for menu and metadata, which would put `home` and a display label into the menu's data.
- **The canonical comes from the row, not the request.** With `build.format: 'file'`, `Astro.url.pathname` is `/cv.html` during the build (Astro's configuration reference says so, and `SiteFooter` already works around it with `routePattern`). Runner up: `new URL(Astro.routePattern, site)`, which works for today's static routes but breaks on a future dynamic route.
- **`BaseLayout` takes one optional `share` prop**, and pages spread `pageMeta(key, cv, Astro.site)` into it (`title`, `description`, `share`). The layout stays dumb, the style guide and the 404 page change nothing but the title, and `getCv()` stays in page frontmatter. Runner up: `BaseLayout` calls `getCv()` itself as `SiteFooter` does, which saves one line per page but gives the layout a second job.
- **The pure helpers return explicit results; the three endpoints throw on the impossible (you chose this after the cross check).** `Astro.site` is typed `URL | undefined`, so `pageMeta` returns `share: undefined` and `cardContent` returns `undefined` without it, and `cardPalette`, `iconPalette`, and `monogram` return `undefined` on a missing token or an empty name. The endpoints turn any of those `undefined` values into `throw new Error('<what is missing>; see spec 0006')`, so `pnpm build` (the gate in CI and the pre commit hook) fails loudly instead of Astro silently skipping a file with no body. This is a second sanctioned throw, limited to build time endpoints in `src/pages/` and to states the schema, the contrast test, and the `site` literal already rule out. The pages still render without share tags rather than throw. Runner up: explicit results everywhere with a 500 response, which a build passes quietly while Playwright is not in CI.
- **Endpoints may call `getCv()` once each**, like pages: `/og/[page].png`, `/favicon.svg`, and `/apple-touch-icon.png` each call it once in `GET`. This spec sanctions them as callers beside pages and `SiteFooter`; `/sync` updates the `AGENTS.md` line after the build.
- **Satori receives plain objects**, built by a typed `h()` helper in `share-card.ts` (`{ type: 'div', props: { style, children } }`). No React, no `satori-html`, no JSX. Satori's declarations import `ReactNode` from `react`, which is not installed; with `skipLibCheck` (on in Astro's base config) that parameter types as `any`, so our typed node passes without a cast. Do not add React. Runner up: `satori-html`, which writes the card as an HTML string with inline styles and adds a package.
- **Fonts load through Node's resolver**: `createRequire(join(process.cwd(), 'package.json')).resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff')` (and 500; the `latin` part comes from `FONT_SUBSET`, see AC-15), then `readFile`. It follows package resolution, as `astro.config.mjs` already does for the woff2 files, and works under both `astro dev` and `astro build`, which run from the project root. Satori reads woff but not woff2, and Fontsource ships both. Runner up: `import.meta.resolve`, which Vite's dev module runner may not support.
- **Colours come from `parseColorTokens(css)`** with `css` imported as `@/styles/global.css?raw`, exactly as `BaseLayout` does for `theme-color`. `cardPalette(light)` returns the five card colours or `undefined` if any is missing; `iconPalette(light, dark)` returns the four icon colours or `undefined`. The contrast test already proves every token exists.
- **The favicon's dark switch keys on the fills Satori writes.** The bench showed Satori 0.33.5 writes each colour exactly as given (`fill="#f2ede3"`, `fill="#2b2722"`). `withDarkFills(svg, swaps)` inserts `<style>@media (prefers-color-scheme: dark){[fill="#f2ede3"]{fill:#1b1916}[fill="#2b2722"]{fill:#e6dfd2}}</style>` after the first `>` of the `<svg>` tag, with values from the tokens; a CSS `fill` overrides the attribute. Its Vitest case checks the insertion on a fixture string, with no rendering. Runner up: two icon links with `media` attributes, which browsers honour unevenly.
- **The monogram is derived**: `monogram(name)` returns the first character of `basics.name`, uppercased (unless that gives something the card font cannot draw as one letter, see AC-15), or `undefined` for an empty string (the schema forbids one).
- **Card URLs have no content hash** (`/og/cv.png`). Platforms cache the scraped preview by page URL, so a hashed image name would not refresh a cached preview any sooner; Post Inspector does.
- **`og:type` is `website` on both pages.** `profile` needs a first and last name split that `cv.json` does not hold.
- **The 404 page gets the title pattern and nothing else**: Workers answers it with HTTP 404 (`not_found_handling`), so no `noindex` meta is needed, and a canonical to a missing page would be wrong.
- **`satori` goes in `devDependencies`**, beside `sharp`: both run only at build time. Use the newest version pnpm's release age rule allows; the bench used 0.33.5. It has no install script, so `allowBuilds` does not change.
- **The style guide shows the real files** (`<img>` of the built endpoints) instead of a component, since the card is an image, not markup; its sizes use `width` and `height` attributes, not arbitrary Tailwind values.

Card limits, added after the review (AC-15 to AC-18):

- **Letters outside the card font fail the schema (you chose this).** The card keeps the `latin` subset, the one the site already ships for Plex Mono and Plex Sans, so the card and the page agree on which letters are native. Runner up: load `latin-ext` on the cards too, which draws Polish or Czech letters on the card while the page falls back to a system font for them.
- **The allowed characters come from the font package's own `unicode.json`**, read with the same `FONT_SUBSET` key that picks the font files, so a subset change moves the files and the rule together, and `astro check` rejects a subset name the package lacks. The glyph helpers live in `share-card.ts` beside `FONT_FAMILY`; `cv-schema.ts` imports `missingGlyphs` from there (a pure module with a JSON import, so Vitest still loads the schema without Astro's plugin). Runner up: a literal range in `cv-schema.ts`, which drifts silently when the subset changes.
- **A name part over one card line fails the schema (you chose this).** Parts split at whitespace and right after a hyphen, the break points Satori uses (measured: `Wolfeschlegel-Steinhausenberg` breaks after the hyphen and stays inside the padding). Runner up: split at whitespace only, which would reject a hyphenated name the card draws fine. Breaking the word on the card or shrinking the name were declined: one splits a name mid word, the other changes the balanced size.
- **The footer is guarded twice (you chose this).** `CV_LIMITS.city = 24` keeps a content error a schema error (the `AGENTS.md` rule), and the footer check in `/og/[page].png.ts` catches what the schema cannot see: a longer `site` host or page path at Go live. It joins the endpoint's existing throws, still limited to states the schema and the `site` literal rule out today. Runner up: the schema cap alone, which lets a longer domain overlap the footer silently.
- **`footerLength` returns a count, not a verdict**, so the endpoint's message can say how far over the budget the footer is; the comparison with `FOOTER_BUDGET` sits beside the endpoint's other guards.
- **The new checks are `superRefine` steps after `text(max)`, with no `abort`**, like `endNotBeforeStart`: each message carries the offending characters or length, and one build lists every problem. Runner up: `abort` after the cap, which hides the glyph problem until the length is fixed.
- **Counts stay in code points, with no Unicode normalization.** A separately typed accent can only make a rule stricter. Runner up: NFC normalization (composing a letter and its accent into one character) in `text()`, which would change spec 0002's handling of every field to cover a case the owner's editor never produces.

## Rationale

Reasoning, options, and the bench measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The site's own design (`design.md` and the tokens in `global.css`), as you chose. Every size below was measured on a live bench: Satori 0.33.5 and your sharp 0.35.4 rendering with the real Plex Mono files and light tokens, shown at full size and at LinkedIn, X, and WhatsApp feed widths (private page: https://claude.ai/artifact/X7BKQJsYWRkHH8upwCwmTa). You picked the balanced size over the bold one, because at 88px your own name breaks onto two lines.

### Card design

1200×630, the light `bg` ground, padding 80px on every side (a 1040×470 content box), Plex Mono only, colours from the light tokens only. Rendered today:

```
+------------------------------------------------------------+
|                                                            |
|   CV                           28px · 0.1em · accent       |
|                                                            |
|   Jorge González Ozorno        72px · 500 · fg · lh 1.2    |
|   Full Stack Developer         40px · muted · lh 1.3       |
|                                                            |
|                                                            |
|   ──────────────────────────── 2px · line                  |
|   jorgergo.dev/cv                               Toluca, MX |
|                                28px · muted · lh 1.3       |
+------------------------------------------------------------+
```

- The root is a flex column with `justifyContent: 'space-between'`: the top group (label, name, role) sits at the top, the footer group at the bottom.
- Label: CV card only (a row with a `label`), `textTransform: 'uppercase'`, `letterSpacing: '0.1em'`, 32px below it. The home card has no label, as the home page has no section heading.
- Name: `basics.name`, 72px, weight 500, line height 1.2; about 907px wide today, so one line. Role: `basics.label`, 40px, weight 400, 12px below.
- Footer: `borderTop: 2px solid line`, `paddingTop: 24`, a flex row with `justifyContent: 'space-between'`. Left: the `site` host, plus the row's path unless it is `/`. Right: `` `${city}, ${countryCode}` ``, the short form `SiteFooter` already prints.
- At a 350px phone feed width the name renders about 21px and the role about 12px; the footer and label (about 8px) are texture there and readable from 500px up.
- The layout holds at the caps: a 30 character name on three lines (a 20 character middle part between two short ones, the measured worst case) plus a 27 character role still ends above the rule, about 22px clear.
- Limits that keep every card drawable (AC-15 to AC-17): only `latin` subset characters in the name, role, and city; each name part at most 24 characters (one 1040px line at 43.2px per glyph); the footer's two sides at most 60 characters together (61 columns of 16.8px fit, one stays free as the gap).

Icons, same tokens:
- `favicon.svg`: 32 unit tile, radius 6 (today's shape), light `bg`, `J` at 26px weight 500 in light `fg`, centred by flexbox; dark switch per AC-8.
- `apple-touch-icon.png`: 180×180, no radius, light `bg`, `J` at 136px weight 500 in light `fg`.

### Data model sketch

No persistence. One content change and a few readonly in code shapes.

| Shape | Fields | Notes |
|---|---|---|
| `basics` in `cv.json` (spec 0002) | `name: text(30)`, each part at most 24, card glyphs only; `label: text(27)`, card glyphs only; `location.city: text(24)`, card glyphs only | the schema changes: the caps (AC-2, AC-16, AC-17) and the glyph rule (AC-15); today's content already passes all of them, so no content edit is needed |
| `SharePage` | `key: string` (required, unique), `path: string` (required, absolute, no trailing slash except `/`, unique), `label?: string` | rows of `SHARE_PAGES` (the two literal rows are in *Decision*); `SharePageKey` is the union of their keys, today `'home' \| 'cv'`; a new page adds one row |
| `ShareImage` | `url: string` (absolute), `alt: string`, `width: 1200`, `height: 630` | |
| `ShareMeta` | `url: string` (the canonical), `siteName: string`, `image: ShareImage` | the `share` prop of `BaseLayout` |
| `PageMeta` | `title: string`, `description: string`, `share: ShareMeta \| undefined` | what `pageMeta` returns and pages spread |
| `CardContent` | `label?: string`, `name`, `role`, `footerStart`, `footerEnd` | what `cardContent` returns |
| `CardPalette` | `bg`, `fg`, `muted`, `line`, `accent` (hex strings) | light tokens only |
| `IconPalette` | `lightBg`, `lightFg`, `darkBg`, `darkFg` | |
| `IconSpec` | `size: number`, `radius: number`, `fontSize: number` | the `FAVICON` and `APPLE_ICON` constants |
| `GlyphRange` | `readonly [from: number, to: number]` (code points, inclusive) | `CARD_GLYPHS` is a readonly list of them |
| `CardNode` | `type: 'div'`, `props: { style, children?: string \| readonly CardNode[] }` | what Satori receives |

### State transitions

None.

### API surface

| Endpoint or function | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/og/[page].png` (`src/pages/og/[page].png.ts`) | GET, prerendered | `page` from `getStaticPaths` over `SHARE_PAGES` | PNG 1200×630, `Content-Type: image/png` | public | unknown `page`, incomplete palette, missing `site`, or a footer over `FOOTER_BUDGET` → throws, failing `pnpm build` |
| `/favicon.svg` (`src/pages/favicon.svg.ts`) | GET, prerendered | none | SVG, `Content-Type: image/svg+xml` | public | incomplete palette or empty monogram → throws, failing `pnpm build` |
| `/apple-touch-icon.png` (`src/pages/apple-touch-icon.png.ts`) | GET, prerendered | none | PNG 180×180, `Content-Type: image/png` | public | same as above |
| `BaseLayout` | component | `title`, `description`, `share?: ShareMeta`, `printFooter?` | the head tags of AC-5 and AC-9 | n/a | none |
| `sharePage(key: string \| undefined)` | pure | a route param | `SharePage \| undefined` | n/a | unknown key → `undefined` |
| `formatPageTitle(basics, page?)` | pure | `{ name, label }`, `string \| undefined` | `string` | n/a | none |
| `formatSectionList(cv)` | pure | `{ skills?, technologies? }` | `string` (`experience, education, skills, and technologies`) | n/a | none |
| `pageMeta(key, cv, site)` | pure | `SharePageKey`, the CV (`basics`, `skills?`, `technologies?`), `URL \| undefined` | `PageMeta` | n/a | `site` undefined → `share: undefined` |
| `cardContent(key, cv, site)` | pure | as above | `CardContent \| undefined` | n/a | `site` undefined → `undefined` |
| `footerLength(content)` | pure | `CardContent` | `number`: the code points of `footerStart` plus `footerEnd` | n/a | none |
| `parseUnicodeRange(list)` (`share-card.ts`) | pure | a CSS `unicode-range` list such as `U+0000-00FF,U+0131` | `readonly GlyphRange[]` | n/a | none (the package's own list is well formed; a Vitest case pins today's parse) |
| `missingGlyphs(text)` (`share-card.ts`) | pure | `string` | `readonly string[]`: each character outside `CARD_GLYPHS`, once, in order; empty when all are drawable | n/a | none |
| `cardPalette(light)` | pure | the `light` scheme of `parseColorTokens` | `CardPalette \| undefined` | n/a | a missing token → `undefined` |
| `iconPalette(light, dark)` | pure | the `light` and `dark` schemes | `IconPalette \| undefined` | n/a | a missing token → `undefined` |
| `monogram(name)` | pure | `string` | `string \| undefined`: the first character, uppercased only when that gives exactly one character inside `CARD_GLYPHS` (AC-15) | n/a | empty → `undefined` |
| `cardTree(content, palette)` | pure | `CardContent`, `CardPalette` | `CardNode` (the *Card design* tree) | n/a | none |
| `iconTree(letter, spec, colors)` | pure | `string`, `IconSpec`, `{ bg, fg }` | `CardNode` (a flex tile, the letter centred, weight 500) | n/a | none |
| `withDarkFills(svg, swaps)` | pure | `string`, `readonly (readonly [from: string, to: string])[]` | the SVG with one `<style>` inserted after the first `>` of the `<svg>` tag | n/a | none (no `<svg` → the input unchanged) |
| `renderPng(node, size)` / `renderSvg(node, size)` (`src/lib/render-image.ts`) | edge | a `CardNode`, `{ width, height }` | `Buffer` / `string` | n/a | a missing font file fails the build with Node's own error |

`share-card.ts` also exports `FAVICON = { size: 32, radius: 6, fontSize: 26 }` and `APPLE_ICON = { size: 180, radius: 0, fontSize: 136 }` as `IconSpec` values; the favicon endpoint passes the light `bg` and `fg` to `iconTree`, then `withDarkFills(svg, [[lightBg, darkBg], [lightFg, darkFg]])`. It exports `FONT_SUBSET` and `CARD_GLYPHS` too (AC-15), and `site-meta.ts` exports `FOOTER_BUDGET = 60` (AC-17). `cv-schema.ts` gains `namePart: 24` and `city: 24` in `CV_LIMITS`.

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Render `/` head | title | `formatPageTitle(basics)`: `basics.name`, `basics.label` from `cv.json` |
| Render `/` head | description | `basics.bio` (capped at 160 by spec 0002) |
| Render `/cv` head | title | `formatPageTitle(basics, 'CV')`: the row's `label` |
| Render `/cv` head | description | `DESCRIPTIONS.cv`: `name`, `label`, and whether `skills` and `technologies` have entries, from `cv.json` |
| Render 404 head | title | `formatPageTitle(basics, 'Not found')`, the page's own label |
| Render 404 head | description | the literal `This page does not exist.` (spec 0003) |
| Render share tags | canonical and `og:url` | `new URL(row.path, site)`: the row's `path` and `site` from `astro.config.mjs` (AC-1) |
| Render share tags | `og:site_name` | `basics.name` |
| Render share tags | `og:image` | `` new URL(`/og/${row.key}.png`, site) ``: the row's `key` and `site` |
| Render share tags | `og:image:alt` | the card's words: the row's `label` if any, `basics.name`, `basics.label`, joined with `, ` |
| Render share tags | width, height, type, `og:type`, `twitter:card` | constants in `site-meta.ts`: `1200`, `630`, `image/png`, `website`, `summary_large_image` |
| Render a card | page label | the row's `label` |
| Render a card | name, role | `basics.name`, `basics.label` |
| Render a card | footer left | `site.host` plus the row's `path` unless it is `/` |
| Render a card | footer right | `basics.location.city`, `basics.location.countryCode` |
| Render a card | colours | the light `bg`, `fg`, `muted`, `line`, `accent` from `parseColorTokens(global.css)` |
| Render a card or icon | glyph shapes | `ibm-plex-mono-${FONT_SUBSET}-400-normal.woff` and `-500-normal.woff` from `@fontsource/ibm-plex-mono` |
| Validate `cv.json` | the characters a card may hold | `CARD_GLYPHS`: `parseUnicodeRange(unicode[FONT_SUBSET])`, from `@fontsource/ibm-plex-mono/unicode.json` |
| Validate `cv.json` | the name part and city limits | `CV_LIMITS.namePart` (24) and `CV_LIMITS.city` (24) in `cv-schema.ts` |
| Render a card | the footer budget | `FOOTER_BUDGET` (60) in `site-meta.ts`, from the 1040px row and 16.8px per glyph at 28px |
| Render a card | sizes and spacing | *Card design* above (the bench) |
| Render the icons | letter | `monogram(basics.name)` |
| Render the favicon | light and dark fills | the light and dark `bg` and `fg` tokens |

### Key invariants

- Every word, colour, and URL on a card, an icon, or a head tag has one source: `cv.json`, `global.css`, `site`, or `SHARE_PAGES`. No literal name, role, hex, or domain in `site-meta.ts`, `share-card.ts`, the endpoints, or `BaseLayout`.
- `og:title` equals `<title>`, `og:description` equals the description meta, `og:url` equals the canonical, on every page that has them.
- Every `SHARE_PAGES` row has a page that answers 200 at its `path`, a card at `/og/<key>.png`, and a `DESCRIPTIONS` rule (the `satisfies` clause makes a missing rule a type error).
- Titles stay within 60 characters (30 + 3 + 27) and the CV description within 119 characters; the bio stays within 160 (spec 0002).
- Cards and icons use Plex Mono at weights 400 and 500 only and the light tokens only; the favicon adds the dark `bg` and `fg` only inside its media query.
- Pages never load a card or the Apple icon; no page gains a script, a style attribute, or a request.
- Every character a card or icon draws is inside `FONT_SUBSET`, so Satori never draws a missing glyph box; the name takes at most three lines, no line runs into the padding, and the footer's two sides never touch.
- The subset has one name (`FONT_SUBSET`): the font files the cards load and the characters the schema allows always come from the same `unicode.json` entry.

### Security model

A public static site with no input. The cards show only what every page already shows (name, role, city in the footer); spec 0002 keeps phone and street address out of the schema. The favicon's `<style>` runs only inside the image (browsers render SVG favicons without scripts, and the page's CSP does not apply inside an image), and the hashed page CSP is unchanged because head `<meta>` and `<link>` tags need no hash. No compliance scope.

### Configuration required

No environment variables or credentials. `site` is a literal in `astro.config.mjs` (AC-1), and `satori` is a new `devDependency`.

### Critical test scenarios

- Happy path: `pnpm build`, then `/` and `/cv` carry the AC-3 titles, the AC-4 descriptions, and every AC-5 tag with the exact values, and their `og:image` URLs serve 1200×630 PNGs under 300 KB, verifies **AC-1**, **AC-3** to **AC-6**, **AC-13**.
- Content edit: set `basics.label` to `Senior Full Stack Developer` (27 characters), build, and the title, both cards, and the alt text change with no code edit, and `pnpm test` still passes; set it to 28 characters and the build fails on the schema, verifies **AC-2**, **AC-7**, **AC-18**.
- Missing glyphs: set `basics.name` to `Łukasz Żółkiewski` and the build fails naming `Ł` and `Ż`; `Seán O’Brien` builds and its card draws every letter, verifies **AC-15**.
- Long name part: a 25 character part fails the build; `Wolfeschlegel-Steinhausenberg` builds and breaks after the hyphen, inside the padding, verifies **AC-16**.
- Footer: a 25 character city fails on the schema; with the city at 24 and `site` set to a host long enough to pass 60 characters on the CV card, the build fails with the footer message; restore both, verifies **AC-17**.
- Section rule: delete `technologies` from `cv.json`, build, and the CV description reads `…: experience, education, and skills.`; delete `skills` too and it reads `…: experience and education.`, verifies **AC-4**.
- Wrong URL trap: the canonical and `og:url` of `/cv` end in `/cv`, never `/cv.html`, in `dist/cv.html`, verifies **AC-5**.
- Dark favicon: `withDarkFills` on a fixture SVG inserts exactly one `<style>` right after the opening tag and leaves the rest byte for byte; `/favicon.svg` contains both dark hex values, verifies **AC-8**, **AC-10**.
- No leak: the 404 page has no canonical or `og:` tag, and `/` and `/cv` request nothing new, verifies **AC-5**, **AC-11**.
- Loud failure: remove `site` from `astro.config.mjs` and `pnpm build` fails with the endpoint's `see spec 0006` message instead of writing a site without cards; restore it, verifies **AC-1**, **AC-6**.
- Auth/permission: none; every route is public.

## Build plan

Skateboard: the first three tasks already give every page its right title, description, and canonical (usable on their own); the cards and icons then complete the preview, and the last tasks lock it down.

1. [x] Add `name: 30` and `label: 27` to `CV_LIMITS`, apply them to `basics.name` and `basics.label`, and add the Vitest cap cases to `cv-schema.test.ts`, satisfies **AC-2**.
2. [x] Set `site: 'https://jorgergo.dev'` in `astro.config.mjs`. Create `src/lib/site-meta.ts` with `SHARE_PAGES`, `SharePageKey`, `sharePage`, `formatPageTitle`, `formatSectionList`, `DESCRIPTIONS`, `pageMeta`, and `cardContent`, plus `site-meta.test.ts` (titles, the four section list cases, unique titles and descriptions, canonical and image URLs from the row, `share: undefined` without `site`, alt text, footer text), satisfies **AC-1**, **AC-3**, **AC-4**, **AC-10**.
3. [x] Add the `share` prop to `BaseLayout` and render the AC-5 tags in order; wire `index.astro` and `cv.astro` to spread `pageMeta(...)` (each keeps one `getCv()` call, now keeping the whole CV), and give `404.astro` its own `getCv()` call and `formatPageTitle(basics, 'Not found')`, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-11**.
4. [x] Add `satori` to `devDependencies`, then prove the pipeline before building on it: a first `src/pages/og/[page].png.ts` that renders one word through Satori and sharp must produce a PNG under both `pnpm build` and `pnpm dev` (the bench ran plain Node, not Vite, and Satori 0.33 loads `harfbuzzjs` WebAssembly). The known fix is `vite: { ssr: { external: ['satori'] } }` in `astro.config.mjs`; if the proof still fails with it, stop and return to `/architect` rather than working around it. Then create `src/lib/share-card.ts` (`h`, `cardPalette`, `iconPalette`, `monogram`, `cardTree`, `iconTree`, `withDarkFills`) with `share-card.test.ts` (palette completeness, the tree's text and colours per row, label only on rows with one, the monogram), and `src/lib/render-image.ts` (the font reads, `renderSvg`, `renderPng`), and finish `src/pages/og/[page].png.ts` with its throws, satisfies **AC-6**, **AC-7**, **AC-10**.
5. [x] Create `src/pages/favicon.svg.ts` and `src/pages/apple-touch-icon.png.ts`, delete `public/favicon.svg`, and add the Apple icon link to `BaseLayout` after the favicon link, satisfies **AC-8**, **AC-9**.
6. [x] Add the `Share cards and icons` section to `src/pages/_dev/styleguide.astro` and to `design.md` (canvas, padding, sizes, the label and footer rules, light tokens only, Plex Mono only, the two caps, the favicon tile and its dark switch, the square opaque Apple icon), satisfies **AC-12**.
7. [x] Add `toLocal` and `pngSize` to `e2e/helpers.ts`, and update `e2e/site.spec.ts` (derived `PAGES` titles, the share tag checks, the image and icon checks, the 404 check) and `e2e/styleguide.spec.ts`. Run the two exact request list tests again (the `/` and `/cv` "ships no script" cases): Chromium does not fetch an `apple-touch-icon` link, but if a browser does, treat it as the favicon is treated there (allowed, not required). Run `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test`; open both cards and both favicons on `pnpm preview` and compare them with the bench; record AC-14 as a Go live check, satisfies **AC-11**, **AC-13**, **AC-14**.

Added after the review: each limit lands whole (rule, message, Vitest cases, and a render case where it has a visual), so the site stays shippable after every task.

8. [x] Replace the live `cv.json` reads in `site-meta.test.ts`, `share-card.test.ts`, and `render-image.test.ts` with inline fixtures holding today's words (done during `/debug` on 2026-09-25; the label edit then left all 259 tests passing), satisfies **AC-18**.
9. [x] Add `FONT_SUBSET`, `GlyphRange`, `parseUnicodeRange`, `CARD_GLYPHS`, and `missingGlyphs` to `share-card.ts` with their Vitest cases, and make `monogram` keep a first character whose uppercase form is not one drawable character (two cases); build the font paths in `render-image.ts` from `FONT_SUBSET`; add `cardText(max)` to `cv-schema.ts`, use it for `basics.name`, `basics.label`, and `basics.location.city`, and add the schema cases (including the two issue case), satisfies **AC-8**, **AC-15**.
10. [x] Add `CV_LIMITS.namePart = 24` and the name part refinement with its schema cases; add the two `render-image.test.ts` cases (a 24 character part, the hyphenated name); correct the `CV_LIMITS` comment to say the capped name wraps to at most three lines, satisfies **AC-7**, **AC-16**.
11. [x] Add `CV_LIMITS.city = 24` and its schema cases; add `FOOTER_BUDGET` and `footerLength` to `site-meta.ts` with Vitest cases; make `/og/[page].png.ts` throw the AC-17 message over the budget; add the footer scan helper and the `render-image.test.ts` case at exactly 60 characters, satisfies **AC-17**.
12. [x] Update the `Share cards and icons` section of `design.md`: the name wraps to at most three lines, the card glyph subset, the 24 character name part, the 24 character city, and the 60 character footer. Run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`), then the four break steps under *Critical test scenarios* (missing glyphs, long name part, footer, content edit) in a scratch copy, satisfies **AC-7**, **AC-12**, **AC-15**, **AC-16**, **AC-17**, **AC-18**.

## Consequences

**Positive**:
- One edit to `cv.json`, a token, or `site` updates every title, description, card, and icon on the next build; nothing can drift.
- Link previews show your name, role, and which page the link opens, on every platform that reads Open Graph tags.
- Zero client cost: no script, no new request, no CSP change; each card is about 40 KB.
- A later page gets its title, card, and tags from one row and one rule.

**Negative / tradeoffs**:
- A new dependency before version 1.0: Satori's API or output can change (the dark favicon switch relies on its fill attributes, and a Vitest case plus the page test guard it). Satori supports a subset of CSS (flexbox, no grid), so any future card design must fit that.
- The name and role caps (30 and 27) constrain your content: a longer role title needs a new card layout decision, not a quiet wrap.
- Cards are light only; on X's dark feed the paper card is bright by design.
- The cards draw only the `latin` subset, the same one the site ships: a name, role, or city with a letter outside it (Ł, Ż, Cyrillic, Greek) fails `pnpm build` naming the letter, even though the page itself could show it in a fallback font. Supporting such a name means adding the subset to the site's fonts (spec 0003) and to `FONT_SUBSET` together; the schema rule then follows through `unicode.json`.
- A name part over 24 characters fails the build, and the city is capped at 24; a longer `site` host at Go live can fail the build through the footer check, which then needs a shorter host or a new footer layout decision.
- Platforms cache previews (LinkedIn about a week); after a change, refresh a URL with LinkedIn's Post Inspector. X offers no refresh tool, and a WhatsApp chat keeps its old preview.
- `site` points at a domain not bought yet; if `jorgergo.dev` is taken, Go live changes one line and every URL and footer follows.
- WhatsApp's small preview may crop a square from the centre, cutting the left aligned text; the large preview shows the whole card.
- Endpoints become new `getCv()` callers and the second sanctioned throw, both of which `AGENTS.md` does not mention until `/sync` updates it.
- Satori's text shaping now runs on `harfbuzzjs` WebAssembly, which must load inside Astro's build; build plan task 4 proves it before anything else depends on it.

**Neutral**:
- Spec 0004's home title changes from the name alone to `name · label`; spec 0005's `CV · name` pattern is inherited; spec 0003's favicon and metadata follow ups close here.
- `public/favicon.svg` is deleted; three endpoint files join `src/pages/`, which spec 0001's layout allows.
- No sitemap, no robots.txt, and no structured data (JSON-LD) for now, by your choice.

## Follow-up

- [ ] Go live spec: confirm `jorgergo.dev` is free (or change `site`; the AC-17 footer check fails the build if the new host is too long), run the AC-14 share checks, and decide Cloudflare's AI crawler setting, since robots rules stay a zone setting. During the X check, confirm X shows the card's alt text; X may not read `og:image:alt`, and if it doesn't, a spec update adds `twitter:image:alt` (AC-5 and its page test change with it).
- [ ] `AGENTS.md` (via `/sync`): endpoints in `src/pages/` may call `getCv()` once, and build time endpoints may throw on states the schema and tests rule out (the second sanctioned throw); the `SHARE_PAGES` rule (a new page's spec adds its row and its `DESCRIPTIONS` rule); the card font rule (a new subset changes the site fonts and `FONT_SUBSET` together, and unit tests use inline fixtures, never the live `cv.json`); `satori` beside `sharp` in the stack; `Declined:` the `json-render@image`, `open-graph`, and `seo-image-gen` skills and the `satori-mcp-server` and `opengraph-mcp` servers.
- [ ] About, contact, and portfolio page specs: add a `SHARE_PAGES` row with a `label` and a `DESCRIPTIONS` rule.
- [ ] Revisit a sitemap when the portfolio page brings more pages, and structured data only if search results for your name show a need.
