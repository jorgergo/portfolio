# 0002. One JSON file for profile and CV content

**Date**: 2026-09-23
**Status**: In Progress

## Summary

All your personal and CV content lives in one file, `src/content/cv.json`, shaped after JSON Resume (an open, documented format for CVs). Astro checks that file against a strict schema (a set of rules for every field) on every build, so a typo, a missing section, a swapped date, or text that is too long stops the build instead of shipping a broken CV. The home page, the CV page, and later the PDF and command menu all read this one file through a small set of helpers. Markdown code highlighting is switched off, since nothing needs it and the CSP would block it.

## Requirements

**User stories**:
- As the site owner, I want to change my CV by editing one file, so that every page stays in sync without hunting through templates.
- As the site owner, I want the build to reject broken or oversized content, so that a mistake never reaches recruiters and the CV stays on one page.
- As the builder of a later feature (home, CV page, metadata, command menu, PDF), I want one typed source and ready made format helpers, so that I never parse or reshape content myself.

**Acceptance criteria**:
- **AC-1**: `src/content/cv.json` is the only place profile, social, and CV content lives. It loads as the collection `cv` with exactly one entry, id `main`, and `getCv()` returns its fully typed data.
- **AC-2**: The schema defines every section in *Data model sketch* (basics, profiles, work, volunteer, education, awards, certificates, skills, technologies, languages, interests) with the listed fields, types, and optional markers. Opening `cv.json` in VS Code gives autocomplete and inline errors for keys, types, enums, patterns, and lengths through its `$schema` line. (Cross field rules, known region codes, and the `https` check run at build only, because JSON Schema cannot carry Zod refinements.)
- **AC-3**: `pnpm build` fails, naming the field, when any required value is missing: `basics.name`, `label`, `bio`, `summary`, `email`, `location.city`, `location.countryCode`, or when `work` or `education` has no entries. Every other section may be left out and the build passes.
- **AC-4**: Any key the schema does not define (for example `higlights`) fails the build. The file root holds only `$schema` (a string, which Astro's loader skips) and the entry `main`; inside `main`, no extra key is allowed anywhere.
- **AC-5**: Badly formatted values fail the build: a date not in `YYYY-MM` form with a real month, an invalid email, a URL that is not `https`, a `countryCode` that is not a known ISO 3166 two letter region, a `network` other than `GitHub` or `LinkedIn`, a `fluency` outside the fixed list, a `level` outside `A1` to `C2`, and a `skills` or `technologies` group with no keywords.
- **AC-6**: A `work`, `volunteer`, or `education` entry whose `endDate` is earlier than its `startDate` fails the build, with the error at that entry's `endDate` (for example `work.0.endDate: endDate is before startDate`).
- **AC-7**: Text past the caps fails the build: `bio` over 160 characters, `summary` over 500, more than 5 `highlights` in one entry, a highlight or entry `summary` over 220, more than 8 `courses`. All caps are read from one exported constant, `CV_LIMITS`.
- **AC-8**: Two profiles with the same `network` fail the build, with the error at the second one (for example `basics.profiles.1.network: duplicate network`).
- **AC-9**: `formatDateRange` returns `Jan 2023 – Present` when there is no end date, `Jan 2021 – Mar 2023` for a closed range, and `Mar 2023` when start and end are the same month. `formatMonth` returns `Mar 2023`. Output is identical on any machine (no locale or time zone dependence).
- **AC-10**: `sortNewestFirst` orders dated entries with current ones (no `endDate`) first, then by `startDate`, newest first, then by `endDate`, newest first; entries that still tie keep their file order. `sortByDateDesc` orders awards and certificates by `date`, newest first, with the same tie rule. Neither mutates its input.
- **AC-11**: `formatLocation` returns `City, Country name` in English (for example `Monterrey, Mexico`).
- **AC-12**: When `basics.image` points to a file in `src/assets/` (written relative to `cv.json`, for example `"../assets/avatar.jpg"`), `getCv()` returns image metadata that `<Image>` from `astro:assets` accepts. When it is absent, the build passes and `image` is `undefined`.
- **AC-13**: `cv.json` holds your real CV, rewritten in English into the Harvard structure, with no phone number and no street address, and `pnpm build` passes on it.
- **AC-14**: `astro.config.mjs` sets `markdown.syntaxHighlight: false`, and `pnpm build` prints no Shiki or CSP warning about inline styles.
- **AC-15**: The home and CV placeholder pages read `basics.name` through `getCv()` (proving the wiring end to end), and `pnpm build`, `pnpm lint`, and `pnpm format:check` pass.

## Decision

**Chosen option**: Option 1: one JSON file, JSON Resume aligned, loaded as a single entry collection.

A single `src/content/cv.json` holds everything, validated by a strict Zod schema (Zod is the validation library Astro bundles, version 4) in a `cv` content collection, with pure helpers in `src/lib/` for access, dates, sorting, and location.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) for content collection config and `astro:assets` images · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) for the helper and schema tests `/test` writes later.

