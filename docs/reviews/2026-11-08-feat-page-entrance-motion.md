# Review, feat/page-entrance-motion, 2026-11-08

**Reviewed by**: Sonnet (author on Opus 5.5, a different model)
**Scope**: 25 files, branch vs main
**Verdict**: Approve with nits

## Summary

You added a CSS only page entrance: four motion variables, `@keyframes enter`, an `enter-*` utility with a fragment target rule, the `enterClass` helper, a `footerStep` prop on `BaseLayout`, class calls on all six pages, a reduced motion guard in `render-pdf.ts`, and a large `page entrance` test block. I traced the step arithmetic on every page against the spec table and found no mismatch. The CSS matches the spec's Composition block exactly, and nothing is hidden at rest. I found no blockers or majors, only a few minors and nits around stale older specs and brittle test patterns.

## Minor

### 🟡 Spec 0008 AC-7 still says nothing animates beyond colour, `docs/specs/0008-home-page-centered-menu/index.md:26`
**Problem**: Spec 0016 amends 0003 and 0015 only. Spec 0008 AC-7 ("nothing animates beyond `transition-colors`") is now false on `/`, and spec 0014 line 165 ("no motion") is false for the page it ships on. The `index.astro` comment was updated, but the specs were not.
**Why it matters**: A future reader or `/check verify` run of spec 0008 will read a criterion the shipped site breaks. The rewritten "nothing animates" test in `e2e/site.spec.ts` now carries `spec 0008 AC-7` in its `covers` tag, so the tag and the spec text disagree.
**Suggested fix**: Add a one line "Amended by 0016" note to spec 0008 AC-7 (and 0014 if you want its history clean), as you did for 0003 and 0015, or list them under the spec's `Amends` line.

### 🟡 The reduced motion default made existing tests flaky enough to need polling, `e2e/site.spec.ts:2418`, `e2e/styleguide.spec.ts:633`
**Problem**: Under `reducedMotion: 'reduce'` the global rule sets `transition-duration: 0.01ms !important`, which still starts a transition. Four focus ring and focus line tests had to be rewritten as polls or `toPass` retries because a read in the frame of the focus sees the old value. Spec 0016's claim that the suite "stops racing colour transitions" is only half true: the race shrinks to one frame but remains.
**Why it matters**: Any other test that reads a colour or outline straight after an interaction can fail the same way on a slow CI runner, and nothing tells the next author to poll. The pattern is also repeated by copy in three places.
**Suggested fix**: Note the 0.01ms behaviour once under `## Tooling` page test conventions in `AGENTS.md`, and consider a small shared `settledStyle` helper in `e2e/helpers.ts` instead of three inline polls.

### 🟡 The built stylesheet tests depend on exact minifier output, `e2e/site.spec.ts:6190` area (the `built stylesheet` and `reduced motion rule` tests)
**Problem**: The regexes match strings such as `.enter-3:is(:target,:has(:target)){--motion-enter-rise:0px}` and `@media (prefers-reduced-motion:reduce){*...` character for character, and `toHaveLength(1)` on the universal rule.
**Why it matters**: A Lightning CSS or Tailwind upgrade that reorders declarations or merges the rules fails these tests with no real regression. The spec accepts this for AC-16, but the reduced motion test is more fragile than it needs to be.
**Suggested fix**: Where possible assert behaviour instead (the computed `animation-delay` under reduced motion, which the `reduce` page test already does) and keep the string match only for the AC-16 literal the spec names.

## Nits

- ⚪ `src/pages/about.astro:5`, `src/pages/projects.astro:8`, `src/pages/cv.astro:34`, the `@/lib/entrance` import sits out of alphabetical order next to `cv-schema` and `cv-format`; the other imports in these files are sorted.
- ⚪ `src/pages/404.astro:19`, `footerStep={3}` is a bare number that must agree with three blocks written below it; a short `const` or a comment naming the count would keep it from drifting. The page test does guard it.
- ⚪ `src/lib/entrance.ts:27`, the `?? ENTER_CLASSES[0]` fallback is the only thing that makes NaN safe; the comment says so and a test covers it, so this is fine, but under `noUncheckedIndexedAccess` a reader may wonder why the clamp alone is not enough.
- ⚪ `e2e/site.spec.ts` `page entrance` block, the `ENTRANCES` locators (`main ul + p`, `main section > p`) are tied to current markup; they fail loudly on a markup change, which is acceptable, but a data attribute would be sturdier (project rules allow only classes, so leave it).

## Strengths

- The CSS is exactly the spec's: one `from` frame, `backwards` fill, a single media query holding both the screen and motion guards, so a block can never be left hidden on paper, in the PDF, or under reduced motion.
- The fragment target fix keeps the animation name, duration, and delay and only zeroes the rise variable, avoiding the `animation: none` replay trap the spec documents; both the first frame and the Back navigation cases are tested.
- `enterClass` is pure, imports nothing, and a Vitest source scan fails any hand written `enter-` class, so the Tailwind literal list cannot silently drift.
- Test expectations derive from `cv.json`, `SITE_NAV`, and the rendered `main section` count, so content edits need no test edit, as the project requires.
- `BaseLayout` keeps the footer prop optional so `/styleguide` stays still, and a test proves it.
- The `render-pdf.ts` guard has its own Vitest case that uses a media dependent page count to prove the emulation, rather than trusting the call.

## Test coverage

Strong. Vitest covers every step the spec lists plus NaN and infinity, the class count, and a source scan. The Playwright `page entrance` block covers timing on every page, the footer being last, hidden at rest, reduced motion, printing mid entrance, JavaScript off, early click and tap, scrollbar and sideways scroll at each step, deep links in both directions, the built CSS, and axe in both schemes. Gaps are limited to what the spec already assigns to manual `verify` (Firefox, WebKit, devices, PDF ink). I only read the tests and ran nothing, so I did not confirm they pass.
