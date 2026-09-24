# Review, feat/content-model, 2026-09-24

**Reviewed by**: Claude Fable 5.1 (author on Claude Opus 5.5)
**Scope**: 23 files, feat/content-model vs main (12 commits from merge base `8effb7d`)
**Verdict**: Approve with nits

## Summary

This branch lands two foundation slices. The first installs the tooling AGENTS.md promised: ESLint 10 flat config with typescript-eslint strict, the Astro and jsx-a11y-x plugins, Prettier with the Astro and Tailwind plugins, a simple-git-hooks pre commit hook running lint-staged then `astro check`, and a GitHub Actions workflow. The second builds spec 0002: a strict Zod 4 schema for a single `cv` collection loaded from `src/content/cv.json`, the real CV content, pure access and format helpers, and the two placeholder pages reading `basics.name` end to end.

The work is careful and matches its spec closely. I did not take the verify doc on faith: I ran the real schema and helpers from a scratch copy against the committed content and eighteen break cases, fed a deliberately bad `.astro` file to ESLint, confirmed the Astro file loader really skips a root `$schema` string, confirmed wrangler's JSONC parser accepts the trailing commas Prettier added, and confirmed the three action tags CI pins exist. Everything the spec claims holds, with two small exceptions below: the date order rule also fires on a malformed date and adds a misleading second error, and `regionName` can throw despite its `string | undefined` return type. Neither blocks merge.

## Minor

### 🟡 Date order rule fires on malformed dates and adds a misleading error, `src/lib/cv-schema.ts:132`
**Problem**: Spec 0002 says the `endNotBeforeStart` refinement "runs only when both dates are present and valid". In Zod 4 the object's `superRefine` still runs when a property check fails with a continuable issue, so with `startDate: "2023-13"` and `endDate: "2022-01"` the build prints both `work.1.startDate: expected a month as YYYY-MM (01 to 12)` and `work.1.endDate: endDate is before startDate`. The second line is wrong: the end date is fine, the start date is the typo. I reproduced this with the real schema.
**Why it matters**: The whole value of this feature is a build error that points you at the one field to fix. A second error on the wrong field sends you editing a correct value. It only shows up alongside a genuine format error, so it never lets bad data through, which is why this is minor.
**Suggested fix**: Inside `endNotBeforeStart`, compare only when both dates match `MONTH_PATTERN` (you already export it), or pass Zod 4's `when` option so the check runs only when the payload has no issues yet. Add the malformed plus swapped case to the `/test` list so the single error path stays locked.

### 🟡 `regionName` can throw despite its `string | undefined` contract, `src/lib/cv-schema.ts:101`
**Problem**: `regionName` is exported as `(code: string) => string | undefined`, but `Intl.DisplayNames.prototype.of` throws a `RangeError` for a code that is not a well formed region subtag (for example `"MXX"` or `""`). Today every caller is safe: the schema puts `abort: true` on the regex so the refine never sees a bad code, and `formatLocation` only ever receives schema valid data. The safety lives in the callers and a comment, not in the function.
**Why it matters**: AGENTS.md says expected failures return explicit results, not thrown exceptions. The spec names `formatLocation` and `regionName` as shared helpers for the CV page, the PDF, and the command menu. The first future caller that builds a location from something other than `getCv()` (a test fixture, a hand typed value in a page) gets an uncaught `RangeError` with no field path. The return type says that cannot happen.
**Suggested fix**: Make the function honour its own type: test `REGION_PATTERN` inside `regionName` and return `undefined` on a mismatch (or wrap `of()` and map the throw to `undefined`). The schema's `abort: true` then becomes belt and braces rather than the only guard, and the comment on line 100 can go.

## Nits

- ⚪ `.github/workflows/ci.yml:16`, the `check` job has no `timeout-minutes`; a hung install or build holds the runner for the six hour default. Ten minutes is plenty for lint, format, and build.
- ⚪ `src/content/cv.json:800`, the second work entry lists `summary` after `highlights` while the first lists it before; keep one key order so diffs stay readable and the entries scan the same way.
- ⚪ `src/content/cv.json:890`, the EF SET certificate URL carries a Spanish locale segment (`/es/`) on an English site; check whether the certificate host serves the same page without it.
- ⚪ `src/lib/cv-format.ts:13`, `formatMonth` quietly returns odd strings (empty year, raw month number) for input that is not `YYYY-MM`. The spec says input is always schema valid, so this is fine today, but a short comment saying the caller owns validity would stop the next reader from adding a guard here.
- ⚪ `eslint.config.js:47`, `tseslint.configs.strict` is the non type aware preset, so rules such as `no-floating-promises` are not enforced. AGENTS.md asks for `strict`, so this matches the convention; if you ever want the type aware preset, `strictTypeChecked` needs `parserOptions.projectService` and will slow the pre commit hook.

## Strengths

- The schema does exactly what the spec says, and I verified it rather than trusting the verify doc: required fields, unknown keys (including `$schema` inside `main`), month format, `https` only URLs, region codes (`ZZ`, `XX`, `mx`, `MXX` all fail cleanly with no `RangeError`), caps at exactly 160 and 5, trimming before caps, duplicate networks at the second index, and empty keyword groups. All eighteen break cases fail at the right path with a readable message, and the committed content parses.
- The helpers are genuinely pure and deterministic: fixed month table, fixed `Present`, plain string comparison on `YYYY-MM`, `toSorted` so input is untouched. My probe confirmed current first, then start descending, then end descending, then file order on full ties.
- The lint config enforces the AGENTS.md rules for real. A probe file with a class, `any`, a `!` assertion, `style=""`, `define:vars`, `is:inline`, and `set:html` produced ten errors, one per violation, each with a message that names the reason.
- The spec's "one sanctioned throw" in `getCv()` is documented in code and in the spec, with the reason (the file loader only logs syntax errors) stated where the next reader will see it.
- Content is clean from a privacy angle: no phone, no street address, email and city published on purpose, and the schema has no field where either could sneak in.
- Tooling choices are consistent with spec 0001: build approvals live in `pnpm-workspace.yaml`, the pre commit hook is installed through `prepare` rather than a postinstall, and CI reads Node from `.nvmrc` and pnpm from `packageManager`.

## Test coverage

Test signal is `none-yet`: no runner is configured, and AGENTS.md says `/test` sets up Vitest and Playwright later. Spec 0002 already lists the critical scenarios for `/test`, and the scope has "Test it" queued as the next step, so this is a known, planned gap rather than an oversight. Until that lands, the safety net for this slice is `astro check` plus the manual break steps in `verify.md`, which I reproduced. When `/test` runs, add the two cases from the Minor findings: a malformed start date combined with an earlier end date should produce exactly one error, and `regionName` with a malformed code should return `undefined` rather than throw.
