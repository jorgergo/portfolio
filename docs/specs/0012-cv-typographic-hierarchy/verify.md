# Verify: CV typographic hierarchy · spec 0012 · 2026-09-30
_Steps derived from spec 0012 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says otherwise. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the browser's rendering panel. Break steps change a file, run the command, check the result, then restore the file. Links carry a 150ms colour transition, so wait before reading a colour after a scheme switch.

## UI / manual
- [x] `pnpm dev`, open `/styleguide` → every panel heading and every subheading (`Tokens`, `Type`, `Spacing`, `Components`, `Icons`) is 16px capitals at weight 500 in olive; the type specimen reads `Section heading in text-base at 500, uppercase, tracked` and looks the same as the headings → AC-1, AC-6
- [x] On `/cv` at 1280×800 in light, then dark → your name is the largest text; each section heading (`SUMMARY`, `EXPERIENCE`, `PROJECTS`, `EDUCATION`, `LEADERSHIP & ACTIVITIES`, `AWARDS`, `CERTIFICATIONS`, `SKILLS & INTERESTS`) is body size capitals at 500 in olive over its rule, clearly the loudest line of its section; entry titles are 16px at 500, positions and roles 16px at 400, dates and locations 14px muted, the body sans; nothing else changed size; the capitals sit about 3px higher above their rule than before, from the taller line box, and still read as one unit with it → AC-2
- [x] Resize to 320px wide → every heading stays on one line, `LEADERSHIP & ACTIVITIES` included; nothing scrolls sideways; then 375px, the same → AC-3
- [x] Skim the page from the top on a phone, or at 320px, and again at 1280px → the headings are the first thing the eye lands on, then the titles, then the rest → AC-2
- [x] Print preview `/cv` in Chrome under a dark system setting, Letter and A4 → paper colours; each heading is 11pt capitals at 500 in the print olive over its rule, never the last line of a page; entries stay whole; the footer is hidden. Then, with `pnpm preview` running, a scratch Playwright script calls `page.pdf({ format: 'Letter' })` and `'A4'` and reports the page counts; compare with the same run on `main` before the change and record both pairs under *Build measurements* below → AC-4
- [x] Emulate `forced-colors: active` and `prefers-contrast: more` in the rendering panel → the headings keep their size and capitals; under contrast more the muted text turns ink and the headings stay olive → AC-5
- [x] Turn on VoiceOver (Safari) and read the headings list on `/cv` → h1 the name, then the eight h2s in order, then h3s and h4s, no skipped level; region names read in capitals as before → AC-2
- [x] Break step: in `src/pages/cv.astro` rename the heading `Leadership & activities` to `Leadership & activities.` (24 characters), run `pnpm build` and `pnpm exec playwright test --project site -g "one line"` → the 320px case fails on the length check, naming that heading (the layout alone would still pass on macOS at 268.8px); restore, run again → it passes → AC-3
- [x] Read `design.md` → the `text-xs` row of the type scale reads `the footer`; a `text-base font-medium uppercase tracking-label text-accent` row names section headings and the 23 character cap; the weights sentence lists section headings; the `SectionHeading` bullet describes the new look and the cap. Read spec 0003 → four amendment lines (AC-4, the `--tracking-label` row, the type scale line, the `SectionHeading` API row) point at spec 0012, written at design time; `git diff --stat main -- docs/specs` shows no spec change from the build → AC-7

## Commands
- [x] On `main` before the change, `pnpm build && cp dist/og/cv.png /tmp/cv-card-before.png && pnpm build && cmp dist/og/cv.png /tmp/cv-card-before.png` → identical, so the render is deterministic; after the change, `pnpm build && cmp dist/og/cv.png /tmp/cv-card-before.png` → identical → AC-5
- [x] `git diff --stat main -- src/styles/global.css src/lib/contrast.ts src/lib/share-card.ts` → no lines → AC-5
- [x] `grep -c 'text-xs' src/components/SectionHeading.astro` → 0; `grep -o 'font-mono text-base font-medium uppercase tracking-label text-accent' src/components/SectionHeading.astro` → one match → AC-1
- [x] `grep -n 'text-xs' src/pages/_dev/styleguide.astro` → only the guide's own small print (the token note, the contrast list, the print line, the spacing list, and the icons list), no `Label in text-xs` specimen → AC-6
- [x] `pnpm test` → passes, `contrast.test.ts` unchanged → AC-5
- [x] `pnpm exec playwright test` → the `SectionHeading` case, the `/cv` ladder, one line at 320px, and print cases pass; `git diff --stat main -- e2e/site.spec.ts` shows additions inside the `cv page` block and no change to a fixture derived case → AC-1 to AC-4, AC-8
- [x] `pnpm build`, `pnpm lint`, `pnpm format:check` → clean → AC-8
- [x] Push the branch and read the CI run → every job green on the Linux runner, the 320px case included → AC-3, AC-8

## Acceptance-criteria coverage
- AC-1: style guide step, grep, Playwright · AC-2: 1280 step, skim step, VoiceOver step, Playwright · AC-3: 320px step, break step, CI · AC-4: print preview step with the page counts, Playwright · AC-5: forced colours step, the card `cmp`, the `git diff`, `pnpm test` · AC-6: style guide step, grep · AC-7: the docs reading step · AC-8: the command gate and CI

## Known gaps (not AC failures)
- Firefox and Safari print previews stay manual; only Chromium runs in the page tests, and `break-after: avoid` is best effort outside it (spec 0005).
- The page count on paper is recorded, not gated; a fifth page is information for the CV PDF decision (scope row 9).
- The skim step is a judgement, backed by the measured ladder and the bench, not a number a test can read.

## Build measurements · /develop · 2026-10-04
_Taken during the build, so `/check verify` can compare without rebuilding `main`._

- Share card: two builds of `main` gave the same `dist/og/cv.png`, and the build after the change gave it again (`shasum -a 256`: `d61d9706b15f1dc4a7c7899a84136cdb3cc4d948191860d32cec13d7915cc35e`) → AC-5
- Page counts from `page.pdf` against `pnpm preview`: Letter 4 pages before and 5 after, A4 4 before and 4 after. On Letter the fifth page holds only the last two keyed rows (Sports and Music); on A4 the last page ends 6pt lower than before → AC-4
- Printed headings, read from the Letter PDF: 11pt IBM Plex Mono Medium in `#4f5a2c`, none the last line of a page → AC-4
- Width of `Leadership & activities` at 320px: 257.6px on macOS and 266.8px in the Linux Playwright image (`mcr.microsoft.com/playwright:v1.63.0-noble`, all 342 page tests passing there), one line in the 272px text area on both → AC-3, AC-8
- Break step: with the 24 character heading the 320px case failed with `Leadership & activities. holds 24 characters`, and passed again once restored → AC-3

## Commands added by the build
- [x] `PLAYWRIGHT_JSON_OUTPUT_NAME=report.json pnpm exec playwright test --project site -g "one line" --reporter=list,json`, then read `annotations` in `report.json` → eight `heading width at 320px` entries. The `list` reporter, which CI uses, does not print annotations, so the CI log alone will not show the widths → AC-3
- [x] Break step, in the Linux image: remove the `document.fonts.ready` line from the 320px case and run the suite → the case still passes but records 220.8px for the longest heading, the width of a fallback face drawn before Plex Mono 500 loads; restore the line → it records 266.8px → AC-3
