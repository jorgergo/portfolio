# 0012. Rationale: CV section headings at body size in olive capitals

The reasoning behind [index.md](index.md). `/develop` does not need this file.

## Context

Spec 0005 built `/cv` as a Harvard style document and gave every section an uppercase label from spec 0003's design system: `SectionHeading`, 12px capitals tracked 0.1em in the olive accent, over a hairline. That label was designed for the small site pages spec 0003 had in mind, where it sits above a short block. On the CV it heads a page of eight sections and forty odd lines, and it is the smallest text on that page: smaller than the 16px entry titles it is meant to sit above, smaller than the 14px dates. Measured from the components, the page sets the name at 18px weight 500, the heading at 12px weight 400, entry titles at 16px 500, roles and positions at 16px 400, meta at 14px muted, and the body at 16px sans. A reader who skims lands on the entry titles and the company links, not on Experience or Education, because size and weight both point there.

The forces that shape the fix are all recorded already. The design system ships two weights, 400 and 500, and six colours, and forbids pixel sizes, arbitrary values, and a `dark:` variant (`AGENTS.md`, design.md). Sizes come from Tailwind's rem steps, so print follows the 11pt root with no extra rule (spec 0003 AC-11). The column is 640px and the site must hold at 320px with nothing scrolling sideways (spec 0003 AC-5), which caps how wide a one line heading can be; a tracked capital in Plex Mono advances 0.7em, and the Linux CI runner rounds the glyph up, so a size that fits on a Mac can wrap in CI (the width note in `e2e/site.spec.ts`, spec 0011's email cap). The page tests pin today's 12px label (`e2e/styleguide.spec.ts`) and design.md's type scale table names `SectionHeading` in its `text-xs` row, so any change moves those with it. Your own bar for a design decision is evidence first: measured numbers and a live comparison before a pick.

Not deciding leaves a CV that reads flat on the screen a recruiter skims for ten seconds, and leaves the Release 2 PDF (scope row 9) to inherit the same flat scale.

## Options considered

### Option 1: The label one step up, 14px capitals at weight 500

Keep the recipe and raise it one Tailwind step, from `text-xs` to `text-sm font-medium`, name and everything else unchanged.

**Pros**:
- The smallest change; 45px to spare at 320px.
- Keeps the label character and the olive structural role.

**Cons**:
- Still smaller than the 16px entry titles, so case, colour, and weight carry the level alone; in the bench the eye still met the titles first.
- Leaves the scope's own test unmet: the headings are not the first thing a skim lands on.

### Option 2: Body size capitals at weight 500 in olive (chosen)

`text-base font-medium uppercase tracking-label text-accent`: the same size as an entry title, set apart by capitals, tracking, weight, colour, and the rule; the name stays 18px on top.

**Pros**:
- The heading is the loudest line in its section on both frames of the bench, in light and in dark, and the name still tops the page.
- Every value is a step or token that already exists; no CSS changes, no new contrast pair.
- Keeps design.md's character (a well kept plain text file, olive for structure) and the man page convention of capital section names in a mono face.

**Cons**:
- About 14px to spare at 320px on macOS and about 5px on the Linux runner, so heading text is capped at 23 characters.
- The 12px label recipe no longer renders on a live page.
- Print grows by about 6.6pt per heading.

### Option 3: Body size capitals at weight 500 in ink

The same recipe in `fg` instead of `accent`: one colour for every heading.

**Pros**:
- Headings share one colour with the name and the titles; olive is reserved for the focus ring, selection, and the share card.

**Cons**:
- In the bench the ink capitals compete with the entry titles, which are ink at 500 too, so the section reads as a louder title rather than a different level.
- Retires the accent's structural role from the only page that uses it as a label.

### Option 4: Mixed case at 18px, the name at 22px

A document heading, `text-lg font-medium`, in ink or olive, with the name raised to `text-title` so it stays the largest text.

**Pros**:
- A classic CV heading, 2px above the titles by size alone; 22px to spare at 320px.
- Drops tracking and capitals, the two devices some readers find shouty.

**Cons**:
- Moves the CV's name off the inner page h1 rule of spec 0003 AC-4 (18px on `/about`, `/projects`, `/contact`), or makes `/cv` the exception, a new rule either way.
- 2px is a small step in a mono face; the bench showed the section told from a title mostly by the rule and the space, not the size.
- Loses the label character the site's structure has carried since spec 0003.

## Rationale

Option 2 answers the scope's test directly, with the least change and the most evidence. Its heading is the first thing the eye meets in every frame of the bench because five devices stack on one line, capitals, tracking, weight 500, olive, and the rule, while the name keeps the top of the page at 18px, the pick you made before the candidates were drawn. Every value is a step or token spec 0003 already ships, so the contrast test, `global.css`, and the share cards do not move, and print keeps the hierarchy through the rem scale with no rule of its own. Option 4 was the closest runner up; it is a fine CV heading, but it costs the inner page h1 rule and gives back only 2px of size for it.

The width constraint decided the size ceiling before taste did. You chose that no heading may wrap at 320px, and the arithmetic then caps tracked capitals at 16px and mixed case at 18px; 20px and 22px were never candidates. The 23 character cap follows from the same arithmetic on the Linux runner, applies to a heading that spans the column, and is written into design.md so the next section is named to fit.

