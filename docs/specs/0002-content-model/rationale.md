# 0002. Content model: rationale

The decision record behind [index.md](index.md). `/develop` does not need this file; it explains why.

## Context

The site has two pages in Release 1 (home and a Harvard style CV) and three later consumers of the same facts: a share card and page metadata, a Cmd+K command menu, and a downloadable CV PDF. Your name, headline, email, links, and every CV line must read the same everywhere. If each page carried its own copy, the PDF would drift from the web CV the first time you updated a job, and recruiters would notice.

Forces that shape the choice:

- **You edit rarely, by hand or through an AI.** Content changes when you change jobs or polish a bullet, not daily. There is no CMS and no editor UI; the file itself is the interface.
- **The build is the only safety net.** The site is static (spec 0001): there is no server to validate anything later. `pnpm build` runs `astro check` first, so whatever the schema rejects never deploys.
- **One page is a hard constraint.** A Harvard CV is one page, and the Release 2 PDF must be too. Runaway text is the most common way that breaks.
- **The CSP is strict.** Astro's hashed CSP blocks inline styles and the lint config bans `set:html`, so anything that renders HTML from a string is off the table, and Shiki's default code highlighting would render unstyled.
- **The content is public PII.** A public page and a public repo get scraped. Whatever fields exist can be filled in by accident, including a phone number or home address.
- **English only for now**, with a Spanish version deferred.

Not deciding means the home and CV pages each invent their own data shape, and the PDF and command menu later have to reconcile them.

## Options considered

### Option 1: One JSON file, JSON Resume aligned, one entry collection

`src/content/cv.json` holds everything as one object, loaded by Astro's `file()` loader as a single entry and validated by a strict Zod schema. Field names follow JSON Resume, with a few extensions.

**Pros**:
- Exactly one file to edit, which is the scope's own done condition.
- Strict syntax with no surprises: every value is the type you wrote.
- Prettier formats it, and VS Code autocompletes it from Astro's generated JSON Schema with no extension.
- Familiar, documented names that existing CV tooling understands.

**Cons**:
- No comments, and long prose sits on one line.
- Very long file once every section is filled (still a few hundred lines).
- JSON Resume alignment is partial, so a true export needs a mapping.

### Option 2: One YAML file

The same single entry, written as `src/content/cv.yaml`.

**Pros**:
- Comments and multiline strings make prose pleasant to write.
- Less punctuation noise than JSON.

**Cons**:
- YAML silently retypes values (`2023-01-15` becomes a date, `no` can become `false`, a bare `3.10` becomes a number), which is exactly the class of bug a CV cannot afford.
- Editor autocomplete needs the Red Hat YAML extension.
- Indentation mistakes change structure without a syntax error.

### Option 3: One file per section

`src/content/cv/basics.json`, `work.json`, `education.json`, and so on, one collection each.

**Pros**:
- Small, focused files; a diff shows which section changed.
- Each collection gets its own generated schema and entries with natural ids.

**Cons**:
- Editing your CV touches several files, which the scope explicitly wants to avoid.
- Ten collections to register and query, and cross section rules (like the required ones) spread out.

### Option 4: One Markdown file per entry

Each job or degree is a `.md` file with frontmatter for dates and a Markdown body for bullets, loaded by `glob()`.

**Pros**:
- The most natural way to write prose, with rich text for free through `render()`.
- The pattern most Astro examples use.

**Cons**:
- Dozens of tiny files for a one page CV.
- Bullets as free Markdown cannot be capped or counted by the schema.
- Brings Markdown rendering and its highlighting question into a site that otherwise needs none.

## Rationale

The file is the only editing interface and the build is the only safety net, so the format that fails loudest on a mistake wins. JSON does not reinterpret values, which removes YAML's silent retyping (the worst failure for dates and grades on a CV). A single file meets the scope's "one content source in one place" literally, which Option 3 does not. Markdown per entry (Option 4) optimizes for long prose, but Harvard bullets are short, countable lines, and keeping them as strings is what lets the schema cap them and keep the CV on one page.

The rest of the design follows from the same forces. Strict objects turn a misspelled key from a silently missing bullet into a build error. `YYYY-MM` strings are what a CV shows, sort correctly as plain text, and avoid time zone bugs that come with `Date` for values that have no day. Plain text only avoids any string to HTML path, which the CSP and the `set:html` ban would block anyway. Leaving phone and street address out of the schema entirely is the simplest guarantee they never publish. Turning off syntax highlighting settles spec 0001's open CSP issue with zero setup, because nothing on the site has code fences yet.

JSON Resume naming costs nothing today and keeps the data understandable to other tools, which may matter for the Release 2 PDF. The comfort cost of JSON for prose is real but small for content you touch a few times a year, and much of the editing will go through an AI that handles JSON well.

### Smaller decisions from the conversation

| Question | Your pick | Runner up |
|---|---|---|
| Extra sections | Languages, certifications, awards, leadership & activities (`volunteer`), plus interests | Core Harvard sections only |
| Home bio vs CV summary | Separate `bio` and `summary` | One shared text |
| Projects | Left to the Portfolio page spec | Modelled now |
| Who writes the real content | This feature, from your pasted CV | Placeholder until the CV page |
| Rich text | Plain text only | Inline bold and links via a small parser |
| Dates | `YYYY-MM`, no end means Present | Full dates, free text |
| Contact on the site | Email plus city and country, no phone | Full Harvard contact line |
| Photo | Optional avatar, home only | None |
| Networks | GitHub and LinkedIn, closed list | Free text |
| Skills shape | Named groups with keywords | Flat list, items with levels |
| Promotions | One entry per role | Company with nested roles |
| Education extras | GPA and coursework, both optional | Bullets under the degree |
| Ordering | Sorted newest first by code | File order |
| Required content | Core basics, one work, one education | Every section, or name only |
| Length | Hard caps (160, 500, 5, 220, 8) | No caps |
| Date display | `Jan 2023 – Present` | Full month names, years only |
| Fluency | Fixed list plus optional CEFR level | Free text |
| Code highlighting | Off | Prism with a stylesheet |
| Location | City plus country code, shown as a name | One free text line |
| Unknown keys | Fail the build | Silently dropped |
| End before start | Fail the build | Allowed |
