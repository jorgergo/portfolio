# 0005. CV page: rationale

The decision record behind [index.md](index.md). `/develop` does not need this file; it explains why.

## Context

> ⚠️ Premise note: the scope's Release 2 promises a one page PDF that matches the CV page exactly, and the content on record (four roles, one volunteer role, a degree with seven courses, three awards, six certificates, five skill lines, twenty one technologies, three languages, two interest groups) prints to four pages at 11pt on Letter and A4 (measured after the build; the first estimate of about eighty lines and two pages was wrong, see *Review measurements*). This spec makes the web page print cleanly across pages and leaves the one page question to the PDF spec, where it belongs: either the content is cut deeply, or the PDF gets a much denser layout, or the promise is dropped. Deciding it here would mean hiding content on paper that the page shows on screen.

The CV page is the placeholder shell from spec 0003: your name and headline, nothing else. The scope asks for your CV in English in the Harvard format, styled like cv.jarocki.me, printing to a clean document with no site chrome, reading well on phone and desktop, with its own title and description. Recruiters are the first audience: they read the current role first, they print or save to PDF, and they check a company or a certificate when it matters. Peers are second.

Three earlier decisions fix most of the page. Spec 0001 makes it a static Astro page under a hashed Content Security Policy (a browser rule that blocks inline styles and unlisted scripts), so no inline style and no `set:html`. Spec 0002 supplies the content: one JSON file with `basics`, `work`, `volunteer`, `education`, `awards`, `certificates`, `skills`, `technologies`, `languages`, and `interests`, every string capped, dates as `YYYY-MM`, plus the helpers that format and sort them, and it hands this spec the questions of section order, grouping consecutive roles at one company, and which optional fields show. Spec 0003 fixes the look: six colour tokens, Plex Mono as the interface face with Plex Sans only inside `Prose`, a 640px column, a print layer (paper tokens, 11pt, 18mm margins, plain links, hidden skip link and footer link), the `xs` breakpoint at 480px reserved for this page's column collapse, `SectionHeading`, `TagChip`, and `Prose`, and a footer whose city line stays on paper for every page. Spec 0004 set the header shape (an `h1` and a subtitle `gap-2` apart), the rule that links carry no underline only where no plain text sits beside them, and the inner page title pattern it left to the metadata spec.

You gave three references and one brief. Your old resume (two Letter pages, Lato 10pt, a blue accent) has the structure you want to keep: a name over a `GitHub | LinkedIn | phone | city` line, uppercase headings with a rule, keyed rows for skills, entries as a bold title, a `Position | dates` line, and bullets. The Harvard template (one wide page, a serif at 11pt) has the pairs: organization left and location right, position left and dates right, a hairline under each heading, a summary paragraph, skills as bullets, technologies as one comma line. The Harvard OCS `.docx` writes skills as labelled lines (`Technical:`, `Language:`, `Interests:`). The brief: "a combination of my old resume, but a bit more minimalistic, with the IBM font, the earth tone colors, and the general aesthetics of the page; a full redesign in that sense." Your standing preference is evidence first: measured numbers, real references, minimal with attention to detail.

## Options considered

### Option 1: The old resume's bones and the Harvard pairs on the design system (chosen)

Left aligned in the column: name, a `label · location` line, a contact line of full link paths; uppercase `SectionHeading`s with a hairline; every dated entry as Harvard pairs (left text, right meta, stacking under 480px); consecutive roles at one company under one company line; awards and certifications as the same entry anatomy; skills, technologies, languages, and interests as keyed rows in one section; sans only in `Prose`; two new components (`CvEntry`, `KeyedList`) and five pure helpers (seven after the review); tightened, unbroken, chromeless on paper.

**Pros**:
- Every structural idea comes from a document you already trust (your resume or the Harvard template), restyled once on the tokens, so the page reads as the site and as a CV at the same time.
- One entry component serves five sections, and the pair pattern is written once with the `xs` collapse spec 0003 reserved for it.
- Prints as a document: text links, keyed rows instead of chips, no footer, no split entries, no script to hash.
- The two Ford roles read as one story under one company line, with each role's own dates and location.

