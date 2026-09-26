# 0009. About page as a short list of what you care about

**Date**: 2026-09-26
**Status**: Proposed

## Summary

`/about` becomes a short, plain page in the spirit of fbold.dev: the heading `about`, the line "Hi, I'm Jorge, I care about...", seven short lines each opened by a muted `›`, and one closing sentence with your email as a link. The words live in a new `about` block in `cv.json` with strict limits, so an empty or overlong line fails the build, and the page adds `01 about` to the home menu, its own title and description, and its own share card. There is no photo, no script, and no new component, and nothing on the page names an employer. The copy was drafted from your answers and your CV, and you can reword it before it ships.

## Requirements

**User stories**:
- As a recruiter or a peer, I want to see what you care about in a few seconds, so that I know you beyond the CV's bullet points.
- As the site owner, I want to be introduced by my craft and interests, not my employer, so that the page stays true when my job changes.
- As a visitor who wants to reach you, I want the page to end with your email as a link, so that I can write to you without looking for it.
- As a keyboard or screen reader user, I want one heading, the lines in order, and one link, so that nothing decorative gets in the way.
- As the site owner, I want to edit the words in `cv.json` alone, so that a copy change never needs a code or test change.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/about` renders through `BaseLayout` with `pageMeta('about', cv, Astro.site)` spread into it. `<title>` reads `About · Jorge González Ozorno`, the meta description reads `What Jorge cares about, at work and away from it.`, the canonical is `https://jorgergo.dev/about`, and the page carries spec 0006's share tags in their order, with `og:image` `https://jorgergo.dev/og/about.png` and `og:image:alt` `About, Jorge González Ozorno, Full Stack Developer`. `printFooter` keeps its default.
- **AC-2**: `SHARE_PAGES` in `src/lib/site-meta.ts` gains `{ key: 'about', path: '/about', label: 'About' }` between `home` and `cv`, and `DESCRIPTIONS` gains `about: ({ basics }) => \`What ${givenName(basics.name)} cares about, at work and away from it.\``. `givenName(name)` (same file, exported) returns the first whitespace separated part of the trimmed name, or `''` when there is none (`?? ''`): `Jorge González Ozorno` gives `Jorge`, `Ana` gives `Ana`, `  Ana  Ruiz ` gives `Ana`, `''` gives `''`. The build draws `/og/about.png`, a 1200×630 PNG under 300 KB with the label `ABOUT`, the name, the role, and the footer `jorgergo.dev/about` and `Toluca, MX` (28 of `FOOTER_BUDGET`'s 60 characters). Vitest in `src/lib/site-meta.test.ts` covers the four `givenName` cases, `DESCRIPTIONS.about`, and `pageMeta('about')`; three existing cases change: the `SHARE_PAGES` `toEqual` (line 61) lists the three rows, the `footerLength` table (line 299) gains `['about', 28]`, and the case that treats `about` as an unknown key (line 76) uses `missing` instead.
- **AC-3**: `makeCvSchema` in `src/lib/cv-schema.ts` gains a required `about` strict object beside `basics`, with three required fields: `intro`, `text(CV_LIMITS.aboutIntro)` (40); `items`, an array of `text(CV_LIMITS.aboutItem)` (100) holding `CV_LIMITS.aboutItemsMin` (3) to `CV_LIMITS.aboutItems` (7) entries; `closing`, `text(CV_LIMITS.aboutClosing)` (160) that holds `EMAIL_TOKEN` (`{email}`) exactly once. `splitAtEmail(closing)` (exported from the same file) returns `{ before, after }`, the text on each side of the token, when the token appears exactly once, and `undefined` otherwise; the `closing` rule refines with it and fails with `closing must hold {email} exactly once, where basics.email goes; see spec 0009`. A missing `about`, an unknown key inside it, an empty or whitespace only value, a value over its cap, 2 or 8 items, and a closing with no token or two tokens each fail `pnpm build`. None of it is card text, so spec 0006's glyph rule does not apply. Vitest in `src/lib/cv-schema.test.ts` covers every one of those failures, the caps at their limit and one over, and `splitAtEmail` with zero, one (at the start, middle, and end), and two tokens. `about` joins the base fixture (`minimalCv`) and the missing section `it.each` (with `work`, `education`, `basics`). The closing cap fixtures hold the token (for example `{email}` plus 153 characters at the cap, 154 one over), so the over cap case reports exactly one `too_big` issue; zod 4 runs the token refine even after a failed `max`, so a fixture without the token would report two.
- **AC-4**: `src/content/cv.json` holds this `about` block (after `basics`), the draft you accepted; you may reword any value before merge within the caps, and no test changes when you do:
  - `intro`: `Hi, I'm Jorge, I care about...`
  - `items`: `Making websites. From the interface to the cloud it runs on.` · `Automating boring work. Releases, versions, and repetitive processes.` · `Teaching and docs. Helping teammates get unstuck.` · `Sport. Five years as basketball captain, plus boxing, tennis, weightlifting, and CrossFit.` · `Music. I play the guitar.` · `Superheroes and anime. They give me hope.` · `Finance and markets. A newer interest; the market keeps me curious.`
  - `closing`: `If you would like to work with me, send me an email at {email}.`
- **AC-5**: `<main>` holds exactly one child, `<div class="flex flex-col gap-6 text-pretty">`, holding in order: `<h1 class="text-lg font-medium">about</h1>`; a `<p>` with `about.intro`; a `<ul class="flex flex-col gap-2">` with one `<li>` per `about.items` entry in order; a `<p>` with the closing (AC-7). Every text is in `fg` except the markers. Nothing else renders in `<main>`: no photo, no section heading, no `nav`, no keyed rows, no employer name, and the page has no `<script>`.
- **AC-6**: Each `<li>` is `flex` and holds `<span aria-hidden="true" class="w-5 shrink-0 text-muted">›</span>` (`U+203A`) then the item text in a `<span>`, so the text starts 20px from the column edge (the same indent as the CV's bullets) and a wrapped line starts under the text, not under the marker. The page test proves the indent at 320px on the longest `cv.about.items` entry, which wraps for any valid content: every rect of a `Range` around its text span (`getClientRects()`, the pattern at `e2e/site.spec.ts:1936`) shares one `left`, equal to the span's own x and 20px right of the `ul`. The marker renders in IBM Plex Mono, never a fallback face: after `document.fonts.ready`, a CDP session (`page.context().newCDPSession(page)`, `DOM.enable`, `CSS.enable`, `DOM.getDocument`, `DOM.querySelector` for the first marker) asks `CSS.getPlatformFontsForNode` and gets exactly one entry, whose `familyName` matches `/^IBM Plex Mono/` and whose `isCustomFont` is `true` (Chromium reports the file's own family name, not the Fonts API's hashed one). Each item's accessible text is the item alone: `toMatchAriaSnapshot` on the `ul`, built from `cv.about.items`, lists one `listitem` per item with its text and no `›` (aria snapshots skip hidden nodes), and each `li` holds exactly one `span[aria-hidden="true"]`.
- **AC-7**: The closing `<p>` reads `If you would like to work with me, send me an email at jorgergo@icloud.com.`, with no space before the period, built from `splitAtEmail(about.closing)`: `before`, then `basics.email` inside a `TextLink` to `mailto:` plus `basics.email`, then `after`. The `<p>` is written on one line under `{/* prettier-ignore */}` (the pattern in `TextLink.astro` and `SkipLink.astro`), because Prettier would put `{after}` on its own line and `compressHTML` keeps one space around an expression, which would print `…icloud.com .`. The page test asserts `toHaveText(before + basics.email + after)` (it trims only the ends, so a space before the period still fails) and one link whose text is the address alone. If `splitAtEmail` ever returned `undefined` (the schema makes that unreachable), the page would render `about.closing` as plain text with no link rather than throw.
- **AC-8**: `SITE_NAV` in `src/lib/site-nav.ts` gains `{ label: 'about', href: '/about' }` as its first entry, so the home menu reads `01 about`, `02 cv`, and the existing test that every menu `href` answers 200 with redirects disabled passes. Spec 0004's (now 0008's) `SITE_NAV` rules are unchanged.
- **AC-9**: Tab order on `/about` is the skip link, the email link, then `← home`; each shows the 2px accent ring offset 3px. The page passes an axe WCAG 2.2 AA check in light and dark, has one `h1`, no `role` attribute under `body`, no `target`, and no `style` attribute; it requests only same origin resources, logs no CSP violation, and scrolls nothing sideways at 320px. Its requests are the page, one stylesheet, and two font files, Plex Mono 400 and 500 (the h1 is `font-medium`), and never a Plex Sans file, checked the way the home request test does (`e2e/site.spec.ts:1339`).
- **AC-10**: In print, the paper tokens apply; the heading, the intro, every marker and item, and the closing print; the email prints as plain ink with no underline; the footer's `Toluca, MX · <year>` line prints, and the skip link and `← home` stay hidden (spec 0003's print layer, no new print rule).
- **AC-11**: `design.md` records the marker list: a `ul` of `flex` rows `gap-2` apart, each a muted `›` in an `aria-hidden` `w-5` column then the text, `›` because Plex Mono's `latin` file has it and lacks `←` and `→`; the spacing table gains `gap-2` "between marker list rows" and `w-5` "a marker column: the 20px indent the CV's bullets use"; the `text-pretty` sentence names the about lines and drops its wrong clause ("running prose in `Prose` does not"; `Prose.astro` sets `text-pretty`); `muted`'s role adds list markers. The component count stays eleven. The style guide's share card section, which design.md says shows the built files, adds `/og/about.png` after the CV card (alt `About share card`), and `e2e/styleguide.spec.ts` expects six images in that order. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass, and every page test expectation derives from `cv.json`, `SITE_NAV`, and `site-meta.ts`, so a valid content edit needs no test edit.
- **AC-12**: The deploy gate covers `/about` (spec 0007): `check_pages` in `.github/scripts/smoke.sh` adds `check_page /about about.html` after `/cv`, and a fetch of `/og/about.png` checked for status 200 and `content-type: image/png` after the CV card; `SMOKE_FILES` in `e2e/helpers.ts` adds `about.html`; the `/* header` loop in `e2e/site.spec.ts` (line 789) runs over `/`, `/about`, and `/cv`. A live `/about` whose bytes differ from `dist/about.html` fails the smoke check and rolls the Worker back, which the existing smoke page tests prove once `about.html` is in the copied files.