Three smaller picks went with the recommendation for the same reasons. Weight 500 puts the heading with the name and the titles, the page's other structural lines; 400 capitals in mono read thinner than the titles beside them. The position line stays at 16px weight 400, because a recruiter reads it right after the company, and it is already told from the sans body by face and from the title by weight; dropping it to 14px would rank it with the dates. Print keeps the same rem scale because the scope asks for the hierarchy on paper and a print only step down would weaken exactly that.

## Evidence

### Today's ladder on `/cv` (from the components, 2026-09-30)

| Level | Element | Size, weight, colour |
|---|---|---|
| Name | `h1.text-lg.font-medium` | 18px, 500, `fg` |
| Section heading | `SectionHeading` | 12px, 400, capitals tracked 1.2px, `accent` |
| Entry title | `CvEntry` `h3.font-medium` | 16px, 500, `fg` |
| Role title, position | `h4`, `p` | 16px, 400, `fg` |
| Date, location, keyed key | `span.text-sm.text-muted`, `dt` | 14px, 400, `muted` |
| Body | `Prose` | 16px, 400, Plex Sans, `fg` |

### Width of the longest heading at 320px

The text area is 272px (320px less `px-6` on each side). Plex Mono advances 0.6em per glyph, 9.6px at 16px on macOS and 10px on the Linux CI runner, whose Chromium rounds each glyph to a whole pixel (the 22px home h1 measures 13px per glyph there, `e2e/site.spec.ts`); the label tracking adds 0.1em after every glyph. The Linux column is that rounding applied to each size; only the 16px untracked width has been measured in this repo, so the AC-3 case attaches the real tracked width as a test annotation, which a JSON report shows when run locally or in the Linux Playwright image (CI's `list` reporter does not print it). The build measured 266.8px for `Leadership & activities` in that image, as the column predicts (see *Build measurements* in [verify.md](verify.md)). `Leadership & activities` is 23 characters.

| Treatment | macOS | Linux CI (estimate) | One line at 320px |
|---|---|---|---|
| 12px capitals tracked (today) | 193px | 189px | yes |
| 14px capitals tracked | 225px | 216px | yes |
| 16px capitals tracked | 258px | 267px | yes, 14px and 5px to spare |
| 18px capitals tracked | 290px | 294px | no |
| 18px mixed case | 248px | 253px | yes |
| 20px mixed case | 276px | 276px | no |
| 22px mixed case | 304px | 299px | no |

Headless Chromium on macOS measured the bench frames at 193, 225, 258, and 248px for the four treatments that were drawn, matching the arithmetic. The cap at 16px capitals: 23 × 11.6px = 266.8px fits the Linux runner, 24 × 11.6px = 278.4px does not.

### The comparison bench

A private artifact, https://claude.ai/artifact/HmNnVvHnSK7JUJekSNkD1e, built 2026-09-30: today's page and six candidates (14px and 16px capitals, 18px mixed case, each in olive and in ink) on the real header, Summary, the Ford group, El Puerto de Liverpool, Education, and Leadership, drawn class for class from `cv.astro`, `CvEntry`, and `Prose` with the six tokens, in the 640px column and a 320px frame, light and dark by a switch, with a checkbox for the position line at 14px and a live readout of the widest heading. You picked B1, 16px capitals in olive, from it. Its fonts come from Google Fonts; the site's from Fontsource; both are the same IBM Plex release, so the metrics match.

### Print growth

Today's label line box is 1rem, 11pt on paper; the new one is 1.6rem, 17.6pt. Eight headings render today (a section with no content is skipped), so the document grows by at most 53pt, about 19mm, which may add a page on Letter or A4. Spec 0005 recorded four pages on 2026-09-24, before spec 0010 added the Projects section, so the build measures the count on `main` again before the change and `/check verify` records both pairs for the CV PDF decision.

## References

**Project sources** (verifiable, in this repo):
- Spec 0003 (`docs/specs/0003-design-system/index.md`): the type scale and its steps, the raised base line height, `tracking-label`, the two weights, the `accent` role, `CONTRAST_PAIRS`, the print layer at 11pt, and the 320px rule.
- Spec 0005 (`docs/specs/0005-cv-page/index.md`): the heading texts and the class prop (AC-3; spec 0010 added Projects), the heading weight rule, and the no test edit rule for content (AC-16).
- Spec 0006 (`docs/specs/0006-metadata-share-cards/index.md`): the card label, unchanged.
- Spec 0011 (`docs/specs/0011-contact-page/index.md`): the 27 character email cap derived from the Linux runner's glyph width, the pattern this spec's 23 character cap follows.
- `design.md`: the character (a plain text file, olive for structure), the type scale table, the weights sentence, and the `SectionHeading` bullet this spec rewrites.
- `AGENTS.md`: tokens only, no pixel sizes, no `dark:`, the page test conventions, and the rule that a spec's docs move with the change.
- `e2e/site.spec.ts`: the Plex Mono width note (9.6px on macOS, 10px in Linux) and the `rightValues` one line helper the 320px case is modelled on.

**Practices & standards**:
- Typographic hierarchy by size, weight, case, and colour together, never by colour alone (WCAG 2.2, 1.4.1 use of colour).
- WCAG 2.2 AA contrast for text, 1.4.3, and the project's APCA Lc 55 floor for accent text.
- WCAG 2.2, 2.4.6 headings and labels: real heading elements whose look follows the level.
- The Harvard resume format: capital section headings over a rule, organisation left and dates right.
- The man page convention: capital section names at body size in a monospace face, the plain text file the site's character is drawn from.
- Rem based type so print and user zoom scale every level together (WCAG 2.2, 1.4.4 resize text).
