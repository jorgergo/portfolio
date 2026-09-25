# 0005. CV page composed as a Harvard style document

**Date**: 2026-09-24
**Status**: Accepted

## Summary

The CV page becomes a full document built from `cv.json`: your name, headline, and contact line, then Summary, Experience, Education, Leadership & activities, Awards, Certifications, and one Skills & interests block of keyed rows. It takes the bones of your old resume (a contact line, uppercase headings with a rule under them, keyed skill rows, entries with bullets) and the Harvard template's paired lines (organization left, dates right), and rebuilds them on the site's tokens: Plex Mono for the structure, Plex Sans for paragraphs and bullets, the six earth tone colours, left aligned in the 640px column, no blue, no phone, no photo. Two new components draw every entry and every keyed row once, the two Ford roles group under one company line, and the page prints as a clean document (four pages today) with no site chrome and no JavaScript. A review on 2026-09-24 added three rules: a location stays whole while the text beside it wraps, the page's last untested rules move into tested helpers, and the page tests keep passing after any valid content edit.

## Requirements

**User stories**:
- As a recruiter, I want your whole CV on one scrolling page with the current role first, so that I can judge fit without downloading anything.
- As a recruiter printing or saving as PDF, I want a clean document with no site chrome, no split entries, and readable links, so that the paper copy stands on its own.
- As a peer, I want to verify a company, a degree, or a certificate in one click, so that the claims are checkable.
- As the site owner, I want every section to render from `cv.json` through the existing helpers, so that editing the file is the only way the page changes and the Release 2 PDF can never drift from it.
- As a keyboard or screen reader user, I want real headings, named regions, and a predictable Tab order, so that I can move section by section and know where each link goes.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/cv` renders through `BaseLayout` with `title` set to `` `CV · ${basics.name}` `` (so `<title>` reads `CV · Jorge González Ozorno`) and `description` set to `basics.bio`. Inside `<main>` one wrapper `<div class="flex flex-col gap-14 print:gap-6">` holds a `<header>` and then one `<section>` per rendered section in this fixed order: Summary, Experience, Education, Leadership & activities, Awards, Certifications, Skills & interests. A section whose source is absent or empty (`volunteer`, `awards`, `certificates`, or all four of `skills`, `technologies`, `languages`, `interests`) is not rendered at all, heading included. The page holds exactly one `h1` and the page calls `getCv()` once in frontmatter.
- **AC-2**: The `<header class="flex flex-col gap-2">` holds, in order: `<h1 class="text-lg font-medium">` with `basics.name`; `<p class="text-sm text-muted">` reading `joinMeta(basics.label, formatLocation(basics.location))` (today `Full Stack Developer · Toluca, Mexico`); and an `<address class="not-italic">` holding `<ul class="flex flex-wrap text-sm text-muted">` of contact items, each `<li class="flex items-center">` (a flex row, so the whitespace Prettier leaves between the link and its dot never renders): first `mailto:{email}` with the address as its text, then one item per entry of `basics.profiles` in file order, linking to its `url` with `formatProfilePath(url)` as its text (`github.com/jorgergo`, `linkedin.com/in/jorgergo`). Every item except the last ends with `<span aria-hidden="true" class="mx-2">·</span>` after its link, so an item wraps whole with its separator and the dot stays muted. Each link is `inline-flex min-h-6 items-center text-fg transition-colors hover:text-accent-warm focus-visible:text-accent-warm`, with no underline and no `target`: the links are `fg` and the label line above them is muted, so the eye tells the two lines apart, and the list holds only links, so no underline is needed for WCAG 1.4.1. When `profiles` is absent the list holds the email alone.
- **AC-3**: Every `<section>` is `flex flex-col gap-6 print:gap-4` with `aria-labelledby` pointing at its `SectionHeading` (an `h2` with `id` `summary`, `experience`, `education`, `leadership`, `awards`, `certifications`, or `skills`), whose `class` is `border-b border-line pb-2 break-after-avoid`. Heading texts are exactly `Summary`, `Experience`, `Education`, `Leadership & activities`, `Awards`, `Certifications`, `Skills & interests`. The Summary section's content is `<Prose><p>{basics.summary}</p></Prose>`.
- **AC-4**: A new `CvEntry` component in `src/components/CvEntry.astro` takes `title: string` (required), `href?`, `meta?` (a date or date range: short, fixed width), `subtitle?`, `aside?` (a location: free text), `summary?`, `highlights?: readonly string[]`, `as?: 'h3' | 'h4'` (default `h3`), `splittable?: boolean` (default `false`), and `class?`. It renders a `<div>` with `flex flex-col gap-2`, plus `break-inside-avoid` unless `splittable`, holding: line 1, a `<div class="flex flex-col gap-x-4 xs:flex-row xs:items-baseline xs:justify-between">` (plus `break-after-avoid` when `splittable`, so a company line never ends a page alone) with the heading element (`font-medium` only when `as` is `h3`; its text is the title, wrapped in `TextLink` when `href` is given) and, when `meta` is given, `<span class="shrink-0 text-sm text-muted xs:ml-auto xs:text-right">`; line 2, the same row markup only when `subtitle` or `aside` is given, with `<p class="xs:flex-1">{subtitle}</p>` when given and, when `aside` is given, `<span class="min-w-0 text-sm text-muted xs:ml-auto xs:text-right">` (no `shrink-0`: a date never wraps, and a location wraps only when it alone is wider than the line); then, only when `summary` or `highlights` has content, `<Prose class="flex flex-col gap-2">` with `<p>{summary}</p>` only when `summary` is given and `<ul class="flex list-disc flex-col gap-1 pl-5 marker:text-muted">` of one `<li>` per highlight only when `highlights` is not empty; then the default slot. Below the `xs` breakpoint (480px) each right value sits under its left text, left aligned; at 480px and above the pair shares one line, the right value right aligned beside the first line of its left text, and the left text wrapping beside it. On line 2 the subtitle grows from zero width (`xs:flex-1`), so the location keeps its full width and only the subtitle wraps: today `Toluca, Mexico` stays on one line beside the degree at every width from 480px. Dates always sit in the right column of line 1 and locations in the right column of line 2, in every section.
- **AC-5**: The Experience section renders `work` sorted with `sortNewestFirst` and then grouped with `groupConsecutive` on `name`. A group with one role renders one `CvEntry` with `title` the company, `href` its `url`, `meta` `formatDateRange(startDate, endDate)`, `subtitle` the position, `aside` the location, and the role's `summary` and `highlights`. A group with several roles renders one `CvEntry` with `splittable`, `title` the company, `href` `firstUrl(roles)` (the `url` of the first role that has one, AC-15), `meta` `formatDateRange` of `spanOf(roles)`, and no subtitle, whose slot is `<div class="flex flex-col gap-4">` of one `CvEntry as="h4"` per role with `title` the position, `meta` `formatDateRange(startDate, endDate)`, `aside` the location, and that role's `summary` and `highlights`. The Leadership & activities section renders `volunteer` the same way with `organization` as the name. Today Experience shows `Ford Motor Company` with `Jan 2025 – Present`, then `Full Stack Developer, PDPO` with `Aug 2025 – Present` and `Remote` at the right of the line under it, then `Software Engineer, IT Academy` with `Jan 2025 – Jul 2025` and `Mexico City, Mexico` under it, then `El Puerto de Liverpool` and `Daimler Truck Mexico` as single entries.
- **AC-6**: The Education section renders `education` sorted with `sortNewestFirst`, one `CvEntry` each with `title` the institution, `href` its `url`, `meta` `formatDateRange(startDate, endDate)`, `subtitle` `joinMeta(`${studyType}, ${area}`, score)` (today `B.S., Computer Science and Technology · GPA 4.0/4.0 (97/100)`), `aside` its `location`, and, only when `courses` has entries, a slot `<Prose><p>Coursework: {courses.join(', ')}.</p></Prose>`.
- **AC-7**: The Awards section renders `awards` sorted with `sortByDateDesc`, one `CvEntry` each with `title` the award title, `meta` `formatMonth(date)`, `subtitle` the awarder, and the `summary`. The Certifications section renders `certificates` sorted with `sortByDateDesc`, one `CvEntry` each with `title` the name, `href` its `url`, `meta` `formatMonth(date)`, and `subtitle` the issuer.
- **AC-8**: A new `KeyedList` component in `src/components/KeyedList.astro` takes `items: readonly KeyedRow[]` (`{ key, values }`, AC-15) and `class?`, and renders `<dl class="flex flex-col gap-2">` with, per item whose `values` is not empty, `<div class="flex flex-col gap-x-4 break-inside-avoid xs:flex-row xs:items-baseline">` holding `<dt class="shrink-0 text-sm text-muted xs:w-40">{key}</dt>` and `<dd>` with the values joined by `joinMeta` (a spaced middle dot). The Skills & interests section renders one `KeyedList` whose items are `formatSkillRows(cv)` (AC-15), in order: one per `skills` group (`name`, `keywords`), one per `technologies` group, one `Languages` row whose values are `formatLanguage` of each language in file order, one per `interests` group that has keywords (`name`, `keywords`), and, when any interest group has no keywords, one last `Interests` row whose values are those groups' names in file order (so `{ "name": "Chess" }` still shows). The section is not rendered when that list is empty. A key of up to 19 characters fits the column (Plex Mono advances 0.6em, so 19 characters at 14px need 160px); a longer key wraps inside the column.
- **AC-9**: `src/lib/cv-format.ts` gains five pure helpers, each covered by Vitest cases tagged `spec 0005 AC-9`: `formatProfilePath('https://www.linkedin.com/in/jorgergo/')` returns `linkedin.com/in/jorgergo` and `formatProfilePath('https://github.com/jorgergo')` returns `github.com/jorgergo` (the host without a leading `www.` plus the path without a trailing `/`; scheme, port, query, and hash dropped; the path decoded with `decodeURI`, so `https://www.linkedin.com/in/jorge-gonz%C3%A1lez/` returns `linkedin.com/in/jorge-gonzález`, a reserved escape such as `%2F` stays encoded, and a malformed escape leaves the path encoded instead of throwing); `joinMeta('Aug 2025 – Present', 'Remote')` returns `Aug 2025 – Present · Remote`, and `joinMeta('B.S., CS', undefined)` returns `B.S., CS` (undefined and empty parts skipped); `formatLanguage({ language: 'English', fluency: 'Fluent', level: 'C2' })` returns `English (Fluent, C2)` and `formatLanguage({ language: 'Spanish', fluency: 'Native' })` returns `Spanish (Native)`; `groupConsecutive(items, key)` returns `readonly { key, items }[]` where each `items` is typed non empty (`readonly [T, ...T[]]`), grouping adjacent items whose `key(item)` is equal, in input order, never mutating, so the same key appearing again later starts a new group; `spanOf(items)` takes a non empty tuple and returns `{ startDate, endDate }` with `startDate` the earliest start and `endDate` the latest end, or with `endDate` left `undefined` when any item has no `endDate`.
- **AC-10**: `BaseLayout` takes a new optional `printFooter?: boolean` (default `true`); `/cv` passes `false`, and `SiteFooter` (which gains the standard `class?` prop merged with `class:list`) then carries `print:hidden`. Under `@media print` on `/cv`, where the root is 11pt: the footer is hidden, the wrapper's row gap is `1.5rem` (22px) and each section's is `1rem` (14.67px), every `CvEntry` root except a `splittable` one and every `KeyedList` row has `break-inside: avoid`, every section heading and every `splittable` entry's first line has `break-after: avoid`, the contact links (`fg`, kept by `a { color: inherit }`) and the `TextLink`s print as plain text in the ink colour with no underline, muted meta text prints in the paper muted value (9.47:1), the paper tokens apply even under a dark system setting, and nothing else on the page is hidden. There is no print button and no `<script>`.
- **AC-11**: At 320px wide nothing scrolls sideways, every contact item wraps whole (its separator stays with it), and every pair line stacks; at 479px a pair's right value sits below its left text at the same x; at 480px the right value's box overlaps the first line of its left text vertically (the two are baseline aligned, so their box tops differ) and ends at the column's right edge. The page passes an axe WCAG 2.2 AA check in light and dark, its heading outline is `h1`, then `h2` per section, then `h3` per entry, then `h4` only for roles inside a group, with no level skipped, and no element under `body` carries a `role`, `style`, or `target` attribute.
- **AC-12**: Tab order on `/cv` is the skip link, then the contact links in list order, then every body link in document order (a linked company, institution, or certificate name), then `← home`, and nothing else; every stop shows the 2px accent ring. Loading `/cv` requests only same origin resources: the page, the stylesheet, the three Plex woff2 files the page uses (Mono 400, Mono 500, and Sans 400: `Prose` brings the sans, and no sans text is weight 500, so the fourth file in `dist/` is never requested here), and the favicon; `dist/cv.html` contains no `<script>`.
- **AC-13**: `/styleguide` renders the two document components once each at full width, in a `scheme-light` block and a `scheme-dark` block below the two panels (the panels are about 234px wide while `xs:`, a viewport query, is active, too narrow for a pair): a single `CvEntry` with `href`, `meta`, `subtitle`, `aside`, a summary, and two highlights; a `splittable` group `CvEntry` holding two `as="h4"` roles; and a `KeyedList` of two rows. `design.md` counts eleven components, adds both with their usage rules, records the hairline heading rule (a `SectionHeading` on a document page carries `border-b border-line pb-2`), the pair rule (left text, right meta; dates on line 1 and locations on line 2; from `xs` the right value sits beside the first line of its left text, and on line 2 the subtitle grows from zero width and wraps while the location stays whole unless it alone is wider than the line; stacking below `xs`), changes its weight line to `500 for h1, entry titles, b, and strong` (positions are 400), adds the spacing meanings `gap-x-4` (a pair's left to right), `xs:w-40` (a keyed row's key column), `gap-4` (between roles in a group), `gap-2` (between keyed rows), `pl-5` (bullet indent), `pb-2` (a heading over its rule), `mx-2` (a contact separator), and `min-h-6` (a contact link, like the footer link), the bullet style, and the print rules of AC-10.
- **AC-14**: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass. `e2e/helpers.ts` exports the whole parsed CV (`cv`, with `basics` kept). In `e2e/site.spec.ts` the `/cv` case carries the new title and the Tab stops of AC-12 derived from the fixture, the label test matches the new label line, the footer ring test (today it presses Tab twice on `/cv` and expects `← home`, which now lands on the email link) moves to `/missing`, and a new `cv page` block, its cases tagged `spec 0005`, covers the header, the Ford grouping, the 479px and 480px pair check, the print rules, and the no script and three font rule; `e2e/styleguide.spec.ts` covers both components' anatomy in the new blocks. Manual steps live in [verify.md](verify.md).
- **AC-15**: `src/lib/cv-format.ts` gains one type and two more pure helpers, each helper covered by Vitest cases tagged `spec 0005 AC-15`, and `cv.astro` calls them instead of keeping the rules inline. `KeyedRow` is `{ readonly key: string; readonly values: readonly string[] }`, the item type `KeyedList` takes. `formatSkillRows(sources)` takes an object with optional `skills` and `technologies` (`{ name, keywords }` groups), `languages` (what `formatLanguage` takes), and `interests` (`{ name, keywords? }`), and returns `readonly KeyedRow[]` in the order of AC-8; a row with no values is dropped, so absent or empty `languages` gives no `Languages` row, and `{}` gives `[]`; it never mutates its input. `firstUrl(items)` takes `readonly { readonly url?: string | undefined }[]` and returns the first defined `url`, else `undefined`. The cases cover: `interests` of `{ name: 'Sports', keywords: ['Tennis'] }`, `{ name: 'Chess' }`, and `{ name: 'Go', keywords: [] }` gives a `Sports` row, then an `Interests` row of `Chess` and `Go`; `languages: []` gives no `Languages` row; skills, technologies, languages, and interests together come out in that order; `firstUrl` returns the second item's `url` when the first has none, and `undefined` when none has one. Afterwards `cv.astro` holds no `keyed`, `keywordInterests`, `namedInterests`, `skillItems`, or `groupHref`, and its Skills & interests presence check is `items.length > 0`.
- **AC-16**: The fixture derived cases in `e2e/site.spec.ts` pass for any schema valid `cv.json`, not only today's. An optional element (a location span, the line 2 of a grouped role, which exists only when the role has a location, the bullet list) is counted from whether the fixture has its value (0 or 1), and its text or style is read only when it exists. The expected keyed rows, the Skills & interests presence, and a group's link come from `formatSkillRows` and `firstUrl`, never from a copy of their rules in the test. Each break step under *Added after the build* in [verify.md](verify.md) then leaves `pnpm exec playwright test --project site` passing with no test edit.

