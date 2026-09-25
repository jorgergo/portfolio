# Review, feat/home-page, 2026-09-24

**Reviewed by**: Claude Opus 5.5 (author on Claude Fable 5.1)
**Scope**: 17 files, feat/home-page vs main (7 commits from merge base `f5cafb9`, plus uncommitted edits to `docs/scope/scope.md` and `docs/specs/0004-home-page/verify.md`)
**Verdict**: Approve with nits

## Summary

This branch builds spec 0004. The home page becomes the name and bio, a numbered `Pages` menu built from `SITE_NAV`, and a keyed `Elsewhere` list of profiles plus email. Both lists use one new `NavRow` component. The branch also adds two pure helpers (`formatRowNumber`, and `formatProfileHandle` behind a `satisfies Record<Network, …>` rules object), the style guide examples, the `design.md` rules, and unit and page tests. The code matches the spec closely: every AC-1 to AC-10 detail I checked holds in the built `dist/index.html`, and the gates pass under Node 26.10.0 (`pnpm build` with 0 check errors, `pnpm lint`, `pnpm format:check`, and `pnpm test` with 149 passing). The two findings are both outside the page code. First, the e2e fixture's type makes `pnpm build` fail on a CV without `profiles`, and the suggested `?? []` does not fix that on its own. Second, three ticked `verify.md` steps cannot pass as written.

## Minor

### 🟡 The e2e fixture's JSON type stops `pnpm build` when `profiles` is omitted, `e2e/site.spec.ts:537`
**Problem**: `e2e/helpers.ts:14` exports `basics` straight from the JSON import, so TypeScript types it from the file's literal shape. In the schema, `profiles` is optional, but in that literal type it is a required property. `astro check` type checks `e2e/`. When `profiles` is removed from `cv.json`, which the schema allows and AC-3 says the page must handle, the check fails at line 537 with TS2339 (`Property 'profiles' does not exist`) and TS7031 (implicit `any` on `url`). I reproduced both in a scratch copy. `astro build` alone renders that copy correctly, with the email row only. `verify.md:15` ticks the "delete `profiles` entirely, build again" step, but under `pnpm build` that step cannot pass.
**Why it matters**: `pnpm build` is the CI gate, and the pre commit hook runs `pnpm check`. A schema valid content edit therefore cannot be committed or merged until someone edits a test file. The failure is loud, points at the right line, and nothing wrong ships, so this is minor.
**Suggested fix**: A `?? []` at line 537 alone does not help. I tried it: TS2339 remains, because the property does not exist on the literal type at all. Type the fixture through the schema instead. In `helpers.ts`, parse it with `makeCvSchema(() => z.string()).parse(cvFile.main)`, the same `image` stub the Vitest schema tests use, which also validates the fixture. If you'd rather not parse at runtime, annotate it with the schema's type. Then use `(basics.profiles ?? [])` at line 537. With both changes, `astro check` reported 0 errors in the copy without `profiles`. I did not run Playwright's loader against the `astro/zod` import. Correct the tick on `verify.md:15`.

### 🟡 Three ticked verify steps cannot pass as written, `docs/specs/0004-home-page/verify.md:23`
**Problem**:
- **Line 23**: `grep -o 'aria-hidden="true"[^<]*<\?[^>]*>01'` and `grep -o '>github<'` both print nothing. With `compressHTML`, the build pads the text inside each span with a space on either side, giving `aria-hidden="true"> 01 </span>` and `w-20"> github </span>`. I confirmed this on a fresh build. The whitespace tolerant versions match.
- **Line 24**: the step says to run `pnpm preview` and then curl `http://localhost:8788/cv`. `pnpm preview` is `wrangler dev`, and `wrangler.jsonc` sets no port, so it serves 8787 (spec 0001's verify uses 8787). Port 8788 is up only while Playwright's `site` server runs, and nothing was listening on it during this review. As written, the curl prints `000`.
- **Line 15**: the build step covered in the finding above.

**Why it matters**: `verify.md` is the checklist `/check verify` runs again. Steps that fail every time either raise false failures on the next run, or train people to tick boxes without running them. The behaviour underneath is correct: the tolerant greps pass, and the Playwright 200 check covers line 24.
**Suggested fix**: Use `grep -oE 'aria-hidden="true">\s*01\s*<'` and `grep -oE 'w-20">\s*github\s*<'`, and change the port to 8787. While there, line 25's expected href list leaves out the skip link's `#main`.

## Nits
- ⚪ `src/components/NavRow.astro:26`: `gap-4` also sets the gap between wrapped lines. A wrapped value therefore sits 16px under its own key but only about 11px above the next row's key (the 4px gap plus that row's centring inside `min-h-10`), so in a mid list row it reads as belonging to the next key. Today only the last row (email) wraps, between 320 and 326px. `gap-x-4` would keep the value tight under its key. AC-4 pins `gap-4`, so this is a line for the Contact page spec, which reuses keyed rows, not a change here.
- ⚪ `e2e/site.spec.ts:573`: the test title promises "two Plex Mono files" but only counts two `.woff2` requests of any family. The file names are hashed, so to prove the family, check `document.fonts` for the loaded faces.
- ⚪ `e2e/site.spec.ts:487`: the `spans` helper is duplicated verbatim at `e2e/styleguide.spec.ts:303`. It could move to `e2e/helpers.ts`.
- ⚪ `src/lib/site-nav.test.ts:5`: the tags say `AC-8` and `AC-2` without a spec number. The same change tags `cv-format.test.ts` as `spec 0004 AC-8`, so these could match.
- ⚪ `docs/scope/scope.md:92`: "Verify it" is ticked while `verify.md:10`, the VoiceOver step, is still open. That step is the only check behind dropping `role="list"` for Safari. Either run it or mark it as deferred in the scope line.

