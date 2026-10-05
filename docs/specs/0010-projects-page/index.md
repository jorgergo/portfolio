# 0010. Projects page as hairline rows with status, stack, and code links

**Date**: 2026-09-26
**Status**: Accepted

## Summary

`/projects` becomes a short list of four things you have built: TRACSUR Tickets, this site, FinTech AI, and Medpal. Each row shows the name (linked to the live site when there is one), its status and years (`building · 2026 – now`), one line on what it is, its stack as chips, and either a `code` link or a muted `private` word, with a hairline between rows, as in the Claude Design draft. The projects live in a new `projects` list in `cv.json` behind strict rules (a `live` project must have a link, at most eight projects, at most two on the CV), so a bad edit fails the build. The page adds `03 projects` to the home menu, its own title, description, and share card, and the two projects you flagged also appear in a new Projects section on the CV, after Experience. There is no motion, no script, no image, and no new component or dependency.

## Requirements

**User stories**:
- As a recruiter or a peer, I want to see what you have built, how far along each thing is, and what it is built with, in a few seconds, so that I can judge your range beyond job titles.
- As a peer, I want a link to the code when it is public and an honest `private` when it is not, so that I never hunt for a repository that does not exist.
- As a recruiter reading the CV or its PDF, I want your two strongest projects in the CV itself, so that I see them without leaving the document.
- As a keyboard or screen reader user, I want one heading per project and links that say where they go, so that I can move through the list in order.
- As the site owner, I want to add, reword, or flip a project's status by editing `cv.json` alone, so that a content change never needs a code or test change.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `makeCvSchema` in `src/lib/cv-schema.ts` gains a required `projects` array after `about`, holding `1` to `CV_LIMITS.projects` (8) strict objects with these fields: `name`, `text(CV_LIMITS.projectName)` (30); `description`, `text(CV_LIMITS.projectDescription)` (120); `startDate`, `month`; `endDate`, `month`, optional; `status`, `z.enum(PROJECT_STATUSES)` with `PROJECT_STATUSES = ['live', 'building', 'done', 'archived'] as const`; `url`, `httpsUrl`, optional; `source`, `httpsUrl` or the literal `PRIVATE_SOURCE` (`'private'`), required; `keywords`, an array of `text(CV_LIMITS.projectKeyword)` (20) holding 1 to `CV_LIMITS.projectKeywords` (6) entries; `cv`, `z.boolean()`, optional. Each project runs `endNotBeforeStart` and a rule that fails `a live project needs a url, the site a visitor can open; see spec 0010` on path `url` when `status` is `live` and `url` is missing. The array fails `duplicate project name` on path `[index, 'name']` for a name equal to an earlier one (exact match, after trimming), and fails `at most 2 projects may set cv; see spec 0010` on path `[index, 'cv']` for each project after the second that sets `cv: true` (`CV_LIMITS.cvProjectsMax`, 2). `CV_LIMITS` gains `projectName: 30`, `projectDescription: 120`, `projectKeyword: 20`, `projectKeywords: 6`, `projects: 8`, `cvProjectsMax: 2`. A missing or empty `projects`, 9 projects, an unknown key, an empty or whitespace only text, each cap at its limit plus one, 0 or 7 keywords, an unknown status, an `http` url or source, a source that is neither an `https` URL nor `private`, a malformed month, an `endDate` before `startDate`, a `live` project with no `url`, a duplicate name, and a third `cv: true` each fail `pnpm build`. None of it is card text, so spec 0006's glyph rule does not apply. Vitest in `src/lib/cv-schema.test.ts` covers every one of those failures and each cap at its limit, `projects` joins the base fixture (`minimalCv`, one `building` project with `source: 'private'`, no `url`, and no `cv`, so the `live`, `cv` count, and empty CV cases start from a clean base), the missing section `it.each` (line 178), and the empty array `it.each` (line 168), and the `CV_LIMITS` `toEqual` (line 401) lists the six new keys. Amended by [0013](../0013-cv-pdf-download/index.md): `cvProjectsMax` is 3, `CV_LIMITS` gains `projectHighlights: 3`, and a project with `cv: true` may carry up to three `highlights`.
- **AC-2**: `src/content/cv.json` holds this `projects` list after `about`, in this file order, drafted from your repositories and answers; you may reword any value within the caps before merge, and no test changes when you do:
  - `TRACSUR Tickets`: `Ticket sales and gate check in for a trailer drag race, with signed QR tickets and an offline scanner.`, `startDate` `2026-09`, `status` `building`, no `url`, `source` `private`, `keywords` `Next.js`, `PostgreSQL`, `Cloud Run`, `Mercado Pago`, `cv` `true`.
  - `jorgergo.dev`: `Personal site and CV, built from written specs, with a CI gate that rolls back a bad deploy.`, `startDate` `2026-09`, `status` `live`, `url` `https://jorgergo.dev`, `source` `https://github.com/jorgergo/portfolio`, `keywords` `Astro`, `TypeScript`, `Tailwind CSS`, `Cloudflare`, `cv` `true`.
  - `FinTech AI`: `A personal finance tool for a retirement portfolio, card utilization, and Mexican tax deductions.`, `startDate` `2026-05`, `status` `building`, no `url`, `source` `https://github.com/jorgergo/fintech`, `keywords` `Next.js`, `Prisma`, `SQLite`, `Recharts`.
  - `Medpal`: `A medical concierge app that helps independent doctors run their agenda, notes, and prescriptions.`, `startDate` `2026-03`, `status` `building`, no `url`, `source` `private`, `keywords` `Flutter`, `TypeScript`, `Google Cloud`.
