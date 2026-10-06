# 0012. CV section headings at body size in olive capitals

**Date**: 2026-09-30
**Status**: Accepted

## Summary

The section headings of `/cv` (Summary, Experience, and the rest) grow from the smallest text on the page, 12px capitals, to 16px capitals at weight 500, still tracked and still olive, so a reader skimming the page lands on them first. Every other level keeps its size: your name stays the largest text at 18px, entry titles stay 16px at 500, positions 16px at 400, dates 14px muted, and the sans body 16px. The change is one class string in `SectionHeading` (the component every section heading renders through), plus the tests and the design notes that pin today's 12px label. No colour token, no new size, and no other page changes.

## Requirements

**User stories**:
- As a recruiter skimming `/cv` on a phone or a desktop, I want the section headings to be the first thing my eye lands on, so that I can jump to Experience or Education without reading the page top to bottom.
- As a recruiter printing the CV, I want the same hierarchy on paper, so that the printed copy skims like the screen.
- As the site owner, I want the hierarchy made in one component and written into the design system, so that no page invents its own heading size.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `src/components/SectionHeading.astro` renders `font-mono text-base font-medium uppercase tracking-label text-accent` merged with its `class` prop, keeps `as` (`h2` default, or `h3`) and `id`, and changes nothing else. `text-xs` no longer appears in the component. The `SectionHeading` case in `e2e/styleguide.spec.ts`, retitled `SectionHeading is a section heading: text-base at 500, uppercase, tracked 0.1em, in accent` and tagged `// covers: spec 0012 AC-1 (amends spec 0003 AC-4)`, asserts on the `h3#light-heading` specimen `font-size` `16px`, `font-weight` `500`, `text-transform` `uppercase`, `letter-spacing` `1.6px`, and `color` the light `accent`.
- **AC-2**: On `/cv` at 1280px, in light and in dark, every `h2` inside `main section` computes to `font-size` `16px`, `line-height` `25.6px`, `font-weight` `500`, `text-transform` `uppercase`, `letter-spacing` `1.6px`, and `color` the scheme's `accent`, and keeps its 1px `line` bottom border, `padding-bottom` `8px`, and `break-after` `avoid`; and the `h1`'s `font-size` is the largest computed `font-size` of any element under `body`. The rest of the ladder is unchanged and already pinned by existing cases, which stay as they are: the `h1` at 18px and 500 (the inner page h1 case), `h3` at 500 and `h4` and position at 400 (the grouped and single role cases), meta at 14px in `muted` (the entry and keyed row cases), and `Prose` in Plex Sans.
- **AC-3**: At a 320px viewport every `h2` on `/cv` renders its text on one line (a `Range` over its text, rects with `width > 0`, one distinct rounded `top`) and holds at most 23 characters of text. The length check is what catches a long heading on both platforms: 24 tracked capitals are 268.8px on macOS, still one line, and 278.4px on the Linux CI runner, whose Chromium rounds a 16px Plex Mono glyph up to 10px. The cap applies to a `SectionHeading` that spans the column; `Leadership & activities` is the longest today at exactly 23. The case attaches each heading's measured width as a test annotation. CI's `list` reporter does not print annotations and CI keeps no Playwright report, so the widths show only in a JSON report run locally or in the Linux Playwright image (the command is under *Commands added by the build* in [verify.md](verify.md)).
- **AC-4**: Under print emulation every `/cv` `h2` computes to `font-size` `14.6667px` (1rem at the 11pt root), `font-weight` `500`, `text-transform` `uppercase`, `letter-spacing` `1.46667px`, `color` the print `accent`, and `break-after` `avoid`. No file gains a print only heading rule; the rem scale carries the hierarchy to paper on its own. The Letter and A4 page counts of `/cv` are measured with Playwright's `page.pdf({ format })` against `pnpm preview`, once on `main` before the change and once after, and both pairs are recorded in [verify.md](verify.md), under *Build measurements · /develop · 2026-10-04* (Letter 4 pages before and 5 after, the fifth holding only the Sports and Music rows; A4 4 and 4); the count is information for the CV PDF decision (scope row 9), not a gate. Amended by [0013](../0013-cv-pdf-download/index.md): at the 10pt root every `h2` computes `13.3333px` with `1.33333px` tracking, and the CV's heading class now carries two print variants, `print:pb-1` and `print:leading-tight` (line height `16.6667px`, padding `3.33333px`).
- **AC-5**: `src/styles/global.css`, `src/lib/contrast.ts`, and `CONTRAST_PAIRS` are unchanged; the heading's colour pair is the existing `label: accent on bg` pair, already proven at 4.5:1 and APCA Lc 55 in light, dark, and print, so `prefers-contrast: more` and `forced-colors: active` need no new rule. `dist/og/cv.png` is byte identical before and after the change (two builds on `main` first, to prove the render is deterministic), since the share card never reads the component.
- **AC-6**: In `src/pages/_dev/styleguide.astro` the type specimen line `Label in text-xs, uppercase, tracked` becomes `Section heading in text-base at 500, uppercase, tracked`, carrying the AC-1 classes. The style guide's panel headings and its `as="h3"` subheadings keep their markup and take the new look through the component. The `styleguide` case `the type specimen line for a section heading looks the same as SectionHeading`, tagged `// covers: spec 0012 AC-6`, reads the specimen against the component as it renders, comparing seven computed properties (font family, size, line height, weight, text transform, letter spacing, and colour); a grep and a manual step check its text.
- **AC-7**: `design.md` moves with the change, in these exact edits: in the type scale table the `text-xs` row's use becomes `the footer`, and a new row `text-base font-medium uppercase tracking-label text-accent` with the use `section headings (SectionHeading)` goes right after the `text-base` row; the weights sentence becomes `500 for h1, section headings, entry titles, b, and strong`; the sentence `Labels are text-xs uppercase tracking-label text-accent.` becomes `Section headings are text-base font-medium uppercase tracking-label text-accent, and a heading that spans the column holds at most 23 characters: at 320px the text area is 272px and a tracked capital advances 11.6px on the Linux CI runner.`; the `SectionHeading` bullet under Components describes it as `styled as body size capitals at 500 in accent` and carries the same cap; in Character, `(labels, selected text, the focus ring)` becomes `(section headings, selected text, the focus ring)` and `the tracked labels` becomes `the tracked section headings`; in the token table, `accent`'s role becomes `structure: section headings, selected text ground, the focus ring`. `pnpm format` runs after, since the wider first column re pads the table. Spec 0003 already carries the four amendment lines this spec wrote at design time (AC-4, the `--tracking-label` row, the type scale line, and the `SectionHeading` API row), so the build touches no spec. `AGENTS.md` is left to `/sync`.
- **AC-8**: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass on macOS and in CI. The page test changes are the ones the API surface table lists; every fixture derived `/cv` case passes unchanged, so spec 0005 AC-16 still holds: a valid content edit needs no test edit.

