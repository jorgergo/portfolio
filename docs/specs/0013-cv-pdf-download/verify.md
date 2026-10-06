# Verify: CV PDF download · spec 0013 · 2026-10-05
_Steps derived from spec 0013 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file; run them in a scratch copy of the repo (`cp -cR` on macOS), because `git checkout src/content/cv.json` would also wipe any content edit you have not committed. Only Chromium is installed for Playwright, so the Safari, Firefox, and iPhone steps are yours to do by hand. Links carry a 150ms colour transition, so wait before reading a colour after a scheme switch.

## UI / manual
- [x] On `/cv` at 1280×800 in light, then dark → `Download PDF` sits at the right edge of the header, centred on your name and role line, a bordered button with the download icon; the contact line below is unchanged and shows no `jorgergo.dev` → AC-4, AC-5, AC-7
- [x] Hover the button, then reach it with Tab → text and border turn terracotta on hover and on focus; Tab also draws the 2px olive ring → AC-5
- [x] Resize to 320, 375, 480, 525, 526, and 640px wide → with today's content, up to 525px the button has its own row under the role line, left aligned with your name; from 526px it sits at the right edge (your name block is 311px, the gap 16px, the button 151px, so the row needs 478px of the column); the role line is one line from 360px up at every width; nothing scrolls sideways → AC-6
- [x] Press Tab from the top of `/cv` → skip link, `Download PDF`, the email, GitHub, LinkedIn, Ford Motor Company, TRACSUR Tickets, jorgergo.dev, Tecnológico de Monterrey, the EF SET certificate, then `← home`; every stop shows the ring → AC-8
- [x] Click `Download PDF` in Chrome, then in Safari and Firefox → a file named `Jorge-Gonzalez-Ozorno-CV.pdf` lands in Downloads and the page stays on `/cv` → AC-5
- [x] Tap the button on an iPhone (or in the iOS simulator) → Safari offers to download the file under the same name → AC-5
- [x] Open `/cv.pdf` in the address bar in Chrome, then Safari, then Firefox → each shows the PDF in its own viewer (the site sends `frame-ancestors 'none'` with every file, so confirm none of them blocks it) and the tab reads `CV · Jorge González Ozorno` → AC-14, AC-17
- [x] Open the downloaded file in Preview and in Chrome → two Letter pages; page one ends after the jorgergo.dev project and page two starts with Medipal, then `EDUCATION`; no entry is split across the pages; no heading is the last line of a page; the type is Plex Mono and Plex Sans → AC-10, AC-14
- [x] In the PDF, select the summary and the first Ford bullets, copy, and paste into a text editor → the text comes out whole and in reading order → AC-14
- [x] In the PDF, hover each link (do not click the email, it would open Mail; read its target instead) → `mailto:` your address, `jorgergo.dev`, GitHub, LinkedIn, Ford, TRACSUR, the jorgergo.dev project, Tec, and the EF SET certificate each point where the page's links do → AC-14
- [x] In Preview's inspector (or Chrome's document properties) → the title is `CV · Jorge González Ozorno`; three fonts are embedded as subsets → AC-14
- [x] With VoiceOver on, read the PDF in Preview → it announces headings and lists and reads English; the section names come in capitals → AC-14
- [x] Print preview `/cv` in Chrome under a dark system setting, Letter → the same two pages as the PDF, on white paper with ink text; no button, no footer, no skip link; the contact line reads email, `jorgergo.dev`, GitHub, LinkedIn → AC-9, AC-10, AC-11
- [x] Print preview `/cv` in Safari and in Firefox → record the page counts here. A third page there is a known limit, not a failure → Consequences
- [x] Print preview `/about` and `/projects` in Chrome → 10pt type, half inch margins, the text runs the full width, and the footer city line is still there → AC-9
- [x] Read the PDF top to bottom as a recruiter would → every line sounds like you; nothing reads as a template → AC-1
- [x] Check the three numbers against what you know today → Ford's first line says a team of 95 for the Portal and more than 7,000 people for the Knowledge Base; TRACSUR's second bullet says 200,000 page views and 5,000 tickets in its first week on sale; Medipal carries no number → AC-1
- [x] Before the merge, ask the TRACSUR organizer whether the ticket count may be public → a yes; with a no, end that bullet at `page views.` in `cv.json` and rebuild → AC-1. The organizer said yes on 2026-10-05, so the bullet stays.
- [x] On `/projects` → TRACSUR Tickets is a link, reads `live`, and shows no bullets; the doctors app is spelled Medipal → AC-1, AC-3
- [x] `pnpm dev`, open `/styleguide` → a `Download PDF` button with the icon appears beside the other two buttons in both panels → AC-20
- [x] Emulate `forced-colors: active` and `prefers-contrast: more` on `/cv` → the button keeps a visible border and its icon; the role line turns ink under contrast more → AC-5

