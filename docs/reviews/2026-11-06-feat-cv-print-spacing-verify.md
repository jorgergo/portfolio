# Verify, feat/cv-print-spacing, 2026-11-06

**Run by**: Claude Opus 5.5, `/check verify`
**Scope**: the CV paper spacing fix, `07046b2` (code) and `a4aae2e` (specs 0005 and 0013 and `design.md`), on `feat/cv-print-spacing`, which is `main` (`b2617a2`) plus those two commits
**Verdict**: PASS

## /check verify cv paper spacing · PASS

**PASS: all 10 behaviors met, with evidence below. Every criterion the amendments touched is met (spec 0005 AC-1, AC-3, AC-4, AC-5, AC-10, AC-13, AC-16; spec 0013 AC-10, AC-11, AC-20), and nothing specced is missing or not applied.**

Next: open the PR. A `/check review` on a fresh model is your call. After the merge, `/sync` owes the `AGENTS.md` line that still says "location on the right of line 2" (spec 0005 records that follow up).

Failing or owed: none.

Ran via `pnpm build` on Node 26.10.0, `wrangler dev --port 8798` on the built `dist/`, Google Chrome 155, PyMuPDF 1.27.2, PDFKit, and the page tests on ports 8798 and 4331. Evidence files (PNGs, JSON, logs) stayed in the session scratch folder and are not committed.

## Behaviors and evidence