**Cons**:
- Two new components, five helpers (seven after the review), and two small prop additions to spec 0003's shell (`printFooter`, `SiteFooter` `class`).
- Grouping is a rule the reader must know (adjacent after sorting); a return to a company after another job renders as two entries, correctly but unlike LinkedIn's grouping.
- Long group keys wrap inside the `xs:w-40` column; `Additional skills` is already 17 of the 19 characters that fit.

### Option 2: The cv.jarocki.me shape

Avatar right, name, tagline, location line, icon contact links; About, Work Experience, Education, Skills; a work entry as company plus a Remote badge plus tech chips on line one with dates right, the title bold on line two, then bullets; skills as chips; a print command in a Cmd+K menu.

**Pros**:
- The scope named it as the style; its tech chips per role scan fast for technical recruiters.
- The chips would give `TagChip` its first real use.

**Cons**:
- It reads as an app, not a document: badges, chips, an avatar, and a command menu are screen furniture that print poorly (chips need the `print:` comma rule, the avatar and menu need hiding).
- Per role tech chips need a field the model does not have, so it is a schema change first.
- It is the opposite of the brief: your resume is text and rules, not badges.

### Option 3: The Harvard template as drawn

A centred name over a centred contact line, an unlabelled summary paragraph, uppercase headings with a rule, the company repeated per role, bullets only, skills as bullets, technologies as one comma line, one page.

**Pros**:
- The plainest document; nothing to explain, prints as it reads.
- No grouping rule, no keyed list component.

**Cons**:
- A centred header on a site where every other page is left aligned, and the only page whose header differs.
- Repeating `Ford Motor Company` twice in a row reads as two jobs to a skimming recruiter.
- One page is not reachable with the content on record without hiding sections in print, which this spec's premise note rejects.
- Skills as bullets and technologies as one line are the two shapes your old resume replaced with keyed rows, the block you asked to keep.

### Option 4: The old resume as drawn, recoloured

The two page resume reproduced in the column: the name centred between two rules, `GitHub | LinkedIn | city` as link words, blue swapped for olive, Lato swapped for Plex, keyed rows with a bar, entries with a `Position | dates` line, a Projects section.

**Pros**:
- The strongest continuity with the document recruiters already have from you.
- The keyed skills block is already the shape you like.

**Cons**:
- `GitHub` and `LinkedIn` as link words are useless on paper; the full paths are what a printed reader can type.
- The flanking rules, the bar separators, and the `Position | dates` line are decorations the brief asked to reduce, and the pairs put dates where a Harvard reader expects them.
- Projects have no home in the content model until the Portfolio page (Release 3).
- Your phone number is on it; spec 0002 keeps phone numbers out on purpose.

## Rationale

Option 1 is chosen because it satisfies the brief and the scope at once: the structure of your resume (keyed rows, a contact line, headings with a rule, bullets) and the Harvard pairs the scope names, restyled once by the tokens and the two surfaces rule, left aligned so the site stays one site. Every force from Context lands somewhere concrete: the CSP forbids inline styles and injected markup, so the page is markup and utilities only; the print layer and the `xs` breakpoint were built for this page, so the pair pattern and the paper rules cost nothing new; the model already holds every value, so the only additions are formatting helpers and rendering rules.

Option 2 was the scope's named style and lost to the brief and to paper. Its badges and chips serve a screen; a CV is read on paper more often than any other page on this site, and your own resume is text. Option 3 is the most honest document, but a centred header breaks the site's one alignment for one page, and repeating the company hides the continuity of the Ford roles. Option 4 keeps the most continuity and the most decoration, and the brief asked for less of the second.

