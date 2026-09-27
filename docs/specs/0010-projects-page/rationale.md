# 0010. Projects page: decision record

The why behind [index.md](index.md). `/develop` builds from the index and can skip this file.

## Context

The site has a home page, an about page, and a CV, and the scope's Release 3 plans a page of projects: "a simple list of your projects, each with a line of context, linked from the home page. Honest about older work (year and status shown)." Spec 0008 already fixed its address and menu word (`projects` at `/projects`, third in the menu), and spec 0002 left projects out of the content model so this spec could shape them. `TagChip` was built in spec 0003 and has waited on the style guide for this page since spec 0005 kept chips off the CV.

The CV shows roles and results but none of the things you build on your own: this site, a finance tool, a ticketing system for a live event, a medical app with a partner. A recruiter or a peer who wants to see how you build, beyond job titles, has nowhere to look. Two of those builds sit in private repositories, and one is days from launch, so the page has to be honest about what a visitor can and cannot open, and it has to stay honest as statuses change without anyone remembering to edit code.

The forces are the same as on every other page: one column of Plex Mono, six colour tokens, WCAG AA in light and dark, a CSP that blocks inline styles and scripts, every word in `cv.json` behind a schema so a bad edit fails the build, and page tests that derive from the content so a content edit never needs a test edit. You asked for extreme attention to detail and evidence for design choices, and you treat the Claude Design draft as a guide rather than an answer. Not deciding leaves a planned menu row with no page behind it, and the redesigned home menu (spec 0008) naming a page that does not exist.

## Options considered

### Option 1: A `projects` list in `cv.json`, drawn as hairline rows (chosen)

A strict `projects` array beside `about` in `cv.json`. The page draws each project as a row between 1px `line` rules, as the draft's projects frame does: the name (linked to the live site when there is one) on the left and `status · years` on the right, then the description, the stack as `TagChip`s, and a `code` link or a muted `private`. Two flagged projects also render in a CV section through `CvEntry`.

**Pros**:
- Closest to the draft you liked, and the rules give four dense entries clear edges on a plain page.
- Line 2 keeps the full column width for the description, since the status sits with the year on line 1.
- One data source feeds the page, the CV section, the title, the description, and the card, so they cannot disagree.
- Only existing tokens and components; no dependency, script, or new component.

**Cons**:
- The rule above each row is a new use of the `line` token and a new spacing meaning (`py-4`), so `design.md` grows.
- The meta on line 1 (`building · 2026 – now`, up to 22 characters) takes width from the name at desktop, which is why the name caps at 30.
- `cv.json` grows further beyond CV content.

### Option 2: The same list, drawn as CV pairs with no rules

Rows spaced 24px apart like CV entries, using the CV's pair rule twice: name and year on line 1, description and status on line 2 (status in `CvEntry`'s location slot), then chips and links.

**Pros**:
- Reuses the CV's exact pair rule, so the site reads as one system.
- No new spacing meaning and no new use of `line`.

**Cons**:
- The status beside the description takes about 83px (the word plus the 16px gap) from every description line at desktop, down to 58 characters a line, so a description near the 120 cap wraps to three lines.
- Without rules, four rows of five lines each run together; the eye has no edge to find the next project.

### Option 3: The same list, with status as a key column

The status in `NavRow`'s 80px key column on the left (`building` and `archived` are exactly its eight character limit), the rest of the row to its right; below 480px the status moves above the name.

**Pros**:
- Best for scanning states down the left edge, and it reuses a column the design system already sized.

**Cons**:
- The column plus its 16px gap take 96px from every line (56 characters left at desktop), the most of any option.
- The page takes the shape of a menu, which is what the home page is; two pages reading alike blurs which one is navigation.

### Option 4: A content collection with one Markdown file and one page per project

`src/content/projects/*.md`, each with front matter for the fields and a body for a write up, a list page, and a `/projects/<slug>` page each.

**Pros**:
- Room for a real case study per project, with images and long form text.
- A new project is a new file rather than an edit to a shared JSON file.

**Cons**:
- Four new pages, each needing a title, description, card, smoke check, and tests, for write ups you have not asked for.
- Breaks the rule that profile content lives in `cv.json` alone, and makes the CV section read from two places.
- Markdown bodies with code fences would need a highlighting decision, which spec 0002 deferred because the CSP blocks Shiki.

## Rationale

The page's job is a few seconds of scanning, not reading, so the choice is about where the eye finds each project and how much width the description keeps. You picked layout A on the comparison page, and the measurements agree: with the status on line 1, the description keeps the full 640px column (64 to 66 characters a line), so a description up to the 120 character cap takes about two lines at desktop, where options 2 and 3 cut the line to 58 and 56 characters and a description near the cap wraps to three. The rules give each row a visible edge, which matters more here than on the about page because each row is four or five lines of mixed weight. The draft set the rules, the medium name, and the right aligned meta, and you had already said you like its look; what changed is what the scope asked for (status, stack, links) and the corrections spec 0009 made against the draft's greyed text.

