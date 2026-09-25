# Verify: Metadata & share cards · spec 0006 · updated 2026-09-25
_Steps derived from spec 0006 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

Page steps run on `pnpm preview` (the built site with real headers) unless a step says `pnpm dev`. View the head with the browser's view source or the Elements panel. Light and dark follow the operating system setting, or emulate `prefers-color-scheme` in the rendering panel. Break steps change a file, build, check, then restore: copy the file aside first and copy it back afterwards, rather than `git checkout`, which would also wipe any content edit you have not committed.

The first build was compared pixel by pixel with the bench renders (the private bench page linked in the spec): `/og/cv.png`, `/og/home.png`, `/apple-touch-icon.png`, and the worst case at the caps were identical, and the favicon paths matched byte for byte. A later difference means the layout changed.

## UI / manual
- [x] Open `/`, view source → the title reads `Jorge González Ozorno · Full Stack Developer`; right after the description meta come the canonical `https://jorgergo.dev/`, then `og:type` `website`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` `https://jorgergo.dev/og/home.png`, `og:image:type` `image/png`, `og:image:width` `1200`, `og:image:height` `630`, `og:image:alt` `Jorge González Ozorno, Full Stack Developer`, and `twitter:card` `summary_large_image`, in that order; then the favicon link, then the Apple touch icon link → AC-3, AC-5, AC-9
- [x] Open `/cv`, view source → the title reads `CV · Jorge González Ozorno`; the description reads `The CV of Jorge González Ozorno, Full Stack Developer: experience, education, skills, and technologies.`; the canonical and `og:url` are `https://jorgergo.dev/cv`, never `/cv.html`; `og:image` is `https://jorgergo.dev/og/cv.png` and its alt `CV, Jorge González Ozorno, Full Stack Developer` → AC-3, AC-4, AC-5
- [x] Open `/missing` → status 404, the title reads `Not found · Jorge González Ozorno`, the description `This page does not exist.`, and the head holds no canonical, no `og:` tag, and no `twitter:` tag → AC-3, AC-5
- [x] Open `/og/home.png` and `/og/cv.png` → 1200×630 on warm paper, Plex Mono throughout: the CV card starts with an olive uppercase `CV`, then the name large and dark, the role in muted grey, and at the bottom a hairline with `jorgergo.dev/cv` on the left and `Toluca, MX` on the right; the home card has no label and reads `jorgergo.dev` in its footer; each file is under 300 KB (about 40 KB) → AC-6, AC-7
- [ ] Open `/favicon.svg` in light mode, then dark mode → a rounded paper tile with a dark `J`, then a dark tile with a light `J`; the browser tab icon switches the same way → AC-8
- [x] Open `/apple-touch-icon.png` → 180×180, square corners, no transparent pixels, a dark `J` on paper → AC-9
- [x] Open `/` and `/cv` with the network panel open and reload → no script, no request to `/og/` or `/apple-touch-icon.png`, only the page, the stylesheet, the Plex files, and at most the favicon; the console shows no Content Security Policy error → AC-11
- [x] `pnpm dev`, open `/styleguide`, scroll to the end → below the panels a `Share cards and icons` section shows the home card and the CV card at column width inside a hairline border, then the favicon at 16 and 32px and the Apple icon at 60px, all loaded; switch light and dark → the cards stay light, the favicons switch → AC-12
- [x] Read `design.md` → a `Share cards and icons` section with the canvas, padding, sizes, the label and footer rules, light tokens only, Plex Mono only, the two caps, the favicon tile and its dark switch, and the square opaque Apple icon; the `BaseLayout` entry names the `share` prop → AC-12
- [ ] After Go live: paste `https://jorgergo.dev/cv` into LinkedIn's Post Inspector, a new X post, and a WhatsApp chat → each shows the CV card and the CV title; the home URL shows the home card → AC-14