## Commands
- [x] `pnpm build` → the log holds `[cv-pdf] cv.pdf: 2 pages` and a size near 65 kB; `ls dist/cv.pdf` finds the file → AC-13, AC-14
- [x] `grep -c '<script' dist/cv.html` → 0 → AC-4
- [x] `pnpm test` → passes, with the `spec 0013` cases for the schema, `formatCvContacts`, and `cv-pdf.ts` → AC-2, AC-7, AC-12
- [x] `pnpm exec playwright test` → passes; `git diff --stat main -- e2e/site.spec.ts` shows the eleven edited cases and the new `cv pdf` block, and no change to another fixture derived case → AC-21
- [x] `pnpm lint`, `pnpm format:check` → clean → AC-21
- [x] With `pnpm preview` running, `curl -sI http://localhost:8787/cv.pdf` → `200`, `content-type: application/pdf`, `x-robots-tag: noindex`, the five `/*` headers, and a cache header without `immutable` → AC-17
- [x] `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → `every check passed` → AC-18
- [x] After the deploy, on your Mac: `pnpm build`, then `bash .github/scripts/smoke.sh pages` with no `SMOKE_ORIGIN` → `every check passed` against the live site, although your local `cv.pdf` and the live one differ in bytes → AC-18. Passed on 2026-10-05 against the deploy of `0268cad`: `attempt 1/10: every check passed`.
- [x] Linux comparison: build the branch inside `mcr.microsoft.com/playwright:v1.63.0-noble` (Node 26 and `pnpm install --frozen-lockfile` in the container, then `pnpm build`), copy its `dist/cv.pdf` out, and compare it with the macOS build's file using PyMuPDF: page count, and `page.get_text()` line by line for each page → the same count and the same lines → AC-16
- [x] Open a draft pull request and read the `check` job → Chromium installs before `pnpm build`, the build logs `cv.pdf: 2 pages`, and every step is green → AC-16, AC-19
- [x] After the merge, read the `deploy` job → `smoke.sh pages` passes with the `/cv.pdf` checks, and `https://jorgergo.dev/cv.pdf` downloads the same two pages → AC-18. Passed on 2026-10-05: the job's `smoke.sh pages` passed on attempt 2, and the live file is two Letter pages with the same 46 and 51 lines of text as a local build (66,160 bytes live, 66,020 local).