The data stays in `cv.json` because the project already decided that profile content lives there (spec 0002, `AGENTS.md`), and because the CV section must read the same records. Keeping it one list with strict rules means the honesty the scope asks for is enforced rather than hoped for: a `live` project without a link and a third CV project both fail the build, and every project must state `private` or give a URL, so a missing link is never an accident. A collection with a page per project (option 4) is the right shape only once you want case studies; nothing in your answers asks for that, and it would quadruple the page count for one release.

The smaller calls follow the site's existing patterns rather than the bench's first draft wherever the two differ: `gap-2` before the arrow as `NavRow` and `IconLink` have it, `py-4` on the spacing scale instead of the draft's 14px, `fg` for the description as spec 0009 chose against the draft, and the CV's own `formatDateRange` for CV dates. The one intentional difference between the two surfaces, `now` on the page and `Present` on the CV, is yours: the page is a quick list, and the CV is a document where every date reads alike.

## Evidence

### The draft's projects frame

`Portfolio.dc.html` in the Claude Design project "Minimalist Developer Portfolio", read through the Claude Design tool on 2026-09-26:

- `main` is a column with a 24px gap: an `h1` `projects` at 18px, weight 500, then the rows.
- Each row is one `a` element (the whole row links to one URL), a column with a 2px gap and `padding: 14px 0`, with a 1px `border-top` in `--line`. The last row has no bottom border.
- Line 1: the name in weight 500 on the left, the year at 13px in `--mute` on the right, 16px apart. Line 2: the description in `--mute` with `text-wrap: pretty`.
- No status, no stack, no second link. Its three projects were placeholders (the hackathon anomaly detector, the stress app, the site), with every link pointing at the GitHub profile.

### The comparison page

A private artifact, https://claude.ai/artifact/9GchHF4Qs6LXW6zpuSGLPL, built for this interview: the three row layouts of options 1 to 3 with your four real projects, rendered in the site's light and dark token values, Plex Mono 400 and 500, and its type scale, inside a 688px page (the 640px column plus its padding) or a 320px phone page, with switches for how links work and for the description colour. You chose layout A, the name linking to the site, and the description in `fg`. The bench used 4px between `code` and its arrow and closed the list with a rule under the last row; the spec keeps the rule and moves the arrow to `gap-2`.

### Measurements

Plex Mono advances 0.6em per glyph: 9.6px at 16px on Mac and 10px in headless Linux Chromium (spec 0008, observed in CI), 8.4px at 14px (`text-sm`) on Mac.

| Measure | Value | Consequence |
|---|---|---|
| Desktop column | 640px: 66 characters (Mac), 64 (CI) | a 120 character description is about two lines |
| Phone column | 272px at a 320px viewport: 28 characters (Mac), 27 (CI) | a 120 character description is four or five lines; the pair stacks below 480px |
| Longest meta | `archived · 2022 – 2023`, 22 characters, about 185px at `text-sm` | the name has 640 − 16 − 185 = 439px beside it, 43 to 45 characters, so a 30 character name never wraps at desktop |
| Longest chip | 20 characters: 168px of text, 16px padding, 2px border, 186px | fits the 272px phone column |
| Card footer | `jorgergo.dev/projects` (21) plus `Toluca, MX` (10) | 31 of the 60 character budget |
| Today's descriptions | 102, 92, 97, 98 characters | every one fits the 120 cap with room to reword |

### Repository survey

Read with `gh` on 2026-09-26, read only (names, descriptions, languages, READMEs, contributors).

- **Chosen**: `jorgergo/portfolio` (this site, public, live); `jorgergo/fintech` (FinTech AI, public: a single user Next.js 16, Prisma, and SQLite tool for a retirement plan portfolio, card utilization, and Mexican tax deductions); `jorgergo/tracsur-boletos` (private: ticket sales through Mercado Pago with Ed25519 signed QR tickets and an offline first gate scanner for the trailer drag races on 2026-11-22 in Progreso, Yucatán; Next.js 16 on Cloud Run, a Vite and React PWA, Cloud SQL PostgreSQL, Cloudflare); `medipalmx/medpal` (private, with one other contributor: a medical concierge for independent doctors in Mexico, a Flutter client planned, a TypeScript backend on Google Cloud; last commit 2026-07-22, still building by your account).
- **Offered, not chosen**: `clean_udemy` (2024 userscript), `typeform-results` (2026, template README), and the older school and team builds (`testfarma_webapp` and `testfarma_TC2007`, `EndtheWar`, `pagina_pirineos`, `hacknjam2023`), which you judged not worth showing.
- **Not offered**: course repositories and forks, `rfc-generator` and `entrevista-fmf` (interview exercises by their names and dates), `devops-pipelines` and `vite-portfolio` (no description), and the older private portfolios.
- **Start dates** in AC-2 are each repository's creation month; correct them in `cv.json` if a project started earlier than its repository.