## Value sourcing (vary the input, check the output)
- [x] Break step: in `src/content/cv.json` set `basics.label` to `Senior Full Stack Developer` (27 characters), run `pnpm build` → the `/` title, both cards' role line, and both `og:image:alt` values change, with no code edit; restore → AC-2, AC-3, AC-7 (title, card role, alt)
- [x] Break step: set `basics.name` to `Maximiliano Alejandro Ferreira` (30 characters), build → every title and `og:site_name` follow, the name on both cards wraps to two lines and the role still ends above the hairline, and the favicon and Apple icon show `M`; restore → AC-2, AC-7, AC-8, AC-9 (name, site name, monogram)
- [x] Break step: change `basics.bio`, build → the `/` description meta and `og:description` follow; the CV description does not; restore → AC-4 (home description)
- [x] Break step: delete `technologies` from `cv.json`, build → the CV description ends `: experience, education, and skills.`; delete `skills` too → `: experience and education.`; restore → AC-4 (CV description)
- [x] Break step: set `basics.location.city` to `Monterrey`, build → both card footers read `Monterrey, MX` on the right (and the page footer follows); restore → AC-7 (footer right)
- [x] Break step: in `astro.config.mjs` set `site` to `https://example.com`, build → the canonicals, `og:url`, `og:image`, and the card footers (`example.com`, `example.com/cv`) all move; restore → AC-1 (canonical, image URL, footer left)
- [x] Break step: in `src/styles/global.css` change the light half of `--color-accent`, build → the CV card's `CV` label takes the new colour and nothing else on the cards changes; restore → AC-7 (card colours)
- [x] Break step: change the dark half of `--color-bg`, build → `/favicon.svg` carries the new value inside its `prefers-color-scheme: dark` rule; restore → AC-8 (favicon fills)
- [x] Read `SHARE_PAGES` in `src/lib/site-meta.ts` → the `/cv` title prefix and card label are the row's `label` `CV`; the card file names are the row keys → AC-5, AC-7 (row label and key)
- [x] Open `dist/favicon.svg` → only `<path>` shapes, no `<text>` and no font file: the glyphs come from the Plex Mono woff files at build time → AC-8 (glyph shapes)

## Commands
- [x] `pnpm build` → passes and writes `dist/og/home.png`, `dist/og/cv.png`, `dist/favicon.svg`, and `dist/apple-touch-icon.png`; `public/favicon.svg` no longer exists → AC-6, AC-8, AC-9
- [x] Break step: set `basics.label` to 28 characters, `pnpm build` → fails at `basics.label` (`<=27 characters`); restore → AC-2
- [x] Break step: delete the `site` line from `astro.config.mjs`, `pnpm build` → fails with `astro.config.mjs sets no site, so the card has no URL; see spec 0006`; restore → AC-1, AC-6
- [x] `pnpm test` → the `site-meta`, `share-card`, and `cv-schema` cases pass → AC-2, AC-10
- [x] `pnpm exec playwright test` → every case passes, including the share tags, image, icon, 404, and style guide cases → AC-11, AC-12, AC-13
- [x] `pnpm lint && pnpm format:check` → pass → AC-13
- [x] `git diff main -- public/_headers` → empty → AC-11

## Acceptance-criteria coverage
- AC-1 … `site` break step, domain break step · AC-2 … label and name break steps, the 28 character build failure, `pnpm test` · AC-3 … `/`, `/cv`, and `/missing` head steps · AC-4 … `/cv` head step, bio and sections break steps · AC-5 … the three head steps, `SHARE_PAGES` read · AC-6 … card files step, `pnpm build`, missing `site` failure · AC-7 … card files step, label, name, city, and accent break steps · AC-8 … favicon step, dark `bg` break step, `dist/favicon.svg` read · AC-9 … Apple icon step, name break step · AC-10 … `pnpm test` · AC-11 … network step, `_headers` diff, Playwright · AC-12 … style guide and `design.md` steps · AC-13 … Playwright, lint, format · AC-14 … the after Go live step

