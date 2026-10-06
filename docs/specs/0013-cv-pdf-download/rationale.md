# 0013. Rationale: CV curated to two pages and printed to a PDF by the build

The reasoning behind [index.md](index.md). `/develop` does not need this file.

## Context

> ⚠️ Premise note: This spec carries three things that could each be a decision: what the CV says, how it is laid out on paper, and how the PDF is made and offered. They stay together because the two page cap ties them: the words must fit the layout, and the PDF is the print of the page. The History page you raised is split out as its own feature. Two more points for you to accept knowingly. First, the research found that one page is the usual advice under five years of experience; you chose two, so page one is built to stand alone. Second, this ships a PDF only, and one researched guide says some application portals read `.docx` best; the answer here is a text based, tagged PDF in one column, which current screening software reads.

The scope promised a download button on `/cv` that gives a ready made PDF "always matching the web version", one page long. The CV page (spec 0005) was built as a full record instead, and it prints long: five Letter pages and four A4 pages on `main`, measured for this spec. On 2026-09-24 a recruiter needed a file of at most two pages within the hour, so one was exported by hand with compact settings, three entries cut, and tighter wording; the cuts and the wording were then reverted in `cv.json`, so the only two page CV that exists is a file in a downloads folder that no longer matches the site.

The forces are mostly recorded already. All CV content lives in one file, and three earlier specs asked that the PDF never drift from the page (0001, 0002, 0005). The site is static with no server, built in GitHub Actions and served by Cloudflare, so anything that makes a PDF has to run at build time; Chromium is in CI only for the page tests, installed after the build. The design system allows Tailwind's scale and the tokens, never an arbitrary value, and its print layer (11pt, 18mm, the 640px column) is pinned by page tests. The accessibility baseline is WCAG 2.2 AA, and a CV is also read by screening software before a person sees it. Late in the interview two more forces arrived from you: the CV should hold only the most important and relevant work for today's market, and every word should sound like you wrote it, not like a template.

Not deciding leaves a button promised in the scope with nothing behind it, a hand made file that ages with every edit, and a web CV that takes five pages to say what a recruiter gives ten seconds to.

## Options considered

### Option 1: Curate `cv.json`, one paper layout, Chromium prints the page at build time (chosen)

`cv.json` is trimmed and reworded until the CV fits two Letter pages in a compact print layout. An Astro integration opens the built `/cv` in the headless Chromium that Playwright installs, prints it with the site's own print styles, checks the result, and writes `dist/cv.pdf`. A button links to it.

**Pros**:
- The page, a Chrome print, and the file are the same HTML and CSS, so they cannot drift, and there is one layout to maintain.
- Measured output is a real document: tagged, titled, with its language, live links, embedded fonts, and selectable text in reading order, about 65 kB, in under a second.
- No new dependency. Chromium is already a dev dependency through Playwright and already installed in CI.
- One launch flag makes the Linux build break every line where macOS does, so what you check locally is what ships.

**Cons**:
- `pnpm build` needs Chromium on every machine that builds, and the CI job order changes.
- The PDF's bytes change with every build, because Chromium stamps the time.
- Content leaves the site (until History), and the site's paper scale changes, which touches four older specs and thirteen tests.
- A Chromium upgrade can move a line break.

### Option 2: A PDF library with its own layout

The CV is drawn a second time for a PDF engine (Typst, pdfkit, or react pdf), from the same helpers, the way the share cards are drawn with Satori.

**Pros**:
- No browser in the build, and the same bytes on every build.
- Full control of typesetting, page breaks, and metadata, including an author field.

**Cons**:
- A second layout to write and keep in step with the page by hand; the "always matching" promise becomes a discipline, not a property.
- A new dependency (and for Typst a new language and fonts in another format).
- Tags for assistive tech are partial or manual in most of these libraries; I could not verify their current state, since my knowledge of them stops in mid 2026.

### Option 3: Keep everything on the page and hide entries on paper