The measurements behind the small calls: the column is `max-w-content` (640px) with `px-6` inside it, so the text area is 592px on desktop and 432px at the 480px `xs` breakpoint. Plex Mono advances 0.6em per glyph, so at `text-sm` (14px) a 19 character key needs 160px, which is why the key column is `xs:w-40`, and `Additional skills` (17 characters) fits. At 320px the text area is 272px, and the longest contact item, `linkedin.com/in/jorgergo` plus its dot, is 24 characters at 8.4px, about 210px, so each item stays whole on its own line when the list wraps. A right value that cannot shrink must be short: `Jan 2025 – Jul 2025 · Mexico City, Mexico` is 41 characters, about 344px at 14px, which beside a role title in a 432px line leaves the title about 70px and breaks it mid word; that is why dates (at most 19 characters, 160px) are the only right values that never shrink, why they sit on line 1 in every section, and why locations sit on line 2 and may wrap. On paper at 11pt with 18mm margins a Letter page holds about 39 lines at the 1.6 line height. The first count put the content at about 80 lines, two pages; it missed how the bullets and the certificate names wrap, and the built page prints to four (see *Review measurements*). The section gap on paper is `gap-6`, which computes to 22px at the 11pt root (about one line), the Harvard template's blank line between sections; the screen keeps spec 0003's `gap-14`.

Three chosen answers were adjusted after the interview, each with your confirmation. The location moved from the contact line to the label line, because a link without an underline beside plain text fails WCAG 1.4.1, and the contact links became `fg` so the eye tells them from the muted label line above. The location of a grouped role moved from the date cell to line 2, and Education put its dates on line 1, after the cross check measured that a 344px date and location cell cannot share a 432px line with a title; dates now sit on line 1 and locations on line 2 in every section. Positions render at weight 400, and the `design.md` weight line changes to match, so each entry has one medium line.

A fresh model review of the build (2026-09-24, [docs/reviews/2026-09-24-feat-cv-page.md](../../reviews/2026-09-24-feat-cv-page.md)) found four minor issues, and you confirmed the answer to each. The chosen option stands; the review changed details inside it:
- **Line 2 of a pair.** Both sides could shrink, so flexbox split the overflow between them by width and broke `Toluca, Mexico` in two at every width. The subtitle now grows from zero width and wraps, and the location stays whole. That is the rule line 1 already followed, where a long certificate name wraps beside a date that cannot shrink. The review proposed `xs:flex-wrap` instead; it would put the location on a row of its own, a third place for a right value.
- **Untested rules.** The page kept two branching rules inline that the fixture never exercises, and the page test copied them, so a shared mistake would pass. They became `formatSkillRows` and `firstUrl`, with literal Vitest cases.
- **Tests that break on valid content.** The fixture derived page tests read text from elements the schema lets be absent. They now count first, so the verify break steps pass without a test edit, as `verify.md` claimed.
- **Page count.** Four pages, not two; a correction of fact, no decision.

## Evidence

### The references you sent (read 2026-09-24 from your Downloads folder)

| Reference | Page | Type and colour | Header | Headings | Entries | Skills |
|---|---|---|---|---|---|---|
| `US Letter Resume.pdf` (your old resume) | 2 pages, Letter (612 × 792pt) | Lato 10pt body, Lato Black 16.9pt name, ink `#262626`, blue `#164c78` for the name and headings, `#5271ff` links, light blue rules | name in capitals centred between two rules; `GitHub \| LinkedIn \| +52 … \| Toluca, Mexico` centred | uppercase blue label with a colon and a full width light blue rule under it | bold title, then `Position \| Month, Year - Present`, then bullets; a `GitHub` or `Public Link` link after a title | keyed rows: bold key in a left column, a bar, values separated by bars (`Programming`, `Web & Database`, `Frameworks`, `Tech`, `Language`); the same for `Other activities` |
| `Harvard CV Template.pdf` (a Spanish Harvard template) | 1 wide page (1191 × 842pt) | STIX Two Text 11pt, black, italic for the summary, locations, and dates; grey hairlines `#b7b7b7` | name centred in bold; `Barcelona, España · linkedin.com/in/… · phone · email` centred with middle dots | uppercase bold label over a grey hairline | organization bold left, location bold right; position left, dates italic right; bullets | `Skills adicionales` as bullets; `Tecnologías` as one comma separated line |
| `Harvard Bullet Point Resume Template.docx` (Harvard OCS) | 1 page | Word template | name, then a `•` separated address, city, email, phone line | Education, Experience, Leadership & Activities, Skills & Interests | organization left, city right; title left, dates right; bullets with action verbs | labelled lines: `Technical:`, `Language:`, `Laboratory:`, `Interests:` |

