# Verify: CV PDF download · spec 0013 · 2026-10-05
_Steps derived from spec 0013 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file; run them in a scratch copy of the repo (`cp -cR` on macOS), because `git checkout src/content/cv.json` would also wipe any content edit you have not committed. Only Chromium is installed for Playwright, so the Safari, Firefox, and iPhone steps are yours to do by hand. Links carry a 150ms colour transition, so wait before reading a colour after a scheme switch.

## UI / manual
- [ ] On `/cv` at 1280×800 in light, then dark → `Download PDF` sits at the right edge of the header, centred on your name and role line, a bordered button with the download icon; the contact line below is unchanged and shows no `jorgergo.dev` → AC-4, AC-5, AC-7
- [ ] Hover the button, then reach it with Tab → text and border turn terracotta on hover and on focus; Tab also draws the 2px olive ring → AC-5
- [ ] Resize to 320, 375, 480, 525, 526, and 640px wide → with today's content, up to 525px the button has its own row under the role line, left aligned with your name; from 526px it sits at the right edge (your name block is 311px, the gap 16px, the button 151px, so the row needs 478px of the column); the role line is one line from 360px up at every width; nothing scrolls sideways → AC-6
- [ ] Press Tab from the top of `/cv` → skip link, `Download PDF`, the email, GitHub, LinkedIn, Ford Motor Company, TRACSUR Tickets, jorgergo.dev, Tecnológico de Monterrey, the EF SET certificate, then `← home`; every stop shows the ring → AC-8
- [ ] Click `Download PDF` in Chrome, then in Safari and Firefox → a file named `Jorge-Gonzalez-Ozorno-CV.pdf` lands in Downloads and the page stays on `/cv` → AC-5
- [ ] Tap the button on an iPhone (or in the iOS simulator) → Safari offers to download the file under the same name → AC-5
- [ ] Open `/cv.pdf` in the address bar in Chrome, then Safari, then Firefox → each shows the PDF in its own viewer (the site sends `frame-ancestors 'none'` with every file, so confirm none of them blocks it) and the tab reads `CV · Jorge González Ozorno` → AC-14, AC-17
- [ ] Open the downloaded file in Preview and in Chrome → two Letter pages; page one ends after the jorgergo.dev project and page two starts with Medipal, then `EDUCATION`; no entry is split across the pages; no heading is the last line of a page; the type is Plex Mono and Plex Sans → AC-10, AC-14
- [ ] In the PDF, select the summary and the first Ford bullets, copy, and paste into a text editor → the text comes out whole and in reading order → AC-14
- [ ] In the PDF, hover each link (do not click the email, it would open Mail; read its target instead) → `mailto:` your address, `jorgergo.dev`, GitHub, LinkedIn, Ford, TRACSUR, the jorgergo.dev project, Tec, and the EF SET certificate each point where the page's links do → AC-14
- [ ] In Preview's inspector (or Chrome's document properties) → the title is `CV · Jorge González Ozorno`; three fonts are embedded as subsets → AC-14
- [ ] With VoiceOver on, read the PDF in Preview → it announces headings and lists and reads English; the section names come in capitals → AC-14
- [ ] Print preview `/cv` in Chrome under a dark system setting, Letter → the same two pages as the PDF, on white paper with ink text; no button, no footer, no skip link; the contact line reads email, `jorgergo.dev`, GitHub, LinkedIn → AC-9, AC-10, AC-11
- [ ] Print preview `/cv` in Safari and in Firefox → record the page counts here. A third page there is a known limit, not a failure → Consequences
- [ ] Print preview `/about` and `/projects` in Chrome → 10pt type, half inch margins, the text runs the full width, and the footer city line is still there → AC-9
- [ ] Read the PDF top to bottom as a recruiter would → every line sounds like you; nothing reads as a template → AC-1
- [ ] Check the three numbers against what you know today → Ford's first line says a team of 95 for the Portal and more than 7,000 people for the Knowledge Base; TRACSUR's second bullet says 200,000 page views and 5,000 tickets in its first week on sale; Medipal carries no number → AC-1
- [ ] Before the merge, ask the TRACSUR organizer whether the ticket count may be public → a yes; with a no, end that bullet at `page views.` in `cv.json` and rebuild → AC-1
- [ ] On `/projects` → TRACSUR Tickets is a link, reads `live`, and shows no bullets; the doctors app is spelled Medipal → AC-1, AC-3
- [ ] `pnpm dev`, open `/styleguide` → a `Download PDF` button with the icon appears beside the other two buttons in both panels → AC-20
- [ ] Emulate `forced-colors: active` and `prefers-contrast: more` on `/cv` → the button keeps a visible border and its icon; the role line turns ink under contrast more → AC-5

