# Review, feat/metadata-share-cards, 2026-09-25

**Reviewed by**: Claude Opus 5.5 (author on a different model, not named in the handoff)
**Scope**: 28 files (27 plus `pnpm-lock.yaml`, read only to confirm the new packages), feat/metadata-share-cards vs main (10 commits from merge base `88fcfb8`; working tree clean)
**Verdict**: Approve with nits

## Summary

This branch builds spec 0006. Every page now gets its title and description from `cv.json` through `site-meta.ts`. `/` and `/cv` also get a canonical link and Open Graph tags. Satori and sharp draw a 1200×630 card for each of those two pages at build time, and a generated `J` favicon (with a dark switch) and a 180px Apple icon replace the old placeholder. The code follows the spec closely: I checked AC-1 to AC-13 against the source and the built `dist/` (built at 01:51, after the last source commit at 01:23), and the head order, values, image sizes, and 404 page all match. `pnpm test` (259 passing), `pnpm lint`, and `pnpm format:check` pass under Node 26.10.0. I found no bug in what ships today. The two minors are about tomorrow's content:
- the new unit tests pin today's words from the live `cv.json`, so a valid content edit turns `pnpm test` red;
- some content the schema accepts still breaks the card without a sound, which I confirmed by rendering it.

## Minor

### 🟡 The unit tests pin today's `cv.json` words, so a valid content edit fails `pnpm test`, `src/lib/site-meta.test.ts:74`
**Problem**: `site-meta.test.ts` and `share-card.test.ts` read the live `cv.json` and then compare against literal strings: `Jorge González Ozorno`, `Full Stack Developer`, `Toluca, MX`, and the full CV description. You can see it at `site-meta.test.ts` lines 74 to 86, 133 to 137, 178 to 205, and 243 to 262, and at `share-card.test.ts` lines 118 to 136. `render-image.test.ts:256` and `:266` also assume today's name fits on one line (`toHaveLength(3)` and `toHaveLength(2)`). On `main`, unit tests read `cv.json` only to check that it parses; this branch is the first to tie unit test expectations to the owner's content. If you change `basics.label` to `Senior Full Stack Developer` (the spec's own content edit scenario), about eight cases fail, although the site is correct. The `verify.md` break step for that edit ran `pnpm build` only, and the build does not run Vitest, so it never showed up.
**Why it matters**: The spec promises that one edit to `cv.json` updates everything with no code edit, and the e2e side keeps that promise (spec 0005 AC-16). Once CI runs `pnpm test`, a promotion, a new role title, or a move to a new city turns CI red on a content only commit, and the fix will look like "update the test to match the CV". That habit weakens what the tests are for.
**Suggested fix**: Keep the exact AC-3 and AC-4 strings, but check them against a fixture that holds today's values written inline in the test (you already have `fixture` for Ada Lovelace; add a second one for today's owner), not against `cvFile.main`. Where a case needs the real file, derive the expected string from `cv.basics` the way `e2e/site.spec.ts` does. For the two "today's card" render cases, render a fixture name known to fit one line, or derive the expected line count from the name's length (24 columns at 72px).

### 🟡 Some content the schema accepts still breaks the card without failing the build, `src/lib/cv-schema.ts:181`
**Problem**: The name and role caps protect the card's height, but three other cases pass the schema and draw a broken image. I rendered each one through the real `renderPng`, `cardTree`, and fonts:
- **A character outside Latin 1** (for example `Łukasz Żółkiewski`): only the `latin` Plex Mono files load, so each such letter draws as an empty box, not as "nothing" as the spec's Consequences say. The favicon and Apple icon would show a box if the name started with one.
- **A name word longer than 24 characters**: the name has about 24 columns at 72px, and a single long word does not wrap. A 29 character word ran past the right padding and was cut off at the canvas edge (ink at x = 1198).
- **A long footer**: `basics.location.city` has no cap (`text()`), and the footer row has room for about 61 characters at 28px across both sides. Past that, the host and the city draw on top of each other instead of wrapping. Today it is 25 characters, so only a long city combined with a longer host or path (a Go live domain change, `/portfolio`) gets there.

**Why it matters**: The spec's approach is that "a longer value fails `pnpm build` through the schema" rather than drawing a bad card. These three gaps are silent: the build passes, and the first sign is a broken preview on LinkedIn, which caches it for about a week. Today's content is fine, so this is Minor.
**Suggested fix**: Extend the same guard you already use for the caps. Add a refinement on `basics.name`, `basics.label`, and `basics.location.city` that rejects characters outside the range the loaded font draws (U+0020 to U+00FF is a simple, safe rule), with a message that names spec 0006, or load the `latin-ext` files as well. Reject a name word longer than 24 characters in the same place. Give `location.city` a cap in `CV_LIMITS` that keeps the footer on one line with the longest host you expect, and write that footer budget into `design.md`. Add a `render-image.test.ts` case for each limit, like the two cap cases you already have. Then correct the spec's "renders as nothing" line.