- **AC-3**: `src/lib/cv-format.ts` gains four pure helpers, each with Vitest cases in `src/lib/cv-format.test.ts` built from inline fixtures: `formatYearSpan(start, end?)` returns `2026 – now` for no `end` (always, whatever the year; the helper reads no clock), `2024` when both months share a year, and `2022 – 2023` otherwise, with the CV's `RANGE_SEPARATOR` (` – `); `projectHref(project)` returns `url` when present, else `source` when it is not `PRIVATE_SOURCE`, else `undefined`; `sortByStart(items)` returns a new list sorted by `startDate`, newest first, ignoring `endDate`, with ties in their original order (`toSorted` is stable), so a project keeps its place when it finishes (unlike `sortNewestFirst`, which puts every open ended entry first); `cvProjects(projects)` returns the projects with `cv === true` in `sortByStart` order, and an empty list when none are flagged.
- **AC-4**: `SHARE_PAGES` in `src/lib/site-meta.ts` gains `{ key: 'projects', path: '/projects', label: 'Projects' }` after `cv`, and `DESCRIPTIONS` gains `projects: ({ basics }) => \`What ${givenName(basics.name)} has built, with the stack behind each project and where it stands.\``. `/projects` renders through `BaseLayout` with `pageMeta('projects', cv, Astro.site)` spread into it: `<title>` reads `Projects · Jorge González Ozorno`, the meta description reads `What Jorge has built, with the stack behind each project and where it stands.`, the canonical is `https://jorgergo.dev/projects`, and the page carries spec 0006's share tags in their order, with `og:image` `https://jorgergo.dev/og/projects.png` and `og:image:alt` `Projects, Jorge González Ozorno, Full Stack Developer`. The build draws `/og/projects.png`, a 1200×630 PNG under 300 KB with the label `PROJECTS`, the name, the role, and the footer `jorgergo.dev/projects` and `Toluca, MX` (31 of `FOOTER_BUDGET`'s 60 characters). `printFooter` keeps its default. Vitest in `src/lib/site-meta.test.ts` covers `DESCRIPTIONS.projects` and asserts the whole `pageMeta('projects')` object, as the about case does (lines 255 to 269); the `SHARE_PAGES` `toEqual` (line 63) lists four rows and its test title (line 62) names the Projects row, and the `footerLength` table gains `['projects', 31]`.
- **AC-5**: `<main>` holds exactly one child, `<div class="flex flex-col gap-6 text-pretty">`, holding in order `<h1 class="text-lg font-medium">projects</h1>` and one `<ul class="flex flex-col">` with one `<li>` per project in `sortByStart(cv.projects)` order (on ship: TRACSUR Tickets, jorgergo.dev, FinTech AI, Medpal; the first two tie on `2026-09` and keep file order; when TRACSUR later gets an `endDate` it keeps its place). Nothing else renders in `<main>`: no intro line, no section heading, no image, no `nav`, and the page has no `<script>`. No text on the page names an employer.
- **AC-6**: Each `<li>` is `flex flex-col gap-2 border-t border-line py-4 last:border-b`, so a 1px `line` hairline sits above every row and below the last, with 16px above and below each row's content and 8px between its lines. A row holds, in order:
  1. A pair, `<div class="flex flex-col gap-x-4 xs:flex-row xs:items-baseline xs:justify-between">` (`CvEntry`'s pair rule): `<h2 class="font-medium">` with the name, wrapped in `TextLink` to `url` when the project has one (`jorgergo.dev` on ship) and plain text otherwise, then `<span class="shrink-0 text-sm text-muted xs:ml-auto xs:text-right">` with `joinMeta(status, formatYearSpan(startDate, endDate))` (`building · 2026 – now` on ship). From 480px the two share one baseline and the meta ends at the column's right edge; below 480px the meta sits under the name, left aligned, and never wraps.
  2. `<p>` with `description`, in `fg`.
  3. `<ul class="flex flex-wrap gap-2">` with one `<li>` per keyword holding a `TagChip`, in file order.
  4. `<p class="flex text-sm">` holding either, for an `https` source, `<a href={source} class="inline-flex min-h-6 items-center gap-2 text-fg transition-colors hover:text-accent-warm focus-visible:text-accent-warm"><span>code<span class="sr-only"> for {name}</span></span><ArrowUpRight class="size-4 shrink-0" /></a>` (visible text `code`; accessible name and text content `code for FinTech AI`, so the visible word leads the name, WCAG 2.5.3), or, for `private`, `<span class="inline-flex min-h-6 items-center text-muted">private<span class="sr-only"> code</span></span>` (a screen reader hears "private code"). No `aria-label` and no other ARIA attribute on the page (the arrow keeps its own `aria-hidden`). No new `prettier-ignore` is needed: the name link follows `CvEntry`'s `h2` plus `TextLink` shape, and the code link is `inline-flex` like `NavRow`, so neither sits after a run of whitespace (the page test at `e2e/site.spec.ts:1257`).

  The page test derives every expectation from `cv.json` through these helpers: the row count, each name and whether it is a link, the meta text, the description, the chips, and the link (its href and text content `code for <name>`) or the `private` word; it checks the hairline widths and `line` colour, the 16px padding, the 8px and 24px gaps, the description colour against `fg`, and the pair at 1280px (shared baseline, meta right edge equal to the list's) and at 320px (meta left edge equal to the name's, meta top at or below the name's bottom).
- **AC-7**: `SITE_NAV` in `src/lib/site-nav.ts` gains `{ label: 'projects', href: '/projects' }` right after `cv`, so the home menu reads `01 about`, `02 cv`, `03 projects` until `/contact` ships as `04 contact`; the existing test that every menu `href` answers 200 with redirects disabled passes. Spec 0008's task 3 has not landed, so this build changes the planned order comment in `site-nav.ts` (line 4) and the `planned` array in `src/lib/site-nav.test.ts` (line 32) from `portfolio` to `projects`; without it the planned order test fails on `projects`. If 0008's task 3 lands first, skip this part. Spec 0004's and 0008's other `SITE_NAV` rules are unchanged.
- **AC-8**: Tab order on `/projects` is the skip link, then for each row in order its name link (when it has a `url`) and its `code` link (when its source is public), then `← home`; on ship that reads `a "Skip to content"`, `a "jorgergo.dev"`, `a "code for jorgergo.dev"`, `a "code for FinTech AI"`, `a "← home"`, derived in the test from `cv.json`. Each stop shows the 2px accent ring offset 3px, checked per stop in the `projects page` block as the `cv page` block does (`e2e/site.spec.ts:2432` to 2456). The page passes an axe WCAG 2.2 AA check in light and dark, has one `h1` and one `h2` per project, no `role` attribute under `body`, no `target`, and no `style` attribute (the `body [role]` and `[style]` checks sit in the `projects page` block, as in the about block); it requests only same origin resources, logs no CSP violation, and scrolls nothing sideways at 320px. Its requests are the page, one stylesheet, and two font files, Plex Mono 400 and 500, and never a Plex Sans file, checked as the about page test does (`e2e/site.spec.ts:1763`): `fontFiles`, today declared inside the `about page` block (line 1496), moves to module scope so both blocks use it. In print the paper tokens apply, every row prints with its hairlines, chips print as plain text (spec 0003's `TagChip` print rule), links print as plain ink, and the footer's `Toluca, MX · <year>` line prints while the skip link and `← home` stay hidden (spec 0003's print layer, no new print rule).
- **AC-9**: `/cv` gains a `Projects` section (`id="projects"`, `SectionHeading` with the document page hairline) right after Experience and before Education, built from `cvProjects(cv.projects)` (so `sortByStart` order) and hidden, like every empty CV section, when no project sets `cv` (a new `projects` kind in the `Section` union, joining the `entries.length > 0` group in `hasContent`). Each project is a `CvEntry` with `title` the name, `href` `projectHref(project)` (on ship: TRACSUR Tickets unlinked, jorgergo.dev linked to `https://jorgergo.dev`), `meta` `formatDateRange(startDate, endDate)` (`Sep 2026 – Present`, the CV's month format), `summary` the description, and in its slot `<p class="text-sm text-muted">` with `joinMeta(...keywords)` (`Next.js · PostgreSQL · Cloud Run · Mercado Pago`). No status and no chips appear on the CV. The `cv page` block of `e2e/site.spec.ts` adds the section to `SECTIONS` after `experience` (present when `cvProjects(cv.projects)` is not empty) and the linked project titles to `CV_STOPS` after the experience links, both derived, and gains a per entry test modelled on `education, awards, and certificates render newest first` (line 2369), skipped with `test.skip` when `cvProjects(cv.projects)` is empty (the `ROLE_SECTIONS` pattern): each entry's title text and link (from `projectHref`), its meta (`formatDateRange`), its body (the description), and its technologies line, read as `entry.locator(':scope > p')` since the slot sits outside the entry's lines and body; its existing cases keep passing, and the CV entries print as every `CvEntry` does (`break-inside-avoid`). Amended by [0013](../0013-cv-pdf-download/index.md): an entry also passes `highlights={project.highlights}`, so a project with highlights shows them as bullets under its description.
- **AC-10**: The deploy gate covers `/projects` (spec 0007): `check_pages` in `.github/scripts/smoke.sh` adds `check_page /projects projects.html` after `/about`, and a fetch of `/og/projects.png` checked for status 200 and `content-type: image/png` after the About card; `SMOKE_FILES` in `e2e/helpers.ts` adds `projects.html`; the `/* header` loop (`e2e/site.spec.ts:805`), the smoke file table (lines 1049 to 1054), the page loop at line 1077, and the card loop at line 1142 each gain `/projects` (or `/og/projects.png`), and the comment above `SMOKE_FILES` (`e2e/helpers.ts:201`, "these five files") counts six. A live `/projects` whose bytes differ from `dist/projects.html` fails the smoke check and rolls the Worker back.
- **AC-11**: `design.md` records the change: `line`'s role adds "the rows of the projects list"; the spacing table gains `py-4` "a projects row's space above and below its content, between hairlines", and `gap-2`'s meaning adds "between chips"; the Components section notes `TagChip`'s first user and gains a paragraph on the projects list as page markup (the row anatomy of AC-6, the `code for <name>` link name, the `private` word); the CV print paragraph names the Projects section. The component count stays eleven. The style guide's share card section adds `/og/projects.png` after the About card (alt `Projects share card`), and `e2e/styleguide.spec.ts` expects seven images in that order: the count at line 161, the alt list at line 167, the icon size checks at lines 186 to 190 moving from `[3, 16]`, `[4, 32]`, `[5, 60]` to `[4, 16]`, `[5, 32]`, `[6, 60]`, and the card shape loop at line 195 running over `[0, 1, 2, 3]`. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass, and every page test expectation derives from `cv.json`, `SITE_NAV`, and `site-meta.ts`, so a valid content edit (a fifth project, a reworded line, TRACSUR flipped to `live` with its `url`) needs no test edit.

## Decision

**Chosen option**: Option 1: a `projects` list in `cv.json`, drawn on `/projects` as hairline rows (the draft's frame plus status, chips, and code links), with the two flagged projects on the CV.

The page is a heading and one list of rows built from existing tokens and components, and the CV gains one section from the same data.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Your picks in the interview: personal projects only (no hackathon, volunteer, work, or school builds); I draft from your CV and repositories, you edit; TRACSUR Tickets, this site, FinTech AI, and Medpal, named as people say them; technologies as chips; newest first in one list; the four status words `live`, `building`, `done`, `archived`; months stored and years shown, with `2026 – now` for anything ongoing; the Claude Design draft as the design source; no motion; no intro line; a muted `private` word where a private project's code link would be; `source` as a URL or `private`; a `live` project must have a `url`, and `endDate` is never before `startDate`; one to eight projects; the top two on the CV through a `cv` flag (TRACSUR and this site), after Experience, drawn as a normal CV entry with a technologies line; layout A from the comparison page, with the name linked to the site and the description in `fg`; the description sentence above; no References section.

Settled while writing (each with the runner up):

- **Page markup, not a component.** The rows have one caller, like the about page's list. Runner up: a `ProjectRow` component on the style guide, worth it once a second page draws projects.
- **A `ul` of rows, each with an `h2`.** The order is a sort, not a sequence, and the headings let a screen reader jump project to project. Safari's VoiceOver drops the list role under the style reset (specs 0004 and 0009 found this); the headings still carry the structure. Runner up: an `article` per project, which adds a landmark style region per row for no gain.
- **Chips in a nested `ul`.** A screen reader then reads them as separate items instead of one run of words. Runner up: `TagChip` spans in a `div`, which read as `Next.js PostgreSQL Cloud Run` with no pauses in some readers.
- **The code link shows `code` and is named `code for <name>` through a hidden span.** Two or more links reading just `code` would sound identical in a links list; the hidden ` for <name>` follows the visible word, so voice control by what you see still works (WCAG 2.5.3), and the Tab stop helper, which labels a stop by its text content, reads the same name the test expects. `SkipLink` already uses `sr-only`. The `private` word gets a hidden ` code` the same way. Runner up: an `aria-label`, which gives the same accessible name but leaves the text content `code`, so the derived Tab stop labels would not match (found by the cross check); also rejected, `code` alone, which passes WCAG 2.4.4 through its row but reads as a list of identical links.
- **Rows sort by start date alone, newest first** (`sortByStart`), on the page and in the CV section. "Newest first" then means when a project began, and a project keeps its place when it finishes: TRACSUR stays first after it gets `endDate` `2026-11`. Runner up: `sortNewestFirst`, the CV's rule, which puts every open ended entry first, so a finished TRACSUR would drop below Medpal and every other project still running (found by the cross check).
- **`gap-2` between `code` and its arrow**, the spacing `NavRow` and `IconLink` already use, instead of the comparison page's 4px. Runner up: `gap-1`, one more spacing meaning for one link.
- **A hairline above every row and below the last**, as on the comparison page you chose from. Runner up: the draft's top rules only, which leaves the last row open above the footer.
- **The name links only to `url`; the CV title links to `projectHref`.** On `/projects` the code has its own link, so the name means "open it". The CV has no code link, so its title falls back to the public source. Runner up: the same rule on both, which would link FinTech AI's name to GitHub on `/projects` next to a `code` link going to the same place.
- **`now` on `/projects`, `Present` on the CV.** You chose `now` for the list; the CV keeps `formatDateRange` so every CV date reads alike. Runner up: `Present` in both, longer in the meta.
- **Field names follow JSON Resume's `projects`** (`name`, `description`, `keywords`, `startDate`, `endDate`, `url`), as `cv.json` already does, plus `status`, `source`, and `cv`. Runner up: `technologies` for the chips, clearer but a second name for what the CV's groups already call `keywords`.
- **Caps from the column.** A name of 30 characters fits one line beside the longest meta (22 characters, `archived · 2022 – 2023`, about 185px) in the 640px column. A description of 120 characters is about two desktop lines (64 to 66 characters each) and five at 320px. A keyword of 20 characters is a 186px chip, inside the 272px phone column. Measurements in [rationale.md](rationale.md). Runner up: the CV's 220 character summary cap, which lets a row grow to four desktop lines.
- **Names are unique by exact match**, like `profiles`' duplicate network rule. Runner up: a case insensitive match, one more rule for a mistake the page test would show anyway.
- **`cv` is an optional boolean**, and `false` means the same as leaving it out. Runner up: `z.literal(true)`, which rejects `false` and surprises anyone who writes it.
- **The CV description stays as it is.** `formatSectionList` names the core sections (experience, education, skills, technologies), not every section, so Projects joins Leadership and Awards in not being named. Runner up: add `projects` when one is flagged, which changes the CV's snippet and its tests.
- **The CV's technologies line is mono meta text** (`text-sm text-muted`, `joinMeta`), the way `KeyedList` joins values. Runner up: a `Prose` line `Technologies: …` like Coursework, which reads as body text.
- **`projects` follows `about` in `cv.json` and in the schema**, profile content before the CV sections. `PROJECT_STATUSES` and `PRIVATE_SOURCE` live in `cv-schema.ts` beside `EMAIL_TOKEN`, and `cv-format.ts` imports them, the direction the imports already run.
- **Order in `SHARE_PAGES` follows the menu** (`home`, `about`, `cv`, `projects`). Only `getStaticPaths` reads the order.
- **The deploy smoke check and the style guide learn `/projects`**, as they learned `/about` in spec 0009. Runner up: record the gap, and a broken `/projects` deploy would pass the smoke check.

## Rationale

Reasoning, the options weighed, the comparison page, and the measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The Claude Design draft's projects frame (`Portfolio.dc.html` in the project "Minimalist Developer Portfolio": an 18px medium `projects` h1, rows split by 1px `line` rules with 14px of padding, the name in medium on the left, the year muted on the right, a muted description) as a guide only, then layout A on the comparison page you chose from (a private artifact, https://claude.ai/artifact/9GchHF4Qs6LXW6zpuSGLPL), with `design.md` and spec 0003's tokens and components unchanged. Differences from the draft: the status joins the year, the description is `fg` (the draft greys it), chips and a code line follow it, a row is not one big link (a row can hold two destinations or none), padding is 16px (`py-4`, on the scale) instead of 14px, and the last row gets a closing rule.

### Page composition

Inside `<main>`, one block (`flex flex-col gap-6 text-pretty`):

1. `<h1 class="text-lg font-medium">projects</h1>`
2. `<ul class="flex flex-col">` of rows, each `<li class="flex flex-col gap-2 border-t border-line py-4 last:border-b">` holding the pair (`h2` name, meta span), the description `p`, the chips `ul`, and the code line `p` (AC-6)

Rendered at desktop width on ship:

```
projects
───────────────────────────────────────────────────────────────
TRACSUR Tickets                          building · 2026 – now
Ticket sales and gate check in for a trailer drag race, with
signed QR tickets and an offline scanner.
[Next.js] [PostgreSQL] [Cloud Run] [Mercado Pago]
private
───────────────────────────────────────────────────────────────
jorgergo.dev                                 live · 2026 – now
Personal site and CV, built from written specs, with a CI gate
that rolls back a bad deploy.
[Astro] [TypeScript] [Tailwind CSS] [Cloudflare]
code ↗
───────────────────────────────────────────────────────────────
FinTech AI                               building · 2026 – now
A personal finance tool for a retirement portfolio, card
utilization, and Mexican tax deductions.
[Next.js] [Prisma] [SQLite] [Recharts]
code ↗
───────────────────────────────────────────────────────────────
Medpal                                   building · 2026 – now
A medical concierge app that helps independent doctors run
their agenda, notes, and prescriptions.
[Flutter] [TypeScript] [Google Cloud]
private
───────────────────────────────────────────────────────────────

───────────────────────────────────────────────────────────────
← home                                        Toluca, MX · 2026
```

`jorgergo.dev` is underlined as a `TextLink`. At 320px each meta drops under its name and the descriptions take four or five lines; nothing scrolls sideways.

The CV gains, between Experience and Education:

```
PROJECTS
───────────────────────────────────────────────────────────────
TRACSUR Tickets                             Sep 2026 – Present
Ticket sales and gate check in for a trailer drag race, with
signed QR tickets and an offline scanner.
Next.js · PostgreSQL · Cloud Run · Mercado Pago

jorgergo.dev                                Sep 2026 – Present
Personal site and CV, built from written specs, with a CI gate
that rolls back a bad deploy.
Astro · TypeScript · Tailwind CSS · Cloudflare
```

### Data model sketch

One new list in `cv.json`, after `about`. No other field changes. A project stands alone: it relates to nothing, and `cv` is its only tie to the CV page.

| Field | Type | Rules | Used by |
|---|---|---|---|
| `projects` | array | required, 1 to 8 (`CV_LIMITS.projects`), names unique, at most 2 with `cv: true` (`cvProjectsMax`; 3 since [0013](../0013-cv-pdf-download/index.md)) | `/projects`, the CV section |
| `name` | string | required, trimmed, 1 to 30 (`projectName`) | the row's `h2`; the CV title |
| `description` | string | required, trimmed, 1 to 120 (`projectDescription`) | line 2; the CV body |
| `startDate` | `YYYY-MM` | required, `month` | the years, the sort |
| `endDate` | `YYYY-MM` | optional (missing means ongoing), not before `startDate` | the years, the sort |
| `status` | enum | required, one of `PROJECT_STATUSES` | the meta on `/projects` only |
| `url` | `https` URL | optional; required when `status` is `live` | the name's link; the CV title first |
| `source` | `https` URL or `private` | required | `code` link or the `private` word; the CV title second |
| `keywords` | string[] | required, 1 to 6 (`projectKeywords`), each trimmed, 1 to 20 (`projectKeyword`) | the chips; the CV's `·` line |
| `cv` | boolean | optional | the CV section |
| `basics.name`, `basics.label`, `basics.location` | unchanged | spec 0002, 0006 | title, description, card |

`CV_LIMITS` gains `projectName: 30`, `projectDescription: 120`, `projectKeyword: 20`, `projectKeywords: 6`, `projects: 8`, `cvProjectsMax: 2`. `cv-schema.ts` also exports `PROJECT_STATUSES` and `PRIVATE_SOURCE`, and `cv.ts` exports `type CvProject = Cv['projects'][number]`. Amended by [0013](../0013-cv-pdf-download/index.md): `cvProjectsMax: 3` and a new `projectHighlights: 3`.

### State transitions

A project's `status` changes only when you edit `cv.json` and the site rebuilds. Any word may follow any other; the schema checks the state, not the path. The expected paths: `building` to `live` (set `url` in the same edit, or the build fails), `building` to `done`, `live` to `done` or `archived`, `done` to `archived`. TRACSUR's next two edits: `live` plus its `url` when ticket sales open, then `done` plus `endDate` `2026-11` after the event on November 22.

### API surface

Build time only, no HTTP beyond the static files.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `CV_LIMITS` (`src/lib/cv-schema.ts`) | six new keys above | the caps | n/a |
| `PROJECT_STATUSES` (`src/lib/cv-schema.ts`) | `readonly ['live', 'building', 'done', 'archived']` | the status words | n/a |
| `PRIVATE_SOURCE` (`src/lib/cv-schema.ts`) | `'private'` | the source word | n/a |
| `projects` (`makeCvSchema`) | strict array above | the parsed list | a schema issue fails the build |
| `formatYearSpan` (`src/lib/cv-format.ts`) | `(start: string, end?: string) => string` | `2026 – now`, `2024`, `2022 – 2023` | n/a |
| `projectHref` (`src/lib/cv-format.ts`) | `(project: { readonly url?: string \| undefined; readonly source: string }) => string \| undefined` | `url`, else a public `source`, else `undefined` | n/a |
| `sortByStart` (`src/lib/cv-format.ts`) | `<T extends { readonly startDate: string }>(items: readonly T[]) => readonly T[]` | a new list, `startDate` newest first, ties in original order | n/a |
| `cvProjects` (`src/lib/cv-format.ts`) | `<T extends { readonly cv?: boolean \| undefined; readonly startDate: string }>(projects: readonly T[]) => readonly T[]` | the flagged projects in `sortByStart` order | n/a |
| `SHARE_PAGES`, `DESCRIPTIONS` (`src/lib/site-meta.ts`) | the `projects` row and rule | title, description, share tags, card | a row without a rule fails `astro check` |
| `SITE_NAV` (`src/lib/site-nav.ts`) | `{ label: 'projects', href: '/projects' }` after `cv` | the menu | a dead row fails the page test |
| `/projects` (`src/pages/projects.astro`) | calls `getCv()` once | the page | the `getCv()` throw (spec 0002) |
| `/cv` (`src/pages/cv.astro`) | a `projects` section kind | the CV | unchanged |
| `/og/projects.png` (`src/pages/og/[page].png.ts`) | unchanged, fed by the new row | the card | spec 0006's footer and palette throws |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/projects` | `<title>` | `formatPageTitle(basics, 'Projects')`: the row's `label` and `basics.name` (spec 0006) |
| Render `/projects` | meta description, `og:description` | `DESCRIPTIONS.projects`: `givenName(basics.name)` in your fixed sentence |
| Render `/projects` | canonical, `og:url` | `site` in `astro.config.mjs` plus the row's `path` |
| Render `/projects` | `og:image`, its alt | `/og/projects.png`; alt from the label, `basics.name`, `basics.label` |
| Render `/projects` | the h1 `projects` | page code; the same word as the `SITE_NAV` label |
| Render `/projects` | the rows and their order | `sortByStart(cv.projects)`; ties keep file order |
| Render a row | the name, and its link | `name`; `url` when present |
| Render a row | the meta `building · 2026 – now` | `joinMeta(status, formatYearSpan(startDate, endDate))` |
| Render a row | the description | `description` |
| Render a row | the chips, in order | `keywords` |
| Render a row | `code`, its href, its accessible name | an `https` `source`; the visible `code` plus a hidden ` for ` and `name` |
| Render a row | `private`, and its spoken ` code` | `source` equal to `PRIVATE_SOURCE`; page code |
| Render a row | the hairlines, spacing, colours | page classes on existing tokens (`border-line`, `py-4`, `gap-2`, `text-muted`) |
| Render `/cv` | the Projects section, present or not | `cvProjects(cv.projects)` |
| Render a CV project | title, link, dates, body, technologies | `name`; `projectHref(project)`; `formatDateRange(startDate, endDate)`; `description`; `joinMeta(...keywords)` |
| Render the home menu | `03 projects` | `SITE_NAV`'s third row, `formatRowNumber(2)` |
| Draw the card | label, name, role, host and path, city | the row's `label`, `basics.name`, `basics.label`, `site` plus `/projects`, `basics.location` (spec 0006) |
| Footer | city, country code, year, `← home` | `SiteFooter` (spec 0003), unchanged |

### Key invariants

- A `live` project always has a `url`, so "live" never promises a page a visitor cannot open.
- Every project states where its code is: an `https` URL or the word `private`, never nothing.
- At most two projects are on the CV, and at most eight on the page; names are unique. Amended by [0013](../0013-cv-pdf-download/index.md): at most three on the CV.
- `endDate` is never before `startDate`; the years a row shows come from its months, never typed.
- Rows sort by `startDate` alone, so finishing a project never moves it.
- The years never read the clock: an ongoing project always reads `<start> – now`, so a rebuild on January 1 changes nothing.
- `/projects` names no employer: its words are the heading, your project names, descriptions, statuses, years, chips, `code`, and `private`.
- One `h1`, one `h2` per project, no `role` under `body`, no ARIA attribute (the arrow keeps its own `aria-hidden`), no `target`, no `style`, no `<script>`, no `font-sans` on `/projects`.
- Colours only from the six tokens; no new token, no arbitrary value (`border-line`, `py-4`, `gap-2`, `gap-6`, `last:border-b` are stock utilities).
- `SITE_NAV` lists only pages that exist, `projects` right after `cv`.

### Security model

A public static page with no input. Private repositories are never linked: `source: "private"` renders a word, not a URL, so no visitor meets a GitHub 404 and no private address leaks. The page names TRACSUR and Medpal and says what they do, which you chose to show; it says nothing about their code, clients, or data. No script, so the CSP hash list is unchanged. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Edge cases and failure modes

- No project sets `cv`: the CV's Projects section does not render, like any empty CV section; `/projects` is unaffected.
- A project with no `url` and a `private` source (TRACSUR, Medpal on ship) has no link at all; its row still ends with the `private` word, so every row has four lines.
- A long name wraps inside the `h2`; the meta never wraps (`shrink-0`) and drops under the name below 480px.
- A public `source` that later goes private or disappears is not caught: page tests do not fetch external links. It shows as a GitHub 404 until you change it to `private`.
- A status left stale (`building` long after you stopped) is not caught either; the `endDate` rules you chose do not tie dates to status. Only `live` without a `url` fails.
- A JSON syntax error in `cv.json` still fails through `getCv()` (spec 0002).

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Schema (Vitest): every failure listed in AC-1 fails with its message, each cap passes at its limit and fails one over, the base fixture with one project passes, verifies **AC-1**.
- Content (`site.spec`, `verify`): the rows equal `cv.json`'s projects in `sortByStart` order; the break steps change the content and the tests still pass, verifies **AC-2**, **AC-11**.
- Helpers (Vitest): `formatYearSpan` for ongoing, one year, and two years; `projectHref` for url, public source, and private; `sortByStart` for distinct starts, a tie (file order kept), and a finished project that keeps its place above an older open one; `cvProjects` for none, one, and two flagged, in `sortByStart` order, verifies **AC-3**.
- Head and card (`site.spec`, Vitest): `/projects` in `PAGES` with its title and description from `pageMeta('projects')`; the share tag loop picks up the row, including the 1200×630 card; the four row `SHARE_PAGES` and the 31 character footer, verifies **AC-4**.
- Composition and rows (`site.spec`): `<main>` has one child, the h1 and one `ul`; one `li` per project with the hairlines, padding, gaps, and colours of AC-6; the name link only where there is a `url`; the `code` link's href and accessible name or the `private` word; the pair at 1280px and 320px, verifies **AC-5**, **AC-6**.
- Menu (`site.spec`, Vitest): the home menu follows `SITE_NAV` with `projects` third; every `href` answers 200; `site-nav.test.ts`'s planned order passes, verifies **AC-7**.
- Keyboard, axe, requests, print (`site.spec`): the Tab stops of AC-8 with the ring per stop; no `role` under `body` and no `style` attribute; axe clean in light and dark; same origin only; no CSP violation; exactly the page, one stylesheet, and the Plex Mono 400 and 500 files through the shared `fontFiles`; no sideways scroll at 320px; under `print` media the hairlines and chips print plain and the footer city line shows, verifies **AC-8**.
- CV section (`site.spec`): `SECTIONS` holds Projects after Experience when a project is flagged; the per entry test checks each entry's title, link, dates, body, and technologies line from `cvProjects` and `projectHref`, and skips when none is flagged; the CV Tab stops include the linked titles, verifies **AC-9**.
- Deploy gate (`site.spec` smoke cases, `verify`): `projects.html` among the smoke files, `/projects` in the header and page loops, `smoke.sh` checking `/projects` and its card, verifies **AC-10**.
- Style guide and docs (`styleguide.spec`, `verify`): seven images in the share card section, the Projects card fourth; `design.md` carries the AC-11 lines, verifies **AC-11**.
- Failure case (`verify` break steps): a `live` project with no `url`, a third `cv: true`, a ninth project, and a 121 character description each fail `pnpm build` with the schema message, verifies **AC-1**.
- Auth: not applicable; the page is public and static.

## Build plan

Skateboard: the page ships whole in one pull request, content first so every later step builds on a real, validated list, then the page, then the CV section, then the gates.

1. [x] In `src/lib/cv-schema.ts` add the six `CV_LIMITS` keys (`cvProjectsMax` among them), `PROJECT_STATUSES`, `PRIVATE_SOURCE`, the project object with its `endNotBeforeStart` and `live` rules, and the required `projects` array with its duplicate name and `cv` count rules, after `about` in `makeCvSchema`; export `CvProject` from `src/lib/cv.ts`; add the AC-2 list to `src/content/cv.json`. In `src/lib/cv-schema.test.ts` add a project to `minimalCv` (`building`, `private`, no `url`, no `cv`), `projects` to the missing section and empty array `it.each` cases, every AC-1 failure, the caps at and over their limits, and the six keys to the `CV_LIMITS` `toEqual`, satisfies **AC-1**, **AC-2**.
2. [x] In `src/lib/cv-format.ts` add `formatYearSpan`, `projectHref`, `sortByStart`, and `cvProjects`, and their Vitest cases in `src/lib/cv-format.test.ts` from inline fixtures, satisfies **AC-3**.
3. [x] In `src/lib/site-meta.ts` add the `projects` row to `SHARE_PAGES` and `DESCRIPTIONS.projects`; in `src/lib/site-meta.test.ts` add the description case and the whole object `pageMeta('projects')` case, list four rows in the `SHARE_PAGES` `toEqual` and retitle it, and add `['projects', 31]` to the `footerLength` table, satisfies **AC-4**.
4. [x] Write `src/pages/projects.astro` per the page composition and AC-6, add the `projects` row to `SITE_NAV` after `cv`, and change the planned order comment and the `planned` array in `site-nav.test.ts` (line 32) from `portfolio` to `projects` (skip that part only if spec 0008's task 3 lands first), satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**.
5. [x] In `src/pages/cv.astro` add the `projects` section kind to the `Section` union and the `entries.length > 0` group of `hasContent`, the section after Experience from `cvProjects(cv.projects)`, and its `CvEntry` rows with the technologies line in the slot, satisfies **AC-9**.
6. [x] In `e2e/site.spec.ts` add the `/projects` entry to `PAGES` (title and description from `pageMeta('projects')`, h1 `projects`, stops derived from `cv.json`), `/projects` to the `text-lg` h1 loop (line 541), move `fontFiles` from the `about page` block to module scope, add a `projects page` block for AC-5, AC-6, and the AC-8 ring, `role`, `style`, request, and print checks, and in the `cv page` block add the Projects entries to `SECTIONS` and `CV_STOPS` plus the per entry Projects test of AC-9. Extend the deploy gate: `smoke.sh`, `SMOKE_FILES` and its comment, and the four loops of AC-10. Add the Projects card to the style guide, and in `e2e/styleguide.spec.ts` the seven image count, the alt list, the shifted icon indexes, and the four card shape loop, satisfies **AC-2**, **AC-4** to **AC-11**.
7. [x] Update `design.md` (the AC-11 lines), then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the steps in [verify.md](verify.md), satisfies **AC-8**, **AC-10**, **AC-11**.

## Consequences

**Positive**:
- A visitor sees in a few seconds what you build, with what, and how far along it is, including two private projects the CV never showed.
- Every word is in `cv.json` behind rules, so adding a project or flipping TRACSUR to `live` is one edit, and a broken edit fails the build.
- `TagChip` finally has a user; no new component, dependency, script, token, or font file, and the page loads only the two Plex Mono files home already uses.
- The CV gains your two strongest builds from the same data, so the page and the CV never disagree.

**Negative / tradeoffs**:
- Today every row reads `2026 – now`, so the years say little until something finishes or a new year starts; they earn their place over time.
- Three of four projects are `building` and two are `private`, so a visitor can open and read only two of them today (jorgergo.dev and FinTech AI's code). That is honest, and it is also thin until TRACSUR launches.
- TRACSUR needs two content edits you must remember: `live` plus its `url` at launch, then `done` plus `endDate` after November 22. Nothing reminds you; a stale `building` is not caught.
- The descriptions are my drafts from your repositories; read them before merge, especially Medpal's, which describes a team product without saying you built it with a partner (you chose no role field).
- The CV grows by one section, so the Release 2 CV PDF's one page goal gets harder.
- `/projects` says `now` while the CV says `Present` for the same idea, and the CV's Projects section sorts by start date while its other sections put ongoing entries first.
- `cv.json` holds more non CV content (`about`, `projects`); its name describes less of it.
- Safari's VoiceOver does not announce the rows or the chips as lists; the `h2` headings carry the structure.
- On the CV and its PDF, jorgergo.dev links to the site the reader may already be on.

**Neutral**:
- The home menu reads `01 about`, `02 cv`, `03 projects` until `/contact` ships as `04 contact`; spec 0008's tests derive from `SITE_NAV`, so its redesign needs no change for this.
- Spec 0003 planned that this page might bring Motion; it does not, so the `--motion-*` variables still wait for a page that needs them.
- The draft's placeholder projects (the hackathon anomaly detector, the stress app) stay out; those builds remain CV awards.

## Follow-up

- [x] `/scope`: feature 11 is now **Projects page** at `/projects` (renamed from Portfolio page, as spec 0008 recorded), linked to this spec.
- [ ] TRACSUR content: when ticket sales open, set `status` to `live` and add `url` in one edit; after the event on 2026-11-22, set `status` to `done` and `endDate` to `2026-11`.
- [ ] Spec 0003's follow up "Portfolio page spec: install `motion`" is settled: no motion here. Tick or reword it when 0003 is next edited; design.md's Motion section still stands for a later page.
- [ ] Spec 0002's follow up "Portfolio page spec: add projects" and spec 0005's "the Projects from your old resume once the Portfolio page exists" are settled by the `projects` list; tick them when those specs are next edited.
- [ ] Spec 0008 AC-5 says the menu reads `01 about`, `02 cv`, `03 contact` when it ships; if `/projects` ships first it reads four rows. Its tests derive from `SITE_NAV`, so only the prose needs a touch when 0008 is next edited. Whichever of 0008 task 3 and this build lands first changes the planned order to `projects`.
- [x] CV PDF download (scope feature 9): its one page goal now includes the Projects section; decide there whether the PDF keeps it. Done in [0013](../0013-cv-pdf-download/index.md): the section stays, with three projects, and the goal is two pages.
- [ ] Sitemap and structured data (scope Deferred): the site now has four pages; revisit the sitemap there.
- [ ] `/sync` after the build: `AGENTS.md`'s content rule names the `projects` list in `cv.json` (and its `cv` flag feeding the CV); its Site navigation rule notes `SITE_NAV` now holds `projects` after `cv` and the planned order `about`, `cv`, `projects`, `contact`; its CV page rule names the Projects section, `cvProjects`, and `projectHref`; its Deploying rule lists `/projects` among the pages `smoke.sh` checks.