`cv.json` keeps the full record and a flag marks entries as web only; print and the PDF leave them out.

**Pros**:
- Nothing leaves the site.
- The PDF can be tuned to two pages without touching what visitors read.

**Cons**:
- The page and the PDF no longer say the same thing, which is the opposite of the scope's promise.
- A flag on six kinds of entry, with rules for a group whose roles are partly hidden and a section whose entries are all hidden.
- With whole entries as the only lever, measured: even hiding Daimler, four certificates, the ICPC mention, and two skill rows left a third page at 10pt. Reaching two pages needed the wording to shrink anyway.

You picked this first and then replaced it with Option 1's curation, once the measurements showed how much would have to be hidden.

### Option 4: Export by hand and commit the file

You make the PDF on your Mac and commit it under `public/`.

**Pros**:
- No build change at all, and you look at every file before it ships.

**Cons**:
- It falls behind `cv.json` the first time someone forgets, which is how the 2026-09-24 file ended up alone.
- A binary in git, and nothing checks its length, fonts, or tags.

## Rationale

The scope's own words settle most of it: a PDF that always matches the web version is easiest to promise when it is the web version, printed. Option 1 makes "matching" a property of how the file is made, where Options 2 and 4 make it a habit someone has to keep, and Option 3 gives it up. The measurements removed the usual objections to a browser in the build. The output is not a picture of a page but a tagged, linked, searchable document. The step costs under a second. The one real risk, lines breaking differently on the Linux runner, has a measured fix. And the project already fails its build on bad content, so a page cap enforced in the same place fits how you work.

Curation over hiding followed from your own change of mind and from the numbers. The CV had grown to 2.6 pages at 10pt, and the cuts that got the September file to two pages no longer did, because the Projects section and the larger headings came later. Hiding whole entries could not close that gap without also trimming words, and two versions of the truth is the thing the single content file exists to prevent. So the CV itself became the short version, with the full path promised a home of its own.

Within Option 1 the smaller calls lean the same way: fewer moving parts and nothing a later reader has to remember. An integration hook instead of a script, so every build is complete. Files handed to Chromium from disk, so there is no port and no network. Pure checks in one module and the browser in another, the split the share cards already use. One paper scale for the site, because the alternative is a second scale and a scoping trick for a handful of pages nobody prints. And where the prototype disagreed with the plan (a breakpoint that wrapped the label line, margins that wrapped two mono lines, headings whose leading cost the third project its place on page one), the measured result won.

## Evidence

Everything below was measured on 2026-10-05 in a scratch copy of the repo (an APFS clone outside the project), with Playwright 1.63.0 and its Chromium, printing the built `/cv` from disk. Page counts and fills were read from the PDFs with PyMuPDF.

### Where the CV stood

All of `cv.json` on `main`:

| Layout | Letter | A4 |
|---|---|---|
| Today's print: 11pt, 18mm, the 640px column | 5 pages (the fifth 13% full) | 4 pages |
| Full width, nothing else changed | 4 pages | 4 pages |
| Compact (10pt, margins 15mm and 16mm, line height 1.45, tight gaps: the settings of the 2026-09-24 export) | 3 pages, 2.56 in all | 3 pages |
| The same at 9.5pt | 3 pages, 2.41 | 3 pages |
| The same at 9pt | 3 pages, 2.18 | 3 pages |
| The same at 8pt | 2 pages, 1.78 | 2 pages |

With whole entries hidden, at 10pt on Letter (total pages; the layouts are built only from Tailwind steps and `global.css` values):

| Hidden | Margins 15mm and 16mm, line height 1.45 | Half inch margins, line height 1.4, tight headings | The same at 9.5pt |
|---|---|---|---|
| nothing | 2.56 | 2.28 | 2.14 |
| Daimler, Catia, Cloud Foundations (the September cuts) | 2.32 | 2.08 | 1.99 |
| plus IT Specialist Python and CCNA | 2.19 | 1.98 | 1.89 |
| plus the ICPC mention, Sports, and Music | 2.04 | 1.86 | 1.80 |