## On the /check verify observations

1. **The `profiles` build failure is confirmed, but the proposed fix is not enough.** Both errors reproduce at `e2e/site.spec.ts:537`, and the page itself builds the email row alone. However, `?? []` alone leaves TS2339 in place. The root cause is the untyped fixture in `e2e/helpers.ts:14`. I rank this as the first Minor, not a Major: it only bites on a content edit nobody has planned, and it fails loudly at the gate.
2. **The two grep patterns are confirmed.** Both return nothing against the padded spans, and the `\s*` versions match. I also found that the curl step on the next line uses the wrong port. These are grouped as the second Minor.
3. **The Node 22 servers are confirmed.** `astro dev` on 4321 (pid 96438, started 14:52) and the `wrangler dev` behind 8787 (started 19:04) both run on fnm's Node v22.14.0. This is an environment note, not a finding against the diff, so it ranks below the nits. The `site` project builds and serves its own `dist/` on 8788 under whichever Node runs Playwright. Only the `styleguide` results came from the Node 22 dev server, and that page renders pure components, so the risk is low. Restart `astro dev` under Node 26 before the final `styleguide` run so the record is clean.

## Strengths
- `HANDLE_RULES ... satisfies Record<Network, (username: string) => string>` gets exhaustiveness from the compiler, including the excess key check, with no `switch` or `never` guard. AGENTS.md now records the rule for the next network.
- `NavRow` gets the accessibility details right. Numbers are `aria-hidden` because the `<ol>` already conveys order. Keys stay in the accessible name, so it matches the visible text (WCAG 2.5.3). The two `<nav>` landmarks have distinct names, there is no `role` anywhere, there is no `target`, and the external arrow rule is shared with `IconLink`.
- A dead menu row cannot ship quietly: the 200 check disables redirects, and numbers come from position rather than being stored.
- The 320px email case is solved with `flex-wrap` plus `shrink-0` rather than letting `overflow-wrap: anywhere` split the address. A test measures the real geometry at 320px and at 330px.
- The `exact: true` sweep in `styleguide.spec.ts` heads off the substring collision between the GitHub `IconLink` and the new `github @jorgergo` row before it becomes a flaky locator.
- The page code handles a CV with no `profiles`: I built a copy without them and got the email row alone.

## Test coverage
**Unit (Vitest)**: `formatRowNumber` (0, 1, 9, 10), `formatProfileHandle` (both networks, and the case of the username preserved), and the `SITE_NAV` invariants (lowercase labels, the href shape, planned order). This covers all of AC-8's outputs. The `satisfies` exhaustiveness is proven by the `NETWORKS` break step in `verify.md`, since Vitest does not type check.

**Page (Playwright)**:
- `site.spec.ts` covers the three blocks in `main` and their gaps, the ordered and unordered lists, `aria-hidden` placement, the arrow rule, no script, same origin requests only, the 320px/330px wrap, focus ring and colours on every row, the five Tab stops, axe in light and dark, and the 200 check.
- `styleguide.spec.ts` covers the row anatomy: height, gap, prefix widths, muted prefix, and the hover and focus colours.

**Not run**: I read the Playwright specs but did not run them, as instructed. No finding depended on running them.

**Automated coverage gaps**:
- The `basics.profiles ?? []` fallback in `index.astro` is exercised only by the manual break step. The page code works (verified in a copy), but the gate around it does not (the first Minor).
- Safari list semantics are manual and still open (the scope nit).
- The home page e2e hardcodes the `github @jorgergo` and `linkedin in/jorgergo` names, per AC-7's literal stops, while deriving the hrefs from `basics`. Once the fixture is schema typed, the names could come from `formatProfileHandle`.
