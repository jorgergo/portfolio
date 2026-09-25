# Review, feat/cv-page, 2026-09-24

**Reviewed by**: Claude Opus 5.5 (author on a different model, not named in the handoff)
**Scope**: 17 files, feat/cv-page vs main (8 commits from merge base `1488017`; no uncommitted changes to tracked files, and the untracked `docs/.agent-cache/` was not reviewed)
**Verdict**: Approve with nits

## Summary

This branch builds spec 0005. `/cv` becomes a full Harvard style document built from `cv.json`: a header with a contact line, then seven sections that render only when they have content. Two new components, `CvEntry` and `KeyedList`, draw every entry and keyed row. Five pure helpers were added to `cv-format.ts`, and a `printFooter` prop takes the footer off paper for this page only. The code matches the spec closely. I checked AC-1 to AC-12 against the built `dist/cv.html` (built after the last source commit), and every grep in `verify.md` gives the expected result. Vitest (167 passing), `pnpm lint`, and `pnpm format:check` pass under Node 26.10.0. I found no bugs in the shipped page. The four minors are:
- a short location breaks across two lines at every width;
- page tests fail on schema-valid content, which contradicts a `verify.md` claim;
- the page prints to four pages, not the two the spec plans around;
- the page-level branching logic has no automated test.

## Minor

### 🟡 `Toluca, Mexico` breaks across two lines at every width from 480px, `src/components/CvEntry.astro:66`
**Problem**: On line 2 the subtitle `<p>` and the `aside` span can both shrink, and flexbox shrinks each one in proportion to its content width. The Education subtitle (`B.S., Computer Science and Technology · GPA 4.0/4.0 (97/100)`, about 576px) is much wider than `Toluca, Mexico` (about 118px), but the two together still overflow the 592px text area. The location is squeezed to 98px at desktop width and 71px at 480px, so it always splits into `Toluca,` / `Mexico`, and the degree also wraps beside it. I measured this in Chromium against the built page at 480, 640, and 1280px, and in print: `Toluca, Mexico` sits on 2 lines each time. The style guide's single entry shows the same split. The spec's own page sketch (index.md, Page composition) draws the degree on one line with `Toluca, Mexico` right aligned beneath it, and the verify step on `verify.md:9` expects that too.
**Why it matters**: This is the only education entry, so every visitor and every printout sees it. The pair rule is meant to make the right edge read the same everywhere, and a two word location broken in the middle undoes that on a page built around detail.
**Suggested fix**: Add `xs:flex-wrap` to line 2 only. When the pair does not fit, the location drops onto its own row, and its existing `xs:ml-auto` keeps it at the right edge. I tried this in memory: at 1280px the degree fits on one line with `Toluca, Mexico` whole beneath it, exactly as in the spec's sketch, and Daimler's line still fits on one row. Another option is to make the aside `shrink-0` with a cap such as `xs:max-w-1/2`, so a long location can still wrap. Either way, update the matching line in AC-4 and in `design.md`'s pair rule.

### 🟡 The fixture-derived page tests fail on schema-valid content, and a `verify.md` step claims they don't, `e2e/site.spec.ts:943`
**Problem**: Several assertions expect elements that the schema allows to be missing:
- Lines 943 to 945 and 905 use `toHaveText(role.location ?? '')`, line 973 uses `toHaveText(entry.location ?? '')`, and line 947 checks `list-style-type` on a `ul`. `location` is optional and `highlights` may be `[]`.
- When the field is absent, `CvEntry` renders no span or `ul`, and `toHaveText('')` on a locator with no match fails. I confirmed this with Playwright 1.63; the array form `toHaveText([])` passes.
- In the grouped role test, line 904 fails even sooner: without line 2, `nth(1)` resolves to the `Prose` body, which holds a `<p>`.

`verify.md:58` (delete `location` from the Liverpool role) and `verify.md:63` say that after that edit, the `cv page` block "passes without a test edit". It does not: Liverpool is the first single role company the test picks. `scope.md:106` also ticks "the manual steps in `verify.md`", while none of its boxes are ticked.
**Why it matters**: These tests are meant to follow content edits, and that is the reason they derive from the fixture. A valid edit such as dropping a location now gives a false red. The next `/check verify` run of that break step will report a failure in code that works. Playwright is not in CI yet, so nothing wrong ships, and this is a Minor.
**Suggested fix**: Where a value is optional, count the element instead of reading its text. For example, expect the span count to be 0 or 1 depending on whether `location` is present, and check its text only when there is one. Check the `ul` style only when `highlights` is non empty. Run the `verify.md` "Added after the build" break steps before ticking them, and untick the scope line until they have run.

### 🟡 The CV prints to four pages, not "about two", `docs/specs/0005-cv-page/index.md:274`
**Problem**: I printed the built page to PDF in Chromium with the print media, the 11pt root, and the 18mm `@page` margin. Letter and A4 both come out at four pages. The page fill is 82%, 97%, 94%, and 45%. Page 3 opens on `AWARDS` and page 4 on `SKILLS & INTERESTS`. The page breaks themselves are correct: no heading and no company line is left alone at a page bottom, and the Ford group splits between its two roles as designed. The estimate is what's wrong. `rationale.md:79` counts "about 80" printed lines, but that misses how the bullets and certificate titles wrap. Removing the 40rem column cap in print still gives four pages, so the length comes from the content itself.
**Why it matters**: Three places depend on this number: `verify.md:16` expects "about two pages", Consequences line 274 records it, and Follow-up line 291 hands it to the Release 2 PDF spec as its premise. Cutting four pages to one is a different decision from cutting two to one: it means heavy content cuts or a much denser layout, not a trim.
**Suggested fix**: Correct the count in `index.md` (lines 274 and 291), `rationale.md` (lines 7 and 79), and `verify.md:16` to three to four pages. The PDF spec can then start from the real number.