What survived from each: from your resume the contact line, the headings with a rule, the keyed rows, and the title then bullets rhythm; from the Harvard template the pairs, the middle dot separator, the summary paragraph, and the hairline in the `line` token; from the OCS template the labelled lines idea, merged with your keyed rows into one `Skills & interests` section. What did not: the blue, the flanking rules, the bar separators, the centred header, the phone number, the `Public Link` words, italics (the site ships no italic face), and Projects (no model section yet).

### Web check (fetched 2026-09-24 by a read only helper on the cheapest model)

- cv.jarocki.me: name left with a tagline, a location line with an icon, six contact icons (globe, email, phone, GitHub, LinkedIn, X), a circular avatar right; sections About, Work Experience, Education, Skills, Side projects; a work entry puts the linked company, a Remote badge, and tech tags on line one with dates right aligned, the bold job title on line two, then a description and bullets; skills as text badges; a command menu (Ctrl+K) for printing. Verified: https://cv.jarocki.me/
- Harvard OCS guidance: name centred at 14pt bold over a 10pt contact line; sections Education, Experience, Leadership & Activities, Skills & Interests; title and company left, dates right at a tab stop, location on its own line; Skills & Interests as at most three labelled lines; a serif at 10 to 12pt, one inch margins, uppercase bold headings with a bottom border, no colour, graphics, or photo, strictly one page. Verified: https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/
- Not verified (HTTP 403): the two OCS PDFs on hwpi.harvard.edu. The cached summary is in `docs/.agent-cache/research/cv-page.md`.

### Cross check (a different model, read only, 2026-09-24)

A second model read the draft, the design system and content specs, `design.md`, `AGENTS.md`, the shell, the helpers, the lint config, and the page tests, and returned fifteen gaps and seven soundness notes. All fifteen were applied to `index.md` and `verify.md` before acceptance; the load bearing ones:

- The right meta of a grouped role (`dates · location`, up to 344px) cannot shrink and squeezed the role title to a few characters between 480px and about 600px. Dates now sit on line 1 and locations on line 2 in every section, and only date spans are `shrink-0`.
- No sans text on the page is weight 500, so the page requests three font files, not four; the criterion and the test expectation were corrected.
- The print gaps compute at the 11pt root (22px and 14.67px), not at 16px.
- The footer ring test in `e2e/site.spec.ts` would land on the email link after this change; it moves to `/missing`.
- Safari drops the list role of the contact `<ul>`; the VoiceOver step now expects three links there and a list elsewhere.
- Positions at weight 400 contradicted `design.md`'s weight line; the line changes through AC-13.
- Whitespace between a contact link and its dot survives compression; each `li` is a flex row.
- An interest group with no keywords vanished; such groups gather into one `Interests` row.
- The style guide panels are about 234px wide while `xs:` is active; the document components render full width below the panels.
- The helper contracts (query and hash in `formatProfilePath`, non empty inputs for `spanOf` and group items, the Spanish input), the Vitest tag (`spec 0005 AC-9`), the missing spacing meanings for `design.md`, the empty summary and highlights cases, `break-after-avoid` on a group's first line, and the 480px overlap check were tightened.

Two soundness notes were taken: dates on line 1 everywhere, and the build plan reordered so every step ends green with the helpers and their tests first. One was declined: hiding the footer by checking the route inside `SiteFooter` saves the two props but couples a shared component to one page.

