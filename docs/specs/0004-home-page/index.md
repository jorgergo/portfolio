# 0004. Home page composed as a numbered menu

**Date**: 2026-09-24
**Status**: In Progress

## Summary

The home page becomes a short plain text menu under your name. It shows your name, your one line bio, a numbered list of the site's pages (only pages that exist, so `cv` alone on day one, then `about`, `portfolio`, and `contact` as they ship), and three keyed rows for GitHub, LinkedIn, and email. Everything comes from `cv.json` plus one small list of pages in code; there is no avatar, no animation, and no JavaScript, and one new row component (a link with a muted prefix and a label) draws both lists. The About and Contact pages you chose become two small release 1 features of their own.

## Requirements

**User stories**:
- As a recruiter, I want to see who you are and reach your CV in one click, so that I can judge fit in seconds.
- As a peer, I want your GitHub, LinkedIn, and email on the first screen, so that I can follow or contact you without hunting.
- As the site owner, I want the menu to gain a row when a page ships, so that About, Portfolio, and Contact join the home page without a redesign.
- As a keyboard or screen reader user, I want the page to be two labelled lists of links, so that I can move through it in order and know where each link goes.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/` renders through `BaseLayout` with `title` set to `basics.name` and `description` set to `basics.bio`, so `<title>` reads `Jorge González Ozorno` and the meta description is the bio. Inside `<main>` a `<header class="flex flex-col gap-2">` holds the one `h1` (`text-title font-medium`) with `basics.name` and, 8px below it, a `<p class="text-pretty">` with `basics.bio` in `fg`. Nothing else is in that block: no label, no location line, no avatar, no cursor.
- **AC-2**: Below the header a `<nav aria-label="Pages">` holds an `<ol>` of menu rows built from `SITE_NAV` in `src/lib/site-nav.ts`. `SITE_NAV` lists only pages that exist under `src/pages/`, in this fixed order once they all exist: `about` → `/about`, `cv` → `/cv`, `portfolio` → `/portfolio`, `contact` → `/contact`. On the day this feature ships it holds `cv` alone. Each row shows its position as a two digit number (`01`, `02`) in `muted` with `aria-hidden="true"`, then the lowercase label in `fg`, and links to the page. Neither list carries a `role` attribute: both sit inside a `<nav>`, where Safari keeps list semantics under Tailwind's list style reset, and the a11y lint rule against redundant roles stays green.
- **AC-3**: Below the menu a `<nav aria-label="Elsewhere">` holds a `<ul>` of social rows: one per entry of `basics.profiles` in file order, then one for `basics.email`. Each row shows a lowercase key in `muted` (the network name lowercased, `github` or `linkedin`, and the literal `email`), then the value in `fg`: `@<username>` for GitHub, `in/<username>` for LinkedIn, the address for email. The key is not hidden from assistive tech, so the link's accessible name is the visible text (`github @jorgergo`), as WCAG 2.5.3 (label in name) asks. GitHub and LinkedIn rows link to the profile `url` and end with the `ArrowUpRight` icon; the email row links to `mailto:<email>` with no arrow. When `profiles` is absent or has one entry, only the rows that exist render; the email row always renders. No visible label sits above the group.
- **AC-4**: A new `NavRow` component in `src/components/NavRow.astro` renders each row as one `<li>` holding one `<a>` with `flex min-h-10 flex-wrap items-center gap-4 font-mono text-fg transition-colors hover:text-accent-warm focus-visible:text-accent-warm`, no `target`, and the `class` prop merged onto the `<a>`. The prefix is a `shrink-0 text-muted` span, `w-6` wide for `kind="number"` (with `aria-hidden="true"`) and `w-20` wide for `kind="key"` (no `aria-hidden`), followed by one space in the text content and then an inner `inline-flex shrink-0 items-center gap-2` span holding the label and, when `href` starts with `http`, `<ArrowUpRight class="size-4 shrink-0" />`. Because the inner span does not shrink, a value that does not fit beside its key drops whole onto the next line instead of breaking mid word. On hover and keyboard focus the label and the arrow turn `accent-warm` while the prefix stays `muted`; the global focus ring applies. Rows in a list sit `gap-1` (4px) apart.
- **AC-5**: `dist/index.html` contains no `<script>` element and nothing on the page animates beyond `transition-colors`; loading `/` requests only same origin resources: the page, the stylesheet, the two Plex Mono files, and `/favicon.svg`, with no request to another origin.
- **AC-6**: The header, the Pages nav, and the Elsewhere nav are the three direct children of `<main>`, `gap-14` apart, top aligned and left aligned inside the `max-w-content` column with the shell's padding, rendered in light and dark from the six tokens alone; at 320px wide nothing scrolls sideways and the email address stays whole (it wraps under its key). The footer shows `Toluca, MX · <year>` and no `← home` link.
- **AC-7**: Tab order on `/` is the skip link, then every menu row in order, then every social row in order, and nothing after (the footer has no link on `/`). On day one the stops read, as `e2e/helpers.ts` labels them, `a "Skip to content"`, `a "01 cv"`, `a "github @jorgergo"`, `a "linkedin in/jorgergo"`, `a "email jorgergo@icloud.com"`. Every stop shows the 2px accent ring, and the page passes an axe WCAG 2.2 AA check in light and dark.
- **AC-8**: `formatProfileHandle({ network: 'GitHub', username: 'jorgergo' })` returns `@jorgergo` and `{ network: 'LinkedIn', username: 'jorgergo' }` returns `in/jorgergo`; `formatRowNumber(0)` returns `01` and `formatRowNumber(9)` returns `10`. Both are pure functions in `src/lib/`, and Vitest covers those four outputs. The handle rules are one object declared `satisfies Record<Network, (username: string) => string>`, so adding a network to `NETWORKS` without a rule fails `astro check` inside `pnpm build` (Vitest does no type checking).
- **AC-9**: `/styleguide` renders `NavRow` in both panels: an `<ol>` holding `kind="number"`, `href="/cv"`, `prefix="01"`, `label="cv"`, and a `<ul>` holding `kind="key"`, `href="https://github.com/jorgergo"`, `prefix="github"`, `label="@jorgergo"` (which shows the arrow); its spacing list gains `gap-1` and `gap-4`. `design.md` counts nine components, adds `NavRow` to its component list and to the interactive rows line, and records the spacing meanings `gap-2` (a heading and its subtitle), `gap-1` (between rows in a list), and `gap-4` (a row's prefix to its label), the prefix widths (`w-6` numbers, `w-20` keys), and `text-pretty` for short standalone paragraphs such as the bio.
- **AC-10**: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass. The `/` entry in `e2e/site.spec.ts` carries the new title and the five Tab stops of AC-7 (its description stays `basics.bio`); link locators in `e2e/styleguide.spec.ts` that would now also match a `NavRow` (for example the GitHub `IconLink`) use `exact: true`; and a page test reads every `href` from the rendered Pages nav and proves each answers 200 from the preview server with redirects disabled (so `/cv/` answering 307 would fail, not pass).

## Decision

**Chosen option**: Option 1: a numbered page menu and keyed social rows, drawn by one new row component on the existing shell.

The home page is your name, your bio, the pages that exist as numbered rows, and your profiles and email as keyed rows, with no avatar, no motion, and no script.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Settled while writing (each with the runner up):

- **Design source: `design.md` and the built components**, your pick in the interview. The Claude Design draft was read for its home and contact markup only; the ideas that survive are the numbered rows and the keyed contact rows, rebuilt on the tokens (basis: `design.md`, the build mandate; spec 0003, the follow up that names this spec's four questions).
- **`NavRow` renders the `<li>` and the `<a>` together.** Props `href`, `prefix`, `label`, `kind` (`'number' | 'key'`), and `class` merged onto the `<a>` with `class:list`, as `IconLink` does. The parent writes the list element and the nav landmark. External detection reuses `IconLink`'s rule (`/^https?:\/\//`), so `mailto:` gets no arrow (basis: spec 0003 AC-7, the external arrow rule). Runner up: a bare `<a>` component with the `<li>` written in the page, which repeats the list markup on every page that uses rows.
- **Numbers are hidden from assistive tech, keys are not.** A number is decoration the `<ol>` already conveys, so it is `aria-hidden`. A key is part of what a speech input user reads aloud (`github @jorgergo`), so it stays in the accessible name (basis: WCAG 2.5.3, label in name; the accessibility skill). Runner up: hide both and add an `aria-label` per row, which duplicates the visible text and drifts.
- **Prefix widths on the numeric scale, one per list.** Plex Mono advances 0.6em per glyph, so at 16px `01` is about 19px (fits `w-6`, 24px) and `linkedin`, the longest key, is about 77px (fits `w-20`, 80px); the draft used 24px and 80px too. A key longer than 8 characters needs a wider column, a decision for the spec that adds it. Runner up: one `w-20` column for both lists so every label shares a left edge, rejected because it leaves 56px of dead space between `01` and `cv`, and the two groups are separate blocks 56px apart with nothing to align across. Also rejected: `ch` widths, which need an arbitrary value the rules ban (basis: `AGENTS.md`, no arbitrary Tailwind values in components).
- **Key rows wrap instead of breaking a value.** At 320px the column is 272px and the email row needs about 278px (80 + 16 + 19 glyphs at 9.6px), so `body`'s `overflow-wrap: anywhere` would print `jorgergo@icloud.co` and a lone `m`. With `flex-wrap` on the `<a>` and `shrink-0` on the inner span, the value drops whole under its key in that narrow window (320px to 326px) and sits on one line above it. A value wider than the whole column (over 28 characters at 320px) would overflow sideways; no current content is near that, and the schema keeps the email a plain address. Runner up: `gap-2` on key rows only, which fits the current email with 2px to spare and breaks on the next one.
- **Row height `min-h-10`** (design.md's interactive row minimum, 40px), not the draft's 44px, with `gap-1` between rows, a 44px pitch. Runner up: `min-h-11`, a size the design system does not use.
- **Numbers come from position** (`formatRowNumber(index)` returns `String(index + 1).padStart(2, '0')`), never stored, so the list renumbers itself as pages ship. It lives in `src/lib/site-nav.ts` beside `SITE_NAV`.
- **`formatProfileHandle` lives in `src/lib/cv-format.ts`** and types its input from `NETWORKS` in `cv-schema.ts` (a new `export type Network = (typeof NETWORKS)[number]`), not from `CvProfile` in `cv.ts`, so Vitest loads it without `astro:content` (basis: spec 0002, the `astro/zod` only rule for testable helpers). The rules are one object literal declared `satisfies Record<Network, (username: string) => string>`: `GitHub` gives `@${username}`, `LinkedIn` gives `in/${username}`. A new network in the enum fails `astro check` until it gets a rule; Vitest checks only the outputs, since it does not type check. Runner up: a `switch`, which needs a `never` guard to be exhaustive.
- **Keys are the network name lowercased** (`network.toLowerCase()`) plus the literal `email`. Runner up: a second map, more code for the same two words.
- **The bio is `fg`, not `muted`.** It is the page's one sentence of content; the draft's muted tagline was meta text. Runner up: `muted`, which the tokens reserve for dates, keys, chips, and the footer (basis: `design.md`, the token roles).
- **Landmarks named `Pages` and `Elsewhere`.** Two `<nav>` elements need distinct accessible names, and `Contact` was avoided because the menu has a `contact` row (basis: WAI-ARIA landmark practice, unique names for repeated landmarks). Runner up: a `<section>` with a visually hidden heading, more markup for the same outcome.
- **No `role` on the lists.** Tailwind's preflight sets `list-style: none`, and Safari's VoiceOver then drops list semantics for lists outside a `<nav>`; both lists here sit inside one, where WebKit keeps them. An explicit `role="list"` would also trip the lint preset's redundant role rule and the style guide test that asserts no `role` attribute under `body` (basis: `design.md` and spec 0003 AC-9, no ARIA roles on generic elements; the a11y lint preset in `eslint.config.js`). The VoiceOver check is a step in [verify.md](verify.md). Runner up: `role="list"` plus a lint exception for `ol` and `ul`, two config lines to work around a heuristic that does not apply here.
- **The header block is a `<header>` inside `<main>`** (not a banner landmark when nested), holding the `h1` and the bio. Runner up: a plain `<div>`.
- **`SITE_NAV` holds shipped pages only.** Each page spec adds its own row (`about` first, `portfolio` after `cv`, `contact` last), and a dead row is caught by the page test that every menu `href` answers 200. Runner up: a full list with a `ready` flag, which ships a hidden row and needs a filter.

## Rationale

Reasoning, options, the reference check, the draft's markup, and the cross check: see [rationale.md](rationale.md).

## Feature design

### Design source

`design.md` and spec 0003's tokens and components, chosen by you. The draft `Portfolio.dc.html` in the Claude Design project "Minimalist Developer Portfolio" was read for its home and contact frames; a summary is in [rationale.md](rationale.md). There is no screenshot and no frame to match pixel for pixel.

### Page composition

Top to bottom inside `<main>` (three children, `gap-14`):

1. `<header class="flex flex-col gap-2">`: `<h1 class="text-title font-medium">{basics.name}</h1>` then `<p class="text-pretty">{basics.bio}</p>`.
2. `<nav aria-label="Pages">` with `<ol class="flex flex-col gap-1">` of `NavRow kind="number"`, one per `SITE_NAV` entry, prefix from `formatRowNumber(index)`.
3. `<nav aria-label="Elsewhere">` with `<ul class="flex flex-col gap-1">` of `NavRow kind="key"`: the profiles in file order, then the email.

Rendered on day one, in the 640px column:

```
Jorge González Ozorno
Full Stack Developer building internal platforms, AI
assistants, and release automation at Ford.

01  cv

github    @jorgergo ↗
linkedin  in/jorgergo ↗
email     jorgergo@icloud.com
```

Once About, Portfolio, and Contact ship the menu reads `01 about`, `02 cv`, `03 portfolio`, `04 contact`. Inner pages keep spec 0003's `← home` footer link and show no menu; the home page is the menu.

### Data model sketch

No change to `cv.json` or its schema. The page reads `basics.name`, `basics.bio`, `basics.profiles` (0 to 2 entries, `network` unique), and `basics.email`. One new code level list:

| Item | Where | Shape | Rules |
|---|---|---|---|
| `SITE_NAV` | `src/lib/site-nav.ts` | `readonly { readonly label: string; readonly href: string }[]` | lowercase labels; hrefs are absolute site paths with no trailing slash; only pages that exist; eventual order `about`, `cv`, `portfolio`, `contact`; the planned order sits in a comment above the list |

The menu is site structure, not CV content, so it stays out of `cv.json` (whose schema is strict and about the CV).

### State transitions

None. The page is static and changes only on a rebuild.

### API surface

Build time functions and one component, no HTTP.

| Function or component (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `SITE_NAV` (`src/lib/site-nav.ts`) | `readonly { readonly label: string; readonly href: string }[]` | the shipped pages in menu order | n/a |
| `formatRowNumber` (`src/lib/site-nav.ts`) | `(index: number) => string` | `01` for 0, `10` for 9 | none; the input is a list position |
| `Network` (`src/lib/cv-schema.ts`) | `type Network = (typeof NETWORKS)[number]` | the network union | n/a |
| `formatProfileHandle` (`src/lib/cv-format.ts`) | `(profile: { readonly network: Network; readonly username: string }) => string` | `@jorgergo` · `in/jorgergo` | none; `network` is schema checked, and the rules object `satisfies Record<Network, …>` |
| `NavRow` (`src/components/NavRow.astro`) | `href: string` · `prefix: string` · `label: string` · `kind: 'number' \| 'key'` · `class?: string` (onto the `<a>`) | `<li><a …><span [aria-hidden when number]>prefix</span> <span>label [arrow]</span></a></li>` | n/a |
| `/` (`src/pages/index.astro`) | calls `getCv()` once in frontmatter | the page | the `getCv()` throw when the entry is missing (spec 0002) |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/` | `<title>`, the h1 text | `basics.name` (spec 0002, required) |
| Render `/` | the meta description, the bio paragraph | `basics.bio` (spec 0002, required, at most 160 characters) |
| Render the menu | which rows, their labels, hrefs, and order | `SITE_NAV` (this spec) |
| Render the menu | the two digit number | `formatRowNumber(index)` from the row's position |
| Render the socials | which rows and their order | `basics.profiles` in file order, then `basics.email` |
| Render the socials | the key word | `profile.network.toLowerCase()`; the literal `email` |
| Render the socials | the value | `formatProfileHandle(profile)`; `basics.email` |
| Render the socials | the href | `profile.url`; `` `mailto:${basics.email}` `` |
| Render a row | whether the arrow shows | `href` matches `/^https?:\/\//` (spec 0003's external rule) |
| Render a row | the prefix width and whether it is hidden | `kind`: `number` gives `w-6` and `aria-hidden`, `key` gives `w-20` and no hiding |
| Render a row | the accessible name | the text content: the label alone for a number row, `key value` for a key row |
| Render a row | hover and focus colour, the ring | `accent-warm` on the `<a>`, the global focus rule (spec 0003) |
| Footer | city, country code, year | `SiteFooter` (spec 0003) |
| Whole page | fonts, colour scheme, favicon, print, reduced motion | `global.css` and `BaseLayout` (spec 0003) |

### Key invariants

- Every `SITE_NAV` href is a page that builds; the page test fails otherwise.
- A menu row's number equals its position plus one, zero padded to two digits.
- The Elsewhere list is never empty, because `basics.email` is required by the schema.
- Exactly one `h1`; the two `<nav>` landmarks have distinct names; no element under `body` carries a `role` attribute.
- No `<a>` carries `target`, no element carries `style`, and `/` ships no `<script>`.
- Colours come only from the six tokens; the only new utilities are spacing, width, and wrap steps from Tailwind's default scale.

### Security model

A public static page with no input. The email address is a `mailto:` link and is already public on the CV page (spec 0002 keeps the phone and street address out). No script, so the CSP hash list carries only the font style hash it carries today. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

Each maps to an acceptance criterion and names where it runs: `site.spec` and `styleguide.spec` are the Playwright files in `e2e/`, `verify` is a manual step in [verify.md](verify.md).

- Happy path (`site.spec`): the built `/` has the name as title and h1, the bio as description and paragraph, `01 cv` linking to `/cv`, `github @jorgergo ↗` to `https://github.com/jorgergo`, `linkedin in/jorgergo ↗` to the LinkedIn URL, and `email jorgergo@icloud.com` to `mailto:jorgergo@icloud.com`, verifies **AC-1**, **AC-2**, **AC-3**.
- Row anatomy (`styleguide.spec`): a `NavRow` is 40px or taller, the number prefix is `aria-hidden` and the key prefix is not, the prefix stays muted while the label turns `accent-warm` on hover and on focus, and the arrow shows only on the `https` example, verifies **AC-4**, **AC-9**.
- No script (`site.spec`): `dist/index.html` has no `<script>`; the requests made by `/` are same origin only: the page, the stylesheet, two font files, the favicon, verifies **AC-5**.
- Layout (`site.spec` for 320px, `verify` for the gaps): at 320px nothing scrolls sideways and the email row shows the address whole under its key; the three blocks are 56px apart; the footer has no home link, verifies **AC-6**.
- Keyboard and axe (`site.spec`): Tab visits the five stops of AC-7, each with the ring; axe reports no violation in light and dark, verifies **AC-7**.
- Helpers (Vitest): the four outputs of AC-8; the `satisfies` clause is proven by `pnpm build` (a temporary extra network in `NETWORKS` must fail `astro check`, a `verify` step), verifies **AC-8**.
- List semantics (`verify`): VoiceOver on `/` announces the Pages and Elsewhere lists with their item counts, verifies **AC-2**, **AC-3**.
- Missing profile (`verify`): with `profiles` cut to one entry, then removed, in a temporary edit, the build passes and the page shows only the existing rows plus email, verifies **AC-3**.
- Links and gate (`site.spec` and commands): every menu `href` answers 200 with redirects disabled; build, lint, format, and both test runners pass, verifies **AC-10**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the whole page first, complete and usable with the one row that exists, then the proofs and the documentation.

1. [x] Write `src/lib/site-nav.ts` (`SITE_NAV` with the `cv` entry and the planned order in a comment, `formatRowNumber`), add the `Network` type to `src/lib/cv-schema.ts` and `formatProfileHandle` (rules object with `satisfies`) to `src/lib/cv-format.ts`, write `src/components/NavRow.astro`, and recompose `src/pages/index.astro` (title and description from `basics`, the header, the Pages nav, the Elsewhere nav), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
2. [x] Write the Vitest cases for `formatRowNumber` (`src/lib/site-nav.test.ts`) and `formatProfileHandle` (added to `src/lib/cv-format.test.ts`), tagged `AC-8`, satisfies **AC-8**.
3. [x] Add `NavRow` to `/styleguide` (the pinned numbered and keyed examples in both panels, `gap-1` and `gap-4` in its spacing list) and to `design.md` (nine components, the `NavRow` rule and the interactive rows line, the spacing meanings, the prefix widths, `text-pretty`), satisfies **AC-9**.
4. Update `e2e/site.spec.ts` (the `/` title and five Tab stops, the same origin request check, the menu href 200 check with redirects disabled, the 320px email check) and `e2e/styleguide.spec.ts` (`exact: true` on link names that a `NavRow` would also match, the row anatomy checks), then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the manual steps in [verify.md](verify.md), satisfies **AC-7**, **AC-10**.

## Consequences

**Positive**:
- Complete on day one with the one page that exists; About, Portfolio, and Contact each add a row with one line in `SITE_NAV`.
- Zero JavaScript, so the page is the shell plus text: nothing to hash, nothing to animate, nothing to break under reduced motion.
- One new component draws both lists, the Contact page reuses it for its own keyed rows, and the command menu (release 2) reuses `SITE_NAV` for its pages group.
- The socials are one Tab stop each, named by their visible text, inside a named landmark, with spec 0003's external arrow rule kept.

**Negative / tradeoffs**:
- Until About and Contact ship the menu is a single row, `01 cv`, which reads thin; the socials keep the page useful, but the release 1 plan now carries two more small pages.
- Numbers shift as pages ship (`cv` moves from `01` to `02` when About lands); nothing links to a number, so only the visible digits change.
- The socials appear twice once the Contact page exists (home and `/contact`), a duplication you chose so the home page keeps its links.
- `w-20` caps a key at 8 characters in Plex Mono at 16px; a longer network name needs a wider column and a spec line.
- Between 320px and 326px the email address sits on its own line under `email`; a value wider than the whole column would overflow sideways, which no current content approaches.
- List semantics in Safari rest on WebKit's rule that lists inside a `<nav>` keep their role without `list-style`; if that heuristic changes, the VoiceOver step in `verify.md` is what catches it.
- Lowercase labels put `cv` and `github` against their proper capitals; the footer's `home` set that convention.
- The Tab order and title expectations for `/` in `e2e/site.spec.ts` and the link locators in `e2e/styleguide.spec.ts` change, so task 4 is not optional.

**Neutral**:
- The menu is code, not content: reordering it is a code change, by design, because site structure is not CV content.
- The canonical link, Open Graph tags, and the inner page title pattern belong to the metadata spec; `/` passes the name and the bio today.
- The draft's header crumb, theme toggle, typed tagline, and blinking cursor stay dropped.

## Follow-up

- [ ] `/scope`: enroll **About page** (`/about`, your `basics.summary` and a photo if you add one, adds the `about` row) and **Contact page** (`/contact`, a keyed `NavRow` list, adds the `contact` row, and the home of the deferred contact form later) as release 1 features. Neither reopens this spec; each may go straight to `/develop` if you already know the build.
- [ ] Portfolio page spec: add the `portfolio` row after `cv`.
- [ ] Command menu spec: build its pages group from `SITE_NAV` and its socials from `basics.profiles`.
- [ ] Metadata spec: canonical link, Open Graph tags, and the inner page title pattern (`cv · Jorge González Ozorno`).
- [ ] `/sync` after the build: add `NavRow` and `src/lib/site-nav.ts` to `AGENTS.md`'s layout and component notes, and confirm `design.md`'s new rows.
