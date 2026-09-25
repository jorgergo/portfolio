# Verify: CV page · spec 0005 · updated 2026-09-24 (after the review)
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Light and dark follow the operating system setting; toggle it in System Settings, or emulate `prefers-color-scheme` in the browser's rendering panel. Page steps run on `pnpm preview` (the built site with real headers) unless a step says `pnpm dev`; the component steps run on `/styleguide` under `pnpm dev`. Break steps change a file, run the command, check the result, then restore the file with `git checkout <file>`.

## UI / manual
- [x] `pnpm preview`, open `/cv` in light mode, then dark mode → the tab reads `CV · Jorge González Ozorno`; the name as the h1, `Full Stack Developer · Toluca, Mexico` under it in muted, then `jorgergo@icloud.com · github.com/jorgergo · linkedin.com/in/jorgergo` as three links in `fg` with muted dots and no underline; then Summary, Experience, Education, Leadership & activities, Awards, Certifications, Skills & interests, each an uppercase olive label with a hairline under it → AC-1, AC-2, AC-3
- [x] Read the Experience section → `Ford Motor Company` (underlined link) with `Jan 2025 – Present` at the right edge, then `Full Stack Developer, PDPO` with `Aug 2025 – Present` right and `Remote` alone at the right of the next line, its summary and five bullets in sans with muted disc markers, then `Software Engineer, IT Academy` with `Jan 2025 – Jul 2025` right and `Mexico City, Mexico` under it, its summary and two bullets; then `El Puerto de Liverpool` and `Daimler Truck Mexico` each as company and dates, position and location, bullets → AC-4, AC-5
- [x] Read Education → `Tecnológico de Monterrey` (link) with `Aug 2020 – Jun 2024` right, then `B.S., Computer Science and Technology · GPA 4.0/4.0 (97/100)` wrapping onto a second line, with `Toluca, Mexico` whole on one line at the right of its first line, then `Coursework: Object Oriented Programming in C++, …` in sans → AC-4, AC-6
- [x] Read Awards and Certifications → three awards newest first (`First Place, SISA Track` with `Apr 2024` right, `Talent Hackathon 2024` under it, the summary in sans); six certificates newest first, the EF SET name underlined as a link, the others plain, each issuer on the second line → AC-7
- [x] Read Skills & interests → five rows: `Additional skills`, `Technologies`, `Languages`, `Sports`, `Music` as muted keys in one 160px column, values in fg separated by `·`; the Languages row reads `Spanish (Native) · English (Fluent, C2) · French (Conversational, B1)` → AC-8
- [x] Hover a contact link, the Ford link, and the EF SET link → terracotta; the Ford and EF SET links keep their underline (terracotta too); the keys and dates never change colour → AC-2, AC-4
- [x] Press Tab from the address bar → the skip link, `jorgergo@icloud.com`, `github.com/jorgergo`, `linkedin.com/in/jorgergo`, `Ford Motor Company`, `Tecnológico de Monterrey`, `EF SET English Certificate, C2 Proficient (73/100)`, then `← home`, each with the 2px olive ring offset 3px, then focus leaves the page → AC-12
- [ ] Turn on VoiceOver (Safari), open the rotor's Landmarks → seven regions named Summary, Experience, Education, Leadership & activities, Awards, Certifications, Skills & interests, plus main and content information; the Headings rotor shows h1, then h2 per section, h3 per entry, h4 for the two Ford roles, no level skipped; the contact line reads as three links with no dot spoken (Safari drops the list role there; NVDA or Chrome's reader announces a list of three items) → AC-3, AC-11
- [x] Narrow the window to 320px → no horizontal scrollbar; the contact links wrap one per line, each whole with its dot; every date and location sits under its left text, left aligned; widen to 479px → still stacked; 480px → dates and locations move to the right edge on the same line as their text (a grouped role's location sits alone at the right of its second line) → AC-11
- [x] Print preview (Cmd+P) in dark mode → white paper, near black ink, no skip link, no footer at all, sections 22px apart (1.5rem at 11pt, about one line), no entry or keyed row cut across the page break, no heading or company line alone at a page bottom, links as plain text in ink, four pages on Letter (the last about half full) → AC-10
- [ ] Repeat the print preview in Firefox and in Safari → the same document; a heading may sit at a page bottom there (`break-after: avoid` is best effort outside Chromium), a known gap, not a failure → AC-10
- [x] Emulate `prefers-reduced-motion: reduce` → the hover colour change is instant; emulate `prefers-contrast: more` → keys, dates, and the label line turn `fg` → AC-2 (spec 0003 hardening on this page)
- [x] `pnpm dev`, open `/styleguide` → below the two panels, a full width light block and a full width dark block each show a single `CvEntry` (linked title, right meta, subtitle and aside, a summary, two bullets), a group `CvEntry` with two regular weight `h4` roles and their locations alone on the right of their second lines, and a two row `KeyedList`; hover and Tab through the links → the same states as on `/cv` → AC-13
- [x] Break step: in `src/content/cv.json` delete `volunteer`, run `pnpm build`, open `dist/cv.html` → no Leadership & activities heading; delete `awards`, `certificates`, `skills`, `technologies`, `languages`, and `interests`, build again → only Summary, Experience, Education remain; restore → AC-1, AC-7, AC-8
- [x] Break step: in `src/content/cv.json` set `endDate` `"2026-06"` on the first Ford role, run `pnpm build` → the Ford company line reads `Jan 2025 – Jun 2026` and the two roles stay grouped (both closed, newest first); restore → AC-5, AC-9
- [x] Break step: in `src/content/cv.json` move the Liverpool entry between the two Ford entries, run `pnpm build` → still one Ford group (sorting precedes grouping); then set the second Ford role's `name` to `Ford Motor Co.`, build → two separate Ford entries; restore → AC-5
- [x] Break step: delete `basics.profiles`, run `pnpm build` → the contact line holds the email alone with no dot; restore → AC-2
- [x] Break step: in `src/content/cv.json` add `{ "name": "Chess" }` to `interests`, run `pnpm build` → a last `Interests` row reads `Chess`; restore → AC-8
- [x] Read `design.md` → eleven components, `CvEntry` and `KeyedList` with their rules, the hairline heading rule, the pair rule (dates on line 1, locations on line 2), the weight line `500 for h1, entry titles, b, and strong`, the meanings `gap-x-4`, `xs:w-40`, `gap-4`, `gap-2`, `pl-5`, `pb-2`, `mx-2`, `min-h-6`, the bullet style, and the print rules → AC-13

## Commands
- [x] `pnpm build` → passes; `grep -c '<script' dist/cv.html` → 0; `grep -o '<title>[^<]*' dist/cv.html` → `<title>CV · Jorge González Ozorno`; `grep -o 'name="description" content="[^"]*' dist/cv.html` → the bio → AC-1, AC-12
- [x] `grep -o '<h[1-4][^>]*>' dist/cv.html | sort | uniq -c` → one `h1`, seven `h2` with the ids `summary`, `experience`, `education`, `leadership`, `awards`, `certifications`, `skills`, `h3`s for the entries, two `h4`; `grep -o 'aria-labelledby="[^"]*"' dist/cv.html` → the same seven ids → AC-3, AC-11
- [x] `grep -c 'role=' dist/cv.html` → 0; `grep -c 'target=' dist/cv.html` → 0; `grep -c 'style=' dist/cv.html` → 0 → AC-11
- [x] `grep -o '<address[^>]*>' dist/cv.html` → one, with `not-italic`; `grep -o 'aria-hidden="true"[^>]*>[^<]*·' dist/cv.html | wc -l` → 2 (two separators for three links) → AC-2
- [x] `grep -o 'print:hidden' dist/cv.html | wc -l` → at least 2 (the skip link and the footer); `grep -o 'break-inside-avoid\|break-after-avoid\|print:gap-6\|print:gap-4' dist/cv.html | sort | uniq -c` → all four present → AC-10
- [x] `grep -n 'printFooter' src/layouts/BaseLayout.astro src/pages/cv.astro` → the prop declared and passed as `false`; `grep -n 'class:list' src/components/SiteFooter.astro` → the merged class → AC-10
- [x] `grep -n 'export const formatProfilePath\|export const joinMeta\|export const formatLanguage\|export const groupConsecutive\|export const spanOf' src/lib/cv-format.ts` → five lines → AC-9
- [x] `pnpm test` → the new `cv-format.test.ts` cases pass (`linkedin.com/in/jorgergo`, `github.com/jorgergo`, `Aug 2025 – Present · Remote`, `English (Fluent, C2)`, `Spanish (Native)`, the Ford group, the Ford, Liverpool, Ford split, the open and closed spans) → AC-9
- [x] `pnpm exec playwright test` → the `/cv` case in `e2e/site.spec.ts` passes with the new title and the Tab stops from the fixture, the label test and the footer ring test (now on `/missing`) pass, the `cv page` block passes (header, grouping, 479px and 480px, print, no script, three woff2 requests), and `e2e/styleguide.spec.ts` passes the `CvEntry` and `KeyedList` anatomy checks → AC-4, AC-8, AC-10, AC-11, AC-12, AC-13, AC-14
- [x] `pnpm lint`, `pnpm format:check` → clean (no arbitrary value, no `dark:`, no palette class, no redundant role) → AC-14
- [x] `grep -rnE 'style="|define:vars|is:inline|set:html|target=' src/components/CvEntry.astro src/components/KeyedList.astro src/pages/cv.astro` → nothing → AC-11

## Acceptance-criteria coverage
- AC-1: preview step, sections break step, title and script greps · AC-2: preview step, hover step, profiles break step, address and separator greps, contrast preference step · AC-3: preview step, VoiceOver step, heading and landmark greps · AC-4: Experience step, hover step, Playwright · AC-5: Experience step, the two grouping break steps, Playwright · AC-6: Education step · AC-7: Awards step, sections break step · AC-8: Skills step, sections break step, Playwright · AC-9: span break step, helper grep, `pnpm test` · AC-10: print preview step, print greps, prop greps, Playwright · AC-11: VoiceOver step, 320px step, attribute greps, bans grep, Playwright · AC-12: Tab step, script grep, Playwright · AC-13: style guide step, `design.md` read, Playwright · AC-14: Playwright, lint, format

## Known gaps (not AC failures)
- `break-after: avoid` on headings and group first lines is best effort: Firefox and Safari may print one at a page bottom; Chrome honours it. The Playwright print checks run in Chromium only, so the Firefox and Safari previews stay manual.
- Grouping is by adjacency after sorting: a current job elsewhere or a return to a company splits that company's roles into two entries, by design.
- The VoiceOver landmark and list checks are manual; axe does not test Safari's list heuristic for the contact `<ul>` or the `<dl>`.
- The Tab stop list depends on which entries carry a `url` in `cv.json`; the page test derives it from the fixture, so editing URLs changes the expected stops, by design.
- External URLs (Ford, Tec, EF SET) are not fetched by the tests; they are yours to keep current.

## Added after the build (/develop, 2026-09-24)

_Break steps for value sources the list above does not exercise yet. Each changes `src/content/cv.json`, runs `pnpm build`, checks `dist/cv.html`, then restores the file with `git checkout src/content/cv.json`._

### UI / manual

- [x] Break step: delete `url` from the first Ford role (the current one) → the Ford company line still links, now to the second role's `https://www.ford.com`; delete it from both → `Ford Motor Company` is plain text and `pnpm exec playwright test --project site` still passes, since the Tab stops derive from the fixture and lose the Ford stop; restore → AC-5, AC-12, AC-14
- [x] Break step: delete `score` and `courses` from the Tec entry → the degree line reads `B.S., Computer Science and Technology` with no dot, and no `Coursework:` line follows; restore → AC-6
- [x] Break step: delete `location` from the Liverpool role → its second line holds `Process Automation Intern` alone with no right value, and the entry still renders its bullets; restore → AC-4, AC-5
- [x] Break step: delete `summary` and empty `highlights` (`[]`) on the Daimler role → the entry ends after its second line with no `Prose` block (`grep -c 'font-sans' dist/cv.html` drops by one); restore → AC-4

### Commands

- [x] `pnpm exec playwright test` after each break step above → the `cv page` block passes without a test edit, because its expectations derive from the fixture → AC-14, AC-16

### Acceptance-criteria coverage

- AC-4: the location and body break steps · AC-5: the group link and location break steps · AC-6: the degree line break step · AC-12, AC-14, AC-16: the group link break step and the Playwright rerun

## Added after the review (/architect, 2026-09-24)

_Steps for the review fixes, build plan tasks 5 to 7._

### UI / manual

- [x] `pnpm dev`, open `/styleguide`, widen the window from 480px to 1280px → in both full width blocks, the single `CvEntry`'s location stays on one line at the right of its subtitle's first line while the subtitle wraps beside it → AC-4, AC-13
- [x] `pnpm preview`, open `/cv` at 480px, 640px, and 1280px → no date or location wraps anywhere; long certificate names and the degree line wrap beside them → AC-4, AC-11
- [x] Read `design.md`'s `CvEntry` rule → the pair rule says the subtitle grows and wraps beside a whole location on line 2 → AC-13

### Commands

- [x] `grep -n 'export const formatSkillRows\|export const firstUrl\|export type KeyedRow' src/lib/cv-format.ts` → three lines → AC-15
- [x] `grep -nE 'keywordInterests|namedInterests|skillItems|groupHref|const keyed' src/pages/cv.astro` → nothing; `grep -n 'formatSkillRows\|firstUrl' src/pages/cv.astro e2e/site.spec.ts` → both files call both helpers → AC-15, AC-16
- [x] `pnpm test` → the `spec 0005 AC-15` cases pass (a name only interest and one with `keywords: []` in one `Interests` row, no `Languages` row for `[]`, `[]` for `{}`, `firstUrl` skipping a role with no `url`), and the three decode cases of `formatProfilePath` pass → AC-9, AC-15
- [x] `grep -n 'class="xs:flex-1"' src/components/CvEntry.astro` → one line, the subtitle `<p>` → AC-4
- [x] `grep -n 'SEPARATOR' src/components/KeyedList.astro` → nothing; `grep -n 'joinMeta' src/components/KeyedList.astro` → the import and the `dd` → AC-8
- [x] In a scratch copy of the repo (`cp -cR`), run each break step under *Added after the build*, then `pnpm exec playwright test --project site` → passes with no test edit each time → AC-16

### Acceptance-criteria coverage

- AC-4: the style guide width step, the `/cv` width step, the `xs:flex-1` grep · AC-8: the separator greps · AC-9: `pnpm test` · AC-13: the style guide step, the `design.md` read · AC-15: the export and page greps, `pnpm test` · AC-16: the page grep, the scratch copy Playwright runs