## Decision

**Chosen option**: Option 1: an "I care about" list from a new `about` block in `cv.json`, in Plex Mono, ending with an inline email link.

The page is a heading, one intro line, three to seven short marker lines, and one closing sentence, built only from existing tokens and components.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Your picks in the interview: your story in your own voice, in first person; I draft, you edit; no photo; the Claude Design draft as a guide plus the fbold.dev page you pasted as the model; the h1 `about`; Plex Mono (62 characters per line, against Plex Sans's 80); every line in `fg` (Lc 91 light, 86 dark); 24px between blocks; the `›` marker in Plex Mono; each line a topic then one fact; the lines you chose (websites, automation, teaching and docs, sport with boxing folded in, music, superheroes and anime, finance); the intro "Hi, I'm Jorge, I care about..."; the closing sentence with your email inline and no rows; the description "What Jorge cares about, at work and away from it."; the copy in `cv.json`; no References section.

Settled while writing (each with the runner up):

- **The marker is page markup, an `aria-hidden` span, not a CSS list marker.** It stays silent in every screen reader and matches `NavRow`'s hidden number and the footer's hidden arrow. The cost: Safari's VoiceOver drops the list role from a list with no visible CSS marker (spec 0004 found this), so it reads the seven lines in order but does not announce "list, 7 items". Runner up: the CV's own bullet, `list-disc pl-5 marker:text-muted` (`CvEntry.astro`), which keeps the list role everywhere and needs no hidden span or font check, but gives up the `›` you chose for a dot. Also rejected: a `list-style-type: "›"` utility in `global.css`, which keeps the role but may make screen readers speak the character before every line and lets the marker's position drift with the font.
- **A `w-5` marker column with no gap.** The text starts 20px in, the exact indent of the CV's bullets (`pl-5`), whatever the glyph width (9.6px on Mac, 10px in Linux CI). Runner up: `NavRow`'s `w-6` plus `gap-4`, which pushes the text to 40px and makes the list read like a menu.
- **Lines `gap-2` (8px) apart.** Four of the seven lines wrap at desktop width; with `gap-1` the space between lines (13.6px) is barely more than the leading inside a line (9.6px), while `gap-2` gives 17.6px, so each line reads as its own. Runner up: `gap-1`, the CV's bullet spacing.
- **`text-pretty` on the block**, inherited by every line, as design.md asks for short standalone text. Runner up: none on the lines, which leaves a lone word on some wraps.
- **The closing is one string with an `{email}` marker.** Your whole sentence stays in `cv.json` in your words, and the address still comes from `basics.email`, so it changes in one place. Runner up: a lead text that the page ends with the link and a full stop, which hides grammar in code.
- **`splitAtEmail` and `EMAIL_TOKEN` live in `src/lib/cv-schema.ts`**, beside `regionName`: the schema needs them, and `cv-format.ts` already imports from `cv-schema.ts`, so placing them there avoids an import loop. Runner up: `cv-format.ts`, the home of CV rules with a branch, which would make the schema import it back.
- **The description derives your first name** from `basics.name` with `givenName`, the way the CV description derives name and role. Runner up: an `about.description` field, one more thing to keep in step with your name.
- **The `about` block is required.** `/about` exists, so a missing block is a content error and fails the build. Runner up: optional with the page skipped, which would leave a dead menu row until the test caught it.
- **No new component.** The list has one caller. Runner up: a `MarkerList` component in the style guide, worth it when a second page uses the pattern.
- **Order in `SHARE_PAGES` follows the menu** (`home`, `about`, `cv`). Only `getStaticPaths` reads the order.
- **This spec merges before spec 0008's layout.** 0008's redesign waits for `/about` anyway. Both edit the same `design.md` lines (the `gap-2` meaning, the `text-pretty` sentence, `muted`'s role) and the home menu tests, so 0008's later edits rebase on these. If 0008's task 1 (the bio and the home menu tests derived from `SITE_NAV`) merges first, this build skips its home test contingency.
- **The deploy smoke check learns `/about`.** Without it a broken `/about` deploy would pass the smoke check and never roll back. Runner up: record the gap and leave the smoke check to `/` and `/cv`.
- **The style guide shows the About card**, since design.md says it shows the built files. Runner up: note that it shows only the first two cards.

## Rationale

Reasoning, the options weighed, and the measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The fbold.dev about text you pasted (a greeting, "I care about...", arrow lines, one closing line with an email), the Claude Design draft's about frame (`Portfolio.dc.html` in the project "Minimalist Developer Portfolio": an `about` h1 at 18px, short lines 24px apart, `text-wrap: pretty`) as a guide only, and `design.md` with spec 0003's tokens and components, unchanged. Differences from the draft: every line in `fg` (the draft greys two of three), a list instead of paragraphs, and a closing link (the draft has none).

### Page composition

Inside `<main>`, one block (`flex flex-col gap-6 text-pretty`):

1. `<h1 class="text-lg font-medium">about</h1>`
2. `<p>{about.intro}</p>`
3. `<ul class="flex flex-col gap-2">`, each `<li class="flex">` holding `<span aria-hidden="true" class="w-5 shrink-0 text-muted">›</span><span>{item}</span>`
4. `{/* prettier-ignore */}` then `<p>{before}<TextLink href={\`mailto:${basics.email}\`}>{basics.email}</TextLink>{after}</p>` on one line, so no whitespace enters the link or sits before the period

Rendered at desktop width:

```
about

Hi, I'm Jorge, I care about...

›  Making websites. From the interface to the cloud it
   runs on.
›  Automating boring work. Releases, versions, and
   repetitive processes.
›  Teaching and docs. Helping teammates get unstuck.
›  Sport. Five years as basketball captain, plus boxing,
   tennis, weightlifting, and CrossFit.
›  Music. I play the guitar.
›  Superheroes and anime. They give me hope.
›  Finance and markets. A newer interest; the market
   keeps me curious.

If you would like to work with me, send me an email at
jorgergo@icloud.com.
───────────────────────────────────────────────────────────────
← home                                        Toluca, MX · 2026
```

Beside the marker the text is 572px wide: 59 Plex Mono characters on Mac, 57 in Linux CI. Four lines wrap; `text-pretty` moves a lone last word up with its neighbour, so the exact breaks above are indicative. The websites line is 60 characters, one over a single row. At 320px the text beside the marker is 252px (25 or 26 characters), so the lines take one to five rows each; nothing scrolls sideways.

### Data model sketch

One new block in `cv.json`, beside `basics`. No other field changes.

| Field | Type | Rules | Used by |
|---|---|---|---|
| `about` | object | required, strict (no other keys) | `/about` |
| `about.intro` | string | required, trimmed, 1 to 40 characters (`CV_LIMITS.aboutIntro`) | the line under the h1 |
| `about.items` | string[] | required, 3 to 7 entries (`aboutItemsMin`, `aboutItems`), each trimmed, 1 to 100 characters (`aboutItem`) | the marker list, in order |
| `about.closing` | string | required, trimmed, 1 to 160 characters (`aboutClosing`), holds `{email}` exactly once | the closing sentence |
| `basics.email` | string | unchanged (spec 0002) | the closing link's text and `mailto:` |
| `basics.name` | string | unchanged | the title, the card, and `givenName` for the description |

`CV_LIMITS` gains `aboutIntro: 40`, `aboutItem: 100`, `aboutItemsMin: 3`, `aboutItems: 7`, `aboutClosing: 160`. The caps count the raw string, so `{email}` counts 7 characters.

### State transitions

None. The page is static and changes only on a rebuild.

### API surface

Build time only, no HTTP beyond the two static files.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `CV_LIMITS` (`src/lib/cv-schema.ts`) | five new keys above | the caps | n/a |
| `EMAIL_TOKEN` (`src/lib/cv-schema.ts`) | `'{email}'` | the marker | n/a |
| `splitAtEmail` (`src/lib/cv-schema.ts`) | `(closing: string) => { readonly before: string; readonly after: string } \| undefined` | the two sides when the token appears once | `undefined` for zero or several |
| `about` (`makeCvSchema`) | strict object above | the parsed block | a schema issue fails the build |
| `givenName` (`src/lib/site-meta.ts`) | `(name: string) => string` | the first whitespace separated part | n/a |
| `SHARE_PAGES`, `DESCRIPTIONS` (`src/lib/site-meta.ts`) | the `about` row and rule | title, description, share tags, card | a row without a rule fails `astro check` |
| `SITE_NAV` (`src/lib/site-nav.ts`) | `{ label: 'about', href: '/about' }` first | the menu | a dead row fails the page test |
| `/about` (`src/pages/about.astro`) | calls `getCv()` once | the page | the `getCv()` throw (spec 0002) |
| `/og/about.png` (`src/pages/og/[page].png.ts`) | unchanged, fed by the new row | the card | spec 0006's footer and palette throws |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/about` | `<title>` | `formatPageTitle(basics, 'About')`: the row's `label` and `basics.name` (spec 0006) |
| Render `/about` | meta description, `og:description` | `DESCRIPTIONS.about`: `givenName(basics.name)` in your fixed sentence |
| Render `/about` | canonical, `og:url` | `site` in `astro.config.mjs` plus the row's `path` |
| Render `/about` | `og:image`, its alt | `/og/about.png`; alt from the label, `basics.name`, `basics.label` |
| Render `/about` | the h1 `about` | page code; the same word as the `SITE_NAV` label |
| Render `/about` | the intro line | `about.intro` |
| Render `/about` | each line, in order | `about.items` |
| Render `/about` | the marker `›` and its colour | page code (`U+203A`), `text-muted` |
| Render `/about` | the closing words | `splitAtEmail(about.closing)`: `before` and `after` |
| Render `/about` | the email text and link | `basics.email`, `mailto:` plus it |
| Render the home menu | `01 about` | `SITE_NAV`'s first row, `formatRowNumber(0)` |
| Draw the card | label, name, role, host and path, city | the row's `label`, `basics.name`, `basics.label`, `site` plus `/about`, `basics.location` (spec 0006) |
| Footer | city, country code, year, `← home` | `SiteFooter` (spec 0003), unchanged |

### Key invariants

- `/about` names no employer: its words are `about`, the intro, the items, the closing, and the email, all craft and interests (your standing rule: intros lead with role and craft).
- The closing holds `{email}` exactly once, so the email always renders as one link, and its address has one source, `basics.email`.
- Three to seven lines, each at most 100 characters; the intro at most 40; the closing at most 160.
- The marker is a glyph the shipped Plex Mono file draws; never `←` or `→`, which it lacks.
- One `h1`, no `role` under `body`, no `target`, no `style`, no `<script>`, no `font-sans` on `/about`.
- Colours only from the six tokens; no new token, no arbitrary value (`w-5`, `gap-2`, `gap-6`, `text-pretty` are stock utilities).
- `SITE_NAV` lists only pages that exist, `about` first.

### Security model

A public static page with no input. The email is already public on `/` and `/cv`. No script, so the CSP hash list is unchanged. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Head and card (`site.spec`, Vitest): `/about` in the `PAGES` list with its title and description from `pageMeta('about')`; the share tag loop picks up the new row by itself, including the 1200×630 card; `givenName`, `DESCRIPTIONS.about`, the three row `SHARE_PAGES`, and the 28 character footer in `site-meta.test.ts`, verifies **AC-1**, **AC-2**.
- Deploy gate (`site.spec` smoke cases, `verify`): `about.html` among the smoke files, `/about` in the header loop, `smoke.sh` checking `/about` and its card, verifies **AC-12**.
- Schema (Vitest): the `about` failures of AC-3, the caps at and over their limits, and `splitAtEmail`'s cases in `cv-schema.test.ts`, verifies **AC-3**.
- Composition (`site.spec`): `<main>` has one child; the h1, intro, list, and closing in order; the intro and items equal `cv.json`'s; one `li` per item; no `nav`, `img`, or `h2` in `<main>`; text in `fg`, markers in `muted`; the 24px block gap and 8px row gap, verifies **AC-4**, **AC-5**.
- Marker (`site.spec`): each `li` holds one `aria-hidden` `›`; the aria snapshot of the `ul` lists the items without the marker; at 320px every row of the longest item starts at one x, 20px in; the CDP font check reports IBM Plex Mono only, verifies **AC-6**.
- Closing (`site.spec`): `toHaveText(before + basics.email + after)` on the `<p>`; one link, `mailto:` plus `basics.email`, whose text is the address alone, verifies **AC-7**.
- Menu (`site.spec`, Vitest): the home menu rows follow `SITE_NAV`, `about` first; every `href` answers 200; `site-nav.test.ts`'s planned order passes, verifies **AC-8**.
- Keyboard, axe, and requests (`site.spec`): the Tab stops of AC-9 with the ring, axe clean in light and dark, same origin only, no CSP violation, exactly the page, one stylesheet, and the Plex Mono 400 and 500 files, no sideways scroll at 320px, verifies **AC-9**.
- Style guide (`styleguide.spec`): six images in the share card section, the About card third, verifies **AC-11**.
- Print (`site.spec`, `verify`): under `print` media the email has no underline and the footer city line shows while `← home` is hidden, verifies **AC-10**.
- Failure case (`verify` break steps): an 8th item, a closing without `{email}`, and a 101 character item each fail `pnpm build` with the schema message, verifies **AC-3**.
- Auth: not applicable; the page is public and static.

## Build plan

Skateboard: the page ships whole in one pull request, content first so every later step builds on a real, validated block.

1. [ ] In `src/lib/cv-schema.ts` add the five `CV_LIMITS` keys, `EMAIL_TOKEN`, `splitAtEmail`, and the required `about` object in `makeCvSchema`; add the AC-4 `about` block to `src/content/cv.json`. In `src/lib/cv-schema.test.ts` add `about` to `minimalCv` and to the missing section `it.each`, the AC-3 failure cases, the caps in the cap tables (closing fixtures holding the token) and the `CV_LIMITS` `toEqual`, and the `splitAtEmail` cases, satisfies **AC-3**, **AC-4**, **AC-11**.
2. [ ] In `src/lib/site-meta.ts` add `givenName`, the `about` row in `SHARE_PAGES`, and `DESCRIPTIONS.about`; in `src/lib/site-meta.test.ts` add the four `givenName` cases, the description, and `pageMeta('about')`, update the `SHARE_PAGES` `toEqual` to three rows, add `['about', 28]` to the `footerLength` table, and change the unknown key case from `about` to `missing`, satisfies **AC-1**, **AC-2**, **AC-11**.
3. [ ] Write `src/pages/about.astro` per the page composition and add the `about` row to `SITE_NAV`. If spec 0008's task 1 (home menu tests derived from `SITE_NAV`) has not landed yet, update every literal home menu expectation in `e2e/site.spec.ts` to follow the new menu: the `'a "01 cv"'` stop (line 120), the `toHaveText(['01 cv'])` row check (line 1288), and the ring test's `names` (line 1400), satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**.
4. [ ] In `e2e/site.spec.ts` add the `/about` entry to `PAGES` (title and description from `pageMeta('about')`, h1 `about`, stops `a "Skip to content"`, the email link, `a "← home"`), add `/about` to the `text-lg` h1 loop, and add an `about page` block for the AC-5 to AC-7, AC-9 request, and AC-10 checks, every expectation read from `cv.json` through the site's helpers. Add the About card to the style guide's share card section and six images to `e2e/styleguide.spec.ts`, satisfies **AC-1**, **AC-5** to **AC-11**.
5. [ ] Extend the deploy gate: `check_page /about about.html` and the `/og/about.png` check in `.github/scripts/smoke.sh`, `about.html` in `SMOKE_FILES` (`e2e/helpers.ts`), `/about` in the `/* header` loop (`e2e/site.spec.ts`, line 789), satisfies **AC-12**.
6. [ ] Update `design.md` (the AC-11 lines), then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the steps in [verify.md](verify.md), satisfies **AC-9**, **AC-10**, **AC-11**, **AC-12**.

## Consequences

**Positive**:
- The page reads in a few seconds and says something the CV does not: what you care about, in your voice.
- Every word is in `cv.json` behind limits, so a copy edit is one file and a broken edit fails the build.
- No new component, dependency, script, token, or font file; the page loads only the Plex Mono file home already uses.
- It unblocks half of spec 0008's precondition (About live) and adds `01 about` to the menu.

**Negative / tradeoffs**:
- Safari's VoiceOver reads the lines in order but does not announce them as a list, because the marker is a hidden span rather than a CSS marker.
- The copy is a draft built from your answers and CV facts; lines such as "Helping teammates get unstuck" and "the market keeps me curious" are my wording of what you told me, so read them before merge.
- `cv.json` now holds non CV profile content (the `about` block); its name no longer describes all of it.
- `givenName` assumes your given name comes first in `basics.name`; a name written family name first would need the rule changed.
- Your first name appears twice by two routes: typed in `about.intro` ("Hi, I'm Jorge") and derived for the description. A name change means editing the intro by hand.
- The marker costs a CDP font check and an aria snapshot in the page tests, which a plain CSS bullet would not need.
- Seven lines is almost twice the reference's four; the cap allows it, and trimming later is a content edit.
- The sport and music lines overlap the CV's interests row, a small repeat by design.

**Neutral**:
- The email now shows on `/about` too; it was already public on `/` and `/cv`.
- `/about` keeps its footer city line on paper, like every non document page.
- The draft's greyed paragraphs, its invented line about small tools and plain text, and its lack of a closing link stay out.

## Follow-up

- [ ] Plex Mono's `latin` file lacks `←` (`U+2190`) and `→` (`U+2192`), so the footer's `← home` arrow already draws in the system fallback face (SF Mono or Menlo on Apple, Consolas on Windows). A small spec 0003 follow up: pick a glyph the font ships, or accept the fallback on record.
- [ ] Spec 0008's follow up line ("rows only before the cv and email rows on `/about`") is settled differently here: you chose one closing sentence with the email inline and no rows. Tick or drop that line when 0008 is next edited.
- [ ] Contact page (scope feature 13): once `/contact` ships, decide whether the closing sentence should also point there; today it links your email only.
- [ ] `/sync` after the build: `AGENTS.md`'s content rule mentions the `about` block in `cv.json` and its `{email}` marker; its Site navigation rule notes that `SITE_NAV` now starts with `about`; its CV page rule ("a CV rule with a branch lives in … `cv-format.ts`") gains the exception that a rule the schema itself needs, such as `splitAtEmail` (and `regionName` before it), lives in `cv-schema.ts`; its Deploying rule notes that `smoke.sh` checks every page, `/about` included.