Settled while writing (each with the runner up):

- **Astro's object form, no custom parser.** `cv.json` is `{ "$schema": "…", "main": { … } }`, loaded by a plain `file('src/content/cv.json')`. For a `file()` collection, Astro generates the editor schema for exactly this wrapped shape, and its loader skips a root string `$schema`, so the entry schema stays fully strict with no `$schema` field and `$schema` never leaks into the `Cv` type. Runner up: a parser that lets the file be the bare entry; it reads one level flatter but breaks editor autocomplete, because the generated schema still expects the wrapped shape.
- **Schema lives in `src/lib/cv-schema.ts`, not inline in `content.config.ts`.** It exports `makeCvSchema<I extends z.ZodType>(image: () => I)`, plus `CV_LIMITS`, the enum lists, `MONTH_PATTERN`, and `regionName`. It imports only `astro/zod` (never `astro:content` at runtime), so Vitest loads it without Astro's Vite plugin and tests pass `() => z.string()` as the image stub with no cast. `content.config.ts` passes Astro's real `image` helper, so `basics.image` still types as image metadata. Runner up: define it inline in `content.config.ts`, the Astro docs default, but then schema tests need Astro's Vite setup.
- **Exact Zod 4 calls.** `z.strictObject` for every object, `z.email()` (not the deprecated `z.string().email()`), `z.url({ protocol: /^https$/ })` (not `z.httpUrl()`, which accepts `http`), and every string as `.trim().min(1)` before any `.max(n)`, so caps count trimmed text. Caps count UTF-16 code units, which is fine for this content. Never call `.readonly()` on these schemas (Astro rewrites image references inside the data).
- **Dates stay `YYYY-MM` strings end to end.** They compare correctly as plain strings and format with a fixed English month table, so there is no `Date` object, no time zone, and no locale drift. Runner up: `z.coerce.date()`, which brings time zone edge cases for a value that has no day.
- **Country codes checked and named through one `Intl.DisplayNames` instance.** Node 26 ships full ICU (the Unicode data behind `Intl`), so `MX` becomes `Mexico` with no lookup table to maintain. `regionName(code)` in `cv-schema.ts` wraps one module level `new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })`. The schema first matches `^[A-Z]{2}$` (so `of()` never throws a `RangeError`), then requires `regionName(code) !== undefined` and `code !== 'ZZ'` (`ZZ` means Unknown Region). Codes such as `EU` or `UN` pass; that is accepted. `formatLocation` reuses `regionName` and falls back with `?? countryCode`, since `of()` is typed `string | undefined` and `!` is banned. Runner up: a hand written code to name map, which rots.
- **Refinement error paths.** The date rule is a `superRefine` on each dated entry, reporting at `path: ['endDate']` with the message `endDate is before startDate`; it runs only when both dates are present and valid. The unique network rule reports at `path: ['profiles', i, 'network']` for the second duplicate, with the message `duplicate network`. Astro prints each as `path.joined: message` under the entry.
- **A missing entry fails the build in `getCv()`, the one sanctioned throw.** A JSON syntax error (a trailing comma, for example) is only logged by Astro's file loader, not thrown, so the build fails later when `getEntry('cv', 'main')` returns `undefined`. `getCv()` throws `src/content/cv.json is missing or unparsable; see the file loader error above`. This is the single exception to the AGENTS.md "no thrown exceptions" rule, allowed because it is a content error that must fail the build. Runner up: return `undefined` and make every page handle it, which just spreads the same failure across four features.
- **Keep `sortNewestFirst` and the formatters pure and separate from `getCv()`.** Pages call `getCv()` once in frontmatter, then pass plain data to the helpers.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Data model sketch