## Break steps
- [x] In the `@media print` block of `src/styles/global.css` set `html { font-size: 11pt; }`, run `pnpm build` → it stops with `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013`, exits with a failing code, and `dist/cv.pdf` does not exist; restore → AC-15
- [x] `PLAYWRIGHT_BROWSERS_PATH=/tmp/no-browsers pnpm build` → it stops with ``cv.pdf needs Chromium: run `pnpm exec playwright install chromium` (on Linux add --with-deps); see spec 0013`` → AC-15
- [x] In `src/lib/render-pdf.ts` change the printed path `/cv` to `/nope`, run `pnpm build` → it stops with `cv.pdf: dist/cv.html did not load; see spec 0013`; restore → AC-15
- [x] In `src/lib/cv-pdf.ts` change `IBMPlexSans-Regular` to `IBMPlexSans-Medium` inside `CV_PDF_FONTS`, run `pnpm build` → it stops with `cv.pdf embeds IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Medium; a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013`; restore → AC-15
- [x] In `cv.json` put an arrow, `→`, into the first Ford bullet, run `pnpm build` → it stops with the same message, now naming a fourth font that is not Plex; restore → AC-15
- [x] In `cv.json` add `"highlights": ["x"]` to FinTech AI (then try `"highlights": []`), run `pnpm build` → the schema error names `projects.2.highlights` and reads `highlights show only on the CV, so the project must set cv; see spec 0013`; restore → AC-2
- [x] In `cv.json` add `"cv": true` to FinTech AI, run `pnpm build` → the schema error reads `at most 3 projects may set cv; see spec 0010`; restore → AC-2
- [x] In `cv.json` remove `basics.profiles`, run `pnpm build` and `pnpm preview` → on screen the contact line is the email alone with no dot after it; in print preview it reads the email, a dot, and `jorgergo.dev`; `pnpm exec playwright test --project site` still passes with no test edit; restore → AC-7, AC-21
- [x] In `cv.json` add one short bullet to the Ford IT Academy role (`A test bullet that stays on one line of the page.`), run `pnpm build` → still `cv.pdf: 2 pages`; in the PDF page one still ends after jorgergo.dev; `pnpm exec playwright test --project site` passes with no test edit; restore → AC-14, AC-21
- [x] In `cv.json` add the bullet this spec removed to both Ford roles (`Set repo standards and strict build checks that ended about an hour a week of fixing broken links, and helped contributors through 18+ support issues.`), run `pnpm build` → it stops with `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013` and `dist/cv.pdf` does not exist; restore → AC-15
- [x] In `public/_headers` delete the `/cv.pdf` block, run `pnpm build`, then `bash .github/scripts/smoke.sh pages` with `SMOKE_ORIGIN` set → it exits 1 with `no /cv.pdf block in dist/_headers`; restore → AC-18
- [x] Run `pnpm dev` and open `/cv` → the page renders with the button, and `/cv.pdf` answers 404 there; this is the known limit in Consequences, not a failure → AC-13

## Build measurements · /develop · 2026-10-05
_Taken during the build, so `/check verify` can compare without running them again. The break steps ran in a scratch clone (`cp -cR`), never in the working tree. Nothing above is ticked: that is for `/check verify`._

