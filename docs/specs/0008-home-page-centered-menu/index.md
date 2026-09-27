# 0008. Home page as a centred name, tagline, and menu

**Date**: 2026-09-26
**Status**: Accepted
**Supersedes**: [0004](../0004-home-page/index.md)

## Summary

The home page becomes three things in the middle of the screen: your name, a short muted tagline (`build things, from scratch`), and the numbered page menu. The bio paragraph and the social rows leave the page, so the first thing a visitor reads is your role and your craft, not your employer; your links live on `/contact`, one click away. The bio stays in `cv.json`, rewritten without Ford, as the Google snippet and share preview text. The rewrite can ship today on its own; the new layout ships after About and Contact are live, so the menu never looks empty and your links never disappear. Updated on 2026-09-26: Projects shipped as the third row (spec 0010), so the centred menu now has four rows ending in `04 contact`, and the contact page it waits on is spec 0011.

## Requirements

**User stories**:
- As a recruiter, I want to see your name, what you do, and the way to your CV in one glance, so that I can judge fit without reading a paragraph.
- As the site owner, I want to be introduced by my role and approach rather than my employer, so that the site stays true when my job changes.
- As a peer, I want your links one click away on `/contact`, so that I can still reach you from the home page.
- As a keyboard or screen reader user, I want the page to be one heading, one line, and one labelled list of links, so that I can move through it in order.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `basics.bio` in `src/content/cv.json` reads `Full Stack Developer building web platforms, AI assistants, and release automation.` `/` keeps `pageMeta('home', cv, Astro.site)` as it is (spec 0006), so its title stays `Jorge González Ozorno · Full Stack Developer` and its meta description and `og:description` use the new bio. At ship, `dist/index.html` does not contain the word `Ford` (a one time check in [verify.md](verify.md); AC-3's test keeps any other CV text off the page for good).
- **AC-2**: `basics` gains a required `tagline` field, schema `text(CV_LIMITS.tagline)` with `CV_LIMITS.tagline = 27`, and `cv.json` sets it to `build things, from scratch` (26 characters). A missing, empty, whitespace only, or 28 character tagline fails `pnpm build`. It is not card text (the share card never draws it), so the glyph rule of spec 0006 does not apply. Vitest covers the cap at 27 and 28, the missing field, and the trimmed empty value.
- **AC-3**: `<main>` holds exactly two children. First, `<header class="flex flex-col gap-2">` with the one `h1` (`text-title font-medium`, `basics.name`) and, 8px below it, `<p class="text-pretty text-muted">` with `basics.tagline`. Second, `<nav aria-label="Pages">` with the `<ol>` of `NavRow kind="number"` rows from `SITE_NAV`, 56px below the header (main's `gap-14`). Nothing else renders in `<main>`: its text is exactly the name, the tagline, and the menu rows (derived from `cv.json` and `SITE_NAV`), so no bio, employer, social, or email text appears; no avatar, no cursor, and the page has no top bar.
- **AC-4**: `BaseLayout` takes a new optional prop `centered` (default `false`). When `true`, `<main>` adds `flex-1 justify-center self-center`; only `/` passes it. At 1280×800: the horizontal centre of `<main>` equals the horizontal centre of the viewport within 1px; the header and the nav start at the same left edge (text stays left aligned); `<main>`'s width equals the name's measured text width (a `Range` around the `h1`'s contents) within 1px, never a fixed number (it is 277.2px on Mac and 273px in CI); the space between `<main>`'s top edge and the header equals the space between the nav and `<main>`'s bottom edge within 1px. At 320×400, where the block outgrows the viewport by about 128px (84px with three rows, plus the fourth row's 44px pitch), `<main>` is exactly its content height (the header's top equals `<main>`'s top and the nav's bottom equals `<main>`'s bottom, within 1px) and the page scrolls to the last row and the footer. `/cv` and the 404 page keep a full width, top aligned `<main>`.
- **AC-5**: `SITE_NAV` in `src/lib/site-nav.ts` keeps spec 0004's rules (lowercase labels, absolute hrefs with no trailing slash, only pages that exist, numbers from position), with the planned order in its comment `about` → `/about`, `cv` → `/cv`, `projects` → `/projects`, `contact` → `/contact` (already true since spec 0010). When this feature ships it holds `about`, `cv`, `projects`, and `contact`, so the menu reads `01 about`, `02 cv`, `03 projects`, `04 contact`. A page test fails when `SITE_NAV` has no `/contact` row, so the home page is never the only way to your links and never ships without one. The existing test that every menu `href` answers 200 with redirects disabled stays.
- **AC-6**: Tab order on `/` is the skip link, then every menu row in order, and nothing after (the footer has no link on `/`). On ship the stops read, as `e2e/helpers.ts` labels them, `a "Skip to content"`, `a "01 about"`, `a "02 cv"`, `a "03 projects"`, `a "04 contact"`; the test derives every menu stop from `SITE_NAV` and `formatRowNumber`, never from literals. Every stop shows the 2px accent ring, and the page passes an axe WCAG 2.2 AA check in light and dark.
- **AC-7**: `dist/index.html` has no `<script>`, nothing animates beyond `transition-colors`, and `/` requests only same origin resources (spec 0004 AC-5 carried forward). At 320px wide nothing scrolls sideways, and the tagline is one line tall (the name may wrap to two). The footer is unchanged: its hairline rule, `Toluca, MX · <year>`, and no `← home` link on `/`.
- **AC-8**: `NavRow`, `formatRowNumber`, and `formatProfileHandle` keep spec 0004's contract unchanged (its AC-4 row anatomy and AC-8 helper outputs, including the `satisfies Record<Network, …>` rule), and their Vitest and style guide tests still pass. `/` no longer imports `formatProfileHandle`; `/contact` calls it through `formatContactRows` (spec 0011).
- **AC-9**: `design.md` records the change: `muted`'s role adds the home tagline; the `gap-2` meaning reads "the home h1 and the tagline"; the `text-pretty` example names the tagline; the Spacing and layout section gains the centred home block (the `centered` prop, `flex-1 justify-center self-center`, left aligned text inside, home only); its home composition pointers name spec 0008 instead of 0004. The component count stays eleven, and `/styleguide` is unchanged.
- **AC-10**: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass. The `/` entry in `e2e/site.spec.ts` carries the Tab stops of AC-6, and its home page block checks AC-3, AC-4, AC-5, and AC-7 with every expectation derived from `cv.json` and `SITE_NAV` (a valid content edit needs no test edit, and a new `SITE_NAV` row needs no home test edit). `src/lib/cv-schema.test.ts` covers `tagline` as task 2 lists, and `src/lib/site-nav.test.ts` holds the planned order with `projects` (already true since spec 0010).

## Decision

**Chosen option**: Option 1: a centred block of name, muted tagline, and numbered menu, on the existing shell and components.

The home page shows your name, one short line, and the menu, centred in the page with left aligned text, and nothing else.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Your picks in the interview: a tagline only (no role line), worded `build things, from scratch`, in muted; the bio kept in `cv.json` as the meta description, rewritten plainly; the whole block centred with left aligned text, like t3.gg; `projects` at `/projects` for the third planned row; no socials on home; no top bar, no theme toggle, no typing effect; the footer keeps its rule; the new home ships with About and Contact.

Settled while writing (each with the runner up):

- **The tagline lives in `cv.json` as `basics.tagline`.** It is profile content, and `AGENTS.md` keeps profile content in `cv.json` only. Runner up: a constant beside `SITE_NAV`, which splits your words across two files.
- **The cap is 27 characters.** The column is 272px at a 320px viewport; Plex Mono advances 9.6px per glyph on Mac and 10px in headless Linux Chromium (observed in CI, see the Plex Mono width comment in `e2e/site.spec.ts`), so 27 characters is the most that stays on one line everywhere. Your tagline is 26. Runner up: 40 characters, which lets a phone wrap it to two lines and blurs the line between a tagline and a bio.
- **The tagline is not the meta description and not on the share card.** You chose the rewritten bio for the snippet; the card keeps name and role (spec 0006), so a tagline edit never changes the card. Runner up: the tagline as `og:description`, too short for a useful search snippet.
- **Centring is a `BaseLayout` prop, not page markup.** A page's content cannot make `<main>` grow to the column's height; only the layout can. A boolean keeps the allowed classes fixed, like `printFooter`. Runner up: a `mainClass` string prop, which lets any page put any class on `<main>`.
- **Plain `justify-center`.** `<main>` is a flex item, so it never gets shorter than its content: on a screen too short for the block the page grows and scrolls, and nothing is pushed above the top. `justify-center-safe` would change nothing here, and Safari before 17.6 drops it entirely (the block would sit at the top). Runner up: `my-auto` on `<main>`, which shares the free space with the footer's `mt-auto` and puts the block a third of the way down.
- **The block is centred in the space between the column's top padding and the footer**, which puts it slightly above the middle of the screen (its centre about 42% down an 800px tall window), near where the eye reads centre. t3.gg centres exactly. Runner up: exact viewport centring, which needs the footer taken out of the page flow.
- **The block is as wide as its widest line** (`self-center` on a flex item shrinks it to fit), so it sits truly centred. On today's content the name is widest: 277.2px on Mac, 273px in CI. At 320px the block fills the 272px column. Runner up: t3.gg's fixed 320px column, which leaves the block about 20px left of centre with a name narrower than the column.
- **56px between the header and the menu** (`gap-14`, the design system's section spacing, already on `<main>`). The draft used 40px and t3.gg 64px. Runner up: `gap-10`, a new spacing meaning for one page.
- **Rows stay as `NavRow` draws them** (`min-h-10`, `gap-1`, a 44px pitch). The draft used 44px rows and a 48px pitch. Runner up: `min-h-11`, a size the design system does not use.
- **The single nav keeps `aria-label="Pages"`.** One landmark does not need a name, but it costs nothing, keeps the page test locator, and stays correct if a second nav returns. Runner up: dropping it.
- **No print rule.** `/` is not a print target; the body drops its minimum height in print, so the block prints at the top, still centred across.
- **The bio rewrite ships first, on its own.** It is one content line with no layout change, and it takes Ford off your landing page today while About and Contact are built.

## Rationale

Reasoning, the options weighed, and the reference measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

Your direction in the interview, measured against t3.gg and fbold.dev (numbers in [rationale.md](rationale.md)), with the Claude Design draft `Portfolio.dc.html` (project "Minimalist Developer Portfolio") as a reference for the tagline and the menu. Tokens, type, and components come from `design.md` and spec 0003, unchanged.

### Page composition

Top to bottom inside `<main>` (two children, `gap-14`, centred in the page):

1. `<header class="flex flex-col gap-2">`: `<h1 class="text-title font-medium">{basics.name}</h1>` then `<p class="text-pretty text-muted">{basics.tagline}</p>`.
2. `<nav aria-label="Pages">` with `<ol class="flex flex-col gap-1">` of `NavRow kind="number"`, one per `SITE_NAV` entry, prefix from `formatRowNumber(index)`.

Rendered on ship, centred in the window:

```
                 Jorge González Ozorno
                 build things, from scratch

                 01  about
                 02  cv
                 03  projects
                 04  contact
```

The footer stays at the bottom of the column, full width, with its rule.

### Data model sketch

One new field in `cv.json`; the bio changes content, not rules.

| Field | Type | Rules | Used by |
|---|---|---|---|
| `basics.tagline` | string | required, trimmed, 1 to 27 characters (`CV_LIMITS.tagline`); no glyph rule | `/` only |
| `basics.bio` | string | unchanged: required, at most 160 characters | the home meta description and share tags (spec 0006) |

`SITE_NAV` keeps its type (`readonly { readonly label: string; readonly href: string }[]`); its comment's planned order already names `projects` (spec 0010), so nothing about it changes here.

### State transitions

None. The page is static and changes only on a rebuild.

### API surface

Build time only, no HTTP.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `CV_LIMITS.tagline` (`src/lib/cv-schema.ts`) | `27` | the cap | n/a |
| `basics.tagline` (`makeCvSchema`) | `text(CV_LIMITS.tagline)` | the trimmed string | a schema issue fails the build |
| `BaseLayout` (`src/layouts/BaseLayout.astro`) | new `centered?: boolean`, default `false` | `<main>` with `flex-1 justify-center self-center` added when `true` | n/a |
| `SITE_NAV` (`src/lib/site-nav.ts`) | unchanged | the shipped pages in menu order | n/a |
| `/` (`src/pages/index.astro`) | calls `getCv()` once; passes `centered` | the page | the `getCv()` throw (spec 0002) |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/` | `<title>` | `pageMeta('home')`: `basics.name · basics.label` (spec 0006) |
| Render `/` | meta description, `og:description` | `basics.bio` (spec 0006's home rule, the new text from AC-1) |
| Render `/` | the h1 | `basics.name` |
| Render `/` | the tagline and its colour | `basics.tagline` (this spec); `text-muted` |
| Render the menu | rows, labels, hrefs, order | `SITE_NAV` |
| Render the menu | the two digit number | `formatRowNumber(index)` |
| Lay out `/` | whether `<main>` centres | the `centered` prop, passed by `index.astro` alone |
| Lay out `/` | the block's width | its widest line (`self-center` shrinks it to fit), capped by the `max-w-content` column |
| Lay out `/` | the block's height position | `flex-1` plus `justify-center`: centred between the column's top padding and the footer (a 33px footer: 1px rule, 16px `pt-4`, one 16px `text-xs` line); on a screen too short for it, `<main>` is its content height and the page scrolls |
| Footer | city, country code, year, rule | `SiteFooter` (spec 0003), unchanged |
| Share card | name, role, host | spec 0006, unchanged |

### Key invariants

- `/` shows no employer: `<main>`'s text is only the name, the tagline, and the menu, and the head reads only `basics.name`, `basics.label`, and `basics.bio`.
- `SITE_NAV` always contains `/contact` while `/` carries no social rows.
- Exactly one `h1`, one `nav`, no `role` attribute under `body`, no `target`, no `style`, no `<script>` on `/`.
- Colours only from the six tokens; no new token and no arbitrary value (`flex-1`, `justify-center`, and `self-center` are stock Tailwind utilities).
- `centered` changes `/` alone; every other page's layout is byte for byte what it was.

### Security model

A public static page with no input. Removing the email and profile links from `/` changes nothing here; they stay public on `/cv` and `/contact`. No script, so the CSP hash list is unchanged. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Bio and title (`site.spec`, `verify`): the `/` title and description come from `pageMeta` as today (the existing case); the one time grep finds no `Ford` in `dist/index.html`, verifies **AC-1**.
- Tagline schema (Vitest): 27 characters pass, 28 fail, missing and whitespace only fail, verifies **AC-2**.
- Composition (`site.spec`): `<main>` has two children, the header holds the name and the tagline from `cv.json` in the muted token 8px below, the nav is 56px below, `<main>`'s text is exactly name, tagline, and menu rows, no `Elsewhere` nav, no `mailto:` or external link in `<main>`, verifies **AC-3**.
- Centring (`site.spec`): at 1280×800 the centre, width, and equal space checks of AC-4; at 320×400 `<main>` is its content height and the last row and footer scroll into view; `/cv`'s `<main>` still spans the column, verifies **AC-4**.
- Menu (`site.spec`): rows equal `SITE_NAV` in order with numbers from `01`, `SITE_NAV` has a `/contact` row, every href answers 200, verifies **AC-5**.
- Keyboard and axe (`site.spec`): the Tab stops of AC-6, each with the ring; axe clean in light and dark, verifies **AC-6**.
- No script, 320px, footer (`site.spec`): no `<script>`, same origin requests only, no sideways scroll, the tagline one line tall, the footer rule and no home link, verifies **AC-7**.
- Carried forward (Vitest and `styleguide.spec`): the existing `NavRow`, `formatRowNumber`, and `formatProfileHandle` tests pass untouched, verifies **AC-8**.
- Docs (`verify`): the `design.md` lines of AC-9, verifies **AC-9**.
- Gate (commands), verifies **AC-10**.
- Auth and permission: not applicable; the site has no users.

## Migration plan

**Strategy**: phased, three merges, each a normal deploy through the CI gate (spec 0007).
**Phases**:
1. Now: the bio rewrite and the derived menu tests (build plan task 1). Ford leaves the landing page and the snippet; the layout is untouched.
2. About (scope feature 12, spec 0009, done), Projects (scope feature 11, spec 0010, done), and Contact (scope feature 13, spec 0011) ship through their own specs, each adding its `SITE_NAV` row with no home test edit (spec 0009 AC-8 derived the menu tests). The old home shows `01 about` to `04 contact` plus the social rows for a while, a harmless overlap.
3. This redesign (build plan tasks 2 to 5) merges once `/contact` is live. The AC-5 test fails on any branch where it is not.
**Rollback**: revert the phase 3 merge; the deploy job ships the previous `dist/` and the social rows return.
**Risks**: merging phase 3 first would leave your links only on `/cv`; the `/contact` row check blocks that.

## Build plan

Skateboard: the one line that fixes the intro ships first; the new page ships whole, once the pages it points to exist.

1. [x] Rewrite `basics.bio` in `src/content/cv.json` to the AC-1 text. Run the gate and merge on its own, before spec 0011 (the order you chose on 2026-09-26). The derived menu tests this task also asked for already landed with spec 0009 (its AC-8: the `/` entry's menu stops, the Pages nav row texts, and the ring test's names come from `SITE_NAV` through `MENU_ROWS`), satisfies **AC-1**, **AC-6**, **AC-10**.
2. [x] Add `tagline: 27` to `CV_LIMITS` and `tagline: text(CV_LIMITS.tagline)` to `basics` in `src/lib/cv-schema.ts`, with the 272px column basis in the `CV_LIMITS` comment; set `basics.tagline` in `cv.json`. In `src/lib/cv-schema.test.ts`: add `tagline` to the `basics` fixture, to the required field `it.each`, to both cap tables (with `chars`), and to the `CV_LIMITS` `toEqual`; add one whitespace only tagline case, satisfies **AC-2**, **AC-10**.
3. [x] Precondition: `/about`, `/projects`, and `/contact` (spec 0011) are merged and in `SITE_NAV`. Add the `centered` prop to `BaseLayout`; recompose `src/pages/index.astro` as the header (name and muted tagline) and the Pages nav, passing `centered`, dropping the Elsewhere nav and the `formatProfileHandle` import (the planned order comment and the `planned` array already name `projects`, since spec 0010), satisfies **AC-3**, **AC-4**, **AC-5**, **AC-7**, **AC-8**.
4. [x] Update the home page block in `e2e/site.spec.ts`: two children; the tagline from `cv.json` in muted; `<main>`'s text as `toHaveText([basics.name, basics.tagline, ...rows].join(' '))` (Playwright normalises whitespace); no `Elsewhere` nav; the 1280×800 centre, width (`Range` measured), and equal space checks; a test titled `at 320×400 main is its content height and the page scrolls`; `/cv` still full width; the tagline one line at 320px; a test titled `the Pages nav holds a contact row`; keep the menu 200 check; drop the three hard coded social stops from the `/` entry in `PAGES`; delete the Elsewhere tests, including the 320px email wrap test (spec 0011 AC-6 carries it on `/contact`); update the two `Spec 0004` comments to 0008, satisfies **AC-1**, **AC-3** to **AC-7**, **AC-10**.
5. [x] Update `design.md` (AC-9 lines), then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the steps in [verify.md](verify.md), satisfies **AC-8**, **AC-9**, **AC-10**.

## Consequences

**Positive**:
- Your intro no longer names an employer, and it survives a job change without an edit.
- Three short lines and a menu: the page reads in a second and looks like its references.
- No new component, dependency, or script; two new utilities and one layout prop.
- The bio fix ships today, separate from the redesign.

**Negative / tradeoffs**:
- GitHub, LinkedIn, and email move from one click to two (home, then `/contact`); a peer who wanted your profile at a glance now has to look for it.
- The redesign waits on About and Contact; until then the old layout stays live, with the new bio.
- The tagline is capped at 27 characters; a longer line needs a new cap and a layout check.
- The block sits slightly above the true middle of the window, not exactly centred like t3.gg.
- Page tests for `/` are rewritten, not extended, so task 4 is not optional.

**Neutral**:
- `basics.bio` now appears only in the head and share tags; its name stays, since spec 0006's rule reads it.
- `cv.json` carries both `label` (your role, for `/cv`, the title, and the card) and `tagline` (home only).
- `formatProfileHandle` and `NavRow kind="key"` stay on `/contact` (through `formatContactRows`, spec 0011) as their only caller outside the style guide.
- Each menu row's hover and focus area narrows with the block, from 592px to about 277px wide; rows stay 40px tall.
- The draft's top bar, theme toggle, typed tagline, blinking cursor, and ruleless footer stay dropped, as in spec 0004.

## Follow-up

- [x] `/scope`: enroll **Home page redesign** in Release 1 after About (12) and Contact (13), linked to this spec; rename feature 11 to **Projects page** at `/projects` (it adds the `projects` row after `cv`); note on feature 5 that spec 0008 replaces its bio and links.
- [x] Contact page spec: written as [spec 0011](../0011-contact-page/index.md). It renders the email first, then the profiles (your pick, like the draft), as `NavRow kind="key"` rows through `formatContactRows`, inside an `<address>`, and carries the 320px email wrap test (its AC-6).
- [ ] Spec 0004 is superseded; its `NavRow`, `SITE_NAV`, `formatRowNumber`, and `formatProfileHandle` decisions carry forward here unchanged (AC-8).
- [ ] `/sync` after the build: `AGENTS.md`'s Site navigation rule names spec 0008 and the planned order `about`, `cv`, `projects`, `contact`, and gains the `centered` prop; its landmark note drops `Elsewhere` (only `Pages` remains on `/`); the content rule mentions `basics.tagline`.
- [x] About page spec: settled by spec 0009 (a closing sentence with the email inline, no rows).