One collection, `cv`, holding one entry, `main`. Every section is contained in that entry: no references, no foreign keys. Every object is strict (unknown keys fail). `?` marks optional; everything else is required.

| Section | Cardinality | Fields | Rules |
|---|---|---|---|
| **file root** (not in the schema) | 1 | `$schema`: string · `main`: the entry | Astro's `file()` object form; the loader skips `$schema`, and `main` is the only entry |
| **main** (the entry) | 1 | `basics` · `work` · `volunteer?` · `education` · `awards?` · `certificates?` · `skills?` · `technologies?` · `languages?` · `interests?` | strict, no `$schema` field |
| **basics** | 1:1 | `name`: string · `label`: string (headline, for example `Software Engineer`) · `bio`: string · `summary`: string · `email`: email · `location`: `{ city: string, countryCode: string }` · `image?`: image · `profiles?` | `bio` ≤ 160, `summary` ≤ 500, `countryCode` a known ISO 3166 two letter uppercase region (see *Decision*), `image` a path relative to `cv.json`, for example `"../assets/avatar.jpg"` |
| **basics.profiles** | 0 to 2 | `network`: `GitHub` \| `LinkedIn` · `username`: string · `url`: https URL | `network` unique across the list |
| **work** | ≥ 1 | `name`: string (company) · `position`: string · `url?`: https URL · `location?`: string (free text, for example `Remote`) · `startDate`: month · `endDate?`: month · `summary?`: string · `highlights`: string[] | no `endDate` means current; `endDate` ≥ `startDate`; `summary` ≤ 220; 0 to 5 highlights, each ≤ 220 |
| **volunteer** (Harvard: Leadership & activities) | 0+ | `organization`: string · `position`: string · `url?` · `location?` · `startDate` · `endDate?` · `summary?` · `highlights` | same rules as work |
| **education** | ≥ 1 | `institution`: string · `studyType`: string (degree, for example `B.S.`) · `area`: string (field) · `url?` · `location?`: string · `startDate` · `endDate?` · `score?`: string (GPA, for example `3.8/4.0`) · `courses?`: string[] | date rules as work; up to 8 courses |
| **awards** | 0+ | `title`: string · `awarder`: string · `date`: month · `summary?`: string | `summary` ≤ 220 |
| **certificates** | 0+ | `name`: string · `issuer`: string · `date`: month · `url?`: https URL | |
| **skills**, **technologies** | 0+ each | `name`: string (group label, for example `Frontend`) · `keywords`: string[] | at least 1 keyword |
| **languages** | 0+ | `language`: string · `fluency`: `Native` \| `Fluent` \| `Professional` \| `Conversational` \| `Basic` · `level?`: `A1` \| `A2` \| `B1` \| `B2` \| `C1` \| `C2` | |
| **interests** | 0+ | `name`: string · `keywords?`: string[] | |

A **month** is a string matching `^\d{4}-(0[1-9]|1[0-2])$`. Every string field is trimmed and must be non empty. Optional arrays may be omitted or empty; both render nothing.

**Where JSON Resume is extended** (so a later export knows what to map): `basics.bio`, `technologies`, `education.location`, `languages.level`, `languages.fluency` as a fixed list, `basics.image` as a local asset (JSON Resume uses a URL), and `basics.location` keeps only `city` and `countryCode`.

**Content sketch** (`src/content/cv.json`, shape only):