## Card limits (added after the review, 2026-09-25)
_Steps for AC-15 to AC-18. Break steps edit `src/content/cv.json` (or `astro.config.mjs`), run `pnpm build`, check, then copy the file back, as above._

### UI / manual
- [ ] Open `/og/home.png`, `/og/cv.png`, and `/favicon.svg` → unchanged from before the limits: today's content passes every new rule, the name still sits on one line, and the favicon still shows `J` → AC-7, AC-8

### Value sourcing (vary the input, check the output)
- [ ] Break step: set `basics.name` to `Łukasz Żółkiewski` → the build fails with `basics.name: characters outside the card font (latin): Ł, Ż, ł; see spec 0006`; restore → AC-15 (`CARD_GLYPHS`)
- [ ] Break step: set `basics.name` to `Seán O’Brien` → the build passes and `/og/cv.png` draws the `é` and the curly apostrophe, with no empty box; restore → AC-15
- [ ] Break step: set `basics.label` to `Разработчик`, then `basics.location.city` to `Москва` → each build fails at that field, naming every Cyrillic letter once; restore → AC-15
- [ ] Break step: set `basics.name` to `Łukasz` plus a space and 24 letters (31 characters) → one build reports both problems, the 30 character cap and the `Ł`; restore → AC-15
- [ ] Break step: in a scratch copy, set `FONT_SUBSET` in `src/lib/share-card.ts` to `'latn'` → `astro check` fails; then confirm `render-image.ts` builds the font paths from `FONT_SUBSET` and `cv-schema.ts` names it in the glyph message, so one constant sets both → AC-15 (`FONT_SUBSET`)
- [ ] Break step: set `basics.name` to `Ada` plus a space and a 25 letter part → the build fails with `a name part holds 25 characters, over 24 (one card line); see spec 0006`; restore → AC-16 (`CV_LIMITS.namePart`)
- [ ] Break step: set `basics.name` to `Ada Wolfeschlegelsteinhausen` (a 24 letter part), then to `Wolfeschlegel-Steinhausenberg` → both build; on `/og/cv.png` the long part sits on its own line and the hyphenated name breaks right after its hyphen, both inside the right padding; restore → AC-16
- [ ] Break step: set `basics.location.city` to 25 letters → the build fails at `basics.location.city` (`<=24 characters`); restore → AC-17 (`CV_LIMITS.city`)
- [ ] Break step: set `basics.location.city` to 24 letters and `site` to `https://jorge-ramon-gonzalez-ozorno.dev` → the build fails with `the cv card footer holds 62 characters, over 60; shorten basics.location.city, the site host, or the page path; see spec 0006`; restore both → AC-17 (`FOOTER_BUDGET`)
- [ ] Break step: set `basics.label` to `Senior Full Stack Developer` → the build passes, the `/` title, both card role lines, and both alt texts change, and `pnpm test` and `pnpm exec playwright test` both pass with no test edit; restore → AC-18

### Commands
- [ ] `pnpm test` → passes, including the glyph, `monogram`, name part, city, and `footerLength` cases, and the render cases: a 24 letter part and the hyphenated name inside the padding, the footer gap at least 32px at 60 characters (34px measured) and under 32px at 61 → AC-10, AC-15, AC-16, AC-17
- [ ] `grep -l cv.json src/lib/*.test.ts` → only `src/lib/cv-schema.test.ts` → AC-18
- [ ] `pnpm build`, `pnpm lint`, `pnpm format:check`, and `pnpm exec playwright test` → pass → AC-13

### Acceptance-criteria coverage
- AC-7 … card files step, 24 letter part and hyphen steps · AC-8 … favicon step, `monogram` cases in `pnpm test` · AC-15 … the `Ł`, `Seán`, Cyrillic, two problem, and `FONT_SUBSET` steps · AC-16 … the 25 letter part, 24 letter part, and hyphen steps · AC-17 … the city cap and footer budget steps, the footer gap render cases · AC-18 … the label edit step, the `grep` step