A one page attempt at 9pt (no Projects, Leadership, Certifications, Daimler, or coursework, two awards, three skill rows) still ran 29% onto a second page.

### The curated content

The content in [index.md](index.md), with the styles as specified, on Letter:

| Variation | Pages | Page fills | Spare on the last page |
|---|---|---|---|
| As specified (10pt, 12.7mm, line height 1.45, tight headings) | 2 | 96%, 95% | 33pt |
| Headings left at line height 1.6 | 2 | 98%, 100% | 3pt |
| Margins 15mm | 2 | 97%, 99% | 4pt |
| Line height 1.4 | 2 | 94%, 94% | 46pt |
| Line height 1.5 | 2 | 98%, 97% | 19pt |
| Root 10.5pt | 3 | | |
| Root 11pt | 3 | | |

The file: 768 words, 2 pages, about 65 kB. This table was measured again after your numbers went in (see *Your numbers*); before them the first row read 99%, 87%, and 91pt.

Ways of adding Medipal that were measured before you chose, all before your numbers: one line with nothing cut (33pt spare, Medipal on page two); one bullet with the ICPC mention cut (55pt); one line with the fifth Ford bullet cut (91pt, all three projects on page one, chosen). Your numbers later added two lines to page one, which is why Medipal opens page two today.

### macOS and Linux

The same build printed on macOS and inside `mcr.microsoft.com/playwright:v1.63.0-noble` (arm64), compared line by line and word box by word box:

| Layout | Lines that differ, default launch | Lines that differ with `--font-render-hinting=none` |
|---|---|---|
| Today's print, Letter | 57 | 0 |
| Today's print, A4 | 134 | 0 |
| Compact 10pt, Letter | 8 | 0 |
| Compact 10pt, A4 | 62 | 0 |
| Compact 9.5pt, Letter | 45 | 0 |

With the flag, 781 words sat within 0.15pt of each other and every page count and fill matched. The final content, with your numbers in, was compared the same way: 768 words, no line differs, and no word sits more than 0.12pt apart. GitHub's runner is x86, which this could not test; AC-16 covers it on the first CI run.

### What Chromium writes

Read from the bytes and with PyMuPDF: PDF 1.4 from Skia; a title taken from the page's `<title>`; `/Lang (en)`; `/MarkInfo` with `Marked true` and a structure tree holding `H1`, `H2`, `H3`, `H4`, `P`, `L`, `LI`, and `Link` elements; nine link annotations with plain `/URI` strings (the email, the site, GitHub, LinkedIn, Ford, TRACSUR, the site again as a project, Tec, EF SET); three embedded subset fonts (`IBMPlexMono-Regular`, `IBMPlexMono-Medium`, `IBMPlexSans-Regular`); `/MediaBox [0 0 612 792]`; no object streams, so page, font, and catalog dictionaries are plain text a regular expression can read. Text extraction returns the lines in reading order. Two builds on one machine differ only in the creation and modification dates; the macOS and Linux files also differ in size (72,765 and 73,034 bytes for the same layout), since each system embeds its own font data. With `outline: true` a heading that wraps lost the space at the wrap (`ProfessionalCertificate`), which is why the outline is off.

### The prototype

The whole design was built in the scratch copy: the paper values, the classes, the button, the contact helper inline, `cv-pdf.ts`, `render-pdf.ts`, and the `_headers` block.