## Decision

**Chosen option**: Option 1: your old resume's bones and the Harvard pairs, rebuilt on the design system with two new components.

The page is a left aligned document in the existing column: header with a contact line, a hairline under each uppercase heading, Harvard pairs for every dated entry, grouped roles at one company, keyed rows for skills, sans only inside `Prose`, tightened and unbroken on paper.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

Settled while writing (each with the runner up):

- **Design source: your old resume and the Harvard template, redesigned on `design.md`.** Read from the PDFs you sent (metrics in [rationale.md](rationale.md)); what survives is structure, not styling (basis: your brief, "a combination of my old resume, but a bit more minimalistic, with the IBM font, the earth tone colors"). Runner up: cv.jarocki.me's shape (badges, avatar, chips), which the scope named but which reads as an app, not a document.
- **`CvEntry` renders its own body** (`summary` and `highlights` props) and keeps a slot for anything else (nested roles, the coursework line). One component then serves single roles, grouped roles, education, awards, and certificates without repeating the bullet markup in the page. Runner up: a slot only component with the body written five times in `cv.astro`.
- **Heading weight follows the level, and positions are regular.** An `h3` title is `font-medium`; an `h4` role title and a position subtitle are weight 400, so each entry has one medium line. `design.md`'s weight line (`500 for … positions`, written before this page existed) changes to `500 for h1, entry titles, b, and strong` through AC-13. Runner up: positions at 500, which puts two medium lines in a row and flattens the hierarchy (the Harvard template sets positions regular).
- **`splittable` on a group entry.** A `break-inside-avoid` on the whole Ford group would move about fifteen lines as one block and leave a large gap at a page bottom; the group root is allowed to split while each role inside it is not, and the group's first line carries `break-after-avoid` so a company name never ends a page alone. Runner up: no avoidance anywhere, which splits a two line title from its bullets.
- **The print tightening lives on a page wrapper, not in `BaseLayout`.** `<main>`'s `gap-14` is spec 0003's rule for every page; the CV wraps its blocks in one `div` with `gap-14 print:gap-6`. Runner up: `print:gap-6` on `<main>` in the layout, which edits a spec 0003 criterion for a rule only this page needs.
- **The footer hides in print through a `printFooter` prop** on `BaseLayout` and a `class` prop on `SiteFooter`. Spec 0003 AC-11 keeps the footer's city line on paper for every other page (its print test asserts it on the 404 page), so a global `footer { display: none }` would break that contract. Runner up: keep `Toluca, MX · 2026` at the end of the printed CV, which you ruled out as chrome.
- **The contact line is an `<address>` holding a `<ul>` of links in `fg`**, each `li` a flex row with its separator as an `aria-hidden` middle dot after the link, so a wrapped item carries its dot, no stray whitespace offsets it, and the line reads as links against the muted label line above it. Safari drops the list role there (WebKit's rule for lists with `list-style: none` outside a `nav`) and reads three links; other screen readers read a list of three. Runner up: a `<nav aria-label="Contact">`, which keeps the list role but calls a contact line navigation, or a `<p>`, which gives up the list for everyone.
- **The location moved up to the label line** so the contact list is links only and needs no underline (WCAG 1.4.1, use of colour; the same reason the footer link and `NavRow` carry none). Runner up: `TextLink` underlines in the contact line.
- **Dates sit in the right column of line 1 and locations in the right column of line 2, in every section.** The text area is 592px (the column's `px-6` sits inside `max-w-content`) and 432px at 480px; a right value that cannot shrink must stay short, and `Jan 2025 – Jul 2025 · Mexico City, Mexico` is 344px, which would squeeze a role title to a few characters up to about 600px. A date range is at most 19 characters (160px) and stays `shrink-0`; a location keeps its width while the subtitle beside it wraps (see the line 2 item below). Education follows the same rule (dates beside the institution, location beside the degree), so the right edge reads the same in every section. Runner up: the location in the role's date cell, your first pick, rejected on that arithmetic after the cross check.
- **Interest groups without keywords gather into one `Interests` row.** The schema allows `{ "name": "Chess" }`, and a keyed row needs values, so name only groups become the values of one last row rather than vanishing. Runner up: dropping them silently.
- **The style guide shows the document components full width below the panels**, in a light and a dark block, because the side by side panels are about 234px wide while the `xs` variant (a viewport query) is already active, which squeezes any pair. Runner up: container queries, a new pattern for one dev page.
- **Five small pure helpers in `cv-format.ts`**, all testable without Astro: `formatProfilePath`, `joinMeta`, `formatLanguage`, `groupConsecutive`, `spanOf`. Sorting happens before grouping, so the two Ford roles are adjacent (the current one sorts first, the closed one is the newest closed). A group links to the first role that has a `url` (the newest). Runner up: grouping inline in the page frontmatter, untestable. The review found two rules still inline; they became helpers six and seven (below).
- **The key column is `xs:w-40`** (160px): `Additional skills`, the longest key today, is 17 characters, and Plex Mono at `text-sm` (14px) advances 8.4px per glyph, so 19 characters fit. Runner up: `w-36` (144px), one pixel of spare for the current longest key.
- **Bullets are `list-disc pl-5 marker:text-muted`** inside `Prose`, rows `gap-1` apart, so the marker is quiet and the list keeps its semantics in every screen reader (the Safari heuristic only drops lists with `list-style: none`). Runner up: custom markers, which need an arbitrary `content` value the rules ban.
- **Sections are `aria-labelledby` regions with anchor ids.** A screen reader lists seven named regions, and the Release 2 command menu can jump to `#experience` without a new decision. Runner up: bare `<section>`s, which are not landmarks.
- **`break-after-avoid` on headings is best effort.** Chromium honours it in print; Firefox may still leave a heading at a page bottom. Accepted, noted in Consequences.
- **The title is `CV · Jorge González Ozorno` now**, the inner page pattern spec 0004 handed to the metadata spec; that spec inherits it instead of deciding it. The description stays `basics.bio` until the same spec refines every page.
- **No structured data (JSON-LD) here**: it needs `set:html`, which the rules ban; the metadata spec decides whether and how. No chips on this page: `TagChip` stays built and on the style guide for the portfolio page.

Settled after the review of 2026-09-24 ([the review](../../reviews/2026-09-24-feat-cv-page.md), measurements in [rationale.md](rationale.md)):

- **On line 2 the subtitle grows from zero width (`xs:flex-1`) and wraps beside the location.** When both items may shrink, flexbox splits the overflow by content width, so the 118px `Toluca, Mexico` shrank to 98px and broke in two at every width. Now the location sits whole beside the first line of the degree, the same way a date sits beside a long certificate name on line 1: one rule for both lines. Runner up: `xs:flex-wrap`, which drops the location to a row of its own, a third place for a right value.
- **Two more helpers, `formatSkillRows` and `firstUrl`.** The Interests row and the group link fallback were branches the fixture never takes, checked only by manual break steps, and the page test re-derived them with the same logic, so a copied mistake would pass both. Helpers with literal Vitest cases prove the rules once; the page and the test then call them. Section presence stays in the page: with empty rows dropped by `formatSkillRows`, every section shows exactly when its list is not empty. Runner up: a third helper for section presence, which moves the page's section list into the lib for a check that is `length > 0` everywhere.
- **The fixture derived page tests count optional elements before reading them.** Those tests read cv.json so they follow content edits; a test that fails when a valid edit drops a location defeats that. Runner up: saying in `verify.md` that those break steps need a test edit, which gives up the reason the tests read the fixture.
- **`formatProfilePath` decodes the path** with `decodeURI`, so a profile URL with an accent shows as typed, not as `%C3%A1`. Runner up: `decodeURIComponent`, which would also decode a `%2F` into a path separator.

## Rationale

Reasoning, options, the reference measurements, and the cross check: see [rationale.md](rationale.md).

## Feature design

### Design source

Your old resume (`US Letter Resume.pdf`, two pages, Lato 10pt, a blue accent, a centred name between two rules, a `GitHub | LinkedIn | phone | Toluca, Mexico` line, uppercase headings with a rule, keyed skill rows, entries as a bold title, a `Position | dates` line, and bullets) and the Harvard template (`Harvard CV Template.pdf`, one page, a centred name over a `·` separated contact line, an italic summary, uppercase headings over a hairline, organization left and location right, position left and dates italic right, bullets, skills as bullets, technologies as one comma line) plus the Harvard OCS `.docx` (labelled `Technical:`, `Language:`, `Interests:` lines). Both PDFs are in your Downloads folder, not in the repo; the measurements that matter are recorded in [rationale.md](rationale.md). `design.md` and spec 0003 supply everything visual.

### Page composition

Inside `<main>`, one wrapper `div` (`gap-14 print:gap-6`) holds the header and the sections. Rendered today in the column's 592px text area (the rule under each heading spans it; right values are right aligned):

```
Jorge González Ozorno
Full Stack Developer · Toluca, Mexico
jorgergo@icloud.com · github.com/jorgergo · linkedin.com/in/jorgergo

SUMMARY
────────────────────────────────────────────────────────────
Full Stack Developer building scalable web platforms, AI assistants,
and automated release pipelines. Led the modernization of …

EXPERIENCE
────────────────────────────────────────────────────────────
Ford Motor Company                                Jan 2025 – Present
Full Stack Developer, PDPO                        Aug 2025 – Present
                                                              Remote
Owned the PDPO Portal and Knowledge Base, internal platforms …
• Designed and launched a production AI assistant …
• …
Software Engineer, IT Academy                     Jan 2025 – Jul 2025
                                                 Mexico City, Mexico
Completed Ford's IT Academy program …
• Migrated legacy financial applications …

El Puerto de Liverpool                            May 2023 – Mar 2024
Process Automation Intern                         Mexico City, Mexico
• Automated financial processes with UiPath …

Daimler Truck Mexico                              Mar 2023 – May 2023
Logistics Intern                           Santiago Tianguistenco, Mexico
• Built dynamic SQL and Microsoft Report Builder reports …

EDUCATION
────────────────────────────────────────────────────────────
Tecnológico de Monterrey                          Aug 2020 – Jun 2024
B.S., Computer Science and Technology · GPA            Toluca, Mexico
4.0/4.0 (97/100)
Coursework: Object Oriented Programming in C++, Data Structures and …

LEADERSHIP & ACTIVITIES
────────────────────────────────────────────────────────────
Ford Operation Good Cheer                         Oct 2025 – Dec 2025
Frontend Lead
• Led the frontend rebuild of the gift drive app …

AWARDS
────────────────────────────────────────────────────────────
First Place, SISA Track                                      Apr 2024
Talent Hackathon 2024
Won the MXN 100,000 first prize for a real time network traffic …

CERTIFICATIONS
────────────────────────────────────────────────────────────
Catia 3DEXPERIENCE (Catia V6) for Beginners and Catia        May 2026
V5 Users
Udemy
EF SET English Certificate, C2 Proficient (73/100)           Jan 2026
EF SET

SKILLS & INTERESTS
────────────────────────────────────────────────────────────
Additional skills   Full stack web platforms, from interface to cloud
                    deployment · AI assistants and retrieval augmented …
Technologies        TypeScript · JavaScript · Python · Java · SQL · …
Languages           Spanish (Native) · English (Fluent, C2) · French …
Sports              Basketball (team captain, 2013 to 2018) · Tennis · …
Music               Guitar
```

Mono everywhere except the `Prose` blocks (the summary paragraph, entry summaries, bullets, the coursework line), which are Plex Sans. Meta text (dates, locations, keys, the label line, the contact line) is `text-sm text-muted`. A long left text (a certificate name, the degree line) wraps beside its right value at 480px and above, and today no right value wraps; below that the right value drops under it. The two wrapped lines above are the ones Chromium draws at a 1280px window (measured 2026-09-24).

### Data model sketch

No change to `cv.json` or `cv-schema.ts`; every value the page shows has a source in the model of spec 0002. What each section reads:

| Section | Reads | Order and grouping |
|---|---|---|
| Header | `basics.name`, `label`, `location` (through `formatLocation`), `email`, `profiles[].url` (through `formatProfilePath`) | profiles in file order |
| Summary | `basics.summary` | |
| Experience | `work[]`: `name`, `url`, `position`, `location`, `startDate`, `endDate`, `summary`, `highlights` | `sortNewestFirst`, then `groupConsecutive` on `name` |
| Education | `education[]`: `institution`, `url`, `location`, `studyType`, `area`, `score`, `courses`, dates | `sortNewestFirst` |
| Leadership & activities | `volunteer[]`: `organization`, `url`, `position`, `location`, dates, `summary`, `highlights` | as Experience, keyed on `organization` |
| Awards | `awards[]`: `title`, `awarder`, `date`, `summary` | `sortByDateDesc` |
| Certifications | `certificates[]`: `name`, `url`, `issuer`, `date` | `sortByDateDesc` |
| Skills & interests | `skills[]` and `technologies[]` (`name`, `keywords`), `languages[]` (`language`, `fluency`, `level`), `interests[]` (`name`, `keywords`) | file order: skills, technologies, one Languages row, interests |

Not shown: `basics.bio` (the meta description only) and `basics.image` (no photo).

### State transitions

None. The page is static and changes only on a rebuild.

### API surface

Build time components and functions, no HTTP.

| Component or function (module) | Props or signature | Renders or returns | Errors |
|---|---|---|---|
| `CvEntry` (`src/components/CvEntry.astro`) | `title` (req) · `href?` · `meta?` (a date, fixed width) · `subtitle?` (grows and wraps beside `aside`) · `aside?` (a location, wraps only when wider than the line) · `summary?` · `highlights?: readonly string[]` · `as?: 'h3' \| 'h4'` (`h3`) · `splittable?: boolean` (`false`) · `class?` (onto the root) | the entry `div` of AC-4: two pair lines, an optional `Prose` body, the slot | n/a |
| `KeyedList` (`src/components/KeyedList.astro`) | `items: readonly KeyedRow[]` · `class?` (onto the `dl`) | the `dl` of AC-8, values joined by `joinMeta`; items with no values skipped | n/a |
| `BaseLayout` (`src/layouts/BaseLayout.astro`) | existing `title`, `description`, plus `printFooter?: boolean` (`true`) | as spec 0003; `SiteFooter` gets `class="print:hidden"` when `printFooter` is `false` | as spec 0003 |
| `SiteFooter` (`src/components/SiteFooter.astro`) | `class?` (merged with `class:list` onto the `footer`) | as spec 0003 | as spec 0003 |
| `formatProfilePath` (`src/lib/cv-format.ts`) | `(url: string) => string` | host without a leading `www.` plus the path without a trailing `/`, decoded by `decodeURI`; no scheme, port, query, or hash | none; input is a schema valid `https` URL, and a malformed escape leaves the path encoded |
| `joinMeta` (`src/lib/cv-format.ts`) | `(...parts: readonly (string \| undefined)[]) => string` | the defined, non empty parts joined by ` · ` | none |
| `formatLanguage` (`src/lib/cv-format.ts`) | `(language: { readonly language: string; readonly fluency: string; readonly level?: string \| undefined }) => string` | `English (Fluent, C2)` · `Spanish (Native)` | none |
| `groupConsecutive` (`src/lib/cv-format.ts`) | `<T>(items: readonly T[], key: (item: T) => string) => readonly { readonly key: string; readonly items: readonly [T, ...T[]] }[]` | adjacent items with the same key grouped, order kept, each group non empty | none; never mutates |
| `spanOf` (`src/lib/cv-format.ts`) | `<T extends { readonly startDate: string; readonly endDate?: string \| undefined }>(items: readonly [T, ...T[]]) => { readonly startDate: string; readonly endDate?: string \| undefined }` | earliest start; latest end, with `endDate` undefined when any item is current | none; the input type is non empty |
| `KeyedRow` (`src/lib/cv-format.ts`) | type `{ readonly key: string; readonly values: readonly string[] }` | the item `KeyedList` takes | n/a |
| `formatSkillRows` (`src/lib/cv-format.ts`) | `(sources: { skills?, technologies?: { name, keywords }[]; languages?: (formatLanguage's input)[]; interests?: { name, keywords? }[] }) => readonly KeyedRow[]`, every array and field `readonly`, every optional field also accepting `undefined` (the page passes the whole parsed `cv`) | the rows of AC-8 in order, rows with no values dropped | none; never mutates |
| `firstUrl` (`src/lib/cv-format.ts`) | `<T extends { readonly url?: string \| undefined }>(items: readonly T[]) => string \| undefined` | the first defined `url` | none; `undefined` when no item has one |
| `/cv` (`src/pages/cv.astro`) | calls `getCv()` once in frontmatter | the page of AC-1 to AC-8 | the `getCv()` throw when the entry is missing (spec 0002) |

The separator in `joinMeta`, which `KeyedList` also uses, is a space, a middle dot (U+00B7), and a space. `formatDateRange`, `formatMonth`, `formatLocation`, `sortNewestFirst`, and `sortByDateDesc` are spec 0002's helpers, unchanged.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/cv` | `<title>` | `` `CV · ${basics.name}` `` (this spec) |
| Render `/cv` | the meta description | `basics.bio` (spec 0002; the metadata spec refines it) |
| Header | the h1 text | `basics.name` |
| Header | the label line | `joinMeta(basics.label, formatLocation(basics.location))` |
| Header | contact link texts and hrefs | `basics.email` and `mailto:` plus it; `formatProfilePath(profile.url)` (path decoded) and `profile.url`, file order |
| Header | separators | a literal `·` in an `aria-hidden` span after every item but the last |
| Header | contact link colour | `fg` at rest, `accent-warm` on hover and focus; the dots inherit the list's muted |
| Any section | whether it renders | the source array has at least one entry (Skills & interests: `formatSkillRows(cv)` is not empty) |
| Any section | heading text and id | the fixed pairs in AC-3 (this spec) |
| Summary | the paragraph | `basics.summary` |
| Experience, Leadership | entry order | `sortNewestFirst` (spec 0002) |
| Experience, Leadership | which roles group | `groupConsecutive` on `name` (or `organization`) after sorting |
| Experience, Leadership | the company line date | one role: `formatDateRange(startDate, endDate)`; several: `formatDateRange` of `spanOf(roles)` |
| Experience, Leadership | the company link | one role: its `url`; several: `firstUrl(roles)`; none: plain text |
| Experience, Leadership | a role's lines in a group | position left and `formatDateRange(startDate, endDate)` right on line 1; `location` right on line 2 (absent when the field is absent) |
| Experience, Leadership | a single role's second line | `position` left, `location` right (absent when the field is absent) |
| Any entry | summary and bullets | the entry's `summary` and `highlights`; the `Prose` block is omitted when both are empty |
| Education | lines 1 and 2 | institution left and `formatDateRange` right; `joinMeta(`${studyType}, ${area}`, score)` left and `location` right |
| Education | the coursework line | `Coursework: ` plus `courses.join(', ')` plus `.`, only when `courses` has entries |
| Awards, Certifications | order and the month | `sortByDateDesc`, `formatMonth(date)` (spec 0002) |
| Certifications | the linked name | `url` when present, else plain text |
| Skills & interests | rows and their order | `formatSkillRows(cv)`: skills groups, technologies groups, `Languages`, interests groups with keywords, then one `Interests` row of the name only groups (AC-8, AC-15) |
| Skills & interests | the Languages values | `formatLanguage` per language, file order |
| Skills & interests | the key column width | `xs:w-40`, from the Plex Mono advance width (this spec) |
| Any pair line | when the right value drops under the left | below the `xs` breakpoint, 480px (spec 0003) |
| Any pair line 2 | which side wraps when both do not fit | the subtitle (`xs:flex-1`, AC-4); the location wraps only when it alone is wider than the line |
| Print | gaps, breaks, the hidden footer | the classes in AC-10 (this spec), the gaps computed at the 11pt root (22px and 14.67px); paper tokens, 11pt, margins, plain links from spec 0003 |
| Whole page | fonts, colours, focus ring, reduced motion, `← home` | `global.css` and `BaseLayout` (spec 0003) |

### Key invariants

- Every rendered section has a source array with at least one entry; a rendered heading is never followed by nothing.
- Sorting precedes grouping; a group holds adjacent entries with the same name and at least one role; a group of one is rendered as a single entry.
- A group's span starts at its earliest role and is open (`Present`) when any role is open.
- Exactly one `h1`; the section ids of AC-3 are unique on the page; heading levels never skip.
- Dates sit in the right column of line 1 and locations in the right column of line 2 in every section; a date span never shrinks, and a location span keeps its width beside a wrapping subtitle, wrapping only when it alone is wider than the line.
- A page rule with a branch the fixture may never take (the `Interests` row, a missing group link) lives in a helper with literal Vitest cases, and the page tests call that helper rather than copying its rule.
- The fixture derived page tests pass for any schema valid `cv.json`.
- The contact list holds links only; every separator is hidden from assistive tech.
- No `<a>` carries `target`, no element carries `style` or a `role`, `/cv` ships no `<script>`, and colours come only from the six tokens.
- `getCv()` is called once by the page; the helpers are pure and never read the clock or the locale.

### Security model

A public static page with no input. The email is a `mailto:` link and already public on `/`; the schema carries no phone or street address (spec 0002). Company, institution, and certificate links go to the `https` URLs in `cv.json`, checked by the schema, in the same tab. No script, so the CSP hash list is unchanged. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency, no schema change.

### Critical test scenarios

`site.spec` and `styleguide.spec` are the Playwright files in `e2e/`, Vitest runs beside the helpers, `verify` is a manual step in [verify.md](verify.md).

- Happy path (`site.spec`): the built `/cv` has the title `CV · Jorge González Ozorno`, the bio as description, the header of AC-2 with three contact links, the seven sections in order with their ids, and the Ford group with two roles under one company line, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**.
- Entry anatomy (`styleguide.spec`): a `CvEntry` shows its title as an `h3` at weight 500 with a `TextLink`, its meta right aligned in muted `text-sm`, a `Prose` body with a disc list; a group's roles are `h4` at weight 400 with their location alone on the right of line 2; `break-inside` is `avoid` on a single entry and `auto` on a `splittable` one, whose first line has `break-after: avoid`; at 480px and 1280px the single entry's location is one line tall, level with the first line of a taller subtitle, and ends at the block's right padding, verifies **AC-4**, **AC-13**.
- Sections from content (`verify`): with `volunteer` removed in a temporary edit the Leadership section and its heading vanish; with `awards`, `certificates`, `skills`, `technologies`, `languages`, and `interests` removed only Summary, Experience, and Education remain; the build passes each time, verifies **AC-1**, **AC-7**, **AC-8**.
- Grouping (Vitest and `verify`): `groupConsecutive` keeps two Ford roles together and splits a Ford, Liverpool, Ford sequence into three groups; `spanOf` returns an open span when one role is current and the latest end otherwise; with a temporary `endDate` of `2026-06` on the current Ford role the company line reads `Jan 2025 – Jun 2026`, verifies **AC-5**, **AC-9**.
- Helpers (Vitest): the outputs of AC-9 for `formatProfilePath` (including a decoded accent, a kept `%2F`, and a malformed escape), `joinMeta`, `formatLanguage`, verifies **AC-9**.
- Rows and links (Vitest): `formatSkillRows` gathers name only interests, including one with `keywords: []`, into one last `Interests` row, drops an empty `Languages` row, returns `[]` for `{}`, and keeps the section order; `firstUrl` skips a first role with no `url` and returns `undefined` for none, verifies **AC-15**.
- Content edits (`verify` plus `site.spec`): after each break step under *Added after the build* (drop both Ford urls, drop the Tec `score` and `courses`, drop the Liverpool `location`, empty the Daimler body), `pnpm exec playwright test --project site` passes unchanged, verifies **AC-16**.
- Education, awards, certifications (`site.spec`): the Tec entry shows the dates beside the institution, the degree line with the GPA beside the location, and the coursework line; the awards and certificates appear newest first with the month on the right; the EF SET name is a link and the Udemy name is not, verifies **AC-6**, **AC-7**.
- Keyed rows (`site.spec` and `styleguide.spec`): the Skills & interests `dl` has five rows keyed `Additional skills`, `Technologies`, `Languages`, `Sports`, `Music`, the Languages row reads `Spanish (Native) · English (Fluent, C2) · French (Conversational, B1)`, and the key column is 160px wide at 640px, verifies **AC-8**.
- Print (`site.spec` under print emulation, and `verify` in a real print preview): the footer is hidden, the wrapper gap is 22px and section gaps 14.67px (1.5rem and 1rem at the 11pt root), an entry has `break-inside: avoid`, a heading and a group's first line `break-after: avoid`, a contact link and a body link have no underline and the ink colour; the preview shows no skip link, no footer, no split entry across the four pages, verifies **AC-10**.
- Responsive (`site.spec`): at 320px nothing scrolls sideways and the contact list wraps at item boundaries; at 479px the Ford meta sits under the company name at the same x, at 480px its box overlaps the company name's first line vertically and ends at the column's right edge, verifies **AC-11**.
- Accessibility and keyboard (`site.spec` and `verify`): axe passes in light and dark; the heading outline is h1, h2, h3, h4 with no skip; Tab visits the skip link, the three contact links, the Ford, Tec, and EF SET links, then `← home`, each with the ring; VoiceOver lists seven regions by name, verifies **AC-11**, **AC-12**.
- Network and gate (`site.spec` and commands): `dist/cv.html` has no `<script>`, loading `/cv` requests only same origin resources with exactly three woff2 files (four remain in `dist/`); build, lint, format, and both test runners pass, with the label test and the footer ring test updated, verifies **AC-12**, **AC-14**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the whole document first, complete and readable on screen and on paper from the real content, then the proofs and the documentation; every step leaves the suite green.

1. [x] Add `formatProfilePath`, `joinMeta`, `formatLanguage`, `groupConsecutive`, and `spanOf` to `src/lib/cv-format.ts` with their Vitest cases in `src/lib/cv-format.test.ts` tagged `spec 0005 AC-9` (no Astro needed), satisfies **AC-9**.
2. [x] Write `src/components/CvEntry.astro` and `src/components/KeyedList.astro`; add the `class` prop to `SiteFooter` and `printFooter` to `BaseLayout`; recompose `src/pages/cv.astro` (title and description, the wrapper, the header with the label line and the `<address>` list, the seven sections built from `getCv()` once with the sorting, grouping, and rendering rules above, `printFooter={false}`); in the same step export the parsed `cv` from `e2e/helpers.ts` and make the forced edits in `e2e/site.spec.ts` (the `/cv` title, its Tab stops derived from the fixture, the label test, the footer ring test moved to `/missing`) so the existing suite ends green, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-10**, and the forced edits of **AC-14**.
3. [x] Add the full width light and dark blocks with `CvEntry` (single, and a `splittable` group with two `h4` roles) and `KeyedList` to `/styleguide`, add their anatomy checks to `e2e/styleguide.spec.ts`, and update `design.md` (eleven components, the two new rules, the hairline heading rule, the pair rule, the weight line, the spacing meanings, the bullet style, the print rules), satisfies **AC-13**.
4. [x] Add the `cv page` block to `e2e/site.spec.ts` (header, grouping, 479px and 480px, print, no script and three fonts, Tab order from the fixture), run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`) and the manual steps in [verify.md](verify.md), satisfies **AC-10**, **AC-11**, **AC-12**, **AC-14**.

Review fixes (added 2026-09-24). Task 5 is mostly written already: its code changes sit uncommitted in your working tree. Tasks 6 and 7 are new. Each task leaves the suite green: task 6 changes no expected output, and task 7 changes only the tests.

5. [x] Land the review fixes in your working tree: `xs:flex-1` on the `CvEntry` subtitle with its comment, the style guide case for a whole location beside a wrapping subtitle in `e2e/styleguide.spec.ts`, `decodeURI` in `formatProfilePath` with its three Vitest cases, `KeyedList` joining through `joinMeta`, and the `spec 0005` tag on every page test. Then rewrite the `CvEntry` pair rule in `design.md` to the line 2 rule of AC-4 and AC-13, satisfies **AC-4**, **AC-8**, **AC-9**, **AC-13**, **AC-14**.
6. [x] Add `KeyedRow`, `formatSkillRows`, and `firstUrl` to `src/lib/cv-format.ts`, with their Vitest cases in `src/lib/cv-format.test.ts` tagged `spec 0005 AC-15`. In `cv.astro`, replace the inline row building and `groupHref` with them and reduce the skills check in `hasContent` to `items.length > 0`. Type `KeyedList`'s `items` as `readonly KeyedRow[]`, satisfies **AC-5**, **AC-8**, **AC-15**.
7. [x] In the `cv page` block of `e2e/site.spec.ts`, take the expected keyed rows, the Skills & interests entry in `SECTIONS`, and the group link from `formatSkillRows` and `firstUrl`. Count each optional element from the fixture before reading it, and check the bullet style only when there are bullets. Then run each break step under *Added after the build* in [verify.md](verify.md) in a scratch copy of the repo, with `pnpm exec playwright test --project site` after each, and run the gate, satisfies **AC-14**, **AC-16**.

## Consequences

**Positive**:
- The page is the CV, complete from `cv.json` on day one; a new role, award, or certificate is a JSON edit and a rebuild, and consecutive roles at one company group themselves.
- Zero JavaScript, no new dependency, no schema change; the two components and seven helpers are small, pure, and covered by tests, and the Release 2 PDF can build on the same helpers.
- Paper output is a real document: no chrome, entries unbroken, links readable as text, on as many pages as the content needs.
- Seven named regions with stable ids give screen readers a map of the page and the command menu its anchors.

**Negative / tradeoffs**:
- The content on record prints to four pages at 11pt on both Letter and A4 (measured in Chromium on 2026-09-24; the last Letter page is about half full). The first estimate of two pages missed how the bullets and certificate names wrap. Getting the Release 2 PDF from four pages to one means deep content cuts or a much denser layout, not a trim; that spec decides it.
- `break-after: avoid` on headings is honoured by Chromium and may be ignored by Firefox, which can leave a heading at a page bottom.
- The `Additional skills` key is 17 characters against a 19 character column; a longer group name wraps inside its column, and the section reads best when group names are short (a content edit in `cv.json`, yours to make).
- Two spec 0003 components change shape slightly: `SiteFooter` gains a `class` prop and `BaseLayout` a `printFooter` prop; `/sync` must record both.
- The `/cv` expectations in `e2e/site.spec.ts` (title, Tab stops, the label text) change, so task 4 is not optional.
- `TagChip` has no user on the site until the portfolio page; it stays on the style guide only.
- Three Plex files load on this page (about 52 kB: Mono 400 and 500, Sans 400), against two on the home page; the Sans 500 file ships in `dist/` unused until some sans text is medium.
- Grouping is by adjacency after sorting, so a current job elsewhere, or a return to a company after another job, splits that company's roles into two entries; correct, but unlike LinkedIn's grouping.
- `design.md`'s weight line changes (positions are 400), a small rewrite of a spec 0003 rule no page had used yet.
- `formatSkillRows` puts one rule that belongs to this page (the `Interests` row) in `cv-format.ts`, a module of general formatters, which now holds seven helpers from this spec instead of five. That is the cost of testing the rule once.
- The review fixes reopen a built feature: tasks 5 to 7 land before `/check verify`, and the review's verdict applies to the code before them.

**Neutral**:
- Section headings use `aria-labelledby` regions; a `<nav>` for the contact line was rejected, so Safari announces the contact `<ul>` as three links without a list and other screen readers as a list of three (checked in `verify.md`).
- The canonical link, Open Graph tags, and structured data belong to the metadata spec; this page passes its title and the bio.
- Your old resume's Projects section has no home here; the Portfolio page (Release 3) owns projects, and the content model gains them there.

## Follow-up

- [ ] CV PDF download spec (Release 2): build from the same helpers and `CvEntry` rules; decide how a one page PDF is reached (deep content cuts, a compact print layout, or dropping the one page promise), since the web page prints to four pages on Letter and A4.
- [ ] Command menu spec: jump targets are `#summary`, `#experience`, `#education`, `#leadership`, `#awards`, `#certifications`, `#skills`.
- [ ] Metadata and share cards spec: inherit the `CV · name` title pattern, refine the description, decide structured data (JSON-LD needs a CSP safe path, since `set:html` is banned).
- [ ] Spec 0003 follow up items this spec closes: the two column grid is written once in `CvEntry` with the `xs` collapse, `break-inside-avoid` is on entries and keyed rows, chip separators in print are moot (no chips on this page), and one page fit is deferred to the PDF spec.
- [ ] `/sync` after the build: add `CvEntry`, `KeyedList`, the `printFooter` prop, and the `SiteFooter` `class` prop to `AGENTS.md`'s component notes and to `design.md`'s count, and note that a CV page rule with a branch lives in a tested `cv-format.ts` helper (AC-15); add `docs/.agent-cache/` to `.gitignore` or commit the research cache on purpose (it is untracked today).
- [ ] Content, yours: consider a shorter key than `Additional skills` in `cv.json` (`Focus`, for example), and the Projects from your old resume once the Portfolio page exists.