### 🟡 The page's branching logic has no unit test, and the page test mirrors it instead of checking it, `src/pages/cv.astro:86`
**Problem**: Three rules live only in the page frontmatter:
- The `Interests` row for name-only groups (lines 86 to 104).
- Section presence in `hasContent` (lines 118 to 131).
- The group link falling back to a later role's `url` (lines 63 to 65).

`e2e/site.spec.ts` re-derives each rule from the fixture with the same logic (lines 1030 to 1043, `SECTIONS`, `groupUrl`). A mistake copied into both places would pass. The current fixture never takes these branches either: no interest group lacks keywords, every optional section is present, and the newest Ford role has a `url`. So only the manual break steps in `verify.md` ever run them. I traced all three and they are correct today.
**Why it matters**: This is the "grouping inline in the page frontmatter, untestable" option that the spec rejected for the five helpers, still in place for three more rules. A later refactor of the page can break a rarely used branch, and the gate will not notice. It is Minor rather than Major because the code is correct and small, and a documented manual step covers each branch.
**Suggested fix**: Move the keyed row composition, and ideally the group link and section presence rules, into pure helpers in `cv-format.ts`, for example one that takes the four source arrays and returns the `KeyedList` items. Give each branch a Vitest case tagged `spec 0005`: a name-only interest, an empty `languages`, and a group whose first role has no `url`. The page and the e2e fixture can then both call the helper instead of each keeping its own copy.

## Nits
- ⚪ `src/lib/cv-format.ts:91`: `pathname` comes back percent-encoded, so a profile URL with a non-ASCII path shows as `linkedin.com/in/jorge-gonz%C3%A1lez`. Wrapping the result in `decodeURIComponent` (guarded, since it can throw) would show what the owner typed. Both of today's URLs are plain ASCII.
- ⚪ `src/components/KeyedList.astro:15`: `' · '` is defined twice, as `META_SEPARATOR` in `cv-format.ts` and `SEPARATOR` here, while `cv.astro:42` keeps the bare dot as `DOT`. `values.join(SEPARATOR)` could be `joinMeta(...values)`, which leaves one constant for the spec's single separator rule.
- ⚪ `e2e/site.spec.ts:777`: the `cv page` cases are tagged with bare numbers (`AC-10`, `AC-12`). AC-14 asks for cases tagged `spec 0005`, and the same file already uses `AC-10` and `AC-12` for spec 0003 in other blocks.

## Strengths
- The types remove the guards. `groupConsecutive` returns `readonly [T, ...T[]]` groups, so `spanOf` needs no empty check and `single()` returns `Role | undefined` with no `!`. The section list is a discriminated union with an exhaustive `switch`.
- The print output works on real paper, not only in computed styles. In the PDF, the Ford group breaks between its roles, no heading or company line is left alone at a page bottom, and there is no footer. `printFooter` keeps spec 0003's city line on paper for every other page without a global rule.
- The tab stops, the section list, and every expected string come from the fixture through the site's own helpers. Adding or removing a `url` in `cv.json` moves the expected stops with it, as the Ford `url` break step intends.
- The markup is disciplined. The built page has no `role`, `style`, `target`, or `<script>`. Heading levels run h1, h2, h3, h4 with no skip. The contact separators are `aria-hidden`, and each one wraps with its own link. Only spec 0003 tokens are used.
- The Playwright `env` change is safe. I checked Playwright 1.63's web server launcher, and it spreads `process.env` before the config's `env`, so `PATH` survives.

## Test coverage
**Unit (Vitest, 167 passing)**: All five new helpers have cases tagged `spec 0005 AC-9`. The cases cover the AC-9 outputs, the scheme, port, query, and hash removal, a bare host, the unparsable fallback, an empty `joinMeta`, the Ford, Liverpool, Ford split, input that is never mutated, and open, closed, single, and crossing spans.

**Page (Playwright, read, not run)**:
- `site.spec.ts` covers the header anatomy, section order and gaps, the Ford grouping, single entries, education, awards, certificates, and the keyed rows.
- It also covers the pair layout at 479px and 480px, the contact wrap at 320px, the heading outline, the attribute bans, the ring on every Tab stop, no script with exactly three woff2 requests, and print (footer, gaps, breaks, paper tokens in dark mode).
- `styleguide.spec.ts` covers the anatomy of `CvEntry` and `KeyedList` in both blocks, including the marker colour and the 160px key column.

**Not run by me**: Playwright and `astro check` (both write build output). `dist/` was built at 21:58, after the last source commit at 21:35, and every `verify.md` command grep passes against it.

**Gaps**:
- The page tests fail on schema-valid missing locations or bullets (the second Minor).
- The Interests row, section presence, and group link fallback are exercised only by manual break steps (the fourth Minor).
- The Firefox and Safari print behaviour and the VoiceOver list reading stay manual, as `verify.md` records.