- `astro build` finished in 2.7 seconds in all and logged `cv.pdf: 2 pages, 63 kB` (`64 kB` with your numbers in); the import of `./src/lib/render-pdf.ts` from `astro.config.mjs` worked as written.
- `astro check`: 0 errors. ESLint on the new and changed files: clean.
- Vitest: 435 of 437 passed; the two failures pin `cvProjectsMax`.
- Page tests, `site` project: 268 of 279 passed; the eleven failures are listed in [index.md](index.md). `styleguide` project: 66 of 66.
- Through `wrangler dev`, `/cv.pdf` answered 200 with `application/pdf`, `Cache-Control: public, max-age=0, must-revalidate`, the `/*` headers, and `x-robots-tag: noindex`, byte for byte the build's file; the unchanged `smoke.sh pages` passed.
- The new `smoke.sh` lines of AC-18 were run as written: a pass against the local server, also from a scratch `dist/` that holds no `cv.pdf`; ten failed attempts with `/cv.pdf header expected X-Robots-Tag: noindex, nofollow got x-robots-tag: noindex` when the scratch `_headers` asked for that; exit 1 with `no /cv.pdf block in dist/_headers` when the block was gone; and the signature line said yes to the PDF and no to an HTML file under `set -euo pipefail`.
- Serving files with `route.fulfill({ path })` instead of a hand written content type table gave the same PDF, line for line. Three name only interests gave the same `Interests` row as one group. Prettier's Tailwind plugin left every class string of AC-4, AC-7, and AC-10 in the order written.
- With the cap forced to 1 the build exited 1 with `cv.pdf has 2 pages, over the cap of 1; shorten src/content/cv.json; see spec 0013` and wrote no PDF. With `PLAYWRIGHT_BROWSERS_PATH` pointing at an empty folder it exited 1 with the Chromium message.
- The header at 320, 480, and 525px stacks the button under the label line; from 526px the button sits at the right edge, centred on the name block. A first version that switched at `xs` wrapped the label line between 480 and 525px.
- Under print emulation: root `13.3333px`, body line height `19.3333px`, wrapper gap `16.6667px`, section gap `10px`, heading `13.3333px` over `16.6667px` with `1.33333px` tracking and `3.33333px` padding, entry and list gaps `3.33333px` and `1.66667px`, one hidden element under `main`.

### Facts behind the project lines

Checked in the repos beside this one, so the CV claims nothing the code does not show.