## Commands
- [ ] `pnpm build` → the log holds `[cv-pdf] cv.pdf: 2 pages` and a size near 65 kB; `ls dist/cv.pdf` finds the file → AC-13, AC-14
- [ ] `grep -c '<script' dist/cv.html` → 0 → AC-4
- [ ] `pnpm test` → passes, with the `spec 0013` cases for the schema, `formatCvContacts`, and `cv-pdf.ts` → AC-2, AC-7, AC-12
- [ ] `pnpm exec playwright test` → passes; `git diff --stat main -- e2e/site.spec.ts` shows the eleven edited cases and the new `cv pdf` block, and no change to another fixture derived case → AC-21
- [ ] `pnpm lint`, `pnpm format:check` → clean → AC-21
- [ ] With `pnpm preview` running, `curl -sI http://localhost:8787/cv.pdf` → `200`, `content-type: application/pdf`, `x-robots-tag: noindex`, the five `/*` headers, and a cache header without `immutable` → AC-17
- [ ] `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → `every check passed` → AC-18
- [ ] After the deploy, on your Mac: `pnpm build`, then `bash .github/scripts/smoke.sh pages` with no `SMOKE_ORIGIN` → `every check passed` against the live site, although your local `cv.pdf` and the live one differ in bytes → AC-18
- [ ] Linux comparison: build the branch inside `mcr.microsoft.com/playwright:v1.63.0-noble` (Node 26 and `pnpm install --frozen-lockfile` in the container, then `pnpm build`), copy its `dist/cv.pdf` out, and compare it with the macOS build's file using PyMuPDF: page count, and `page.get_text()` line by line for each page → the same count and the same lines → AC-16
- [ ] Open a draft pull request and read the `check` job → Chromium installs before `pnpm build`, the build logs `cv.pdf: 2 pages`, and every step is green → AC-16, AC-19
- [ ] After the merge, read the `deploy` job → `smoke.sh pages` passes with the `/cv.pdf` checks, and `https://jorgergo.dev/cv.pdf` downloads the same two pages → AC-18

## Break steps
- [ ] In the `@media print` block of `src/styles/global.css` set `html { font-size: 11pt; }`, run `pnpm build` → it stops with `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013`, exits with a failing code, and `dist/cv.pdf` does not exist; restore → AC-15
- [ ] `PLAYWRIGHT_BROWSERS_PATH=/tmp/no-browsers pnpm build` → it stops with ``cv.pdf needs Chromium: run `pnpm exec playwright install chromium` (on Linux add --with-deps); see spec 0013`` → AC-15
- [ ] In `src/lib/render-pdf.ts` change the printed path `/cv` to `/nope`, run `pnpm build` → it stops with `cv.pdf: dist/cv.html did not load; see spec 0013`; restore → AC-15
- [ ] In `src/lib/cv-pdf.ts` change `IBMPlexSans-Regular` to `IBMPlexSans-Medium` inside `CV_PDF_FONTS`, run `pnpm build` → it stops with `cv.pdf embeds IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Medium; a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013`; restore → AC-15
- [ ] In `cv.json` put an arrow, `→`, into the first Ford bullet, run `pnpm build` → it stops with the same message, now naming a fourth font that is not Plex; restore → AC-15
- [ ] In `cv.json` add `"highlights": ["x"]` to FinTech AI (then try `"highlights": []`), run `pnpm build` → the schema error names `projects.2.highlights` and reads `highlights show only on the CV, so the project must set cv; see spec 0013`; restore → AC-2
- [ ] In `cv.json` add `"cv": true` to FinTech AI, run `pnpm build` → the schema error reads `at most 3 projects may set cv; see spec 0010`; restore → AC-2
- [ ] In `cv.json` remove `basics.profiles`, run `pnpm build` and `pnpm preview` → on screen the contact line is the email alone with no dot after it; in print preview it reads the email, a dot, and `jorgergo.dev`; `pnpm exec playwright test --project site` still passes with no test edit; restore → AC-7, AC-21
- [ ] In `cv.json` add one short bullet to the Ford IT Academy role (`A test bullet that stays on one line of the page.`), run `pnpm build` → still `cv.pdf: 2 pages`; in the PDF page one still ends after jorgergo.dev; `pnpm exec playwright test --project site` passes with no test edit; restore → AC-14, AC-21
- [ ] In `cv.json` add the bullet this spec removed to both Ford roles (`Set repo standards and strict build checks that ended about an hour a week of fixing broken links, and helped contributors through 18+ support issues.`), run `pnpm build` → it stops with `cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013` and `dist/cv.pdf` does not exist; restore → AC-15
- [ ] In `public/_headers` delete the `/cv.pdf` block, run `pnpm build`, then `bash .github/scripts/smoke.sh pages` with `SMOKE_ORIGIN` set → it exits 1 with `no /cv.pdf block in dist/_headers`; restore → AC-18
- [ ] Run `pnpm dev` and open `/cv` → the page renders with the button, and `/cv.pdf` answers 404 there; this is the known limit in Consequences, not a failure → AC-13