```json
{
  "$schema": "../../.astro/collections/cv.schema.json",
  "main": {
    "basics": {
      "name": "…",
      "label": "…",
      "bio": "…",
      "summary": "…",
      "email": "…",
      "location": { "city": "…", "countryCode": "MX" },
      "profiles": [{ "network": "GitHub", "username": "…", "url": "https://github.com/…" }]
    },
    "work": [{ "name": "…", "position": "…", "startDate": "2023-01", "highlights": ["…"] }],
    "education": [{ "institution": "…", "studyType": "…", "area": "…", "startDate": "2016-08", "endDate": "2021-06" }]
  }
}
```

### State transitions

None. Content is static; it changes only when you edit the file and rebuild.

### API surface

Build time TypeScript functions, no HTTP. All run in page frontmatter at build.

| Function (module) | Signature | Returns | Errors |
|---|---|---|---|
| `getCv` (`src/lib/cv.ts`) | `() => Promise<Cv>` | the validated `main` entry data | throws `src/content/cv.json is missing or unparsable; see the file loader error above` when the entry is absent (schema errors already stopped the build earlier) |
| `makeCvSchema` (`src/lib/cv-schema.ts`) | `<I extends z.ZodType>(image: () => I) => z.ZodType` | the strict entry schema | n/a (used by `content.config.ts` and tests) |
| `regionName` (`src/lib/cv-schema.ts`) | `(code: string) => string \| undefined` | English region name, or `undefined` for an unknown code | none (callers pass codes already matching `^[A-Z]{2}$`) |
| `CV_LIMITS`, `NETWORKS`, `FLUENCY_LEVELS`, `CEFR_LEVELS`, `MONTH_PATTERN` (`src/lib/cv-schema.ts`) | `readonly` constants | caps, enum lists, month regex | n/a |
| `formatMonth` (`src/lib/cv-format.ts`) | `(month: string) => string` | `Mar 2023` | input is already schema valid; no runtime error path |
| `formatDateRange` (`src/lib/cv-format.ts`) | `(start: string, end?: string) => string` | `Jan 2023 – Present` · `Jan 2021 – Mar 2023` · `Mar 2023` | same |
| `sortNewestFirst` (`src/lib/cv-format.ts`) | `<T extends { startDate: string; endDate?: string }>(items: readonly T[]) => readonly T[]` | a new sorted array | none |
| `sortByDateDesc` (`src/lib/cv-format.ts`) | `<T extends { date: string }>(items: readonly T[]) => readonly T[]` | a new sorted array | none |
| `formatLocation` (`src/lib/cv-format.ts`) | `(location: { city: string; countryCode: string }) => string` | `Monterrey, Mexico` | none; `regionName(code) ?? code` covers the typed `undefined` |

Both sorts use `Array.prototype.toSorted` (stable and non mutating). `sortNewestFirst` compares: current first, then `startDate` descending, then `endDate` descending.

Types exported from `src/lib/cv.ts`: `Cv = CollectionEntry<'cv'>['data']` plus named aliases per section (`CvBasics`, `CvWork`, `CvEducation`, and so on) derived from it, never hand written.

The range separator is a space, an en dash character (U+2013), and a space. The month table is the fixed English list `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`. `Present` is a fixed English word (the site is English only; the Spanish version is deferred).

`content.config.ts` after this feature:

```ts
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { makeCvSchema } from '@/lib/cv-schema';

const cv = defineCollection({
  loader: file('src/content/cv.json'),
  schema: ({ image }) => makeCvSchema(image),
});

export const collections = { cv };
```

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Load content (AC-1) | the `main` entry | the `main` key of `src/content/cv.json`, via the plain `file()` loader |
| Real content (AC-13) | every text field, date, and link | your pasted CV, which `/develop` rewrites into English Harvard bullets and you review before commit |
| Real content (AC-13) | `email` | ask you at build time which address to publish (it goes public) |
| Real content (AC-13) | `location` | your city plus ISO code, asked at build time if the pasted CV lacks it |
| Real content (AC-13) | profile `username` and `url` | asked at build time if the pasted CV lacks them |
| Avatar (AC-12) | `basics.image` | an image file you add to `src/assets/` (optional; if you don't have one ready, leave it out) |
| `formatDateRange` (AC-9) | month names, `Present`, separator | fixed constants in `cv-format.ts` (decided here) |
| `formatLocation` (AC-11) | country name | `regionName(countryCode)` (one `Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })`), falling back to the code |
| Caps (AC-7) | the numbers | `CV_LIMITS` in `cv-schema.ts` (decided here: 160, 500, 5, 220, 8) |
| Sorting (AC-10) | order | current first, then `startDate` desc, then `endDate` desc (awards and certificates: `date` desc), then file order via stable `toSorted` |
| Editor autocomplete (AC-2) | JSON Schema | Astro generates `.astro/collections/cv.schema.json` on `astro sync`, `astro dev`, and `astro check` |
| Page wiring (AC-15) | `basics.name` | `getCv()` |
| Site URL, page titles, descriptions | not this feature | the Metadata and share cards spec (it may read `name`, `label`, `bio` from here) |

### Key invariants

- Exactly one entry, `main`, exists in `cv`. (The file holds only `$schema` and `main`; `getCv()` fails the build if `main` is absent.)
- Every month string is `YYYY-MM` with month 01 to 12; for every dated entry, `endDate` is absent or ≥ `startDate` (plain string comparison is correct for this format).
- `work` and `education` each hold at least one entry.
- `profiles` has at most one entry per `network`.
- No schema object accepts unknown keys; `$schema` sits at the file root, outside the entry, where the loader skips it.
- Helpers never mutate their input and never read the clock, the locale, or the time zone.

### Security model

Public content on a public site and a public repo; there is no auth and no write path. The one sensitive surface is personal data (PII): the schema has **no phone or street address field**, so neither can be published by accident. Email and city are public by your choice. Cloudflare's Email Address Obfuscation must stay off (Go live spec) or the hashed CSP breaks the `mailto:` link. No compliance regime applies.

### Configuration required

None. No environment variables, secrets, or credentials. One config change: `markdown: { syntaxHighlight: false }` in `astro.config.mjs`.

### Critical test scenarios

For `/test` (Vitest on `src/lib`; the schema factory tested with `() => z.string()` as the `image` stub):

- Happy path: the committed `cv.json` builds, `getCv()` returns it, and both placeholder pages render your name, verifies **AC-1**, **AC-13**, **AC-15**.
- Required fields: removing `basics.email`, or emptying `work`, fails validation with that path in the error, verifies **AC-3**.
- Typo: a `higlights` key fails validation; a `$schema` key inside the entry also fails, verifies **AC-4**.
- Formats: `2023-13`, `2023-1`, `http://…`, `countryCode: "XX"`, `"ZZ"`, `"mx"`, `"MXX"` (no throw), `network: "X"`, `fluency: "Expert"` each fail, verifies **AC-5**.
- Swapped dates: `startDate: "2023-05"`, `endDate: "2022-01"` fails at `endDate` with `endDate is before startDate`, verifies **AC-6**.
- Caps: a 161 character bio and a sixth highlight each fail; exactly 160 and 5 pass, verifies **AC-7**.
- Duplicate profile: two `GitHub` entries fail at `profiles.1.network`, verifies **AC-8**.
- Formatting: `("2023-01")` → `Jan 2023 – Present`; `("2021-01", "2023-03")` → `Jan 2021 – Mar 2023`; `("2023-03", "2023-03")` → `Mar 2023`, verifies **AC-9**.
- Sorting: a current role started 2020 sorts above a closed role started 2023; two roles with the same start sort by later end first; fully equal keys keep file order; the input array is unchanged, verifies **AC-10**.
- Location: `{ city: "Monterrey", countryCode: "MX" }` → `Monterrey, Mexico`, verifies **AC-11**.

(No auth or permission scenario: the site has no users.)

## Build plan

Skateboard: the smallest complete whole first, then the helpers later pages need. A half filled CV is not usable, so the full model with your real content comes in one pass, proven by the placeholder pages reading from it.

1. Set `markdown: { syntaxHighlight: false }` in `astro.config.mjs`, satisfies **AC-14**.
2. Write `src/lib/cv-schema.ts` (imports only `astro/zod`): `CV_LIMITS`, `NETWORKS`, `FLUENCY_LEVELS`, `CEFR_LEVELS`, `MONTH_PATTERN`, `regionName`, and `makeCvSchema(image)` building strict objects per the data model with the exact Zod calls and refinement paths in *Decision*, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-12**.
3. Register the `cv` collection in `src/content.config.ts` with a plain `file('src/content/cv.json')` loader (no parser), satisfies **AC-1**.
4. Create `src/content/cv.json` in object form (`$schema` plus `main`) with your real CV. Ask you to paste it, rewrite it into English Harvard style bullets (action verb first, a result where there is one), drop any phone or street address, ask for the email, city, and profile links if missing, and show you the result to approve before committing. Run `astro sync` so the `$schema` target exists, satisfies **AC-2**, **AC-13**.
5. Write `src/lib/cv.ts`: `getCv()` and the `Cv` type aliases, satisfies **AC-1**.
6. Wire `src/pages/index.astro` and `src/pages/cv.astro` placeholders to show `basics.name` from `getCv()`, satisfies **AC-15**.
7. Write `src/lib/cv-format.ts`: `formatMonth`, `formatDateRange`, `sortNewestFirst`, `sortByDateDesc`, `formatLocation`, satisfies **AC-9**, **AC-10**, **AC-11**.
8. If you supplied an avatar: add it to `src/assets/`, set `basics.image` to `"../assets/<file>"` (relative to `cv.json`; Astro resolves it against the entry's file path), and confirm `getCv()` returns image metadata, satisfies **AC-12**.
9. Prove the failure paths by hand: break the file once per rule in *Critical test scenarios*, confirm `pnpm build` fails with a clear path, then restore. Finish with `pnpm build`, `pnpm lint`, `pnpm format:check` clean, satisfies **AC-3** to **AC-8**, **AC-14**, **AC-15**.

## Consequences

**Positive**:
- One file to edit; every page, and later the PDF and command menu, reads the same typed data.
- Mistakes fail the build with a field path, before anything deploys; the caps keep the CV near one page by construction.
- Editor autocomplete and inline errors in `cv.json` with no extension installed (keys, types, enums, patterns, lengths; the refinements only run at build).
- JSON Resume naming means a later export (for example to a JSON Resume theme or the PDF tool) is a small mapping, not a redesign.
- No new dependency: Astro's loader, Zod, and `Intl` cover everything.

**Negative / tradeoffs**:
- JSON has no comments and long strings stay on one line; editing prose in it is less pleasant than YAML or Markdown.
- Strict keys mean adding any new field is a schema change first, even a small one.
- Hard caps may reject a bullet you like; you shorten the text or raise `CV_LIMITS` on purpose.
- Plain text only: no bold, italics, or inline links inside a bullet. Adding them later needs a small parser, since `set:html` is banned.
- The alignment with JSON Resume is partial (see *Where JSON Resume is extended*), so a direct export needs that mapping.
- `$schema` autocomplete only works after `.astro/` exists (`astro sync`, `dev`, or `check`), because `.astro/` is gitignored.
- Your CV sits one level deep under `main` in the file, a small readability cost paid so editor autocomplete works.
- A JSON syntax error surfaces as a loader log line plus the `getCv()` error, not as a schema error; read the log line above it for the position.
- `Present`, month names, and the country name are English only; the deferred Spanish version will need them parameterized.

**Neutral**:
- Projects are not modelled; the Portfolio page spec adds a `projects` section or collection.
- Turning off syntax highlighting means a future blog or portfolio with code fences must pick Prism (class based, CSP safe) in its own spec.
- The CV page spec owns how sections render (order, grouping consecutive roles at one company, which optional fields show).

## Follow-up

- [ ] Home page spec: decide whether the optional avatar shows, and its alt text (empty when the name sits beside it, since it is then decorative).
- [ ] Metadata and share cards spec: read `name`, `label`, and `bio` from `getCv()` for titles and descriptions rather than duplicating them.
- [ ] CV PDF spec: build from `getCv()` and the same format helpers so the PDF can never drift from the page.
- [ ] Portfolio page spec: add projects (name, year, status, description, links) to this model.
- [ ] Spanish version (deferred): parameterize `Present`, month names, and the country name locale in `cv-format.ts`.