- **TRACSUR Tickets** (`tracsur-boletos`): one author across 395 commits and 29 merged pull requests; first commit 2026-09-07; the sale open in production since 2026-09-28 21:50 UTC (that repo's spec 0006 `verify.md`). Its README states payment through Mercado Pago by card, OXXO, and bank transfer, QR tickets signed with Ed25519, and a scan that marks a ticket used in one atomic step so it gets in exactly once. Its own scope lists the offline scanner as planned, so the CV says gate check in and not offline. "Three weeks" is 2026-09-07 to 2026-09-28.
- **Medipal** (`medpal`, org `medipalmx`, domain `medipal.com.mx`): 126 commits, 112 yours and 14 from one other developer, 2026-03-25 to 2026-07-21. A Flutter app for web, iOS, and Android and a Fastify and TypeScript backend with PostgreSQL on Google Cloud, in a closed alpha. "Built with a partner" is the honest frame.
- **Ford and earlier roles**: every fact in the new bullets is in the old ones (see the wording table). Two readings are mine and were shown to you: "answers from our own docs" for the RAG assistant, and "I own" for "Owned".

### Your numbers

You sent these on 2026-10-05, after you accepted the spec. They are yours: unlike the commit counts above, nothing in this repo or the ones beside it can check them.

- **Ford**: the PDPO Portal is used by the PDPO team, 95 people (you wrote 95 first and 90+ later; the CV says 95). The Knowledge Base is used by more than 7,000 people, the product development users of 3DEXPERIENCE all over the world. My first draft hung the 95 on the Knowledge Base, from the way your first message read, and you corrected it.
- **TRACSUR Tickets**: more than 200,000 page views in less than a week on sale, and 5,000 tickets sold so far. The sale opened on 2026-09-28 and the race is about a month and a half away, so the CV dates both as the first week, which stays true when the totals grow.
- **Medipal**: an MVP with three users. You left the number out.

What was measured before you picked, each wording added to the accepted content (10pt, Letter):

| Wording | Lines added on paper | Pages |
|---|---|---|
| Ford first line as one sentence that names each site with its number (chosen) | 1 | 2 |
| Ford first line as two sentences, the accepted one and then the numbers | 1 | 2 |
| The 7,000 alone, as a short sentence at the end of the Knowledge Base bullet | 0 | 2, nothing moves |
| TRACSUR third bullet with page views and tickets (chosen) | 1 | 2 |
| TRACSUR third bullet with page views alone | 1 | 2 |

Page one had about 9pt to spare, so the first added line moves Medipal to the top of page two, whichever line it is. With both chosen lines in, the pages are 96% and 95% full, and each has room for about two more lines:

| Edit to the final content | Pages | Page fills |
|---|---|---|
| One more line on page one | 2 | 98%, 95% |
| Two more lines on page one (the fifth Ford bullet would be this) | 2 | 100%, 96% |
| Three more lines on page one | 3, the build stops | |
| One more line on page two | 2 | 96%, 98% |
| Two more lines on page two | 2 | 96%, 100% |
| Three more lines on page two | 3, the build stops | |

So the fifth Ford bullet, which left to keep the three projects together on page one, would fit again by 3pt. It stays out: 3pt is no margin at all, and it is the bullet you had already picked to cut.

Run again on the final content: the prototype build (`astro check` with 0 errors, `cv.pdf: 2 pages, 64 kB`), Vitest (435 of 437, the same two), the `site` page tests (268 of 279, the same eleven), and the Linux comparison above. No second cross check ran, since the change is two content strings and the fit figures.

The ticket count is the organizer's sales figure, so a follow up in [index.md](index.md) asks you to check with them before the merge.

### Research on resume standards

One capped pass by a research helper on 2026-10-05 (5 searches, 7 pages loaded); its notes are cached at `docs/.agent-cache/research/cv-market-standards.md`, which is local and not committed. Read it as common practice: most pages that loaded are guides from resume tool vendors, with the Stack Overflow survey and one Hacker News thread as the stronger sources.

- Length: one page is the usual advice for under five years of experience; two pages are accepted and screening software does not penalise them. The Harvard template cached on 2026-09-24 says one page as well.
- What screening software reads: one column, real text (not an image), standard section names, contact details in the body, a professional file name. `.docx` parses most reliably; a text based PDF works with current systems.
- Bullets: an action, the tool, and a result, with a number when there is one; one to two lines; three to six for the current role; no pronoun; past tense for past roles.
- Skills: Python, JavaScript, TypeScript, and SQL lead the Stack Overflow 2025 survey; retrieval and agent work with language models is the rising area; a skills section grouped by kind.
- One vendor survey reports AI screening used by 58% of hiring managers in 2026, up from 35%. The helper found no source that measures how much course certificates count; it reported the low weight as convention.
- A September 2026 Hacker News hiring thread: managers ask for real interest and a look at real projects, and some state they read every resume themselves.

How it shaped the content: page one stands alone; skills became four grouped rows; three course certificates and the coursework list left; bullets sit at one or two lines. Where the guides and your voice pulled apart, your voice won: plain verbs instead of the stock resume ones, and a summary that says hello instead of listing wins.

### What left the CV

Kept word for word so the History feature, or you, can bring any of it back. Git history holds the same.

A `work` entry:

```json
{
  "name": "Daimler Truck Mexico",
  "position": "Logistics Intern",
  "location": "Santiago Tianguistenco, Mexico",
  "startDate": "2023-03",
  "endDate": "2023-05",
  "highlights": [
    "Built dynamic SQL and Microsoft Report Builder reports tailored to materials analysts and expeditors."
  ]
}
```

Three `certificates`:

```json
[
  { "name": "Catia 3DEXPERIENCE (Catia V6) for Beginners and Catia V5 Users", "issuer": "Udemy", "date": "2026-05" },
  { "name": "IT Specialist: Python", "issuer": "Certiport, Pearson", "date": "2023-07" },
  { "name": "Google Cloud Computing Foundations: Cloud Computing Fundamentals", "issuer": "Google Cloud Skills Boost", "date": "2023-03" }
]
```

`education[0].courses`:

```json
[
  "Object Oriented Programming in C++",
  "Data Structures and Algorithms",
  "Advanced Algorithms",
  "Web Development",
  "Android Programming",
  "Artificial Intelligence",
  "Cybersecurity Essentials"
]
```

The `skills` key, the old single `technologies` group, and the old `interests`:

```json
{
  "skills": [
    {
      "name": "Additional skills",
      "keywords": [
        "Full stack web platforms, from interface to cloud deployment",
        "AI assistants and retrieval augmented generation (RAG)",
        "Release automation and CI/CD",
        "Technical documentation and teammate mentoring",
        "Process automation (RPA)"
      ]
    }
  ],
  "technologies": [
    {
      "name": "Technologies",
      "keywords": [
        "TypeScript", "JavaScript", "Python", "Java", "SQL", "React", "Next.js", "Angular",
        "Tailwind CSS", "Spring Boot", "FastAPI", "Node.js", "PostgreSQL", "Google Cloud",
        "Vertex AI", "Google ADK", "GitHub Actions", "Docker", "Tekton", "SonarQube", "Elastic"
      ]
    }
  ],
  "interests": [
    { "name": "Sports", "keywords": ["Basketball (team captain, 2013 to 2018)", "Tennis", "Weightlifting", "CrossFit"] },
    { "name": "Music", "keywords": ["Guitar"] }
  ]
}
```

### Wording, before and after

Matched by subject, not by position (the Ford bullets changed order).

| Where | Before | After |
|---|---|---|
| Summary | Full Stack Developer building scalable web platforms, AI assistants, and automated release pipelines. Led the modernization of Ford's PDPO Portal and Knowledge Base, delivering a production RAG assistant used across both platforms and removing manual versioning and release work. Computer Science graduate of Tecnológico de Monterrey with a 4.0 GPA and winner of a national hackathon. | Full stack developer. I'm a computer science and technology engineer who builds things for the web, from scratch and all the way to the cloud. I bring problem solving, creativity, and clear communication to every project, and I'm quick to pick up whatever it needs next. Lately that has meant a lot of AI. |
| Ford PDPO, intro | Owned the PDPO Portal and Knowledge Base, internal platforms serving Ford's 3DEXPERIENCE product development users. | I own two internal sites for the teams that use 3DEXPERIENCE at Ford: the PDPO Portal, used by a team of 95, and the Knowledge Base, used by more than 7,000 people all over the world. (The accepted draft read: I own the PDPO Portal and Knowledge Base, two internal sites for the teams that use 3DEXPERIENCE at Ford.) |
| Ford PDPO, the assistant | Designed and launched a production AI assistant and RAG agent platform with Google ADK and Vertex AI, now used in both the Portal and Knowledge Base and planned for reuse by other teams. | Built an AI assistant that answers from our own docs (a RAG agent on Google ADK and Vertex AI) and took it to production. Both sites use it now, and other teams plan to reuse it. |
| Ford PDPO, the Portal | Rebuilt the Portal from legacy HTML into a Next.js and Spring Boot application with live LDAP team directories and an Elastic Synthetics health dashboard for 3 environments. | Rebuilt the Portal from old HTML pages into a Next.js and Spring Boot app, with team directories read live from LDAP and a health dashboard for 3 environments on Elastic Synthetics. |
| Ford PDPO, the Knowledge Base | Migrated the Knowledge Base from MkDocs to Zensical and added a FastAPI and Uvicorn runtime, turning a static site into a platform with authentication, sessions, and APIs. | Moved the Knowledge Base from MkDocs to Zensical and added a FastAPI backend, which turned a static site into an app with sign in, sessions, and its own APIs. |
| Ford PDPO, releases | Automated calendar versioning and releases for 2 applications with GitHub Actions, shipping 5 monthly and 3 patch releases with zero manual versioning or release notes. | Automated versioning and releases for both apps with GitHub Actions: 5 monthly and 3 patch releases so far, none with a version number or release note written by hand. |
| Ford PDPO, standards | Enforced repository standards and strict build validation, eliminating about 1 hour per week of broken link cleanup, and mentored contributors through 18+ support issues. | (removed, to make room for Medipal) |
| Ford IT Academy, intro | Completed Ford's IT Academy program in Java full stack development on Google Cloud. | (removed) |
| Ford IT Academy, migration | Migrated legacy financial applications from Linux shell and SQL scripts to Google Cloud Platform, rebuilding them with Spring Boot and Angular. | Moved old finance tools from shell and SQL scripts to Google Cloud, rebuilt with Spring Boot and Angular. |
| Ford IT Academy, quality | Maintained code quality and security with Tekton, SonarQube, and FOSSA through testing, change approval, and production deployment. | Kept quality and security in check with Tekton, SonarQube, and FOSSA, from tests to approval to production. |
| Liverpool, robots | Automated financial processes with UiPath and Visual Basic robots, reducing processing time by up to 60%. | Built UiPath and Visual Basic robots for finance processes that cut processing time by up to 60%. |
| Liverpool, SAP | Automated SAP ECC and S/4HANA data extraction and Excel data management. | Automated data extraction from SAP ECC and S/4HANA and the Excel work that came after it. |
| Good Cheer, rebuild | Led the frontend rebuild of the gift drive app with React and Tailwind, adding QR code scanning that tracked 1,341 gifts for 450 children. | Led the React and Tailwind rebuild of the gift drive app, with QR scanning that tracked 1,341 gifts for 450 children. |
| Good Cheer, wishlists | Automated extraction of children's wishlists from PDFs with Python, replacing manual data entry for volunteers. | Wrote a Python script that pulls children's wishlists out of PDFs, so volunteers no longer type them in by hand. |
| TRACSUR Tickets, line | Ticket sales and gate check in for a trailer drag race, with signed QR tickets and an offline scanner. | Ticket sales and gate check in for a trailer drag race in Yucatán, paid by card, OXXO, or bank transfer. |
| TRACSUR Tickets, first week | (new, from your numbers) | In its first week on sale it passed 200,000 page views and sold 5,000 tickets. |
| jorgergo.dev, line | Personal site and CV, built from written specs, with a CI gate that rolls back a bad deploy. | My site and CV, built with AI coding agents from specs I write and review. A failed check rolls the deploy back. |
| Medipal, line | A medical concierge app that helps independent doctors run their agenda, notes, and prescriptions. | An app for independent doctors in Mexico, built with a partner: agenda, notes, prescriptions, WhatsApp reminders. |

The voice rules these follow, in your words from the interview: nothing that sounds "rehearsed, robotic and just, not me", a tone "a bit up" from how you text "without being too extreme", and a summary that introduces you and leaves the achievements to the sections below. The summary is the one you picked, closest to your own paragraph.

### The cross check

An independent model read the finished spec on 2026-10-05, without the conversation, and checked its claims against the code. Its verdict: the design holds and the evidence is good, with gaps to close before the build. What changed because of it, all applied with your approval:

- The older specs this one amends (0003, 0005, 0007, 0010, 0012) and the follow ups it closes (0001, 0002) now carry a note that points here, written with this spec, since `/develop` never edits a spec.
- The contact tests got a stated rule for when a dot exists and when it shows, so the no profiles case needs no test edit.
- The header criterion asserts only what the test's own measurements predict; the 526px figure moved to the manual checks.
- The exact `design.md` lines and a `README.md` line were listed, a style guide print case joined the forced edits, and `distBytes` was added so tests can read the PDF as bytes.
- `cv-pdf.ts` imports nothing and both new modules stay erasable TypeScript, because Node loads them when it loads the config. Files reach Chromium by path, so Playwright sets their type.
- The font error names the likely cause, a character the Plex latin files lack.
- The deploy check no longer compares the PDF's bytes. The review pointed out that the documented manual check (build locally, then run `smoke.sh` against the live site) could never pass on a file whose bytes differ per build and per system. You chose to check the status, the type, the headers, and the PDF signature instead.
- One risk stays open for the manual checks: whether every browser shows `/cv.pdf` inline while the site sends `frame-ancestors 'none'`. The app's own browser pane downloads PDFs instead of showing them, so it could not be confirmed here.

## References

**Project sources** (verifiable, in this repo):
- Spec 0001 (`docs/specs/0001-stack-architecture/index.md`): static output, no server, and its follow up asking this spec to choose between a headless browser in the build and a PDF renderer.
- Spec 0002 (`docs/specs/0002-content-model/index.md`): one content file, the caps, and its follow up that the PDF build from the same helpers.
- Spec 0003 (`docs/specs/0003-design-system/index.md`): the print layer (AC-11), `Button`, the `Download` icon, and the no arbitrary values rule.
- Spec 0005 (`docs/specs/0005-cv-page/index.md`): the header, the contact list and its trailing dots, the print rules (AC-10), the helper rule (AC-15), and the content edit rule for tests (AC-16).
- Spec 0006 (`docs/specs/0006-metadata-share-cards/index.md`): every absolute URL derives from `site`; the pure tree and renderer split.
- Spec 0007 (`docs/specs/0007-go-live/index.md`): the deploy ships the tested `dist/`, and `smoke.sh` compares bytes and headers.
- Spec 0010 (`docs/specs/0010-projects-page/index.md`): the `projects` list, `cv: true`, and `projectHref`.
- Spec 0012 (`docs/specs/0012-cv-typographic-hierarchy/index.md`): the heading scale and its print criterion.
- `AGENTS.md` and `design.md`: tokens only, rules with a branch live in tested helpers, expected failures return explicit results, and the print section this spec rewrites.
- `playwright.config.ts` and `.github/workflows/ci.yml`: the web server builds with `astro build`, and Chromium is installed after `pnpm build` today.
- The measurements and the prototype under *Evidence*.

**Practices & standards**:
- One source of truth, with every rendering derived from it.
- Tagged PDF (a structure tree, a language, and a title) as the base of an accessible PDF; WCAG 2.2 AA as the project's bar.
- CSS paged media: `@page` margins and `break-inside` for print layout.
- Fail the build on a broken invariant instead of shipping and warning.
- Unhinted font rendering for the same text layout across operating systems.
- The Harvard resume format: one column, standard headings, organisation left and dates right.

**Links** (web verified only; the research helper loaded these on 2026-10-05, the Astro page was read through the Astro Docs server the same day, and the Harvard page was verified on 2026-09-24):
- Astro Integration API, `astro:build:done`: https://docs.astro.build/en/reference/integrations-reference/#astrobuilddone
- Stack Overflow Developer Survey 2025: https://survey.stackoverflow.co/2025/
- Hacker News, Who is hiring (September 2026): https://news.ycombinator.com/item?id=49522897
- Harvard career services, bullet point resume template: https://careerservices.fas.harvard.edu/resources/bullet-point-resume-template/
- Resume.io, resume templates that screening software reads: https://resume.io/resume-templates/ats
- The Interview Guys, what screening software looks for in resumes: https://blog.theinterviewguys.com/what-ats-looks-for-in-resumes/
- Resume Genius, 2026 hiring trends report: https://resumegenius.com/blog/job-hunting/hiring-trends-report-2026
- Careerflow, resume bullet points: https://www.careerflow.ai/blog/resume-bullet-points
- Resumly, achievement driven bullet points for software engineers: https://www.resumly.ai/blog/writing-achievementdriven-bullet-points-for-software-engineers-in-2025
