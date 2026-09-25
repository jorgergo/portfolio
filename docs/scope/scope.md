# Scope: Personal portfolio

An extremely minimal personal site: a home page with your name, a short bio, and links, plus a Harvard style CV page, all in English. Recruiters and peers are the audience. Look and feel is the top priority. Visual references: [fbold.dev](https://fbold.dev/), [t3.gg](https://t3.gg/), [cv.jarocki.me](https://cv.jarocki.me/), and your Harvard CV Template PDF.

**Build approach:** Skateboard (ship the smallest complete site a visitor would actually use, home plus CV live, then grow it release by release).
**Workflow:** GA (after develop: `/check verify`, then `/test`, then a fresh model `/check review`, then `/document`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Prototype`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | Content model | Foundation | done |
| 4 | Design system & UI foundation | Foundation | done |
| 5 | Home page | Release 1 | done |
| 6 | CV page | Release 1 | done |
| 7 | Metadata & share cards | Release 1 | done |
| 8 | Go live | Release 1 | in-progress |
| 9 | CV PDF download | Release 2 | planned |
| 10 | Command menu | Release 2 | planned |
| 11 | Portfolio page | Release 3 | planned |
| 12 | About page | Release 1 | planned |
| 13 | Contact page | Release 1 | planned |

## Foundations

### 1. Stack & architecture · done
Decide the stack, including where the site is hosted, and scaffold a runnable project so every later page builds on real structure.
**Done when:** the stack and hosting choice are recorded in a spec, and the empty scaffold runs locally and builds clean.
spec [0001](../specs/0001-stack-architecture/index.md) · code in `src/`
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture`

### 2. Coding standards & tooling · done
Capture conventions, then install lint, format, and pre commit checks from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint, format, and pre commit run clean.
code in `eslint.config.js`, `.prettierrc.json`, `package.json`, `.github/workflows/ci.yml`
- [x] Capture conventions + tooling choices: `/audit`
- [x] Build it: `/develop coding standards & tooling`
  - [x] Lint: ESLint 10 flat config (typescript-eslint, eslint-plugin-astro, jsx-a11y-x) enforcing the AGENTS.md rules
  - [x] Format: Prettier with the Astro and Tailwind plugins
  - [x] Pre commit: simple-git-hooks runs lint-staged, then `astro check`
  - [x] CI: GitHub Actions runs frozen install, lint, format check, build

### 3. Content model · done
One source of truth for your profile, socials, and CV content (experience, education, skills, technologies), so the home page, CV page, and PDF all read the same data.
**Done when:** editing your CV means changing one content source in one place, and every section of the Harvard template has a defined shape.
**Note:** the CSP blocks Shiki's inline styles, so decide code block highlighting here (`syntaxHighlight: false` or `'prism'`); see spec [0001](../specs/0001-stack-architecture/index.md) Consequences.
spec [0002](../specs/0002-content-model/index.md) · code in `src/content/cv.json`, `src/lib/cv*.ts`, `src/content.config.ts`
- [x] Design it (spec): `/architect content model`
- [x] Build it: `/develop content model`
  - [x] Schema and loader: strict `cv` collection from `src/content/cv.json`, highlighting off (AC-1 to AC-8, AC-12, AC-14)
  - [x] Real CV content: your pasted CV rewritten into English Harvard shape, no phone or address (AC-2, AC-13)
  - [x] Access and format helpers: `getCv()`, dates, sorting, location (AC-1, AC-9 to AC-11)
  - [x] Wiring and failure checks: placeholders read your name, avatar if supplied, every rule proven to fail the build (AC-3 to AC-8, AC-12, AC-14, AC-15)
- [x] Verify it: `/check verify content model`
- [x] Test it: `/test content model`
- [x] Review it (fresh model): `/check review content model`
- [x] Document it: `/document content model`

### 4. Design system & UI foundation · done
The minimal visual language: type, spacing, a tight color palette, and base components. Light and dark follow the visitor's system setting, with no toggle.
**Done when:** `design.md` covers type, color, spacing, and components for both light and dark; text meets WCAG AA contrast in both; links and focus states work by keyboard.
spec [0003](../specs/0003-design-system/index.md) · code in `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/`, `src/lib/contrast.ts`, `src/pages/_dev/styleguide.astro`, `design.md`
- [x] Design it (spec): `/architect design system & UI foundation`
- [x] Build it: `/develop design system & UI foundation`
  - [x] Tokens, fonts, and base CSS: `global.css` tokens with `light-dark()`, Plex Mono and Plex Sans from the Fontsource packages, motion, print, and hardening layers (AC-1, AC-3, AC-10 to AC-12)
  - [x] Page shell and components: `contrast.ts`, `BaseLayout`, skip link, footer, `TextLink`, `SectionHeading`, `TagChip`, `IconLink` with five icons, `Button`, `Prose`, pages wired (AC-4 to AC-9, AC-15)
  - [x] Contrast test and the dev only `/styleguide` page (AC-2, AC-13)
  - [x] `design.md` and the gate: build, lint, format, test, manual print and preference checks (AC-14, AC-15)
- [x] Verify it: `/check verify design system & UI foundation`
- [x] Test it: `/test design system & UI foundation`
- [x] Review it (fresh model): `/check review design system & UI foundation`
- [x] Document it: `/document design system & UI foundation`

## Release 1: Home and CV live

### 5. Home page · done
Your name, one or two lines about you, and links to the CV and your socials. Nothing else, in the spirit of t3.gg.
**Done when:** a visitor sees name, bio, and working links to the CV and socials; it reads well on phone and desktop in light and dark; it has its own title and description.
spec [0004](../specs/0004-home-page/index.md) · code in `src/pages/index.astro`, `src/components/NavRow.astro`, `src/lib/site-nav.ts`, `src/lib/cv-format.ts`
- [x] Design it (spec): `/architect home page`
- [x] Build it: `/develop home page`
  - [x] Page and pieces: `SITE_NAV` and `formatRowNumber` in `src/lib/site-nav.ts`, `formatProfileHandle`, the `NavRow` component, and `index.astro` recomposed as name, bio, numbered menu, keyed social rows (AC-1 to AC-7)
  - [x] Helper tests: Vitest cases for the row number and the profile handles (AC-8)
  - [x] Style guide and `design.md`: `NavRow` examples, the new spacing meanings and prefix widths (AC-9)
  - [x] Page tests and the gate: the `/` case and the menu href check in `e2e/site.spec.ts`, the `NavRow` checks in `e2e/styleguide.spec.ts`, build, lint, format, tests, the manual steps in `verify.md` (AC-7, AC-10)
- [x] Verify it: `/check verify home page`
- [x] Test it: `/test home page`
- [x] Review it (fresh model): `/check review home page`
- [x] Document it: `/document home page`

### 6. CV page · done
Your CV in English, laid out in the Harvard format (header with contact line, summary, experience, education, skills, technologies), styled like cv.jarocki.me. Content comes from the CV you paste in, rewritten into English and the Harvard structure.
**Done when:** every Harvard section renders from the content model; browser print or "Save as PDF" gives a clean document with no site chrome; it reads well on phone and desktop; it has its own title and description.
spec [0005](../specs/0005-cv-page/index.md) · code in `src/pages/cv.astro`, `src/components/CvEntry.astro`, `src/components/KeyedList.astro`
- [x] Design it (spec): `/architect cv page`
- [x] Build it: `/develop cv page`
  - [x] Helpers: `formatProfilePath`, `joinMeta`, `formatLanguage`, `groupConsecutive`, and `spanOf` in `src/lib/cv-format.ts` with their Vitest cases (AC-9)
  - [x] Page and pieces: `CvEntry`, `KeyedList`, the `printFooter` and `SiteFooter` `class` props, and `cv.astro` recomposed as header, contact line, and seven sections from `getCv()`, with the forced page test edits (AC-1 to AC-8, AC-10, AC-14)
  - [x] Style guide and `design.md`: both components full width in both schemes with their anatomy checks, eleven components, the new rules and spacing meanings (AC-13)
  - [x] Page tests and the gate: the `cv page` block in `e2e/site.spec.ts`, build, lint, format, tests, the manual steps in `verify.md` (AC-10 to AC-12, AC-14)
  - [x] Review fixes (spec build plan tasks 5 to 7): land the line 2 pair rule, `decodeURI`, and `joinMeta` changes already in your tree and update `design.md`; add `KeyedRow`, `formatSkillRows`, and `firstUrl` with their Vitest cases; make the page tests count optional elements, proven by the `verify.md` break steps (AC-4, AC-8, AC-9, AC-13 to AC-16)
- [x] Verify it: `/check verify cv page`
- [x] Test it: `/test cv page`
- [x] Review it (fresh model): `/check review cv page`
- [x] Document it: `/document cv page`

### 7. Metadata & share cards · done
Proper titles and descriptions for every page, plus a clean preview image when someone shares your link on LinkedIn, X, or WhatsApp.
**Done when:** each page has a unique title and description, and sharing either page shows a branded preview card.
spec [0006](../specs/0006-metadata-share-cards/index.md) · code in `src/lib/site-meta.ts`, `src/lib/share-card.ts`, `src/lib/render-image.ts`, `src/pages/og/[page].png.ts`, `src/pages/favicon.svg.ts`, `src/pages/apple-touch-icon.png.ts`
- [x] Design it (spec): `/architect metadata & share cards`
- [x] Build it: `/develop metadata & share cards`
  - [x] Page metadata: `site`, the name and role caps, `site-meta.ts` with its Vitest cases, the `share` prop in `BaseLayout`, and the three pages wired (AC-1 to AC-5, AC-10, AC-11)
  - [x] Share cards: Satori proven inside Astro's build first, then `share-card.ts`, `render-image.ts`, and the `/og/[page].png` endpoint (AC-6, AC-7, AC-10)
  - [x] Icons: the generated `favicon.svg` with its dark switch and `apple-touch-icon.png` (AC-8, AC-9)
  - [x] Style guide, `design.md`, the `toLocal` and `pngSize` page test helpers, page tests, and the gate, with the live share check recorded for Go live (AC-11 to AC-14)
  - [x] Card limits from the review: the glyph rule read from the font's `unicode.json`, the 24 character name part, the 24 character city and the 60 character footer check, the `monogram` fix, `design.md`, and the break steps; the inline test fixtures are already done (AC-7, AC-8, AC-15 to AC-18)
- [x] Verify it: `/check verify metadata & share cards`
- [x] Test it: `/test metadata & share cards`
- [x] Review it (fresh model): `/check review metadata & share cards`
- [x] Document it: `/document metadata & share cards`

### 8. Go live · in-progress
Put the site on the internet at your address, with every change deploying automatically.
**Done when:** the site is reachable at your chosen domain over HTTPS, and pushing a change publishes it without manual steps.
spec [0007](../specs/0007-go-live/index.md) · code in `.github/workflows/ci.yml`, `.github/scripts/smoke.sh`, `wrangler.jsonc`
- [x] Design it (spec): `/architect go live`
- [ ] Build it: `/develop go live`
  - [x] Repo: `wrangler.jsonc` custom domain with workers.dev off, the `/_astro/*` cache block and its page test, the CI gate with Playwright and the `dist` artifact, `smoke.sh`, the `deploy` job with rollback, and the README (AC-1, AC-3 to AC-9, AC-16)
  - [ ] Your setup: zone settings, the www record and Redirect Rule, the token and the `production` environment, then the bootstrap deploy from your Mac (AC-2, AC-10, AC-11)
  - [ ] Launch: merge, and watch `deploy` pass its smoke checks (AC-1, AC-2, AC-4, AC-5, AC-9)
  - [ ] Grow: mail records, the `main` ruleset, Search Console and Bing, and the share checks (AC-12 to AC-15)
- [ ] Verify it: `/check verify go live`
- [ ] Test it: `/test go live`
- [ ] Review it (fresh model): `/check review go live`
- [ ] Document it: `/document go live`

### 12. About page · needs a decision · from spec 0004
A short `/about` page in the same shell: your longer `basics.summary` as a paragraph or two, and a photo if you add one to `src/assets/`. It adds the `about` row to the home menu (`SITE_NAV`, spec 0004) as its first entry. Small enough to go straight to `/develop` if you already know the build.
**Done when:** `/about` renders your summary from the content model through `BaseLayout` with its own title and description; the home menu shows `01 about` linking to it; it reads well on phone and desktop in light and dark.
- [ ] Design it (spec): `/architect about page`

### 13. Contact page · needs a decision · from spec 0004
A `/contact` page listing your GitHub, LinkedIn, and email as keyed `NavRow` rows (spec 0004's component), the future home of the deferred contact form. It adds the `contact` row to the home menu (`SITE_NAV`, spec 0004) as its last entry. Small enough to go straight to `/develop` if you already know the build.
**Done when:** `/contact` renders every profile and the email from the content model through `BaseLayout` with its own title and description; the home menu shows `contact` as its last row linking to it; it reads well on phone and desktop in light and dark.
- [ ] Design it (spec): `/architect contact page`

## Release 2: CV extras

### 9. CV PDF download · needs a decision
A visible download button on the CV page that gives a ready made PDF, always matching the web version.
**Done when:** clicking the button downloads a one page Harvard style PDF whose content matches the CV page exactly; the button is hidden when printing.
- [ ] Design it (spec): `/architect cv pdf download`

### 10. Command menu · needs a decision
A Cmd+K / Ctrl+K menu for quick jumps (pages, socials, PDF download), like cv.jarocki.me.
**Done when:** the shortcut opens the menu, it works fully by keyboard, phone visitors have a small button to open it, and it never shows in print.
- [ ] Design it (spec): `/architect command menu`

## Release 3: Portfolio

### 11. Portfolio page · needs a decision
A simple list of your projects, each with a line of context, linked from the home page. Honest about older work (year and status shown).
**Done when:** projects render from the content model with name, year, short description, and links; the home page links to it; it matches the rest of the site in light and dark.
- [ ] Design it (spec): `/architect portfolio page`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Spanish version**: site and CV in Spanish as a second language · needs a decision
- **Contact form**: message you from the site instead of just an email link · needs a decision
- **Visitor analytics**: declined for now to stay light and banner free; if added later, pick a cookieless option so no consent banner is needed · needs a decision
- **Sitemap and structured data**: a sitemap once the portfolio page brings more pages, and Person JSON-LD only if search results for your name show a need (it needs a `set:html` exception) · needs a decision · from spec 0006
- **PR previews**: a Workers Preview URL per pull request, if visual reviews ever need a shared link · needs a decision · from spec 0007
- **Email at the domain**: an address such as hello@jorgergo.dev through Cloudflare Email Routing, if you want one on the CV · needs a decision · from spec 0007

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