- Gate on macOS: `pnpm lint` and `pnpm format:check` clean; `pnpm test` 498 passing; `pnpm build` logs `[cv-pdf] cv.pdf: 2 pages, 64 kB` (66,020 bytes) and takes about 0.4 s longer than before; `pnpm exec wrangler deploy --dry-run` reads 23 files; `pnpm exec playwright test` 360 passing → AC-21
- `grep -c '<script' dist/cv.html` → 0 → AC-4
- The PDF, read with `readPdfFacts` and PyMuPDF: 2 pages, 612 by 792pt, the fonts `IBMPlexMono-Medium`, `IBMPlexMono-Regular`, and `IBMPlexSans-Regular`, tagged, `lang` `en`, the title `CV · Jorge González Ozorno`, and 9 links (the email, `https://jorgergo.dev/`, GitHub, LinkedIn, Ford, TRACSUR, the jorgergo.dev project, Tec, EF SET) → AC-14
- Page fill: the text of page one ends at 723.1pt of 792pt, 32.9pt above the bottom margin (about two lines), on the technologies line of jorgergo.dev; page two starts with Medipal and ends at 722.0pt, 34.0pt above the margin → AC-10, AC-14
- Contact line on paper: `jorgergo@icloud.com · jorgergo.dev · github.com/jorgergo · linkedin.com/in/jorgergo`; the PDF holds no `Download` text → AC-7, AC-11
- Header fit, measured on the built page: the name block is 310.8px wide (the label line), the button 150.8px, the gap 16px, so the row needs 477.6px. At 525px wide the header is 477px and the button sits under the name block at the left edge; at 526px it is 478px and the button sits at the right edge with its centre on the name block's. Nothing scrolls sideways at 320, 375, 480, 525, 526, 640, or 1280px → AC-6
- `pnpm preview`: `/cv.pdf` answers 200 with `Content-Type: application/pdf`, `x-robots-tag: noindex`, `Cache-Control: public, max-age=0, must-revalidate`, and the five `/*` headers; `/cv` carries no `x-robots-tag`; `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → `attempt 1/10: every check passed` → AC-17, AC-18
- `pnpm dev`: `/cv` renders with the button and `/cv.pdf` answers 404 there; `/styleguide` shows `Download PDF` after the two other buttons in both panels, with a 16px icon and `download="Example-CV.pdf"` → AC-13, AC-20
- Forced colours and contrast more, probed on the built page: under `forced-colors: active` the button keeps a 1px solid border and its icon, both in the system link colour, and takes the underline every link gets there; under `prefers-contrast: more` its border and the label line turn ink, in light and dark → AC-5
- Break steps. Each `pnpm build` exited 1 and left no `dist/cv.pdf` → AC-2, AC-15
  - `html { font-size: 11pt; }` in the print block → `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013`
  - `PLAYWRIGHT_BROWSERS_PATH` set to an empty folder → the Chromium message, with Playwright's own launch error printed under `Caused by`
  - the printed path changed to `/nope` → `cv.pdf: dist/cv.html did not load; see spec 0013`
  - `IBMPlexSans-Medium` in `CV_PDF_FONTS` → the font message of the step above, word for word
  - an arrow in the first Ford bullet → `cv.pdf embeds ArialMT, IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular; …`. On macOS the fourth face is Arial
  - `"highlights": ["x"]`, then `"highlights": []`, on FinTech AI → `projects.2.highlights: highlights show only on the CV, so the project must set cv; see spec 0013`
  - `"cv": true` on FinTech AI → `projects.3.cv: at most 3 projects may set cv; see spec 0010`. The issue lands on Medipal, the fourth flagged project in file order, not on FinTech AI
  - the removed bullet added to both Ford roles → the three page message again
- Content edits that needed no test edit, each followed by `pnpm exec playwright test --project site` with 293 passing: `basics.profiles` removed (on screen the email alone with its dot hidden; on paper `jorgergo@icloud.com · jorgergo.dev`), and one short bullet added to the IT Academy role (still two pages, and page one still ends after jorgergo.dev) → AC-7, AC-14, AC-21
- `site` changed to `https://www.example.dev/me/` in the clone → the paper only item reads `example.dev/me` and links `https://www.example.dev/me/`, so it follows `site` and nothing else → AC-7
- `check_pdf`, lifted from `smoke.sh` as written and run under the bash 3.2 of macOS: it passes the built `cv.pdf` and fails `cv.html`, an empty body, a signature that is not at the start of line one, and random bytes, each with `/cv.pdf body expected a PDF got something else`. No page test locks this branch yet; the three smoke cases the spec names cover the pass, the header value, and the missing block → AC-18
- Linux comparison, in `mcr.microsoft.com/playwright:v1.63.0-noble` (arm64, Node 26.10.0, pnpm 12.6.0): the build logs `[cv-pdf] cv.pdf: 2 pages, 65 kB` (66,160 bytes, against 66,020 on macOS). Both files have 2 pages, the same text lines on each (46 on page one, 51 on page two), and the same three fonts; across 768 words the largest move of a word edge is 0.12pt, and the text ends at 723.15pt and 722.00pt in both. In the same image `pnpm lint`, `pnpm format:check`, `pnpm test` (498 passing), and `CI=1 pnpm exec playwright test` (360 passing) pass → AC-16, AC-21
- A note for the next Linux run: make the archive with `COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata`. With the plain macOS tar, `pnpm lint` and `pnpm format:check` fail inside the image while the build and the page tests pass, so the failure is the archive, not the code.

## Not run by the build
- The Safari, Firefox, iPhone, Preview, and VoiceOver steps, the read as a recruiter, the three numbers, and the TRACSUR organizer's answer are yours.
- The deploy steps wait for the merge.
