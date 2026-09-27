# 0011. Contact page as keyed rows for email, GitHub, and LinkedIn

**Date**: 2026-09-26
**Status**: In Progress

## Summary

`/contact` becomes the smallest page on the site: the heading `contact`, then three rows, `email`, `github`, and `linkedin`, each a muted key and your address or handle as a link, exactly like the contact frame of your Claude Design draft. The rows reuse `NavRow`, the component the home page already draws its social rows with, and read everything from `cv.json`, so the address still lives in one place. The page adds `04 contact` to the home menu, its own title, description (`How to reach Jorge: email, GitHub, or LinkedIn.`), and share card. There is no intro, no form, no script, and no new component; the one new rule caps your email at 27 characters so it always fits a phone screen. Once it is live, spec 0008's home redesign can take the social rows off the home page.

## Requirements

**User stories**:
- As a recruiter or a peer, I want every way to reach you on one short page, so that I can pick the channel I prefer without reading the CV.
- As a visitor on a phone, I want each channel to be one large tap target, so that I can open mail, GitHub, or LinkedIn with my thumb.
- As a keyboard or screen reader user, I want one heading and one list of links, each named by its channel, so that I know where each link goes before I follow it.
- As the site owner, I want the address and profiles to come from `cv.json` alone, so that changing them never needs a code or test edit.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/contact` renders through `BaseLayout` with `pageMeta('contact', cv, Astro.site)` spread into it. `<title>` reads `Contact · Jorge González Ozorno`, the meta description reads `How to reach Jorge: email, GitHub, or LinkedIn.`, the canonical is `https://jorgergo.dev/contact`, and the page carries spec 0006's share tags in their order, with `og:image` `https://jorgergo.dev/og/contact.png` and `og:image:alt` `Contact, Jorge González Ozorno, Full Stack Developer`. `printFooter` keeps its default, and the page does not pass spec 0008's `centered` prop.
- **AC-2**: `SHARE_PAGES` in `src/lib/site-meta.ts` gains `{ key: 'contact', path: '/contact', label: 'Contact' }` as its last row (after `projects`, the menu order). `MetaCv['basics']` gains `readonly profiles?: readonly { readonly network: string }[] | undefined`. A new exported `formatChannelList(basics)` in the same file returns `email` followed by each profile's `network` in `cv.json` order, joined by an English `or` list (`Intl.ListFormat('en', { style: 'long', type: 'disjunction' })`): two profiles give `email, GitHub, or LinkedIn`, one gives `email or GitHub`, and a missing or empty `profiles` gives `email`. `DESCRIPTIONS` gains `contact: ({ basics }) => \`How to reach ${givenName(basics.name)}: ${formatChannelList(basics)}.\``. The build draws `/og/contact.png`, a 1200×630 PNG under 300 KB with the label `CONTACT`, the name, the role, and the footer `jorgergo.dev/contact` and `Toluca, MX` (30 of `FOOTER_BUDGET`'s 60 characters). Vitest in `src/lib/site-meta.test.ts` covers the three `formatChannelList` cases plus `profiles: undefined`; `DESCRIPTIONS.contact` on the inline `cv` fixture, which gains today's two profiles (`{ network: 'GitHub' }`, `{ network: 'LinkedIn' }`) and gives `How to reach Jorge: email, GitHub, or LinkedIn.`, on the second fixture as it is (no profiles, `How to reach Ada: email.`), and on that fixture with one GitHub profile (`How to reach Ada: email or GitHub.`); and `pageMeta('contact')`. Two existing cases change: the `SHARE_PAGES` `toEqual` (line 61) lists five rows and its title names Contact, and the `footerLength` table (line 380) gains `['contact', 30]`. The tests never read `cv.json` (spec 0006 AC-18).
- **AC-3**: A new exported `formatContactRows(basics)` in `src/lib/cv-format.ts` returns `readonly ContactRow[]`, where `ContactRow` is `{ readonly key: string; readonly href: string; readonly label: string }`. The first row is always `{ key: 'email', href: 'mailto:' + basics.email, label: basics.email }`; then one row per `basics.profiles` entry in `cv.json` order, with `key` the network in lower case (`network.toLowerCase()`), `href` the profile's `url`, and `label` `formatProfileHandle(profile)`. A missing or empty `profiles` gives the email row alone. Vitest in `src/lib/cv-format.test.ts` covers, with inline fixtures: today's three rows exactly; `profiles` missing; `profiles` empty; and a fixture listing LinkedIn before GitHub, which keeps that order after the email row. One more case guards the key column: every entry of `NETWORKS` (`src/lib/cv-schema.ts`), lowercased, is at most 8 characters and holds no whitespace, so a network added later with a longer name fails `pnpm test` instead of overflowing the `w-20` column.
- **AC-4**: `<main>` holds exactly one child, `<div class="flex flex-col gap-6">`, holding in order: `<h1 class="text-lg font-medium">contact</h1>`; then, 24px below, `<address class="not-italic">` holding one `<ul class="flex flex-col gap-1">` with one `NavRow kind="key"` per `formatContactRows(basics)` row, in order (`prefix` the row's `key`, `label` its `label`, `href` its `href`). The `address` computes `font-style: normal`. Nothing else renders in `<main>`: no intro or other paragraph, no availability or time zone line, no button, no form, no `nav`, no image, no employer name (the page test asserts `employersNamed(page)` is empty, the helper at `e2e/site.spec.ts:227` that `/about` and `/projects` use); `dist/contact.html` has no `<script>`, and the address appears only through `basics.email`.
- **AC-5**: Each row keeps `NavRow`'s spec 0004 anatomy unchanged: the link's accessible name is the key, a space, then the label (today `email jorgergo@icloud.com`, `github @jorgergo`, `linkedin in/jorgergo`, derived in the test from `formatContactRows`); the key is muted in a `w-20` (80px) column, 16px (`gap-4`) before the label in `fg`; every row is at least 40px tall and rows sit 4px (`gap-1`) apart; each row whose `href` starts with `http://` or `https://` ends with the arrow and the `mailto:` row does not; the key stays in the accessible name, so the list holds no `span[aria-hidden]`, and its `aria-hidden` elements are exactly the arrows, one per `https` row. The test derives the arrow rows from `formatContactRows(basics)` (filtering on the href, the way the projects block derives its code links at `e2e/site.spec.ts:2219`), never from a literal count, so removing or adding a profile needs no test edit. Hover and keyboard focus turn the label `accent-warm`, and keyboard focus shows the 2px accent ring offset 3px.
- **AC-6**: At 320px wide the email row's address moves whole onto the line under its key, starts at the key's left edge, stays one line tall, and ends inside the viewport; widening the viewport to the width where the row fits again (measured from the rendered boxes, never hard coded, because a Plex Mono glyph is 9.6px on Mac and 10px in Linux Chromium) puts it back beside the key. Each profile row stays on one line at 320px, and nothing scrolls sideways. `NavRow`'s label never shrinks (`shrink-0`), so this holds only for an address that fits the 272px column; AC-12 caps it. This carries spec 0004's email wrap test from `/` (the pattern at `e2e/site.spec.ts:1471`), which spec 0008 deletes from the home page.
- **AC-7**: Tab order on `/contact` is the skip link, then each contact row in `formatContactRows` order, then `← home`; the page test derives the row stops from `formatContactRows(basics)`, never from literals. Every stop shows the ring. The page passes an axe WCAG 2.2 AA check in light and dark, has one `h1`, no `role` attribute under `body`, no `target`, and no `style` attribute. It requests only same origin resources and logs no CSP violation; its requests are the page, one stylesheet, and two font files, Plex Mono 400 and 500 (the h1 is `font-medium`), never a Plex Sans file, checked the way the projects request test does (`e2e/site.spec.ts:2237`).
- **AC-8**: `SITE_NAV` in `src/lib/site-nav.ts` gains `{ label: 'contact', href: '/contact' }` as its last entry, so the home menu reads `01 about`, `02 cv`, `03 projects`, `04 contact`. The existing test that every menu `href` answers 200 with redirects disabled passes, `src/lib/site-nav.test.ts` passes unchanged (its planned order already ends in `contact`), and the current home page tests pass with no edit, because every menu expectation derives from `SITE_NAV` (spec 0009 AC-8). Until spec 0008's redesign lands, the home page shows the fourth row and its old social rows together, a harmless overlap.
- **AC-9**: In print, spec 0003's print layer applies and no new print rule is added: the paper tokens apply, the heading and the three rows print, the footer's `Toluca, MX · <year>` line prints, and the skip link and `← home` stay hidden.
- **AC-10**: `design.md` records the page: the `NavRow` usage line adds that `/contact` draws its rows from `formatContactRows` inside an `<address class="not-italic">`, email first, and that the home page's keyed rows move there with spec 0008; the Source section's list of pages that take their composition from their own spec adds contact. The component count stays eleven. The style guide's share card section adds `/og/contact.png` after the Projects card (alt `Contact share card`), and `e2e/styleguide.spec.ts`'s share card test (line 149) expects eight images in that order: its count becomes 8, its alt list adds `Contact share card` after `Projects share card`, the icon size table moves from indexes 4, 5, 6 to 5, 6, 7, and the card shape loop runs over indexes 0 to 4. The comment above `SMOKE` in `e2e/helpers.ts` (line 202) says seven files instead of six. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass, and every page test expectation derives from `cv.json`, `formatContactRows`, `SITE_NAV`, and `site-meta.ts`, so a valid content edit needs no test edit.
- **AC-11**: The deploy gate covers `/contact` (spec 0007): `check_pages` in `.github/scripts/smoke.sh` adds `check_page /contact contact.html` after `/projects`, and a fetch of `/og/contact.png` checked for status 200 and `content-type: image/png` after the Projects card; `SMOKE_FILES` in `e2e/helpers.ts` adds `contact.html`; the page loops in `e2e/site.spec.ts` that list paths by hand add `/contact`: the h1 size loop (line 626), the `/*` header loop (line 890), the one byte smoke loop (line 1136), the immutable cache smoke loop (line 1164), and the card content type loop (line 1229). A live `/contact` whose bytes differ from `dist/contact.html` fails the smoke check and rolls the Worker back.
- **AC-12**: `basics.email` is capped at 27 characters: `CV_LIMITS` gains `email: 27` and the schema reads `email: z.email().max(CV_LIMITS.email)`, with the basis in the `CV_LIMITS` comment (the keyed row's value must fit the 272px phone column on one line, and Plex Mono is 10px per glyph in CI, so 27 is the most that fits, the same basis as spec 0008's tagline cap). Today's address is 19. A 28 character address fails `pnpm build`. Vitest in `src/lib/cv-schema.test.ts` covers a valid 27 character address (`aaaaaaaaaaaaaaa@example.com`) passing, a 28 character one failing on `basics.email`, and the `CV_LIMITS` `toEqual` (line 422) gaining `email: 27`; the address is not card text, so the glyph rule of spec 0006 does not apply.

## Decision

**Chosen option**: Option 1: the draft's contact frame, a heading and keyed `NavRow` rows inside an `<address>`, email first.

`/contact` is the heading `contact` and one list of three keyed links built from `cv.json`, with no new component, field, or script.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Your picks in the interview: the Claude Design draft's contact frame as the design source, detail by detail; rows in the order email, github, linkedin; nothing between the heading and the rows; top aligned like `/about` and `/projects`; the channels you have today (GitHub, LinkedIn, email), no new network; nothing else on the page (no availability line, no time zone, no copy button); a plain `mailto:` link, no hiding from scrapers; a share card labelled `Contact`; the description `How to reach Jorge: email, GitHub, or LinkedIn.`; an `<address>` around the list; the ship order bio (spec 0008 task 1), then this page, then the home redesign; no References section.

Settled while writing (each with the runner up):

- **The list sits in an `<address>`, not a `<nav>`, and carries no `role`.** The rows are your contact details, the page's content, not site navigation. The known cost, confirmed with you after the first pick: Tailwind's reset removes the list markers, and Safari's VoiceOver then drops the list role for a list outside a `<nav>` (specs 0004, 0009, and 0010 recorded this), so VoiceOver reads the three links in order but does not say "list, 3 items". Each link's name still says its channel. An explicit `role="list"` would fail the a11y lint preset and the no `role` test. Runner up: `<nav aria-label="Elsewhere">`, which keeps the list role in Safari but adds a navigation landmark for content and loses the address meaning.
- **The rows come from one pure helper, `formatContactRows`, in `src/lib/cv-format.ts`.** It holds the order rule and the missing `profiles` branch, so `AGENTS.md` puts it in a Vitest covered helper, and the page test derives its Tab stops and row texts from the same call. Runner up: mapping `basics.profiles` inline in the page, which `AGENTS.md` forbids for a rule with a branch.
- **Keys are the network name in lower case** (`github`, `linkedin`), as the home page's rows draw them today. `linkedin` is eight characters, the most the `w-20` column holds (design.md); a longer network name needs a wider column and a spec line. Runner up: a `key` field per profile in `cv.json`, one more value to keep in step with `network`.
- **Labels are handles (`@jorgergo`, `in/jorgergo`), not paths (`github.com/jorgergo`).** The draft draws handles, the home rows already do, and a handle fits beside its key at 320px. Runner up: `formatProfilePath`, the `/cv` contact line's form, which says where the link goes but wraps the LinkedIn row on a phone.
- **The description lists channels with `formatChannelList`**, derived from `profiles`, so removing or adding a network updates the snippet with no code edit. `MetaCv` takes only `network`, keeping its tests to plain objects. Runner up: the sentence as a fixed string, which would name LinkedIn after you removed it.
- **`SHARE_PAGES` gains the row last**, in menu order, as spec 0009 set; only `getStaticPaths` reads the order.
- **The heading and list sit `gap-6` (24px) apart**, the draft's spacing and `/about`'s and `/projects`'s. Runner up: `gap-14`, the section spacing, which floats a three row list away from its heading.
- **No `text-pretty` on the wrapper.** The page has no running text; the email wrap rule comes from `NavRow`'s `flex-wrap` and the body's `overflow-wrap: anywhere`. Runner up: copying `/about`'s wrapper classes whole.
- **Three rows are a finished page, not a placeholder.** design.md's mandate calls a page of one heading and one paragraph a placeholder; this page is a heading and three labelled, 40px interactive rows, every state styled (rest, hover, focus, print), which is the whole job the page has. The draft drew the same frame. Runner up: padding it with an intro or an availability line, which you declined because each goes stale.
- **The email cap is 27 characters (AC-12).** `NavRow` keeps its label whole (`shrink-0`, spec 0004), so an address wider than the phone column would overflow instead of wrapping. 27 glyphs at CI's 10px fit the 272px column, the basis spec 0008 used for the tagline. Runner up: letting the label shrink and break mid address, which changes spec 0004's row contract for every `NavRow`.
- **No new component.** The page is `NavRow` rows inside one `address`. Runner up: a `ContactList` component, worth it only if a second page lists the channels.
- **This spec does not touch `/`.** The home page keeps its Elsewhere rows until spec 0008's task 3 removes them; deleting them here would ship a home page with no links before the redesign replaces it.
- **The deploy smoke check learns `/contact`,** as it learned `/about` and `/projects`. Without it a broken `/contact` deploy would pass and never roll back.
- **The style guide shows the Contact card,** since design.md says it shows every built card.

## Rationale

Reasoning, the options weighed, and the draft measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The contact frame of the Claude Design draft `Portfolio.dc.html` (project "Minimalist Developer Portfolio"), read on 2026-09-26: the heading `contact` at 18px weight 500, 24px, then three rows (`email`, `github`, `linkedin`) of an 80px muted key, 16px, and the value, each at least 44px tall and 4px apart, top aligned. Taken as a guide per detail, as spec 0008 did: the order, the keys, the handles, the 24px gap, and the 80px key column are kept; the 44px rows become `NavRow`'s 40px (spec 0008 settled this for the menu); the draft's missing arrows gain spec 0003's external arrow; its `← back` footer stays spec 0003's `← home`. Tokens, type, and components come from `design.md` and spec 0003, unchanged.

### Page composition

Inside `<main>`, one wrapper `<div class="flex flex-col gap-6">`:

1. `<h1 class="text-lg font-medium">contact</h1>`
2. `<address class="not-italic">` with `<ul class="flex flex-col gap-1">` of `NavRow kind="key"`, one per `formatContactRows(basics)` row.

Rendered on ship, in the 640px column, top aligned:

```
contact

email     jorgergo@icloud.com
github    @jorgergo ↗
linkedin  in/jorgergo ↗
```

The footer stays at the bottom with its rule, `← home`, and `Toluca, MX · <year>`. At 320px the address drops under `email`, 80px key column and all, because the row (80 + 16 + 19 glyphs, about 278px on Mac and 286px in CI) is wider than the 272px column.

### Data model sketch

No new field. One schema change: `basics.email` gains a 27 character cap (AC-12). The page reads what spec 0002 already defines:

| Field | Type | Rules | Used by |
|---|---|---|---|
| `basics.email` | string | required, `z.email()`, now at most 27 characters (`CV_LIMITS.email`, AC-12) | the email row's label and `mailto:` href |
| `basics.profiles` | array, optional | each `{ network, username, url }`; `network` one of `NETWORKS` (`GitHub`, `LinkedIn`); `url` https | one row each: key, handle, href; the description's channel list |
| `basics.name` | string | spec 0006 card rules | the title, the description's given name, the card |
| `basics.label`, `basics.location` | string, object | spec 0006 card rules | the title (home only), the card |

Two new read only shapes, both plain data:

| Shape (module) | Fields |
|---|---|
| `ContactRow` (`src/lib/cv-format.ts`) | `key: string` (lower case channel), `href: string` (`mailto:` or the profile URL), `label: string` (address or handle) |
| `MetaCv['basics']['profiles']` (`src/lib/site-meta.ts`) | optional `readonly { network: string }[]`, the only part the description reads |

### State transitions

None. The page is static and changes only on a rebuild.

### API surface

Build time only, no HTTP beyond the static files.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `formatContactRows` (`src/lib/cv-format.ts`) | `(basics: { readonly email: string; readonly profiles?: readonly { readonly network: Network; readonly username: string; readonly url: string }[] \| undefined }) => readonly ContactRow[]` | the email row, then one row per profile | none; a missing `profiles` gives the email row alone |
| `formatChannelList` (`src/lib/site-meta.ts`) | `(basics: Pick<MetaCv['basics'], 'profiles'>) => string` | `email, GitHub, or LinkedIn` | none |
| `DESCRIPTIONS.contact` (`src/lib/site-meta.ts`) | `(cv: MetaCv) => string` | `How to reach Jorge: email, GitHub, or LinkedIn.` | none |
| `SHARE_PAGES` row | `{ key: 'contact', path: '/contact', label: 'Contact' }` | the canonical, share tags, and `/og/contact.png` | a missing `DESCRIPTIONS` rule fails `astro check` |
| `SITE_NAV` row (`src/lib/site-nav.ts`) | `{ label: 'contact', href: '/contact' }`, last | `04 contact` in the home menu | the menu 200 test fails if the page is missing |
| `/contact` (`src/pages/contact.astro`) | calls `getCv()` once | `dist/contact.html` | the `getCv()` throw (spec 0002) |
| `/og/contact.png` (`src/pages/og/[page].png.ts`, unchanged) | the `contact` param from `SHARE_PAGES` | the 1200×630 card | the card rules of spec 0006 fail the build |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/contact` | `<title>` | `pageMeta('contact')`: `formatPageTitle(basics, 'Contact')` (spec 0006) |
| Render `/contact` | meta description, `og:description` | `DESCRIPTIONS.contact`: `givenName(basics.name)` (spec 0009) and `formatChannelList(basics)` (this spec) |
| Render `/contact` | canonical, `og:url`, `og:image`, `og:image:alt` | `pageMeta` from the `SHARE_PAGES` row and `site` in `astro.config.mjs` (spec 0006) |
| Render `/contact` | the h1 text | the literal `contact`, the page's name, like `about` and `projects` |
| Render a row | its key (`email`, `github`, `linkedin`) | `formatContactRows`: the literal `email`, then `profile.network.toLowerCase()` |
| Render a row | its label | `basics.email`, then `formatProfileHandle(profile)` (spec 0004) |
| Render a row | its href | `mailto:` plus `basics.email`, then `profile.url` |
| Render a row | the arrow | `NavRow`: present when the href starts with `http://` or `https://` (spec 0004) |
| Render a row | row order | `formatContactRows`: email first, then `basics.profiles` in `cv.json` order |
| Render the menu | `04 contact` | `SITE_NAV` last row and `formatRowNumber` (spec 0004) |
| Draw the card | label, name, role, footer | `cardContent('contact')`: `Contact`, `basics.name`, `basics.label`, `jorgergo.dev/contact`, `Toluca, MX` (spec 0006) |
| Footer | `← home`, city, year, rule | `SiteFooter` (spec 0003), unchanged |

### Key invariants

- The address comes only from `basics.email`, and each profile's URL only from `basics.profiles`; the page and its tests hold no literal address, handle, or URL.
- `formatContactRows` always returns the email row first, so the page is never empty and never lacks a way to write to you. The same order (email, then profiles in `cv.json` order) also lives in `formatChannelList`, so a future change to the order touches both helpers and both test files.
- Every key fits the `w-20` column: a network name longer than eight characters needs a wider column and a spec line (design.md), on top of the handle rule `formatProfileHandle`'s `satisfies` clause already forces.
- Exactly one `h1`; no `nav`, no `role` attribute under `body`, no `target`, no `style`, no `<script>` on `/contact`.
- Colours only from the six tokens; no new token, no arbitrary value (`not-italic` is a stock utility).
- `/` is untouched by this spec; spec 0008 alone changes it.

### Security model

A public static page with no input, no form, and no script. The email address is deliberately public and already plain text on `/cv`, `/about`, and the home page; a `mailto:` link adds no new exposure, and obfuscating it on one page would protect nothing. The CSP is unchanged (no script, so no new hash). Nothing to authorise. A contact form stays deferred (scope); when it lands it needs a server route, a Turnstile check, and a rate limit, and that spec revisits the zone's bot settings.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `styleguide.spec` is `e2e/styleguide.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Head and card (`site.spec`, Vitest): a `/contact` entry in `PAGES` checks the title, description, and h1; the share tag loop over `SHARE_PAGES` covers the tags; `pageMeta('contact')` and `DESCRIPTIONS.contact` in Vitest, verifies **AC-1**, **AC-2**.
- Channel list (Vitest): `email`, `email or GitHub`, `email, GitHub, or LinkedIn`, and `profiles: undefined`, verifies **AC-2**.
- Rows helper (Vitest): today's three rows, missing and empty `profiles`, order kept, every `NETWORKS` key at most 8 characters, verifies **AC-3**.
- Email cap (Vitest, `verify`): 27 characters pass, 28 fail, `CV_LIMITS` holds `email: 27`, verifies **AC-12**.
- Composition (`site.spec`): `<main>` has one child; the h1 then the `address` 24px below; `font-style: normal`; the `ul` holds `formatContactRows(basics).length` rows; `<main>`'s text is exactly `contact` plus the row texts; no `nav`, no `p`, no `img`, no `button`, no `form`; `employersNamed(page)` is empty, verifies **AC-4**.
- Row anatomy (`site.spec`): names, hrefs, key width 80px, gap 16px, heights of at least 40px, 4px apart, an arrow on each `https` row derived from `formatContactRows` and none on the `mailto:` row, the hover and focus colour and the ring, verifies **AC-5**.
- Email at 320px (`site.spec`): the address under its key, back beside it at the measured width, profile rows one line, no sideways scroll, verifies **AC-6**.
- Keyboard, axe, and requests (`site.spec`): the Tab stops derived from `formatContactRows`, axe clean in light and dark, same origin requests, Plex Mono 400 and 500 only, no CSP violation, verifies **AC-7**.
- Failure case, content without profiles (Vitest and `verify`): `formatContactRows` with no `profiles` returns the email row alone, and a `verify` step removes `profiles` from `cv.json`, builds, and sees one row and the description `How to reach Jorge: email.`, verifies **AC-2**, **AC-3**.
- Menu (`site.spec`): the home menu rows equal `SITE_NAV`, now four, and `/contact` answers 200, with no home test edit, verifies **AC-8**.
- Print (`site.spec`, `verify`): paper tokens, heading and rows print, city line prints, skip link and `← home` hidden, verifies **AC-9**.
- Docs and style guide (`styleguide.spec`, `verify`): eight images in order, the icons at indexes 5 to 7, the cards 0 to 4, the design.md lines, verifies **AC-10**.
- Deploy gate (`site.spec` smoke tests, `verify`): the `/contact` rows of the one byte, immutable, and content type loops fail the smoke run as expected, verifies **AC-11**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the page ships whole in one merge, the smallest complete `/contact` a visitor can use. It merges after spec 0008's task 1 (the bio, your chosen order) and before spec 0008's layout, which needs it live.

1. [x] Helpers: add `ContactRow` and `formatContactRows` to `src/lib/cv-format.ts` with the AC-3 Vitest cases in `src/lib/cv-format.test.ts`. In `src/lib/site-meta.ts`, add `profiles` to `MetaCv['basics']`, the `OR_LIST` formatter beside `LIST`, `formatChannelList`, the `contact` row last in `SHARE_PAGES`, and `DESCRIPTIONS.contact`; in `src/lib/site-meta.test.ts`, add the AC-2 cases and update the `SHARE_PAGES` `toEqual` and the `footerLength` table. In `src/lib/cv-schema.ts`, add `email: 27` to `CV_LIMITS` (with its basis in the comment) and `.max(CV_LIMITS.email)` to `basics.email`, with the AC-12 cases in `src/lib/cv-schema.test.ts`, satisfies **AC-2**, **AC-3**, **AC-12**.
2. [x] Page and menu: create `src/pages/contact.astro` (the AC-4 markup, `getCv()` once, a Spec 0011 comment in the style of `about.astro`), and add the `contact` row last in `SITE_NAV`, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-8**.
3. [ ] Page tests: add the `/contact` entry to `PAGES` in `e2e/site.spec.ts` with stops derived from `formatContactRows`; add a `contact page` block covering composition, row anatomy, the 320px email wrap (modelled on the home test at line 1471), the ring, the requests, and print; add `/contact` to the five hand written path loops, satisfies **AC-4** to **AC-7**, **AC-9**, **AC-11**.
4. [ ] Deploy gate and docs: in `.github/scripts/smoke.sh` add the `/contact` page check and the `/og/contact.png` fetch; add `contact.html` to `SMOKE_FILES` in `e2e/helpers.ts`; add the Contact card to the style guide's share card section and to `e2e/styleguide.spec.ts` (count 8, the alt list, icon indexes 5 to 7, card indexes 0 to 4); change the `SMOKE` comment in `e2e/helpers.ts` to seven files; update `design.md` (the AC-10 lines); then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the steps in [verify.md](verify.md), satisfies **AC-10**, **AC-11**.

## Consequences

**Positive**:
- Your links get a home of their own, which unblocks spec 0008's centred home page.
- Three large, labelled tap targets, the same row the home menu uses, so the site keeps one interaction pattern.
- No new component, field, dependency, or script; one helper, one description rule, one page.
- Adding a network later (with its handle rule) updates the rows and the description with no page or test edit.

**Negative / tradeoffs**:
- Until spec 0008 lands, the home page shows `04 contact` and the same three links as rows below it, a short lived duplicate.
- The page is very short: on a desktop screen it is a heading, three lines, and a lot of empty space above the footer. That is the draft's look, but it can read as unfinished to someone expecting a form.
- No copy button, so a visitor without a mail app has to select the address by hand (a long press on a phone).
- Your email address can be at most 27 characters; a longer one needs a new cap and a layout check.
- The address stays scrapable, as it already is on three other pages.
- The profile rows show handles, so a visitor sees `in/jorgergo`, not the full LinkedIn URL, until they follow the link.
- Safari's VoiceOver reads the rows as three links, not as a list of three, because the list sits outside a `<nav>` under Tailwind's list reset; the home page's rows are announced as a list today, so a VoiceOver user loses the item count when the rows move here.

**Neutral**:
- `formatProfileHandle` and `NavRow kind="key"` gain `/contact` as a caller now and become its only caller outside the style guide once spec 0008 removes the home rows.
- `MetaCv` now reads `basics.profiles`, so the inline `cv` fixture in `site-meta.test.ts` carries today's two networks.
- The contact form stays in the scope's Deferred list; this page is where it would go.

## Follow-up

- [ ] Spec 0008, task 4: delete the home page's Elsewhere tests, including the 320px email wrap test, once this spec's AC-6 test exists on `/contact` (recorded in spec 0008's updated build plan).
- [ ] `/sync` after the build: `AGENTS.md`'s content rule names `formatContactRows` as the source of the contact rows; the Site navigation rule's "today" list reads `about`, `cv`, `projects`, `contact`; the deploy rule's page list (`smoke.sh` checks `/`, `/cv`, `/about`, `/projects`) adds `/contact`.