### Review measurements (2026-09-24, a build of your working tree in Chromium)

Pair lines, measured on `/cv` at three window widths with the `xs:flex-1` subtitle. Each row gives the left text's width and line count, then the right value's:

| Width | Tec degree line (subtitle, location) | Catia certificate (title, date) | Right values that wrap |
|---|---|---|---|
| 480px | 298px, 3 lines · 118px, 1 line | 349px, 2 lines · 67px, 1 line | none |
| 640px | 458px, 2 lines · 118px, 1 line | 509px, 2 lines · 67px, 1 line | none |
| 1280px | 458px, 2 lines · 118px, 1 line | 509px, 2 lines · 67px, 1 line | none |

Before the fix, the review measured `Toluca, Mexico` at 98px and two lines at desktop width, and at 71px and two lines at 480px. At 1280px Chromium breaks the degree after `GPA` and the Catia name after its second `Catia`; the page sketch in `index.md` draws those breaks.

Print, `page.pdf` with print media at the 11pt root and 18mm margins, content on record:

| Paper | Pages | Fill per page | Page openings |
|---|---|---|---|
| Letter | 4 | 82%, 97%, 94%, 45% | the header, `Software Engineer, IT Academy`, `AWARDS`, `SKILLS & INTERESTS` |
| A4 | 4 | 96%, 99%, 96%, 8% | the header, `El Puerto de Liverpool`, an award, the `Sports` row |

No page ends on a heading or a company line; the Ford group splits between its two roles as designed.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`: colours from the six tokens only, no arbitrary Tailwind values, no `target`, no `style`, no `set:html` or `is:inline`, no ARIA role on generic elements, `getCv()` once per page, `src/pages/_dev/` dev only.
- Spec 0002 (`docs/specs/0002-content-model/index.md`): the sections, fields, caps, `formatDateRange`, `formatMonth`, `formatLocation`, `sortNewestFirst`, `sortByDateDesc`, and its note that the CV page owns section order, grouping consecutive roles, and which optional fields show.
- Spec 0003 (`docs/specs/0003-design-system/index.md`): the tokens, the two surfaces rule, the print layer (AC-11), the `xs` breakpoint, `SectionHeading`, `TagChip`, `Prose`, `TextLink`, the footer on paper, and the follow up naming this spec's four questions.
- Spec 0004 (`docs/specs/0004-home-page/index.md`): the header shape, unmarked links only beside other links, the inner page title pattern.
- `design.md`: the build mandate, the token roles, the spacing meanings, the components and usage rules.
- `docs/scope/scope.md`: the CV page row, the Release 2 PDF row (one page), the Portfolio row (projects).
- Installed skills: `astro` (`.claude/skills/astro/`), `tailwind-4-docs` (`.agents/skills/tailwind-4-docs/`), `accessibility` (`.claude/skills/accessibility/`), `vitest` (`.agents/skills/vitest/`).

**Practices & standards**:
- The Harvard resume format (Office of Career Services): pairs of organization and location, position and dates; labelled skill lines; action verb bullets.
- WCAG 2.2 AA: 1.3.1 info and relationships (real headings, a `dl` for keyed rows, a real list for bullets), 1.4.1 use of colour (no unmarked link beside plain text), 2.4.7 focus visible, 2.4.6 headings and labels (named regions), 2.5.8 target size (the inline exception for text links, `min-h-6` kept).
- CSS fragmentation: `break-inside: avoid` on entries and `break-after: avoid` on headings for paged media, best effort across engines.
- IBM Plex Mono's fixed advance width of 0.6em, the basis for the key column width and the wrap arithmetic.
- Progressive enhancement: the document ships as HTML with no script.

**Links** (web verified on 2026-09-24 by the web check):
- cv.jarocki.me: https://cv.jarocki.me/
- Harvard OCS bullet point resume template: https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/