## Decision

**Chosen option**: Option 2: the section heading at body size, 16px capitals tracked 0.1em, weight 500, in the olive accent, with the rule kept and the name left at 18px.

`SectionHeading` swaps `text-xs` for `text-base font-medium`; nothing else on `/cv` changes size, weight, or colour (basis: spec 0003's type scale, whose steps and `tracking-label` token already supply every value).

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`)

Your picks in the interview: a new spec that amends 0003 and 0005 rather than an edit to either; the name stays the largest text on the page; no heading may wrap at 320px; a live bench before choosing; B, 16px capitals tracked; olive; weight 500; the position line stays 16px at 400; one look for `SectionHeading`, no size prop; print keeps the same rem scale; the width cap lives in a page test at 320px; References at the sources level; the cross check's recommended fixes applied.

Settled while writing (each with the runner up):

- **The line height is the body's 1.6, 25.6px, not a tighter heading leading.** `text-base` in this project sets `--text-base--line-height: 1.6` (spec 0003), so the heading takes it with no extra class. The half leading grows from 2px to 4.8px, so the capitals sit about 2.8px higher above the rule than today; the manual step looks at it. Runner up: `leading-tight` on the heading, one more class to document for a single line of capitals that never wraps (basis: spec 0003's type scale bullet, the raised base line height).
- **The 23 character cap is a page test and a written rule, not a schema rule.** The heading texts are literals in `cv.astro` (spec 0005 AC-3), not content, so a schema cannot see them, and `AGENTS.md`'s rule about branches in helpers does not apply to eight fixed strings. The page test at 320px proves the layout and asserts the length, which is the check that fails on both platforms, and the cap in `design.md` tells the next spec what a new section may be called. Runner up: moving the headings to a `src/lib` constant with a Vitest cap, a refactor of spec 0005's page for a rule a page test already proves (basis: `AGENTS.md`, the page test conventions and spec 0005 AC-16).
- **The cap is 23, not 24.** At 320px the text area is 272px. A tracked capital advances 0.7em: 11.2px on macOS and 11.6px on the Linux runner, which rounds the 9.6px glyph up to 10px. 23 characters are 257.6px and 266.8px; 24 are 268.8px and 278.4px, which wraps in CI. The cap that holds on both is 23, and it applies to a heading that spans the column; a `SectionHeading` in a narrower box, such as a style guide panel, may wrap and is not covered (basis: the Plex Mono width note in `e2e/site.spec.ts`, used by spec 0011 for the 27 character email cap).
- **Weight 500 on the heading keeps spec 0005's one medium line per entry rule intact.** The rule speaks of entries; a section heading sits outside every entry, beside the name and the entry titles, which are 500 too (basis: spec 0005's heading weight rule, design.md's weights sentence).
- **The share card label stays at 28px capitals.** It is an image drawn by spec 0006, not the component, and its share of the card's width (28 of 1200, 2.3%) now sits beside the page heading's (16 of 640, 2.5%), so the two read as one label. Runner up: redrawing the card label, a spec 0006 change for no visible gain (basis: spec 0006, the card layout).
- **Spec 0005 is not edited; spec 0003 was amended by this spec, at design time.** Spec 0005's AC-3 fixes the heading texts and the `border-b border-line pb-2 break-after-avoid` class prop, and both stay true; the look was always the component's. Spec 0003 states the label size in four places (AC-4, the `--tracking-label` row, the type scale line, the API row), and `/develop` never edits spec content, so those four lines were written together with this spec and the build leaves every spec alone (basis: spec 0005 AC-3, spec 0003 AC-4, the `/develop` rule that specs belong to `/architect`).
- **The style guide keeps `SectionHeading` for its own panel headings and subheadings.** They grow with the component, which is the point of a style guide: it shows the component as it ships. Runner up: a private label class for the guide, a second recipe to maintain for a dev only page.
- **No `text-wrap: balance` on the heading.** At the 16px root no heading wraps; at a larger browser default size the longest one breaks into two or three words, which balancing cannot improve (basis: design.md, `text-pretty` only for standalone text that can wrap).

## Rationale

Reasoning, the options weighed, and the bench measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The existing `design.md` and the built `/cv`, checked against a private comparison bench built for this decision (https://claude.ai/artifact/HmNnVvHnSK7JUJekSNkD1e): today's page and six candidates on your real content, in the 640px column and in a 320px frame, light and dark, with a live readout of the widest heading against the text area. The bench's fonts come from Google Fonts; the site's from Fontsource; both are the same IBM Plex release.

### Page composition

`/cv` keeps spec 0005's composition. The one visible change, rendered in the 640px column:

```
Jorge González Ozorno                                  18px, 500
Full Stack Developer · Toluca, Mexico                  14px, muted
jorgergo@icloud.com · github.com/jorgergo · …          14px

EXPERIENCE                                             16px, 500, caps, tracked, olive
──────────────────────────────────────────────────────
Ford Motor Company                  Jan 2025 – Present 16px 500 · 14px muted
Full Stack Developer, PDPO          Aug 2025 – Present 16px 400 · 14px muted
                                                Remote 14px muted
Owned the PDPO Portal and Knowledge Base, …            16px sans
```

The ladder a reader sees, top to bottom: the name, then the section headings, then entry titles, then roles and positions with their dates, then the body. Each step is told from the next by size, weight, case, or colour; no step relies on colour alone.

### Data model sketch

None. The page reads `cv.json` as spec 0005 set; no field, schema, or token changes.

### State transitions

None. A static page with no state.

### API surface

Build time components only; no HTTP.

| Surface | Change | Classes or values |
|---|---|---|
| `SectionHeading` (`src/components/SectionHeading.astro`) | the default class string | `font-mono text-base font-medium uppercase tracking-label text-accent`, merged with `class`; props `as?: 'h2' \| 'h3'` and `id?` unchanged |
| `cv.astro` | none | still passes `border-b border-line pb-2 break-after-avoid` and the eight heading texts (spec 0005 AC-3, plus Projects from spec 0010) |
| `styleguide.astro` | the type specimen line | `Section heading in text-base at 500, uppercase, tracked`, with the same classes as the component |
| `e2e/styleguide.spec.ts` | the `SectionHeading` case, and one new case | the `SectionHeading` case retitled and retagged as AC-1 says, reading 16px, 500, uppercase, 1.6px, light accent (AC-1); `the type specimen line for a section heading looks the same as SectionHeading`, seven computed properties of the specimen against the component's (AC-6) |
| `e2e/site.spec.ts`, the `cv page` block | five new cases | `section headings are text-base capitals at 500 in accent, under the name, in light and dark` (AC-2); `every section heading is one line of at most 23 characters at 320px` (AC-3); `under prefers-contrast: more the muted label line turns ink and the section headings stay accent capitals, in light and dark` (AC-5); `under forced colours a section heading loses its olive and keeps its size, weight, capitals, tracking, and rule` (AC-5, and the AC-2 ladder with no step told by colour alone); inside the block's own `test.describe('print')`, `prints section headings at 11pt capitals in the paper accent with no print only rule` (AC-4); each tagged `// covers: spec 0012 AC-N` |
| `design.md` | the edits of AC-7 | |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render a section heading | font size 16px, line height 25.6px | Tailwind's `text-base` step with `--text-base--line-height: 1.6` (spec 0003) |
| Render a section heading | weight 500 | `font-medium`, the one emphasis weight shipped (spec 0003 AC-3) |
| Render a section heading | colour | the `accent` token, light, dark, and print values in `global.css` (spec 0003) |
| Render a section heading | capitals, 0.1em tracking | `uppercase` and `tracking-label` (spec 0003) |
| Render a section heading | the rule and page break rule | `cv.astro`'s class prop `border-b border-line pb-2 break-after-avoid` (spec 0005 AC-3) |
| Render a section heading | its text | the eight literals in `cv.astro` (spec 0005 AC-3 and spec 0010, which added Projects), each at most 23 characters (this spec) |
| Render the name | 18px at 500 | `text-lg font-medium` (spec 0003 AC-4), unchanged |
| Print a section heading | 11pt, tracking 0.1em | the 11pt root of spec 0003 AC-11; every value is rem or em, so it follows |
| The 320px page test | the one line check | the `Range` helper inside the date wrap case of `e2e/site.spec.ts` (`rightValues` in `page.evaluate`, rects with `width > 0`, distinct `Math.round(rect.top)` values) |
| The 320px page test | the 23 cap | a named constant with its derivation in a comment: 272px, the column at 320px less `px-6` each side (spec 0003 AC-5), divided by 11.6px, the tracked advance on the Linux runner |
| The print page count | Letter and A4 pages, before and after | `page.pdf({ format: 'Letter' })` and `'A4'` against `pnpm preview`, the probe `/check verify` already uses; recorded under *Build measurements* in [verify.md](verify.md) |
| Render the style guide specimen | its text and classes | the literal in `styleguide.astro` (this spec, AC-6) |
| Draw the CV share card | the `CV` label | `share-card.ts` (spec 0006), unchanged |

### Key invariants

- The name is the largest text on `/cv`: no element under `body` computes to a font size above the `h1`'s.
- Every section heading that spans the column is one line at 320px, and every heading text is at most 23 characters.
- Every level of the ladder is told from its neighbours by size, weight, case, or colour, never by colour alone; the heading's colour pair is a tested `CONTRAST_PAIRS` entry.
- The 12px olive label recipe no longer renders on any live page; the footer keeps `text-xs` in `muted`.
- Colours come only from the six tokens; sizes only from Tailwind's rem steps; weights only 400 and 500; no `dark:`, no arbitrary value, no pixel size, no inline style.
- The share cards, `global.css`, and `contrast.ts` are byte identical before and after; no spec file changes during the build.

### Security model

Not applicable. A public static page with no input, no script, and no new resource; the CSP is unchanged.

### Configuration required

None. No environment variable, secret, or dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `styleguide.spec` is `e2e/styleguide.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Component (`styleguide.spec`): the retitled `SectionHeading` case reads 16px, 500, uppercase, 1.6px, light accent on the `h3#light-heading` specimen, verifies **AC-1**.
- Ladder (`site.spec`, the `cv page` block): at 1280px, in light and dark, every `main section h2` computes to the AC-2 values and keeps its rule, and the `h1` has the largest `font-size` under `body`; the existing h1, role, position, and meta cases stay untouched, verifies **AC-2**.
- One line at 320px (`site.spec`, the `cv page` block): for every `h2`, the `Range` helper of the date wrap case gives one distinct rounded top, `textContent.length` is at most the 23 constant, and each width goes into `test.info().annotations`, which a JSON report shows when run locally or in the Linux Playwright image (CI's `list` reporter does not), verifies **AC-3**.
- Failure case, a long heading (`verify`, break step): with `Leadership & activities` temporarily renamed to a 24 character text the 320px case fails on the length check on macOS, where the layout alone would still pass; restored, it passes, verifies **AC-3**.
- Print (`site.spec` inside the `cv page` block's `test.describe('print')`, whose `beforeEach` already emulates print in dark; `verify` in a real print preview): the AC-4 values on every `h2` and no new print rule, plus the Letter and A4 `page.pdf` counts before and after, verifies **AC-4**.
- Preferences (`site.spec`, the `cv page` block): under `prefers-contrast: more`, in light and dark, the muted label line turns ink (so the setting is on) while every `h2` stays accent capitals at 16px and 500; under `forced-colors: active` every `h2` takes the system text colour and keeps its size, weight, capitals, tracking, and rule, and no entry title is in capitals, so the ladder holds without colour, verifies **AC-5** and the colour clause of **AC-2**.
- Tokens and card (`pnpm test`, `verify`): `contrast.test.ts` passes unchanged; `git diff` shows no change to `global.css`, `contrast.ts`, or any spec; `dist/og/cv.png` compares byte equal across two builds on `main` and then against the build after the change, verifies **AC-5**.
- Style guide (`styleguide.spec`, grep, `verify`): the specimen case finds the specimen line once in the light panel and reads its seven computed properties equal to the `h3#light-heading` component's; the grep finds no `Label in text-xs` specimen; the panel headings render the new look, verifies **AC-6**.
- Docs (`verify`): the `design.md` rows and sentences of AC-7 exist and `pnpm format:check` is clean, verifies **AC-7**.
- Gate (commands, CI): build, lint, format, Vitest, and Playwright pass on macOS and in CI; the fixture derived `/cv` cases are untouched, verifies **AC-8**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the visible change is one class string, so it ships whole in one merge with the tests that pin it and the notes that describe it, then nothing more grows from it.

1. Baseline: on `main`, run `pnpm build` twice and `cmp` the two `dist/og/cv.png` files, keep one copy; run `page.pdf` for Letter and A4 against `pnpm preview` and note the page counts, satisfies **AC-4**, **AC-5**.
2. Component and style guide: change the class string in `src/components/SectionHeading.astro`, update the specimen line in `src/pages/_dev/styleguide.astro`, and retitle, retag, and rewrite the `SectionHeading` case in `e2e/styleguide.spec.ts` to the new values; run `pnpm build` and the `styleguide` Playwright project, satisfies **AC-1**, **AC-6**.
3. Page tests: in the `cv page` block of `e2e/site.spec.ts` add the AC-2, AC-3, and AC-4 cases named in the API surface table with their `// covers: spec 0012 AC-N` tags, the 23 constant with its derivation comment, the `Range` one line check, and the width annotations; run the `site` project, satisfies **AC-2**, **AC-3**, **AC-4**.
4. Docs: make the `design.md` edits of AC-7 and run `pnpm format`, satisfies **AC-7**.
5. Verify and gate: run the full gate, compare `dist/og/cv.png` with the baseline copy, run `page.pdf` again for Letter and A4, run the break step for a 24 character heading, confirm the CI run on Linux passes, and read the measured widths from a JSON report run in the Linux Playwright image, since CI's `list` reporter prints no annotations, satisfies **AC-4**, **AC-5**, **AC-8**.

## Consequences

**Positive**:
- A reader skimming `/cv` finds the sections first, on screen and on paper, within the two weights and six colours the design system ships.
- One class string changes; `cv.astro`, `CvEntry`, `KeyedList`, the tokens, and the share cards are untouched.
- The 23 character cap is written down and asserted, so the next section a spec adds is named to fit a phone before it is built.

**Negative / tradeoffs**:
- The 12px olive label leaves the live site. A later page that wants a small tracked label needs its own spec line, since `SectionHeading` no longer draws one.
- At 320px the longest heading has about 14px to spare on macOS and about 5px on the Linux runner. A new section name longer than 23 characters is a spec change, not a content edit.
- The printed CV grows by about 6.6pt per heading, up to 53pt over the document, which may add a page on Letter or A4. The count is recorded, not gated; the one page promise belongs to the CV PDF decision.
- The style guide's subheadings (`Tokens`, `Type`, and the rest) grow to 16px capitals too, which reads louder on that dev only page, and its `SectionHeading as h3` specimen may wrap inside a 320px panel, which the cap does not cover.

**Neutral**:
- Spec 0003 carries four amendment lines written with this spec; after the build its AC-4 amendment was reworded (no label recipe remains, the footer's `text-xs` is plain muted text) and its `--color-accent` row now reads `section headings`, as `design.md` does. The type scale table in `design.md` gains a row and loses `SectionHeading` from the `text-xs` row.
- `AGENTS.md`'s design system bullet still holds; `/sync` adds the cap after the merge.
- The bench artifact stays private and linked from `rationale.md` for the next type decision.

## Follow-up

- [ ] `/sync` after the merge: add the 23 character section heading cap and the new `SectionHeading` recipe to `AGENTS.md`'s design system bullet.
- [ ] CV PDF decision (scope row 9): start from the page counts recorded under *Build measurements* in [verify.md](verify.md) (Letter 5 pages, A4 4) and from the compact export settings already measured for the shared two page PDF. Done in [0013](../0013-cv-pdf-download/index.md).
- [ ] If a later page needs a small tracked label (a footer eyebrow, a date stamp), spec it as its own recipe rather than reviving `text-xs` on `SectionHeading`.
