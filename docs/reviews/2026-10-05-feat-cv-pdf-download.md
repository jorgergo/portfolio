# Review, feat/cv-pdf-download, 2026-10-05

**Reviewed by**: Sonnet 5.5 (author on a different model)
**Scope**: 36 files, branch vs main
**Verdict**: Approve with nits

## Summary
The branch curates `cv.json`, sets one paper scale, adds the `Download PDF` button and `formatCvContacts`, and adds a build-time Astro integration that prints `/cv` to `dist/cv.pdf` through Chromium and fails the build on a third page, a missing font, or a missing browser. It follows spec 0013 closely and holds to AGENTS.md. The pure rules (`cv-pdf.ts`) are separate from the browser module (`render-pdf.ts`), matching the `share-card.ts` and `render-image.ts` split. `pnpm lint` is clean and all 510 Vitest cases pass. I did not run the Playwright suite or a full build. No blockers or majors; only small robustness and doc nits.

## Minor
### 🟡 Malformed percent escape in a request path is not handled, `src/lib/render-pdf.ts:27`
**Problem**: `builtFile` calls `decodeURIComponent(pathname)` with no guard. A request path with a bad escape (for example `%E0%A4%A`) throws a `URIError` inside the `page.route` handler.
**Why it matters**: Unresolved route handlers can leave the request pending, so the build could stall until a Playwright timeout and then fail with a confusing message instead of a 404 for that asset. Content-driven and unlikely today; I have not reproduced it.
**Suggested fix**: Treat a decode failure as a missing file (404), keeping the "files under dist/ only" rule. Add a case to `render-pdf.test.ts`.

### 🟡 `pnpm test` now needs Chromium, `src/lib/render-pdf.test.ts:1`
**Problem**: The new unit file launches real Chromium, so a fresh machine without `playwright install chromium` fails `pnpm test` for this file with a launch error rather than a clear message.
**Why it matters**: AGENTS.md describes `pnpm test` as Vitest on `src/lib` helpers. CI installs Chromium earlier now, so CI is fine; local first runs are the exposure. The file's header comment already says Chromium is needed.
**Suggested fix**: Say it in the AGENTS.md Commands block during `/sync`, which the spec's follow-up already lists.

## Nits
- ⚪ `src/lib/cv-pdf.ts:68`, `readTitle` unescapes only `\\`, `\(`, `\)`. A literal title containing an octal escape (`\050`) or `\n` would read wrongly. Chromium's titles come out as ASCII literal or UTF-16 hex today, so this is theoretical.
- ⚪ `src/lib/render-pdf.ts:55`, `page.evaluate(() => document.fonts.ready.then(() => undefined))` works but a short comment on why `undefined` is returned (so the result serialises) would help.
- ⚪ `AGENTS.md`, not yet updated for Chromium in the build, `cv-pdf.ts`/`render-pdf.ts`, the paper scale, `formatCvContacts`, and the `/cv.pdf` smoke checks. The spec lists this as a `/sync` follow-up, so it is expected, but it must land before merge to keep the guide true.

## Strengths
- Clean pure/impure split with the throw confined to the build hook, and the hook reads only files under `dist/`, aborts every other origin, and closes the browser in `finally`. The path-climb case is covered by a test.
- `smoke.sh` and `_headers` change together as the rules require (block lookup, signature check, `check_not_immutable`), and the deliberate choice not to compare PDF bytes is documented in the script and the spec.
- `formatCvContacts` is a pure, immutable helper whose separator states are tested, and `cv.astro` holds no contact rule of its own.

## Test coverage
Strong. `cv-pdf.test.ts` covers every `checkCvPdf` branch, both title forms, and the file names. `render-pdf.test.ts` runs the hook against real Chromium and covers success, the launch failure, a non-200 page, the page cap, the missing font, request interception, and the 404, traversal, and abort paths. `cv-schema.test.ts` and `cv-format.test.ts` cover the new caps, the highlights rule, and the contact separators. The Playwright additions derive their expectations from `cv.json` and helpers as AGENTS.md asks. Only the malformed escape path above is untested.
