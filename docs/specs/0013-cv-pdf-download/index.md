# 0013. CV curated to two pages and printed to a PDF by the build

**Date**: 2026-10-05
**Status**: Accepted

## Summary

Your CV gets shorter and plainer, and visitors can download it. `src/content/cv.json` is curated down to the entries that matter most for a full stack role with an AI focus, in words that sound like you, so the page and the paper version always show the same thing. Every build opens the finished `/cv` in headless Chromium (a browser with no window), prints it with the page's own print styles, and writes `cv.pdf`; a third page, a font that did not load, or a missing Chromium stops the build. A `Download PDF` button beside your name saves the file as `Jorge-Gonzalez-Ozorno-CV.pdf`.

## Requirements

**User stories**:
- As a recruiter, I want one click to save your CV as a PDF named after you, so that I can file it and pass it on.
- As a recruiter with ten seconds, I want two pages at most with the strongest work on page one, so that I can judge fit without reading a long page.
- As screening software (the program that reads a resume before a person does), I want one column of real text under standard headings, so that nothing is lost when the file is parsed.
- As a screen reader user, I want the PDF to carry its language, its title, and real headings and lists, so that it reads the way the page does.
- As the site owner, I want the build to make the PDF from the same page, so that it can never fall behind `cv.json`, and I want the build to stop me when an edit would spill onto a third page.
- As the site owner, I want the words to sound like me, plain and direct, so that nothing reads as a template.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `src/content/cv.json` holds the content under *Content* below, value for value. `basics.summary` is the new summary. `work` holds three roles in this order: Ford `Full Stack Developer, PDPO` with its one sentence `summary` and four `highlights`, Ford `Software Engineer, IT Academy` with two `highlights` and no `summary`, and El Puerto de Liverpool with two `highlights`; there is no Daimler entry. `projects` holds four entries: `Medpal` is renamed `Medipal`, TRACSUR Tickets is `live` with `url` `https://tracsurtruckraces.com` and three `highlights`, and TRACSUR Tickets, jorgergo.dev, and Medipal set `cv: true`. `education[0]` has no `courses`. `volunteer[0]` has the two reworded `highlights`. `certificates` holds EF SET, Cloud Engineer, and CCNA. There is no `skills` key. `technologies` holds the groups `Frontend`, `Backend`, `AI`, and `Cloud & DevOps`. `interests` holds three name only entries (`Basketball (team captain, 2013 to 2018)`, `Tennis`, `Guitar`), which `formatSkillRows` gathers into the one `Interests` row. `about`, `awards`, `languages`, and every other `basics` field stay exactly as on `main`. `pnpm build` accepts the file.
- **AC-2**: In `src/lib/cv-schema.ts`, `CV_LIMITS.cvProjectsMax` becomes `3` and `CV_LIMITS` gains `projectHighlights: 3`. The `project` object gains `highlights: z.array(text(CV_LIMITS.highlight)).max(CV_LIMITS.projectHighlights).optional()`. A project whose `highlights` is defined, even as an empty list, without `cv: true` fails with one issue at `['highlights']` reading `highlights show only on the CV, so the project must set cv; see spec 0013`. The fourth project that sets `cv` fails at its `cv` with the existing message, which now reads `at most 3 projects may set cv; see spec 0010`. Vitest cases tagged `spec 0013 AC-2` cover: the caps; three flagged projects pass and a fourth fails; two and three highlights on a flagged project pass; four fail; a 221 character highlight fails; highlights on a project without `cv` fail at `highlights`, an empty list included.
- **AC-3**: The Projects section of `/cv` passes `highlights={project.highlights}` to each project's `CvEntry`, so a project with highlights renders its description and then a `ul` of one `li` per highlight inside the same `Prose` body, followed by the keywords line; a project without highlights renders as before. `/projects` renders no highlights. With today's content: Experience shows the Ford group with two roles, then El Puerto de Liverpool; Projects shows TRACSUR Tickets (linked, three bullets), jorgergo.dev (linked), then Medipal (plain text, since `projectHref` gives nothing for a private project that is not live); Certifications shows EF SET (linked), Cloud Engineer, then CCNA; Skills & interests shows six rows keyed `Frontend`, `Backend`, `AI`, `Cloud & DevOps`, `Languages`, `Interests`. Section order, ids, and heading texts stay those of specs 0005 and 0010.
- **AC-4**: The `/cv` `<header class="flex flex-col gap-2 print:gap-1">` holds two children in this order. First a row, `<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">`, holding the name block `<div class="flex flex-col gap-2 print:gap-1">` (the `h1` and the label line `<p class="text-sm text-muted">` of spec 0005 AC-2, unchanged) and then the download `Button` of AC-5. Second the `<address class="not-italic">` of AC-7. The page still has exactly one `h1`, and `dist/cv.html` still contains no `<script>`.
- **AC-5**: `Button` (`src/components/Button.astro`) takes a new optional `download?: string` and writes it onto its `<a>`; without `href` it does nothing. The CV's button is `<Button href={CV_PDF_PATH} download={cvPdfFileName(basics.name)} class="shrink-0">` holding `<Download class="size-4 shrink-0" />` and the text `Download PDF`. So its `href` is `/cv.pdf`, its `download` is `Jorge-Gonzalez-Ozorno-CV.pdf` today, its accessible name (what a screen reader announces) is `Download PDF`, it is 40px tall, and it keeps every `Button` state of spec 0003: a muted border, terracotta text and border on hover and focus, the accent ring on keyboard focus, hidden in print. A click starts a download whose suggested file name is the `download` value, and the page does not navigate.
- **AC-6**: The button sits beside the name block when the row has room for both and takes the next row when it does not, with no breakpoint class. Nothing scrolls sideways at 320px. The page test asserts only what its own measurements predict, so a valid content edit never needs a test edit. At 1280px it measures the natural widths of the `h1` text and of the label line text, and the button's width. Then at 320px, 480px, 640px, and 1280px it reads the header's width and works out whether the wider of the two texts, plus 16px, plus the button fits. When it fits, the button's right edge equals the header's right edge and its vertical centre is within 1px of the name block's. When it does not, the button's left edge equals the `h1`'s left edge and its top is at or below the name block's bottom. The label line is asserted to be one line tall only at a width where its natural width fits the room it gets in that state. Today's content fits from 526px wide, which [verify.md](verify.md) records as a manual check.
- **AC-7**: `src/lib/cv-format.ts` gains `type CvContact = { readonly href: string; readonly text: string; readonly paperOnly: boolean; readonly separator: 'always' | 'paper' | 'none' }` and the pure `formatCvContacts(basics, site)`, where `basics` is `{ email, profiles? }` and `site` is `URL | undefined`. It returns, in order: the email (`href` `mailto:` plus the address, `text` the address, `paperOnly` `false`); when `site` is defined, the site (`href` `site.href`, `text` `formatProfilePath(site.href)`, `paperOnly` `true`); then one item per profile in file order (`href` its `url`, `text` `formatProfilePath(url)`, `paperOnly` `false`). `separator` is `none` on the last item, `paper` on an item that is followed only by paper only items, and `always` otherwise. It never mutates its input. Vitest cases tagged `spec 0013 AC-7` cover: email, site, and two profiles give separators `always`, `always`, `always`, `none`; email and site with no profiles give `paper`, `none`; no site and two profiles give no paper only item; no site and no profiles give one item with `none`. `cv.astro` calls it once with `Astro.site` and renders the `<address>` list of spec 0005 AC-2 from it: each `<li>` is `class:list={[paperOnly ? 'hidden print:flex' : 'flex', 'items-center']}`, the link markup is unchanged, and the dot `<span aria-hidden="true">` is rendered unless `separator` is `none`, with `class:list={['mx-2', separator === 'paper' && 'hidden print:inline']}`. On screen the site item computes `display: none`; under print it computes `flex` and reads `jorgergo.dev`, right after the email.
- **AC-8**: Tab order on `/cv` is the skip link, then `Download PDF`, then the email, then each profile link in list order, then every body link in document order, then `← home`, and nothing else; every stop shows the 2px accent ring. Loading `/cv` requests the same resources as before (spec 0005 AC-12); `/cv.pdf` is requested only on a click.
- **AC-9**: The site has one paper scale. In the `@media print` block of `src/styles/global.css`, `@page` sets `margin: 12.7mm` (half an inch), `html` sets `font-size: 10pt`, and a new `body` rule sets `line-height: 1.45`; the paper colour tokens and the link rule stay as they are. The column `div` in `BaseLayout` gains `print:max-w-none`. Under print emulation, checked on `/missing` and on `/cv`: `html` computes `font-size` `13.3333px`, `body` computes `line-height` `19.3333px`, the stylesheet's one `@page` margin is `12.7mm`, and the column computes `max-width` `none`.
- **AC-10**: Under print emulation on `/cv`: the page wrapper's row gap is `16.6667px` (`print:gap-5` replaces `print:gap-6`); the header and the name block are `3.33333px` (`print:gap-1`); every section is `10px` (`print:gap-3` replaces `print:gap-4`); every `h2` computes `font-size` `13.3333px`, `line-height` `16.6667px`, `letter-spacing` `1.33333px`, `padding-bottom` `3.33333px`, weight `500`, uppercase, the print `accent`, and `break-after` `avoid`, from the class `border-b border-line pb-2 break-after-avoid print:pb-1 print:leading-tight` that `cv.astro` passes; every `CvEntry` root and its `Prose` body are `3.33333px` (`gap-2 print:gap-1`); a bullet list is `1.66667px` (`gap-1 print:gap-0.5`); a group's roles wrapper is `6.66667px` (`gap-4 print:gap-2`); the `KeyedList` `dl` is `3.33333px` (`gap-2 print:gap-1`). Every screen value is unchanged (56px, 8px, 24px, 8px, 4px, 16px, 8px in the same order). The break rules of spec 0005 AC-10 are unchanged.
- **AC-11**: Under print on `/cv`, the footer and the skip link are hidden as before, exactly one element under `main` computes `display: none` (the download link), and every contact `li` computes `flex`.
- **AC-12**: A new pure module `src/lib/cv-pdf.ts`, which imports nothing, exports: `CV_PDF_PATH` (`'/cv.pdf'`); `CV_PDF_MAX_PAGES` (`2`); `CV_PDF_FONTS` (`['IBMPlexMono-Regular', 'IBMPlexMono-Medium', 'IBMPlexSans-Regular'] as const`); `cvPdfFileName(name)`; `type PdfFacts`; `readPdfFacts(bytes)`; and `checkCvPdf(facts)`. `cvPdfFileName` normalises to NFD, drops combining marks, turns every other run of characters outside `A` to `Z`, `a` to `z`, and `0` to `9` into one hyphen, trims hyphens from both ends, and adds `-CV.pdf` (or returns `CV.pdf` when nothing is left): `Jorge González Ozorno` gives `Jorge-Gonzalez-Ozorno-CV.pdf`, `Ana-María O'Neil` gives `Ana-Maria-O-Neil-CV.pdf`, and `  Zoë  ` gives `Zoe-CV.pdf`. The marks it drops are the Unicode class `\p{M}`; a letter that does not decompose, such as `ø` or `ß`, becomes a hyphen. `readPdfFacts(bytes: Uint8Array)` decodes the bytes as Latin 1 and returns `{ pages, width, height, fonts, tagged, lang, title, uris }`: `pages` counts `/Type /Page` not followed by a letter; `width` and `height` come from the first `/MediaBox [0 0 w h]`; `fonts` is the sorted, unique list of `/BaseFont` names with any six capital letter prefix and its `+` removed; `tagged` is `true` when the bytes hold `/Marked true` and a `/StructTreeRoot` reference; `lang` is the first `/Lang (…)` value; `title` is the first `/Title`, decoded as UTF-16BE when written as a hex string that starts with `FEFF`, or read as a literal string with `\\`, `\(`, and `\)` unescaped (the first `/Title` is the document's, since the outline is off); `uris` lists every `/URI (…)` value in file order. `checkCvPdf(facts)` returns the first problem as a string, or `undefined`: `cv.pdf has no pages; see spec 0013`; `` `cv.pdf has ${pages} pages, over the cap of ${CV_PDF_MAX_PAGES}; shorten src/content/cv.json; see spec 0013` ``; `` `cv.pdf embeds ${fonts or 'no fonts'}, expected ${CV_PDF_FONTS sorted}; a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013` `` (font lists joined by `, `) when the font sets differ; `cv.pdf is not tagged; see spec 0013`. Vitest cases tagged `spec 0013 AC-12` cover every branch with small hand written byte strings, both title forms, and the three file names.
- **AC-13**: A new module `src/lib/render-pdf.ts`, the only one that launches a browser, exports `cvPdf(): AstroIntegration` named `cv-pdf` with one hook, `astro:build:done`. The hook: imports `chromium` from `@playwright/test` inside the hook (a dynamic import); launches it with `args: ['--font-render-hinting=none']`; opens one page; answers every request itself from the build folder (`page.route('**/*', …)`: for a request to the origin `http://cv.localhost` it takes the decoded path, adds `.html` when the path has no extension, resolves it under `dir` with `fileURLToPath(new URL(…, dir))`, and calls `route.fulfill({ path })` when `existsSync` finds the file, so Playwright sets the content type from the extension, or `route.fulfill({ status: 404 })` when it does not; a request to any other origin gets `route.abort()`); goes to `http://cv.localhost/cv` and requires status 200; waits for `document.fonts.ready`; calls `page.pdf({ format: 'Letter', tagged: true })`; runs `checkCvPdf(readPdfFacts(pdf))`; writes the bytes to `new URL(CV_PDF_PATH.slice(1), dir)`; logs `` `cv.pdf: ${pages} pages, ${kB} kB` `` through the hook's `logger.info`; and closes the browser in every case. `astro.config.mjs` imports it as `./src/lib/render-pdf.ts` and registers `integrations: [devStyleguide, cvPdf()]`. `render-pdf.ts` imports `cv-pdf.ts` by relative path with its extension and uses no `@/` alias, because the config is loaded outside Vite. For the same reason both new modules use erasable TypeScript only (types and `as const`; no enum, namespace, or parameter property): Node loads them directly when it loads the config. Under `astro dev` and `astro check` the hook never runs and Playwright is never loaded.
- **AC-14**: After `pnpm build`, `dist/cv.pdf` exists and `readPdfFacts` reads from it: `pages` at least 1 and at most 2 (2 today); `width` 612 and `height` 792 (Letter, in points); `fonts` equal to `CV_PDF_FONTS` sorted; `tagged` `true`; `lang` `en`; `title` equal to the `<title>` of `/cv` (`CV · Jorge González Ozorno` today); and `uris` containing `mailto:` plus the email, `site.href`, and every profile `url` as the browser writes it (`new URL(url).href`).
- **AC-15**: The build fails loudly, with a failing exit code and no `dist/cv.pdf`, in each of these cases, and the message names the cause: `checkCvPdf` returns a problem (the hook throws it); Chromium cannot launch (the hook throws ``cv.pdf needs Chromium: run `pnpm exec playwright install chromium` (on Linux add --with-deps); see spec 0013`` with the launch error as its `cause`); `/cv` does not answer 200 from the build folder (`cv.pdf: dist/cv.html did not load; see spec 0013`).
- **AC-16**: A build inside the Linux Playwright image (`mcr.microsoft.com/playwright:v1.63.0-noble`) and a build on macOS give PDFs with the same page count and the same lines of text on each page. The first CI run on the branch logs `cv.pdf: 2 pages`.
- **AC-17**: `public/_headers` gains a block `/cv.pdf` with one header, `X-Robots-Tag: noindex`. Served by wrangler, `/cv.pdf` answers 200 with `content-type: application/pdf`, that header, every header of the `/*` block, no `immutable` in its cache header, and the exact bytes of `dist/cv.pdf`. The page test reads that file through a new `distBytes(name): Uint8Array` in `e2e/helpers.ts`, since `distFile` decodes as text.
- **AC-18**: `.github/scripts/smoke.sh` gains three things. Right after its check for the `/*` and `/_astro/*` blocks it reads `pdf_headers=$(block '/cv.pdf')` and, in an `if` of its own, exits 1 with `no /cv.pdf block in $dist/_headers` on stderr when that is empty. A new `check_pdf` passes when the first line of the fetched body starts with `%PDF-` (`LC_ALL=C sed -n '1{p;q;}' "$tmp/body" | grep -q '^%PDF-'`) and otherwise calls `miss "$1 body" 'a PDF' 'something else'`. And `check_pages`, right after the `/cv` page line, fetches `$origin/cv.pdf` and runs, each with `|| return 1`: `check_status /cv.pdf 200`, `check_pdf /cv.pdf`, `check_headers /cv.pdf "$all_headers"`, `check_headers /cv.pdf "$pdf_headers"`, `check_header /cv.pdf 'content-type: application/pdf'`, `check_not_immutable /cv.pdf`. The script does not compare the PDF's bytes and does not read `dist/cv.pdf`, so `SMOKE_FILES` in `e2e/helpers.ts` stays as it is; the script's opening comment says in one sentence that the PDF is checked by headers and signature. Page tests tagged `spec 0013 AC-18`, modelled on the existing smoke cases: `smoke.sh pages` passes against the local server; a scratch `_headers` whose `/cv.pdf` block asks for `X-Robots-Tag: noindex, nofollow` fails all ten attempts with `/cv.pdf header expected X-Robots-Tag: noindex, nofollow got x-robots-tag: noindex`; a scratch `_headers` without the block exits at once with code 1, an empty stdout, and the stderr `no /cv.pdf block in dist/_headers\n`.
- **AC-19**: In `.github/workflows/ci.yml` the step `pnpm exec playwright install --with-deps chromium` runs before `pnpm build` in the `check` job; no other step moves and the `deploy` job is unchanged.
- **AC-20**: `design.md` gets these edits and no others. The spacing table: `gap-14` names `print:gap-5` on the CV page wrapper; `gap-6` names `print:gap-3` on a CV section; `gap-4` adds `print:gap-2` between roles; `gap-2` adds `print:gap-1` on a `CvEntry`, its body, the keyed rows, and the CV header; `gap-1` adds `print:gap-0.5` between bullets; `pb-2` adds `print:pb-1` on the CV. The `SectionHeading` bullet gives the document page class as `border-b border-line pb-2 break-after-avoid print:pb-1 print:leading-tight` and says the heading tightens on paper. The `Button` bullet says it takes `download` and may hold one icon before its label. The Icons bullet says `size-4` is for the trailing arrow and for an icon inside a `Button`. The *Print* section's first paragraph states 12.7mm, 10pt, a body line height of 1.45, and that the column drops its max width; its second paragraph states the CV's new gaps and heading classes, replaces `nothing else on the page is hidden, and the page ships no script and no print button` with the download button hidden like every `Button`, the site added to the contact line on paper only, and still no script, and replaces `the PDF spec reuses it` with the build printing `/cv` to `cv.pdf` from this layer (spec 0013). The responsive section says the CV header row wraps by fit. The component count stays eleven. `README.md`, under *Run it*, says that `pnpm build` also prints the CV to `dist/cv.pdf` with headless Chromium and needs `pnpm exec playwright install chromium` once. `/styleguide` shows one more `Button` after the two it has, in both panels: `<Button href={CV_PDF_PATH} download="Example-CV.pdf">` holding `<Download class="size-4 shrink-0" />` and the text `Download PDF`. `e2e/styleguide.spec.ts` checks that its icon is 16px square and that its `download` attribute is `Example-CV.pdf`, and the existing print case counts it among the hidden buttons.
- **AC-21**: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass. The eleven page tests, one style guide test, and two unit tests listed under *Critical test scenarios* are edited as that table says; every other existing test passes unchanged. New page cases are tagged `spec 0013`, compare class lists as sets, and derive their expectations from `cv.json`, `site`, and the helpers (`formatCvContacts`, `cvPdfFileName`, `readPdfFacts`, `pageMeta`), so a valid content edit needs no test edit. The build edits no file under `docs/specs/`: the notes in the older specs were written together with this spec. Manual steps live in [verify.md](verify.md).

## Decision

**Chosen option**: Option 1: curate `cv.json` itself, give the site one compact paper layout, and let the build print `/cv` to `cv.pdf` with the Chromium that Playwright already installs.

The page, a browser print, and the downloaded file are one document from one source, and the build refuses to ship a PDF that is longer than two Letter pages (basis: spec 0002's one source rule and the project's habit of failing the build on bad content).

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `wrangler` (`cloudflare/skills`, `.claude/skills/wrangler/`)

Your picks in the interview: two pages at most, enforced by the build; Letter; the CV itself is curated, so page and PDF always match (you dropped the web only flag you first chose); a full stack role with an AI focus as the target; a research pass on today's resume standards, with links; History as its own feature, with the removed entries kept word for word in [rationale.md](rationale.md); TRACSUR Tickets, jorgergo.dev, and Medipal on the CV, TRACSUR with bullets under its line and the other two as one line each; projects framed as projects, not as jobs; a first person summary that greets rather than lists achievements, in your own shape; the fifth Ford bullet leaves to make room for Medipal; CCNA stays; the spelling Medipal; saying plainly that TRACSUR and this site were built with AI coding agents from your specs; Chromium prints the page; a failed PDF step fails the build everywhere; 10pt; the button at the top right of the header, as the bordered `Button` with the icon and `Download PDF`; a click saves the file under your name; the PDF is not listed by search engines; `jorgergo.dev` in the contact line on paper only; tests read the PDF bytes by hand, with no new dependency; and, after the cross check, a deploy check that reads the PDF's headers and signature and not its bytes.

After you accepted the spec you sent your numbers and picked how they read. Ford's first line names the Portal's team of 95 and the more than 7,000 people who use the Knowledge Base. TRACSUR gains a third bullet with its first week on sale (more than 200,000 page views and 5,000 tickets), dated as the first week so it stays true when the totals grow. Medipal carries no number while it has three users. The two new lines move Medipal to the top of page two, which you saw in the picture before you confirmed.

Settled while writing (each with the runner up):

- **The PDF is the browser print of the page, so there is one paper layout.** The compact layout lives in the site's print styles; `Cmd+P` in Chrome and the download give the same two pages. Runner up: a stylesheet only the build injects, which leaves two paper looks to test and lets them drift (basis: design.md, "The CV page builds on this layer, and the PDF spec reuses it").
- **The step is an Astro integration on `astro:build:done`, not a script after the build.** Every `astro build` then leaves a complete `dist/`: `pnpm build`, the Playwright web server's own build, and CI, with no command to repeat in three places. Runner up: `node scripts/cv-pdf.mjs` chained in `package.json`, which the Playwright config and CI would each have to copy (basis: the Astro integration reference, `astro:build:done` receives `dir` and `logger`; `playwright.config.ts` builds with the bare `astro build`).
- **Chromium gets the built files through request interception, with no server and no port.** `page.route` serves `dist/` under a made up origin and aborts everything else, so the print can never touch the network or clash with a port in use. Runner up: `wrangler dev` or a Node server on a port, slower and one more thing to tear down.
- **`--font-render-hinting=none` on launch.** Without it the Linux image breaks 8 to 134 lines differently from macOS; with it, none (781 words, at most 0.15pt apart). The flag is what makes the CI built file the one you see locally. Runner up: no flag and a cap test alone, which lets a third page appear only in CI (basis: the measurements in [rationale.md](rationale.md)).
- **`tagged: true` and no outline.** Tags give the PDF its language, headings, lists, and links for assistive tech. The outline (bookmarks) joined two words of a wrapped heading into one (`ProfessionalCertificate`), and two pages need no bookmarks. Runner up: `outline: true` (basis: WCAG 2.2 AA as the project's baseline; the measured PDF facts).
- **Playwright is imported inside the hook.** `astro dev`, `astro check`, Vitest, and the page tests that load `astro.config.mjs` never pay for it. Runner up: a top level import.
- **Pure rules in `cv-pdf.ts`, the browser in `render-pdf.ts`.** The same split as `share-card.ts` and `render-image.ts`: checks return a message or `undefined`, and only the hook throws, as the card endpoints do. Runner up: one module, untestable without a browser (basis: `AGENTS.md`, expected failures return explicit results; spec 0006).
- **Exactly three fonts, checked by name.** Chromium falls back to a system face without complaint when a font file fails to load, and the page would still print. The check turns that into a build error, and also flags a fourth face arriving unannounced. Runner up: check the page count alone.
- **One paper scale for the whole site, in `global.css`.** `@page` cannot be scoped to one page without named pages, and a second root size would need a new theme token; the other pages are a few lines each and rarely printed. Runner up: a CV only scale through a `text-paper` token and a named page (basis: spec 0003 AC-11, amended here).
- **Every page drops the column's max width on paper**, one class in `BaseLayout` and no new prop. Paper is not a 640px screen. Runner up: a `printColumn` prop that only `/cv` passes.
- **Half inch margins and line height 1.45.** The long certificate title and the Languages row each fit one line only at this width, and 1.45 keeps Plex Sans comfortable at 10pt with about two spare lines on each page. Runner up: 15mm margins, which wrap both of those lines and leave 4pt spare (basis: the what if table in [rationale.md](rationale.md)).
- **The CV's headings tighten on paper** (`print:leading-tight print:pb-1`), which amends spec 0012's rule that the heading carries no print variant. It saves 8px on each of eight headings, and that is where the two spare lines on each page come from. Runner up: leave the 1.6 line height on paper, which fills page two to within 3pt (basis: spec 0012 AC-4, amended here; the what if table in [rationale.md](rationale.md)).
- **The header row wraps by fit, not at a breakpoint.** A switch at `xs` made the label line wrap between 480 and 525px; a wrapping flex row keeps the label whole at every width and adapts to a longer label. Runner up: `xs:flex-row`, the design system's usual switch.
- **An icon inside a `Button` is `size-4`**, 16px beside 14px text. Runner up: `size-5`, the size `IconLink` uses beside 16px text.
- **The address is fixed at `/cv.pdf` and the person's name rides on the `download` attribute.** `_headers`, `smoke.sh`, and the tests need a path that does not change when a name does, and `jorgergo.dev/cv.pdf` is easy to share and opens in the browser. Runner up: the name in the URL. No `Content-Disposition` header: it would force a download on the shareable address too.
- **The site link on paper comes from `site`, not from a new content field.** Every absolute URL already derives from `site` (spec 0006). Its dot follows the trailing separator rule of spec 0005, with a `paper` state so a CV with no profiles never shows a dangling dot on screen. Runner up: a `basics.url` field.
- **Bullets on a project need `cv: true`, at most three.** They show on the CV only, so on any other project they would be data that renders nowhere. Runner up: bullets on every project and on `/projects` too, a redesign of spec 0010's row.
- **`X-Robots-Tag: noindex` alone**, with no `nofollow`: the links inside the PDF are yours.
- **The deploy check does not compare the PDF's bytes.** Chromium stamps the time into every file, and macOS and Linux embed slightly different font data, so a local build can never equal the live PDF, and the documented manual check (`pnpm build`, then `smoke.sh pages` against the live site) would fail on it every time. The script checks that `/cv.pdf` answers 200 as a PDF with the right headers; the byte for byte check of the pages already proves which build is live. Runner up: exact bytes, with the manual check moved to the deploying run's `dist` artifact, kept 7 days (basis: spec 0007's manual check; the measured files in [rationale.md](rationale.md)).
- **The PDF's title is the page's title, and it has no author field.** Chromium writes the title and nothing else; an author would need a PDF library to rewrite the file. Runner up: `pdf-lib` as a build dependency for one metadata field.
- **The section stays `Skills & interests`**, since one Interests row stays, and screening software matches on the word Skills (basis: the research notes in [rationale.md](rationale.md)).
- **TRACSUR Tickets turns `live` in this change.** The sale opened on 2026-09-28; this is the content edit scope item 16 was waiting for, so that item folds into this feature.

## Rationale

Reasoning, the options weighed, every measurement, the research, and the exact entries that left the CV: see [rationale.md](rationale.md).

## Feature design

### Design source

`design.md` and spec 0003's components. The bordered `Button` and the `Download` icon have shipped since spec 0003 and were waiting for this page. You chose the placement and the label from mock ups in the interview, and a working prototype (built in a scratch copy, never in the repo) confirmed the layout at 320, 480, 526, 640, and 768px in light and dark. No outside design file.

### Page composition

The header, from 526px wide with today's content (the button is centred on the name block):

```
Jorge González Ozorno                          ┌──────────────────┐
Full Stack Developer · Toluca, Mexico          │ ↓  Download PDF  │
                                               └──────────────────┘
jorgergo@icloud.com · github.com/jorgergo · linkedin.com/in/jorgergo
```

Narrower than that, in reading order and Tab order:

```
Jorge González Ozorno
Full Stack Developer · Toluca, Mexico
┌──────────────────┐
│ ↓  Download PDF  │
└──────────────────┘
jorgergo@icloud.com · github.com/jorgergo ·
linkedin.com/in/jorgergo
```

On paper the button is gone and the contact line reads `jorgergo@icloud.com · jorgergo.dev · github.com/jorgergo · linkedin.com/in/jorgergo`.

The two Letter pages today (10pt, half inch margins, full width):

| Page | Holds | Filled |
|---|---|---|
| 1 | Header, Summary, Experience (Ford with two roles, El Puerto de Liverpool), Projects (TRACSUR Tickets, jorgergo.dev) | 96% |
| 2 | Medipal (the last project), Education, Leadership & activities, Awards, Certifications, Skills & interests | 95% |

Each page has room for about two more lines. Medipal opens page two, with the `PROJECTS` heading back on page one: your numbers added two lines to page one, and an entry never splits, so the last project moved whole. A third extra line on either page makes a third page, and the build stops.

### Content

`basics.summary` becomes:

> Full stack developer. I'm a computer science and technology engineer who builds things for the web, from scratch and all the way to the cloud. I bring problem solving, creativity, and clear communication to every project, and I'm quick to pick up whatever it needs next. Lately that has meant a lot of AI.

These keys of `main` are replaced whole; the `skills` key is deleted; everything else in the file stays as it is.

```json
{
  "projects": [
    {
      "name": "TRACSUR Tickets",
      "description": "Ticket sales and gate check in for a trailer drag race in Yucatán, paid by card, OXXO, or bank transfer.",
      "startDate": "2026-09",
      "status": "live",
      "url": "https://tracsurtruckraces.com",
      "source": "private",
      "keywords": ["Next.js", "PostgreSQL", "Cloud Run", "Cloudflare", "Mercado Pago"],
      "cv": true,
      "highlights": [
        "Built alone in three weeks, from first commit to open sale, with AI coding agents and specs I write and review.",
        "In its first week on sale it passed 200,000 page views and sold 5,000 tickets.",
        "Payments run through Mercado Pago, and each ticket is a QR code signed with Ed25519 that gets in exactly once."
      ]
    },
    {
      "name": "jorgergo.dev",
      "description": "My site and CV, built with AI coding agents from specs I write and review. A failed check rolls the deploy back.",
      "startDate": "2026-09",
      "status": "live",
      "url": "https://jorgergo.dev",
      "source": "https://github.com/jorgergo/portfolio",
      "keywords": ["Astro", "TypeScript", "Tailwind CSS", "Cloudflare"],
      "cv": true
    },
    {
      "name": "FinTech AI",
      "description": "A personal finance tool for a retirement portfolio, card utilization, and Mexican tax deductions.",
      "startDate": "2026-05",
      "status": "building",
      "source": "https://github.com/jorgergo/fintech",
      "keywords": ["Next.js", "Prisma", "SQLite", "Recharts"]
    },
    {
      "name": "Medipal",
      "description": "An app for independent doctors in Mexico, built with a partner: agenda, notes, prescriptions, WhatsApp reminders.",
      "startDate": "2026-03",
      "status": "building",
      "source": "private",
      "keywords": ["Flutter", "TypeScript", "Fastify", "PostgreSQL", "Google Cloud"],
      "cv": true
    }
  ],
  "work": [
    {
      "name": "Ford Motor Company",
      "position": "Full Stack Developer, PDPO",
      "url": "https://www.ford.com",
      "location": "Remote",
      "startDate": "2025-08",
      "summary": "I own two internal sites for the teams that use 3DEXPERIENCE at Ford: the PDPO Portal, used by a team of 95, and the Knowledge Base, used by more than 7,000 people all over the world.",
      "highlights": [
        "Built an AI assistant that answers from our own docs (a RAG agent on Google ADK and Vertex AI) and took it to production. Both sites use it now, and other teams plan to reuse it.",
        "Rebuilt the Portal from old HTML pages into a Next.js and Spring Boot app, with team directories read live from LDAP and a health dashboard for 3 environments on Elastic Synthetics.",
        "Moved the Knowledge Base from MkDocs to Zensical and added a FastAPI backend, which turned a static site into an app with sign in, sessions, and its own APIs.",
        "Automated versioning and releases for both apps with GitHub Actions: 5 monthly and 3 patch releases so far, none with a version number or release note written by hand."
      ]
    },
    {
      "name": "Ford Motor Company",
      "position": "Software Engineer, IT Academy",
      "url": "https://www.ford.com",
      "location": "Mexico City, Mexico",
      "startDate": "2025-01",
      "endDate": "2025-07",
      "highlights": [
        "Moved old finance tools from shell and SQL scripts to Google Cloud, rebuilt with Spring Boot and Angular.",
        "Kept quality and security in check with Tekton, SonarQube, and FOSSA, from tests to approval to production."
      ]
    },
    {
      "name": "El Puerto de Liverpool",
      "position": "Process Automation Intern",
      "location": "Mexico City, Mexico",
      "startDate": "2023-05",
      "endDate": "2024-03",
      "highlights": [
        "Built UiPath and Visual Basic robots for finance processes that cut processing time by up to 60%.",
        "Automated data extraction from SAP ECC and S/4HANA and the Excel work that came after it."
      ]
    }
  ],
  "volunteer": [
    {
      "organization": "Ford Operation Good Cheer",
      "position": "Frontend Lead",
      "startDate": "2025-10",
      "endDate": "2025-12",
      "highlights": [
        "Led the React and Tailwind rebuild of the gift drive app, with QR scanning that tracked 1,341 gifts for 450 children.",
        "Wrote a Python script that pulls children's wishlists out of PDFs, so volunteers no longer type them in by hand."
      ]
    }
  ],
  "education": [
    {
      "institution": "Tecnológico de Monterrey",
      "studyType": "B.S.",
      "area": "Computer Science and Technology",
      "url": "https://tec.mx",
      "location": "Toluca, Mexico",
      "startDate": "2020-08",
      "endDate": "2024-06",
      "score": "GPA 4.0/4.0 (97/100)"
    }
  ],
  "certificates": [
    {
      "name": "EF SET English Certificate, C2 Proficient (73/100)",
      "issuer": "EF SET",
      "date": "2026-01",
      "url": "https://cert.efset.org/es/yY3TfP"
    },
    {
      "name": "Preparing for Google Cloud Certification: Cloud Engineer Professional Certificate",
      "issuer": "Google Cloud, Coursera",
      "date": "2025-12"
    },
    {
      "name": "CCNA: Enterprise Networking, Security, and Automation",
      "issuer": "Cisco Networking Academy",
      "date": "2024-06"
    }
  ],
  "technologies": [
    {
      "name": "Frontend",
      "keywords": ["TypeScript", "JavaScript", "React", "Next.js", "Angular", "Tailwind CSS"]
    },
    {
      "name": "Backend",
      "keywords": ["Python", "FastAPI", "Java", "Spring Boot", "Node.js", "PostgreSQL", "SQL"]
    },
    {
      "name": "AI",
      "keywords": ["RAG", "Google ADK", "Vertex AI", "AI coding agents (Claude Code)"]
    },
    {
      "name": "Cloud & DevOps",
      "keywords": ["Google Cloud", "Cloud Run", "Cloudflare", "Docker", "GitHub Actions"]
    }
  ],
  "interests": [
    { "name": "Basketball (team captain, 2013 to 2018)" },
    { "name": "Tennis" },
    { "name": "Guitar" }
  ]
}
```

Run `pnpm format` after the edit; Prettier decides how the short arrays wrap. The three interests carry a name and no keywords on purpose: `formatSkillRows` gathers name only entries into the one `Interests` row, so no group can ever share that key.

### Data model sketch

One file, `src/content/cv.json`, one strict schema. The schema moves in two places only:

| Field | Type | Required | Rule | Shown |
|---|---|---|---|---|
| `projects[].highlights` | `string[]` | optional | at most 3 (`CV_LIMITS.projectHighlights`), each at most 220 characters (`CV_LIMITS.highlight`); only on a project with `cv: true` | the CV's Projects section, never `/projects` |
| `CV_LIMITS.cvProjectsMax` | number | | `2` becomes `3` | at most three projects on the CV |

No other field, type, or cap changes. There is no flag that hides an entry on paper: what `cv.json` holds for the CV is what the page and the PDF both show.

### State transitions

None in the site; it is static. The build step has one path: build the pages, print `/cv`, check the bytes, then either write `dist/cv.pdf` and log, or throw and fail the build with nothing written.

### API surface

Build time components, functions, and files; the only HTTP surface is one static file.

| Piece (where) | Signature or shape | Does | Errors |
|---|---|---|---|
| `GET /cv.pdf` (static, `dist/cv.pdf`) | no input | 200, `application/pdf`, the `/*` headers plus `X-Robots-Tag: noindex`, default revalidating cache | 404 only if a build shipped without it, which AC-15 and `smoke.sh` prevent |
| `cvPdf` (`src/lib/render-pdf.ts`) | `() => AstroIntegration` | the `astro:build:done` hook of AC-13 | throws the messages of AC-15; the build fails |
| `CV_PDF_PATH`, `CV_PDF_MAX_PAGES`, `CV_PDF_FONTS` (`src/lib/cv-pdf.ts`) | `'/cv.pdf'`, `2`, the three font names | the address, the cap, the faces the page uses | n/a |
| `cvPdfFileName` (`src/lib/cv-pdf.ts`) | `(name: string) => string` | the saved file name of AC-12 | none; returns `CV.pdf` when the name has no letters or digits |
| `readPdfFacts` (`src/lib/cv-pdf.ts`) | `(bytes: Uint8Array) => PdfFacts`, where `PdfFacts` is `{ readonly pages: number; readonly width: number \| undefined; readonly height: number \| undefined; readonly fonts: readonly string[]; readonly tagged: boolean; readonly lang: string \| undefined; readonly title: string \| undefined; readonly uris: readonly string[] }` | reads the facts of AC-12 from Chromium's plain text dictionaries | none; a value that is not there is `0`, `undefined`, `false`, or `[]` |
| `checkCvPdf` (`src/lib/cv-pdf.ts`) | `(facts: PdfFacts) => string \| undefined` | the first problem of AC-12, or `undefined` | none; it returns, the hook throws |
| `formatCvContacts` (`src/lib/cv-format.ts`) | `(basics: { readonly email: string; readonly profiles?: readonly { readonly url: string }[] \| undefined }, site: URL \| undefined) => readonly CvContact[]` | the contact items of AC-7 | none; never mutates |
| `Button` (`src/components/Button.astro`) | existing props plus `download?: string` | writes `download` onto the `<a>` | n/a |
| `BaseLayout` (`src/layouts/BaseLayout.astro`) | no new prop | the column gains `print:max-w-none` | n/a |
| `CvEntry`, `KeyedList` (`src/components/`) | no new prop | the paper gap classes of AC-10 | n/a |
| `/cv` (`src/pages/cv.astro`) | still one `getCv()` call; imports `CV_PDF_PATH` and `cvPdfFileName` from `@/lib/cv-pdf`, `Button`, and the `Download` icon | the header of AC-4, contacts from `formatCvContacts(basics, Astro.site)`, project highlights, the paper classes | the `getCv()` throw of spec 0002 |
| `project` schema (`src/lib/cv-schema.ts`) | `highlights?`, `cvProjectsMax: 3`, `projectHighlights: 3` | AC-2 | schema issues fail the build |
| `smoke.sh` (`.github/scripts/`) | `pdf_headers`, `check_pdf`, and six lines in `check_pages` | AC-18: status, signature, headers, type, cache; no byte comparison | a mismatch fails the deploy and rolls it back |
| `distBytes` (`e2e/helpers.ts`) | `(name: string) => Uint8Array` | one built file as bytes, by its path under `dist/` | throws when the file is missing, as `distFile` does |

`cv.astro` holds no contact rule of its own after this change: the list, the paper only item, and the separator states all come from the helper.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render `/cv` | the button's `href` | `CV_PDF_PATH` in `cv-pdf.ts` |
| Render `/cv` | the button's `download` | `cvPdfFileName(basics.name)` |
| Render `/cv` | the button's label and icon | the literal `Download PDF` and the `Download` icon, in `cv.astro` |
| Render `/cv` | the contact items, their order, and which one is paper only | `formatCvContacts(basics, Astro.site)` |
| Render `/cv` | the paper only item's text and link | `site` in `astro.config.mjs`, through `formatProfilePath(site.href)` and `site.href` |
| Render `/cv` | whether a dot follows an item, and in which medium | `separator` from `formatCvContacts` |
| Render `/cv` | a project's bullets | `projects[].highlights` in `cv.json` |
| Render `/cv` | every other line of the CV | `cv.json` through the helpers of specs 0002, 0005, and 0010, unchanged |
| Print (any page) | margin, root size, body line height | the `@media print` block of `global.css` (AC-9) |
| Print `/cv` | gaps and heading leading | the `print:` classes of AC-10 |
| Build the PDF | which page is printed | the literal path `/cv` in `render-pdf.ts`, answered from `dir` (the hook's build folder) |
| Build the PDF | paper size | the literal `Letter` in `render-pdf.ts` |
| Build the PDF | the browser | Chromium from `@playwright/test`, installed by `pnpm exec playwright install chromium` |
| Build the PDF | the title inside the file | the `<title>` of `/cv`, from `pageMeta('cv', …)` (spec 0006) |
| Build the PDF | the language inside the file | `<html lang="en">` in `BaseLayout` |
| Build the PDF | the tags | the page's own HTML (headings, lists, links), through `tagged: true` |
| Check the PDF | the page cap | `CV_PDF_MAX_PAGES` |
| Check the PDF | the expected fonts | `CV_PDF_FONTS`: the three faces `/cv` loads (Mono 400, Mono 500, Sans 400, spec 0005 AC-12) |
| Write the PDF | the output path | `cv.pdf` under `dir`, the same name as `CV_PDF_PATH` |
| Log | page count and size | `readPdfFacts(pdf).pages` and the byte length divided by 1024, rounded to a whole number |
| Serve `/cv.pdf` | `X-Robots-Tag` | the `/cv.pdf` block of `public/_headers` |
| Serve `/cv.pdf` | content type and cache | Cloudflare's static assets defaults, checked by `smoke.sh` |
| Smoke check | what the live PDF must be | status 200, the PDF content type, the headers of the `/*` and `/cv.pdf` blocks of `dist/_headers`, and a first line that starts `%PDF-`; its bytes are not compared |

### Key invariants

- The PDF is printed from the same built `cv.html` the site serves. Between screen and paper only four things differ: the button is hidden, the site item is shown, and the footer and skip link are hidden.
- `cv.json` has no field that hides an entry on paper. What the page shows, the PDF shows.
- After every successful build `dist/cv.pdf` exists, has one or two Letter pages, is tagged, and embeds exactly the three Plex faces. No build can ship a site whose button points at nothing.
- A build without Chromium fails. The hook reads files under `dist/` only and aborts every request to another origin.
- `/cv` still ships no `<script>`; the download is a plain link with a `download` attribute.
- A project has `highlights` only when it sets `cv: true`, and at most three projects set it.
- The site has one paper scale; a page tightens its own gaps with `print:` utilities from Tailwind's scale, never with an arbitrary value.
- Tab order equals reading order at every width: the button comes right after the name block in the markup.
- The contact list holds links only, and no visible dot is ever followed by nothing.
- Checks that can fail return a message; only the build hook throws.

### Security model

A public static file with no input. The PDF holds what `/cv` already publishes (the email is public on four pages; the schema carries no phone or address), has no script, and is served with the same `nosniff`, referrer, permissions, transport, and frame headers as every page, plus `noindex`. The build step runs a headless browser against local files only: requests to any other origin are aborted, so a stray URL in content cannot make the build call out. No secret, no new origin in the CSP, no script added, nothing to authorise.

### Configuration required

No environment variable and no secret. Two prerequisites: Chromium must be installed where the build runs (`pnpm exec playwright install chromium` once on a machine, already needed for the page tests), and CI installs it one step earlier (AC-19). No new dependency: `@playwright/test` is already a dev dependency.

### Critical test scenarios

`site.spec` and `styleguide.spec` are the Playwright files in `e2e/`; Vitest runs beside the helpers; `verify` is a manual step in [verify.md](verify.md).

- Happy path (`site.spec`, new `cv pdf` block): after the build, `dist/cv.pdf` gives the facts of AC-14 through `readPdfFacts`; `/cv.pdf` answers with the status, type, headers, and bytes of AC-17 (the file read with `distBytes`); the button has the `href`, the `download`, and the name of AC-5, and a click raises a download whose suggested file name is `cvPdfFileName(basics.name)`, verifies **AC-5**, **AC-13**, **AC-14**, **AC-17**.
- Content and schema (Vitest, and the build): the cases of AC-2; the live `cv.json` parses; the Projects section shows three bullets under TRACSUR Tickets and none under the other two, verifies **AC-1**, **AC-2**, **AC-3**.
- Header and fit (`site.spec`): the header's two children, the row's two children, and at 320px, 480px, 640px, and 1280px the state the measured widths predict (stacked or beside), with no sideways scroll, verifies **AC-4**, **AC-6**.
- Contacts (Vitest and `site.spec`): the four `formatCvContacts` cases; a dot exists when `separator` is not `none`, shows on screen only when it is `always` on an item that is not paper only, and shows on paper whenever it exists; on screen the site item is `display: none`; under print all items are `flex` and the second reads `formatProfilePath(site.href)`, verifies **AC-7**, **AC-11**.
- Keyboard and network (`site.spec`): `CV_STOPS` gains `a "Download PDF"` after the skip link; loading `/cv` requests no PDF, verifies **AC-8**.
- Paper (`site.spec` under print emulation): the site values of AC-9 on `/missing`, the CV values of AC-10, one hidden element under `main`, verifies **AC-9**, **AC-10**, **AC-11**.
- Pure PDF rules (Vitest): `cvPdfFileName`, `readPdfFacts` on hand written bytes (two pages, a hex title, a literal title, subset font names, tags present and absent, two URIs), every `checkCvPdf` branch, verifies **AC-12**.
- Failure cases (`verify` break steps, backed by the Vitest branches): a temporary `11pt` root in the print block forces a third page, which stops `pnpm build` with the page message and leaves no `dist/cv.pdf`; `PLAYWRIGHT_BROWSERS_PATH` set to an empty folder stops it with the Chromium message; a wrong name in `CV_PDF_FONTS` stops it with the font message, verifies **AC-15**.
- Same file on both systems (`verify`): the Linux image build and the macOS build have equal page counts and equal text lines, verifies **AC-16**.
- Deploy gate (`site.spec` smoke cases and `verify`): `smoke.sh pages` passes against the local server, fails all ten attempts on a scratch `_headers` that asks for a different `X-Robots-Tag`, and exits at once when the block is missing, verifies **AC-18**.
- Style guide (`styleguide.spec`): the new `Button` specimen's icon is 16px square, its `download` attribute is `Example-CV.pdf`, and the print case counts it among the hidden buttons, verifies **AC-20**.
- Auth and permission: not applicable; the site has no users.

Forced edits to existing tests, found by running both suites against the prototype (268 of 279 page tests and 435 of 437 unit tests passed untouched; the style guide suite passed whole, before its new specimen):

| Test (file, name) | Why it fails | Edit |
|---|---|---|
| `site.spec` · `/cv › Tab follows the visual order` | one new stop | `CV_STOPS` gains `a "Download PDF"` after the skip link |
| `site.spec` · `print › sets the root size to 11pt and an 18mm page margin` | paper scale | expect `13.3333px` and `12.7mm`, add the body line height and the column's `max-width`; rename |
| `site.spec` · `cv page › the header holds the name, the label line, and the contact links` | header shape, one more `li` | two header children, the row's two children, the label line inside the name block, contacts from `formatCvContacts` with the site item `display: none`; a dot is expected where `separator` is not `none` and is visible on screen only where it is `always` on an item that is not paper only |
| `site.spec` · `cv page › a contact link turns accent-warm on hover and shows the ring on keyboard focus` | reaches the link with two Tabs | three Tabs, or focus the link directly |
| `site.spec` · `cv page › a contact link turns accent-warm on keyboard focus alone` | the same | the same |
| `site.spec` · `cv page › the projects section lists each flagged project` | it expects no `ul` in the section, and a project with highlights now has one inside its `Prose` body | per project, count the `ul` from the fixture (1 when it has highlights, else 0) and read its items only when it exists; the entry's children stay `DIV`, `DIV`, `P` |
| `site.spec` · `cv page › at 320px every contact item wraps whole` | walks the hidden `li` | walk the visible items only, and measure a dot only when it is visible |
| `site.spec` · `cv page › under prefers-contrast: more the muted label line turns ink` | the label line moved one level down | locate it inside the name block |
| `site.spec` · `cv page › print › hides the footer and the skip link, and nothing else` | the button is hidden too | expect exactly one hidden element under `main`, the download link; rename |
| `site.spec` · `cv page › print › tightens the gaps to 1.5rem and 1rem at the 11pt root` | paper values | the values of AC-10; rename |
| `site.spec` · `cv page › print › prints section headings at 11pt capitals … with no print only rule` | paper values, two print classes | `13.3333px`, `1.33333px`, line height `16.6667px`, padding `3.33333px`, and the class holds exactly `print:pb-1` and `print:leading-tight`; rename |
| `styleguide.spec` · `print › hides every Button, the skip link, and the footer home link` | two more hidden buttons | add the `Download PDF` specimens to the list, so its length is 8 |
| `cv-schema.test` · `reads every cap from CV_LIMITS` | two caps | `cvProjectsMax: 3`, `projectHighlights: 3` |
| `cv-schema.test` · `accepts two projects on the CV and fails at the third` | the cap | three pass, the fourth fails; rename |

One comment changes too: the note above the employer words in `e2e/site.spec.ts` lists Daimler and Truck as today's words, and both leave with the Daimler entry.

## Build plan

Skateboard: each step leaves something a visitor can use and the suite green. The curated CV ships first and is useful alone; paper comes right second; the file exists before any button points at it.

1. Schema and content: add `projectHighlights` and the new `cvProjectsMax` to `CV_LIMITS`, `highlights` and its rule to `project`, with the Vitest cases and the two forced unit test edits; replace the content of `cv.json` as under *Content* and run `pnpm format`; pass `highlights` to the project entries in `cv.astro`; make the forced edit to the projects section page test, satisfies **AC-1**, **AC-2**, **AC-3**.
2. Paper: the three `@media print` values in `global.css`; `print:max-w-none` on the `BaseLayout` column; the paper classes in `cv.astro` (wrapper, sections, heading class, roles wrapper), `CvEntry`, and `KeyedList`; the three forced paper test edits with the new values, satisfies **AC-9**, **AC-10**.
3. The file: `src/lib/cv-pdf.ts` with its Vitest cases; `src/lib/render-pdf.ts`; the import and `cvPdf()` in `astro.config.mjs`; the Chromium step moved before the build in `ci.yml`; the `/cv.pdf` block in `public/_headers`; `distBytes` in `e2e/helpers.ts`; the `cv pdf` page cases for the file's facts and its headers, satisfies **AC-12**, **AC-13**, **AC-14**, **AC-15**, **AC-17**, **AC-19**.
4. The button and the contact line: `download` on `Button`; `CvContact` and `formatCvContacts` with their Vitest cases; the header of AC-4 and the contact list of AC-7 in `cv.astro`; the seven forced page test edits for the header, Tab order, contacts, and print visibility; the new cases for the button, the download, and the fit rule, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-11**.
5. The deploy gate: `pdf_headers`, `check_pdf`, and the six `check_pages` lines in `smoke.sh`, its opening comment, and the three smoke page cases, satisfies **AC-18**.
6. Style guide, docs, and the gate: the `Button` specimen with its style guide case and the edited print case; the `design.md` and `README.md` edits; the test comment that names Daimler; then the full gate, the break steps and the Linux comparison in [verify.md](verify.md), and the first CI run, satisfies **AC-16**, **AC-20**, **AC-21**.

## Consequences

**Positive**:
- One document, one source: the page, a Chrome print, and the download cannot drift, and a content edit is still one JSON edit and a build.
- Two pages by construction. The build tells you, on your machine, the moment an edit no longer fits.
- The PDF is a real document: selectable text in reading order, live links, embedded Plex, a title, a language, and tags for screen readers, in about 65 kB.
- No new dependency, no script on the page, no server. The build grows by under a second.
- The CV reads like you, and leads with the work a full stack role with an AI focus asks about.

**Negative / tradeoffs**:
- `pnpm build` now needs Chromium. A fresh machine must run `pnpm exec playwright install chromium` first, or the build stops with that instruction.
- `dist/` is no longer the same bytes on every build: Chromium stamps the time into `cv.pdf`. The share cards stay stable; the PDF does not.
- `pnpm dev` has no `/cv.pdf`, so the button leads to a 404 there. It works under `pnpm preview` and live.
- Only Chromium's print is guaranteed. Safari and Firefox break lines a little differently, so `Cmd+P` there may run to a third page; the download is the promised two pages.
- The whole site's paper scale changes, which amends specs 0003, 0005, 0007, 0010, and 0012, and fourteen existing tests are edited.
- Daimler, three certificates, the coursework list, and one Ford bullet leave the site until the History feature brings them back.
- Both pages are about 95% full, with room for about two more lines on each; a bigger edit fails the build until something is trimmed. That is the cap working, but it will interrupt you.
- Medipal sits at the top of page two, away from the `PROJECTS` heading on page one. Your numbers took the two lines that kept all three projects together.
- The paper layout is tuned to this content: with 15mm margins, or without the tighter headings, the same content fits with only 3 to 4pt to spare.
- The mono rows are width sensitive: the Languages row and the Cloud Engineer title each fit their line with about two characters to spare. A longer value wraps by one line.
- A PDF only. Some application portals read `.docx` best (one of the researched guides says so), and A4 paper prints the Letter file slightly scaled.
- A Playwright upgrade brings a new Chromium, which can move a line break. The cap check catches a third page; smaller shifts need the look in `verify.md`.
- The Linux comparison was run on an arm64 image; GitHub's runner is x86. The first CI run is the proof (AC-16).
- `render-pdf.ts` breaks the house import style on purpose (a relative path with `.ts`, no alias), because the config loads it outside Vite, and both new modules must stay erasable TypeScript for the same reason.
- The deploy check does not compare the PDF's bytes, only that it answers as a PDF with the right headers. A wrong PDF beside the right pages would pass; one deploy uploads both, so that would take a fault outside this repo.
- `cvPdfFileName` turns a letter that does not decompose (`ø`, `ß`, `æ`) into a hyphen. Your name is not affected.
- The research found that one page is the usual advice under five years of experience. You chose two; page one is built to stand alone for that reason.

**Neutral**:
- The PDF has a title and no author field. `Skills & interests` keeps its name. `/projects` gains nothing but better lines, a live TRACSUR link, and the spelling Medipal.
- Scope item 16 (Project links live) is done by this change's content edit.
- The share cards, the metadata, the home page, `/about`, and `/contact` do not change.

## Follow-up

- [ ] History page (enrolled in the scope as its own feature): tell the full path from student to now, and bring back the entries recorded under *What left the CV* in [rationale.md](rationale.md).
- [x] Content, yours, before the merge: the TRACSUR ticket count is the organizer's sales figure. Check that they are fine with it being public; if not, end that bullet at `page views.` Done 2026-10-05: the organizer is fine with it, so the bullet stays.
- [ ] Content, yours: after the race (about a month and a half from 2026-10-05), swap TRACSUR's first week bullet for the final totals. Still open for when you have them: the questions the assistant answers in a week, and Medipal's users once it has more than its first three. Each is a plain `cv.json` edit; the build tells you if it no longer fits.
- [ ] Content, yours: when TRACSUR's offline scanner ships, the project line can say so again. Today it says gate check in, which is true now.
- [x] `/sync` after the build: record in `AGENTS.md` that `pnpm build` needs Chromium and writes `dist/cv.pdf`; the `cv-pdf.ts` and `render-pdf.ts` split and the import rule; the paper scale; `formatCvContacts`; three CV projects and project highlights; the `/cv.pdf` checks in `smoke.sh` (headers and signature, no bytes); `distBytes`. Done in pull request 31 on 2026-10-05.
- [ ] After a Playwright upgrade: run the Linux comparison of `verify.md` again and look at both pages.
- [ ] If a recruiter asks for `.docx` or A4, that is a new decision: a second file from the same content.
