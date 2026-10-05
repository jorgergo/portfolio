# Review, feat/cv-typographic-hierarchy, 2026-10-04

**Reviewed by**: Claude Opus 5.5 (author on a different model, not named in the handoff)
**Scope**: 10 files, feat/cv-typographic-hierarchy vs main (8 commits from merge base `9bea8fd`, plus uncommitted edits to `docs/scope/scope.md` and the spec's `verify.md`)
**Verdict**: Approve with nits

## Summary

This change ships spec 0012. `SectionHeading` swaps `text-xs` for `text-base font-medium`, so the CV's section headings become 16px olive capitals at 500 under an 18px name. Around that one class string you get the style guide specimen and its case, five new `/cv` page cases (the ladder in light and dark, one line of at most 23 characters at 320px, contrast more, forced colours, and print), the `design.md` edits of AC-7, and four amendment lines in spec 0003. I read every changed file in full plus `cv.astro`, `global.css`, `playwright.config.ts`, and the CI workflow. I also ran `pnpm lint`, `pnpm format:check`, `pnpm test` (437 passed), the five new `site` cases, and the three style guide `SectionHeading` cases, all green on macOS. The code is as small and clean as a change can be, and it stays inside every rule I can check: Tailwind classes only, tokens only, no arbitrary value, no print variant, and `SectionHeading` renders on `/cv` alone, so no other live page moves. The findings are all about records: the spec now says things the branch no longer matches, one test comment promises a CI record that CI never keeps, and the scope ticks are out of step with the work.

## Minor

### 🟡 Spec 0012 no longer describes the tests and records the branch ships, `docs/specs/0012-cv-typographic-hierarchy/index.md:23`
**Problem**: Three acceptance criteria state facts the build overtook. AC-6 says "No page test reads the specimen", but `e2e/styleguide.spec.ts:654` now does, comparing the specimen's computed look with the component's. AC-8 (line 25) says the only page test edits are the AC-1 case and three new `/cv` cases, but the branch adds five `/cv` cases plus the specimen case (the contrast more and forced colours cases at `e2e/site.spec.ts:3648` and `:3673` are tagged AC-5). AC-4 (line 21) says `/check verify` records the Letter and A4 page counts "in its review under `docs/reviews/`", but `/check verify` owns no durable file (its mode file says chat output only), and the counts live in `verify.md:39` instead.
**Why it matters**: The extra tests are good, and nothing here breaks the site. But the spec is the contract the next `/architect`, `/test`, and `/sync` runs read, and it will flip to Accepted with three sentences that are false on the day it lands. Someone asking "where are the page counts?" or "is the specimen tested?" gets the wrong answer from the source of truth.
**Suggested fix**: Ask `/architect` to amend the three lines before the status flips. AC-6 names the specimen case. AC-8 lists the six page test additions, or drops the "only" sentence and keeps the AC-16 promise, which is the part that matters. AC-4 points at the Build measurements section of `verify.md`.

### 🟡 The width annotation promises a CI record that CI never shows, `e2e/site.spec.ts:3633`
**Problem**: The comment reads "The measured width goes into the report, so a CI run records the real tracked width on Linux", and AC-3 (`index.md:20`) and build plan step 5 (`index.md:156`) say the same. But `playwright.config.ts:19` sets `reporter: 'list'`, which does not print annotations, and `.github/workflows/ci.yml` uploads no Playwright report. `verify.md:45` already says so plainly: the CI log alone will not show the widths. The real Linux numbers (266.8px for `Leadership & activities`) came from a local run in the Playwright Docker image.
**Why it matters**: The longest heading has about 5px to spare on the Linux runner. The day a Playwright or font update eats that margin, the next person will look for the recorded CI widths the comment promises and find nothing. A comment that states something false costs more than no comment.
**Suggested fix**: Pick one. Either reword the comment (and AC-3) to say the annotation shows in a JSON report run locally or in the Linux image, as `verify.md:45` describes, or make CI keep it: add a `json` reporter beside `list` when `CI` is set, plus an `upload-artifact` step for that file. The first is the smaller change and matches what you already do.

### 🟡 The scope ticks are out of step with the work, `docs/scope/scope.md:203`
**Problem**: Row 15 ticks "Verify it" (line 204) while the VoiceOver step in `verify.md:13` is still open. In the other direction it leaves "Docs and the gate" (line 203) and "Build it" (line 199) open, although the `design.md` edits, the format run, the full gate, the 24 character break step, and the Linux CI run are all done and ticked in `verify.md`.
**Why it matters**: The scope is what `/scope` and `/sync` read next. Here the markup did not change and the headings were capitals before, so the VoiceOver step carries little risk. But the same mismatch was flagged on the home page redesign, projects, and contact reviews, and records that disagree with the work in both directions make the next reconcile guess.
**Suggested fix**: Tick "Docs and the gate" and "Build it" in the same commit as the uncommitted ticks. Then either run the VoiceOver step on a Mac and tick it, or leave "Verify it" open with a note naming that one step.

## Nits

- ⚪ `e2e/site.spec.ts:3648`, the newest commit `d9c52ff` (the contrast more, forced colours, and specimen cases) is not pushed: PR #28 and its green CI run sit on `f2a2c39`, while `verify.md:25` ticks the CI step. Push before merge so those three cases run once on the Linux runner.
- ⚪ `docs/specs/0003-design-system/index.md:21`, the amendment says "`text-xs` labels remain only in the footer", but the footer is plain muted `text-xs` text, not a label (no capitals, tracking, or accent), so no label recipe remains in CSS at all. The `--color-accent` row (line 84) still says "section labels" where `design.md` now says "section headings". One for `/architect` with the spec 0012 edits.
- ⚪ `docs/scope/scope.md:29` and `:236`, row 16 (Project links live) rides along in the spec commit `cd75854`, which is about spec 0012 only. Name it in the PR description, or move it to its own `docs(scope)` commit, so the history explains it.
- ⚪ `docs/specs/0012-cv-typographic-hierarchy/verify.md:39`, on Letter the CV now prints a fifth page that holds only the Sports and Music rows. The spec accepts an extra page as information, not a gate, and the CV PDF decision owns the fix, but say it in the PR description so you sign off on the near empty page knowingly.
- ⚪ `e2e/site.spec.ts:3616`, this is the fifth copy of the `Range` line counter in the file (lines 1418, 1839, 2053, 3421, and now 3618). A small helper in `e2e/helpers.ts` that takes a locator and returns its lines and width through `evaluate` would keep the five alike. Optional, and fine to leave for a later test pass.
- ⚪ `docs/specs/0012-cv-typographic-hierarchy/index.md:4`, the status still reads `In Progress`; flip it to `Accepted` once this review lands, as specs 0008 to 0011 did, and run `/sync` for the `AGENTS.md` line the follow up list names.

## Strengths

- The whole visible change is one class string in one component, and `SectionHeading` renders only on `/cv`, so "no other page changes" holds by construction.
- The 320px case awaits `document.fonts.ready` before it measures, and the build proved why in the Linux image: without it the case passes on a fallback face at 220.8px. That is the CI font trap handled in the test itself, with the reason in a comment.
- The length check is what fails a 24 character heading on macOS, where the layout alone would pass, and the break step proved it fails with a message that names the heading.
- The forced colours case uses a neat discriminator: the name is ink and a heading olive on a normal page, so the two colours match only once the system palette has replaced both. It also proves the ladder holds without colour, since every entry title stays in mixed case.
- The specimen case reads the specimen against the component as it renders, never against a second literal, so the two cannot drift apart silently.
- Every `/cv` expectation comes from `SECTIONS`, derived from `cv.json` through the site's own helpers, and the title case check reads zero titles as valid, so spec 0005 AC-16 still holds.
- `design.md` carries every AC-7 edit word for word, and the cap's arithmetic (272px, 11.6px, 23) is written in the same terms in the doc, the spec, and the test comment.

## Test coverage

**Page (Playwright, site project)**: five new `/cv` cases. The ladder at 1280px in light and dark checks size, line height, weight, capitals, tracking, accent, the rule, its padding, and `break-after` on every `h2`, and that no element under `body` is larger than the `h1`. The 320px case checks one line per heading through a `Range` and the 23 character cap, after the fonts load, and annotates each width. Contrast more checks that the muted label line turns ink (so the setting is on) while the headings stay accent capitals. Forced colours checks that a heading takes the system text colour and keeps its size, weight, capitals, tracking, and rule, and that no entry title is in capitals. Print checks 11pt capitals in the paper accent with `break-after: avoid` and no `print:` class. All five pass here on macOS.

**Page (Playwright, styleguide project)**: the retitled AC-1 case reads 16px, 500, capitals, 1.6px, and the light accent on `h3#light-heading`, and the new specimen case compares seven computed properties with the component's. Both pass here, with the existing `SectionHeading` semantics case.

**Unit (Vitest)**: no `src/lib` change, so no new unit case is owed. 437 pass and `contrast.test.ts` is unchanged, which is the AC-5 proof that the accent pair still clears 4.5:1 and APCA Lc 55.

**Acceptance criteria**: AC-1 (styleguide case, grep), AC-2 (ladder case, plus the existing h1, role, position, and meta cases), AC-3 (320px case, the break step, the Linux image run), AC-4 (print case, the page counts in `verify.md`), AC-5 (contrast more and forced colours cases, `pnpm test`, the card `shasum`, the `git diff`), AC-6 (specimen case, grep), AC-7 (the docs read; I checked each edit against `design.md`), AC-8 (the gate: lint, format, Vitest, and the new cases pass here, and CI passed on `f2a2c39`). Every criterion has a test or a verify step.

**Gaps**: the VoiceOver step stays manual and open (the third minor); the three newest cases have not yet run on the Linux runner (the first nit); the CI widths the annotation promises are not kept (the second minor). Nothing new in the code is untested.