## Nits
- ⚪ `design.md:122`: says a name at the cap takes "two lines at most", and `src/lib/cv-schema.ts:7` and spec AC-7 say it "wraps to two lines". Your own `render-image.test.ts:141` case proves the real worst case is three lines (about 22px left between the role and the rule). Changing both lines to "up to three lines" keeps the design source honest for whoever tightens the spacing next.
- ⚪ `src/layouts/BaseLayout.astro:67`: X's card docs list Open Graph fallbacks for the title, description, and image, but, as far as I know, not for the alt text, so `og:image:alt` may never reach X users. I'm not certain; check it during the AC-14 share test at Go live. If X ignores it, add `twitter:image:alt` with the same value (AC-5 and the "no other tag" e2e case would need a spec update first).
- ⚪ `src/pages/apple-touch-icon.png.ts:12`: lines 12 to 24 repeat `src/pages/favicon.svg.ts` lines 18 to 30 (palette, monogram, two throws), and the Apple icon requires the dark tokens even though it never uses them. A small pure helper in `share-card.ts` that returns `{ colors, letter } | undefined` would leave each endpoint with a single throw.
- ⚪ `src/lib/render-image.ts:35`: `{ ...size, fonts }` passes the whole `SHARE_IMAGE` object to Satori, so its `type` field goes along as an unknown option. Passing `width` and `height` by name keeps Satori's options to exactly what it reads.
- ⚪ `src/lib/site-meta.test.ts:88` and `:149`: the 60 character title and 119 character description cases have no `// covers:` tag. They check the spec's Key invariants, so tag them with the closest ids (AC-3 and AC-4).
- ⚪ `AGENTS.md:38`: still says `SiteFooter` is the only other `getCv()` caller and that `getCv()` is the one sanctioned throw. The three endpoints now do both, as spec 0006 allows. Spec 0004 AC-1 (the home title), spec 0005 AC-1 (the CV description), and spec 0003's metadata follow up box are also out of date. The spec already hands this to `/sync`; run it soon after merge, so the next review doesn't flag the endpoint throws as violations.

## Strengths
- The split between pure code and the edges is clean. `site-meta.ts` and `share-card.ts` are pure and return `undefined` for missing pieces, `render-image.ts` is the only module that touches fonts and native code, and each endpoint turns an `undefined` into a throw whose message tells you what is missing and points to spec 0006.
- The types catch mistakes before tests do. `DESCRIPTIONS` uses `satisfies Record<SharePageKey, …>`, so a new row with no rule fails `astro check`, and `SharePageKey` comes from the table itself.
- `render-image.test.ts` measures real pixels instead of trusting the layout tree. It found a worst case (a three line name) that the bench and the spec missed, and it proves the rule does not move.
- `withDarkFills` is tested on a fixture and on real Satori output, and the test that ignores Satori's white `<mask>` fill shows you read the actual SVG. The built favicon is 774 bytes, with only paths.
- The canonical comes from the row's path, so the `/cv.html` trap cannot happen, and both a unit case and the built `dist/cv.html` confirm it.
- The page tests derive every value from `cv.json` and read `site` from `astro.config.mjs`. They check the exact head order, and `pngSize` reads the IHDR chunk without adding sharp to `e2e/`. The new dependency is well chosen: `satori` sits in `devDependencies`, none of its packages has an install script, so `allowBuilds` stays as it is, and `public/_headers` is unchanged.

## Test coverage
**Unit (Vitest, 259 passing, run by me)**: `site-meta.ts` has cases for every export, including the four section list cases, unique titles and descriptions, URLs built from `site`, no `.html` in a canonical, and `share: undefined` without `site`. `share-card.ts` covers both palettes with every missing token, the monogram (including a character outside the Basic Multilingual Plane), the tree's words, sizes, and colours, and every `withDarkFills` branch. `render-image.ts` covers the favicon's paths and fills, the Apple icon's size, opacity, corners, and letter, and both cards at today's content and at the caps.

**Page (Playwright, read, not run)**: `site.spec.ts` covers the titles and descriptions from `site-meta.ts`, the exact tag order after the description, each share tag once, every value, the equalities, the image answering 200 as a 1200×630 PNG under 300 KB, both icons, the 404 page with no share tags, and the four built files. `styleguide.spec.ts` covers the new section's five images loading at their sizes, the style guide head, and the endpoints answering under `astro dev`.

**Not run by me**: Playwright and `pnpm build` (both write build output). I read the built `dist/` instead and viewed both cards, and I rendered the edge cases in the second Minor through the real pipeline from a scratch Vitest file outside the repo.

**Gaps**:
- Unit expectations are tied to today's content (the first Minor).
- No case covers a character outside Latin 1, a long unbroken name word, or a long footer (the second Minor).
- The endpoint throws are covered only by the manual "delete `site`" break step in `verify.md`, which fits the spec's choice.