| # | Behavior | Evidence | Result |
|---|---|---|---|
| 1 | On paper a grouped role's location sits beside its date on line 1, and no line holds a location alone | `dist/cv.pdf` read with PyMuPDF (`get_text('dict')`, spans grouped by baseline): `Full Stack Developer, PDPO` and `Remote · Aug 2025 – Present` share the baseline 233.25pt; `Software Engineer, IT Academy` and `Mexico City, Mexico · Jan 2025 – Jul 2025` share 404.25pt; both dates end at 576.0pt. Of the 72 lines on the two pages, none equals a `cv.json` location (`Remote`, `Mexico City, Mexico`, `Toluca, Mexico`). The `main` PDF had two such lines (`Remote` at 234.8pt, `Mexico City, Mexico` at 423.1pt) | ✅ |
| 2 | Single roles and education keep the location on the right of line 2 | Same read: `Process Automation Intern` with `Mexico City, Mexico` ending at 576.0pt on its own line 2; `B.S., Computer Science and Technology · GPA 4.0/4.0 (97/100)` with `Toluca, Mexico` ending at 576.0pt. Under print emulation both line 2 rows compute `display: flex` | ✅ |
| 3 | The paper gap scale | Under print emulation (root 13.3333px, the 10pt paper root): wrapper `row-gap` 20px (1.5rem); each of the 8 sections 10px (0.75rem, heading rule to body); each section body 13.3333px (1rem, between entries); the Ford roles wrapper 3.33333px (0.25rem); every `CvEntry` root 3.33333px (0.25rem, between an entry's lines); bullets 1.66667px. In the PDF the white from each heading's rule to its first line is 8.1pt on all 8 headings | ✅ |
| 4 | No gap above a first item or at the top of page 2 | Under print, no element under `main` has a top margin, top padding, or bottom margin, and every flex container's first visible child starts at its parent's content top (the only offsets are 2px baseline alignment in the 6 keyed rows, as on `main`). Page 2 of the PDF starts with `Medipal` at 36.3pt, against the 36pt margin | ✅ |
| 5 | Visible steps on paper | White between line boxes in the PDF: company to its first role 3.5pt (3.9pt measured from the date span, as the rationale did), role to role 4.3pt, company to company 11.8pt, section to section 15.5 to 16.3pt (17.4pt from the header to Summary) | ✅ |
| 6 | Still two Letter pages, only the three Plex faces | PyMuPDF: 2 pages, each 612 by 792pt; fonts `IBMPlexMono-Medium`, `IBMPlexMono-Regular`, `IBMPlexSans-Regular` on both pages, which is `CV_PDF_FONTS`. The build log reads `[cv-pdf] cv.pdf: 2 pages, 65 kB`, so `checkCvPdf` passed. Page fill: 44 and 51 PyMuPDF lines; page 1 ends 52.4pt above the bottom margin, page 2 ends 11.5pt above it (11.9pt measured from the key span, as the rationale did) | ✅ |
| 7 | The screen `/cv` is unchanged at 320, 480, 640, and 1280px | Full page screenshots of `main`'s build and this branch's build, light and dark, 8 pairs: same sizes (320 by 6029, 480 by 4611, 640 by 3936, 1280 by 3936) and 0 differing pixels in every pair; `document.body.innerText` and the body aria snapshot equal in every pair | ✅ |
| 8 | On screen line 2 still shows the location, and the paper only copy stays out of the accessibility tree | At each of the four widths: each Ford role's line 2 computes `display: flex` and reads `Remote` or `Mexico City, Mexico`; the paper only span computes `display: none`; the meta span's `innerText` is the date alone. From 480px the location's right edge equals the column's right edge (456, 616, 936px). Chromium's full accessibility tree (CDP `Accessibility.getFullAXTree`) has no node naming `Remote ·` or `Mexico City, Mexico ·`, and the aria snapshot still reads `Aug 2025 – Present Remote`, as on `main`. In the browser pane at 1280px on the preview, each role shows its date at the right of line 1 and its location alone at the right of line 2 | ✅ |
| 9 | Printing `/cv` from Chrome gives the same document | Chrome 155 printed `http://localhost:8798/cv` to PDF: 2 Letter pages, the same 72 lines with the same text, 0.0pt apart in x and y from `dist/cv.pdf`, the same three fonts. `/cv.pdf` served by the preview is byte identical to `dist/cv.pdf` and carries `X-Robots-Tag: noindex` | ✅ |
| 10 | Copying the Ford group from the PDF | A PDFKit selection over the Ford group gives `Full Stack Developer, PDPO Remote · Aug 2025 – Present` and `Software Engineer, IT Academy Mexico City, Mexico · Jan 2025 – Jul 2025`: each location once, before its date | ✅ |

Suites on this branch: the page tests, 433 passed (site and styleguide projects, `prints a grouped role's location beside its date, so no line holds a location alone`, `consecutive roles at one company group under one company line`, and every `print` case among them); `pnpm test`, 578 passed in 11 files; `pnpm lint` and `pnpm format:check` clean; `astro check` 0 errors.

## Spec conformance

| Criterion | Evidence | Verdict |
|---|---|---|
| 0005 AC-1 | `<title>CV · Jorge González Ozorno`; one `h1`; the wrapper is `flex flex-col gap-14 print:gap-6` (no `print:gap-5` left in `cv.html`), 56px on screen and 20px on paper; the eight sections in order, Projects after Experience | ✅ met |
| 0005 AC-3 | Every section is `flex flex-col gap-6 print:gap-3` with `aria-labelledby`; every `h2` carries `border-b border-line pb-2 break-after-avoid print:pb-1 print:leading-tight`; each of the 8 is followed by one body `div` `flex flex-col gap-6 print:gap-4`, 24px on screen and 13.3333px on paper | ✅ met |
| 0005 AC-4 | The meta span of each grouped role starts with `<span class="hidden print:inline">` holding `Remote · ` and `Mexico City, Mexico · `; exactly 2 line 2 `div`s carry `print:hidden`; `META_SEPARATOR` is exported at `src/lib/cv-format.ts:82`; screen line 2 kept (behaviors 7 and 8); entries with a subtitle unchanged (behavior 2) | ✅ met |
| 0005 AC-5 | The roles wrapper is `flex flex-col gap-4 print:gap-1`, 16px on screen and 3.33333px on paper; the paper lines read as specced (behavior 1) | ✅ met |
| 0005 AC-10 | On paper the footer computes `display: none`, the wrapper is 20px, each body 13.3333px, and the 2 grouped role line 2 rows are hidden; one script on the page | ✅ met |
| 0005 AC-13 | `design.md`: the pair rule adds the paper rule (a location with nothing on its left joins line 1 before the date, `hidden print:inline`, `META_SEPARATOR`, line 2 `print:hidden`); the spacing rows name `print:gap-6`, `print:gap-3` and `print:gap-4`, and `print:gap-1`; the print paragraph states the stepped gaps; no `print:gap-5` or `print:gap-2` left. The style guide project passes | ✅ met |
| 0005 AC-16 | Break step in a scratch copy: delete `location` from the first Ford role, then the site project passes with no test edit (363 passed); that build hides one line 2, keeps the `Mexico City, Mexico · ` copy, and prints `Full Stack Developer, PDPO` with its date alone | ✅ met |
| 0013 AC-10 | Wrapper 20px, sections 10px, bodies 13.3333px, roles 3.33333px; every other value as before (entries and header 3.33333px, bullets 1.66667px); all flex gaps (behavior 4) | ✅ met |
| 0013 AC-11 | The hidden elements under `main` on paper are exactly the download link and 2 `DIV`s, the grouped role line 2 rows; the footer and skip link hidden; the contact items print (page test passes) | ✅ met |
| 0013 AC-20 | `design.md` carries the amended spacing rows, the `CvEntry` paper rule, and the print paragraph (see 0005 AC-13) | ✅ met |
| 0013 AC-14, AC-15 (verify.md coverage) | 2 Letter pages, the three fonts (behavior 6). Break step in a scratch copy: a third Ford Operation Good Cheer bullet makes the build exit 1 with `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013`, and no `dist/cv.pdf` is left | ✅ met |

Missed surfaces: none. Not applied: none.

## How the hand steps were run

Some `verify.md` steps name a tool this run reached another way. Each one is ticked, and here is exactly how it was run:

- **`pnpm preview`**: `wrangler dev --port 8798`, the same command `pnpm preview` runs, on a port the parallel session does not use.
- **Print preview `/cv` in Chrome**: Google Chrome 155 with `--headless --print-to-pdf --no-pdf-header-footer` against the preview. That is the print pipeline the preview dialog shows, without the dialog itself.
- **Open the downloaded PDF in Preview**: `/cv.pdf` fetched from the preview (byte identical to the download), drawn at 2x with PDFKit, the framework Preview draws with, and both pages read by eye: a role sits close under the role before it, a new company clearly further down, a new section further still, no heading has extra space before its first entry, and page 2 starts with Medipal at the top.
- **Select and copy the Ford group**: a PDFKit selection over the group, whose string is what Preview copies.
- **The two page test commands**: the full suite through a temporary copy of `playwright.config.ts` on ports 8798 and 4331 (deleted afterwards); it includes both `-g` filters.
- **Break steps**: in a clonefile copy of the worktree with its `.git` link removed, so the worktree never changed.

If you want the literal Preview and print dialog looks, they take about a minute: download from `pnpm preview`, open it in Preview, then press Cmd+P on `/cv` in Chrome.

## What was ticked

- Spec 0005 `verify.md`, *Added after the paper spacing fix*: the screen step at 1280px, the print preview, the copy step, and the Playwright command (all four that were open).
- Spec 0013 `verify.md`, *Added after the paper spacing fix*: the Preview look, the print preview, the Playwright command, and the break step (all four that were open).
- Scope: no row matches this fix; feature 9's `Verify it` box (the CV PDF download) was already ticked. Both specs stay `Accepted`.

## For /check review

- Probe note, not a site bug: the reduced motion rule gives every element a 0.01ms transition, so a one shot `getComputedStyle` right after `emulateMedia({ media: 'print' })` still reads the screen values (16px root, 56px wrapper) for a frame, while `display` (not animatable) flips at once. `toHaveCSS` retries, so the suite is safe; a scratch probe needs a short wait. Worth knowing on the spec 0016 branch, whose Playwright config turns reduced motion on for every test.
- `compressHTML` leaves a space after the paper only span (`Remote · </span> Aug 2025`); layout collapses it, and the PDF text and the PDFKit copy both read one space.
- Page 2 has 11.5pt spare, under one 14.5pt body line, so the next line there makes a third page and the build stops (by design, recorded in spec 0013's rationale).
