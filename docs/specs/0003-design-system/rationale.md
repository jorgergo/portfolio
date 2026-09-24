# 0003. Design system: rationale

The decision record behind [index.md](index.md). `/develop` does not need this file; it explains why.

## Context

The site has no visual language yet. `src/styles/global.css` is an empty `@theme`, `BaseLayout.astro` carries no styles, and the three pages are unstyled placeholders that only prove the content wiring. Every later feature inherits what is decided here: the home page, the CV page, the share cards, the PDF, the command menu, and the portfolio page all render with these tokens, fonts, and components. Deciding page by page would give each one its own colours, its own sizes, and its own idea of what a link looks like.

Forces that shape the choice:

- **Look and feel is the top priority**, with minimalism and extreme attention to detail. With so little on each page, every choice shows, so each one has to be reasoned, measured, and written down.
- **The Claude Design draft is a starting point, not the answer.** The project "Minimalist Developer Portfolio" (`Portfolio.dc.html`) established a warm paper feel: a warm dark ground, cream text, olive and terracotta accents, IBM Plex Mono throughout, a 640px column. Measured against WCAG 2.2, its light palette fails for muted text and both accents (3.7:1 to 4.0:1, where 4.5:1 is needed), its dark muted text passes the ratio yet reads faint (APCA Lc 36), it carries a header and a theme toggle you have since dropped, and it uses inline styles the CSP forbids. Its content is placeholder content too.
- **Light and dark follow the system setting, with no toggle**, and text must meet WCAG AA in both. That rules out anything that needs JavaScript to pick a theme and anything that ships a single palette.
- **The CSP hashes styles** (spec 0001): no inline `style` attributes, no `define:vars`, no style tags injected at runtime. Colours, spacing, and states have to be classes and tokens, and fonts have to be self hosted and hashed.
- **The CV must print well** and the Release 2 PDF must match the page. Paper needs black ink on white, point sizes, page margins, and rules for what disappears in print, decided once.
- **Two pages now, more later**, including a projects page that wants motion. The system has to leave room for animation without paying for it on the pages that do not move.
- **A static site with a near zero JavaScript budget** and a small font budget. Theming, focus, motion, and print all have to be CSS.
- **The stack is fixed**: Tailwind v4 with tokens in CSS, the Astro Fonts API, Vitest for tests, and a lint setup that already bans inline styles.

Not deciding means each page invents its own look, contrast is checked by eye or not at all, print is an afterthought, and the PDF drifts from the web CV.

## Options considered

### Option 1: A semantic token system on Tailwind v4, two Plex typefaces, the draft's palette corrected, eight small components

Six colour roles defined once in `@theme` with `light-dark()`, IBM Plex Mono as the interface face and IBM Plex Sans for CV prose, the draft's hues kept with their lightness corrected to pass AA in both modes, a print token layer, a fixed set of base components, a dev only style guide, and a unit test that proves the contrast numbers.

**Pros**:
- Keeps the character you liked in the draft while fixing what the measurements disproved.
- Theming needs no JavaScript and no duplicated classes; every colour is written once.
- Contrast becomes a build gate, not a hope.
- Every later page composes the same eight pieces, so the site stays one site.

**Cons**:
- More decisions and more files up front than styling two pages by hand.
- Two web fonts cost about 30 kB on the home page and 76 kB on the CV page, plus a few config lines; system fonts would cost nothing.
- `light-dark()` needs a 2024 browser; older browsers cannot compute the tokens and show black text on white.

### Option 2: Adopt the Claude Design draft as it is

Convert the draft's inline styles to classes, keep its all mono typography, its header, its theme toggle, and its palette, and ship.

**Pros**:
- Fastest path to a styled site; the look is already agreed in spirit.
- One typeface, one short list of tokens.

**Cons**:
- The light palette fails WCAG AA on three roles, which the scope forbids.
- The toggle needs JavaScript, storage, and a flash guard, and contradicts the no toggle rule.
- The header contradicts the decision to drop it, and the print layer does not exist.
- Mono prose in the CV reads slower and prints like a typewriter.

### Option 3: A ready made component library or UI kit

Adopt a Tailwind based kit, or a component collection you copy into the repo, for buttons, chips, links, and a dark mode switch.

**Pros**:
- Components and states arrive finished; dark mode is built in.
- Documentation and examples exist.

**Cons**:
- The look is the kit's, not yours; undoing it costs more than writing eight small components.
- Hundreds of unused tokens and utilities, and overrides that fight defaults.
- The kit's palette is not guaranteed to meet AA on a warm cream and a warm dark ground; you would still do the contrast work.
- A dependency to upgrade for a site that needs a handful of pieces.

### Option 4: Neutral greys, one accent, system fonts only

A near white and near black palette with a single accent, and the operating system's monospace and sans fonts.

**Pros**:
- Zero font bytes and no font configuration.
- The most conventional and the hardest to get wrong.

**Cons**:
- The look changes per operating system (SF Mono on a Mac, Consolas on Windows, DejaVu on Linux), so the type scale and line lengths cannot be tuned precisely.
- Loses the warm paper identity, the one clear thing the draft got right.
- Neutral plus one accent is the most common look in developer portfolios today.

### Alternatives weighed inside the chosen option

- **Palette direction.** Four AA safe directions were built and compared side by side on a live bench page: warm paper (the draft corrected), peach and moss (closer to fbold.dev), ink and bone (neutral with one terracotta accent, closest to t3.gg), and slate (cool greys with blue). Warm paper won because it keeps the draft's character and its two accent roles; peach reads tinted on cheap screens, ink and bone is the crowded default, slate reads as a product page.
- **Typography model.** All mono (the draft, t3.gg, fbold.dev), sans prose everywhere with mono details (cv.jarocki.me), serif prose, and the chosen two surfaces model. Mono everywhere was the identity you wanted, but long CV bullets in mono read noticeably slower and print like a typewriter; the two surfaces rule keeps mono as the interface on every page and uses the sans only for document prose.
- **Monospace family.** IBM Plex Mono (the draft), JetBrains Mono (the most praised open mono in the Hacker News threads read for this decision), Commit Mono (a well received Show HN release, Fontsource only), Geist Mono (used by t3.gg and cv.jarocki.me, and the most common 2026 look). Plex Mono was kept: a humanist mono drawn for running text with strong hinting at small sizes, and its sans sibling shares its x height and rhythm.
- **Sans family.** IBM Plex Sans, Inter (the forum and roundup default), Geist, Atkinson Hyperlegible Next. Plex Sans was chosen for the superfamily match; Inter would pair better with JetBrains Mono or Geist Mono.
- **Font delivery.** Fontsource packages through Astro's local provider (four package imports, pinned by the lockfile, no network for fonts at build), the npm provider (reads the package CSS but rewrites the file URLs to a CDN, downloads them at build, and filters only by format), the Fontsource or Google providers (download at build), or local woff2 files in git (manual updates). Pinned packages read straight from `node_modules` suit a CI build that must be reproducible.
- **Theme switching.** `light-dark()` tokens (chosen), a `prefers-color-scheme` media block repeating every value, or Tailwind `dark:` variants on every element. The media block is the fallback if a 2023 browser ever matters.
- **Contrast bar.** WCAG AA only, AA plus APCA Lc 55 on secondary text (chosen), or AAA for body text. The APCA check exists because the draft's dark muted text passed 4.8:1 yet sat at Lc 36, which looks faint; AA alone would have let it through.
- **Style guide exclusion.** Dev only route injection (chosen), a dynamic route whose `getStaticPaths` returns nothing in production, or shipping it with `noindex`.
- **Animation library** for later pages: Motion (chosen: the Web Animations API underneath, no style tag injection, small), GSAP (richer, heavier), anime.js, or hand written CSS and Web Animations only.

## Rationale

The draft settled the character, and the measurements settled what had to change. Option 1 keeps the first and fixes the second: the same olive and terracotta hues, moved in OKLCH lightness only, so the light palette passes 4.5:1 and the dark muted text reaches Lc 55 without changing the feel. Options 2 and 4 each give up one of those two things, and Option 3 gives up both for speed the site does not need.

`light-dark()` fits every force at once: no JavaScript, no flash, no toggle, one value per role, and nothing for the CSP to block. The Plex superfamily is what makes the two surfaces model read as one site: the mono and the sans share proportions, so a CV page with sans prose and mono dates does not look like two designs stitched together. Pinning the fonts as packages keeps the build reproducible in CI, which matters more than saving one dependency. The dev only style guide gives you a place to judge the details you care about without shipping a page recruiters could find. Writing the contrast test now turns "meets AA in both modes" from a review note into something `pnpm test` refuses to let regress.

## Evidence

### Contrast audit of the Claude Design draft (WCAG 2.2 ratio, APCA Lc)

| Role | Light on `#f2ede3` | Dark on `#1b1916` |
|---|---|---|
| Body text | `#2b2722` 12.7:1, Lc 91, pass | `#e6dfd2` 13.2:1, Lc 86, pass |
| Muted text | `#7b7366` 4.0:1, Lc 62, **fail** | `#8d8576` 4.8:1, Lc 36, pass but faint |
| Olive accent | `#6f7a4b` 3.95:1, Lc 62, **fail** | `#b7a77a` 7.4:1, Lc 54, pass |
| Terracotta accent | `#b8643c` 3.65:1, Lc 59, **fail** | `#c9835a` 5.7:1, Lc 43, pass but faint |
| Selected text (bg on olive) | 3.95:1, **fail** | 7.4:1, pass |

### Final tokens, measured

| Pair | Light | Dark | Print |
|---|---|---|---|
| fg on bg (body text, needs 4.5:1) | 12.71:1, Lc 91 | 13.24:1, Lc 86 | 17.72:1, Lc 105 |
| muted on bg (meta, needs 4.5:1 and Lc 55) | 4.64:1, Lc 67 | 7.61:1, Lc 55 | 9.47:1, Lc 92 |
| accent on bg (labels, needs 4.5:1 and Lc 55) | 4.63:1, Lc 66 | 7.62:1, Lc 55 | 7.42:1, Lc 86 |
| accent-warm on bg (hover text, needs 4.5:1 and Lc 55) | 4.65:1, Lc 66 | 7.59:1, Lc 55 | 17.72:1, Lc 105 |
| accent on bg (focus ring, needs 3:1) | 4.63:1 | 7.62:1 | 7.42:1 |
| muted on bg (button border, needs 3:1) | 4.64:1 | 7.61:1 | 9.47:1 |
| bg on accent (selected text, needs 4.5:1) | 4.63:1 | 7.62:1 | 7.42:1 |
| line on bg (hairline, decorative, no requirement) | 1.26:1 | 1.23:1 | 1.54:1 |

Ratios are WCAG 2.2 contrast ratios; Lc is the APCA lightness contrast (algorithm 0.0.98G, sign dropped), computed with the same maths the spec asks the build to ship in `src/lib/contrast.ts`.

### Reference sites, measured in a browser on 2026-09-24

| Site | Body face | Body size | Column | Ground and text | Notes |
|---|---|---|---|---|---|
| t3.gg | Geist Mono 400 | 16px on 24px | 320px | `#050505` and `#fafafa` | muted `#525252` on near black is about 2.9:1, below AA; footer 14px with 0.7px tracking |
| fbold.dev | Necto Mono (commercial) | 16px on 24px | 512px | `#f7dfca` and `#312320`, green `#4a5d46` headings | warm peach ground, its own theme toggle |
| cv.jarocki.me | Geist Sans 400 body, Geist Mono 14px meta at 80 percent opacity | 16px on 24px | 672px | white and `#030712` | print rules: 12px text, wider padding, animations disabled |

### Palette directions built for comparison (all AA safe, values solved in OKLCH)

| Direction | Light: bg, fg, muted, accents | Dark: bg, fg, muted, accents |
|---|---|---|
| P1 warm paper (chosen) | `#f2ede3`, `#2b2722`, `#71695c`, `#646f3f`, `#a5532a` | `#1b1916`, `#e6dfd2`, `#b2aa9a`, `#baaa7c`, `#e29a70` |
| P2 peach and moss | `#f8e4d4`, `#2f231f`, `#766358`, `#526d4c`, `#a84932` | `#1d1713`, `#eadfd3`, `#baa798`, `#91b389`, `#e99577` |
| P3 ink and bone | `#fafaf9`, `#1c1917`, `#77716d`, `#b2582c` | `#131211`, `#f0eeeb`, `#aea8a3`, `#e4966b` |
| P4 slate | `#f8fafc`, `#0f172a`, `#6a727d`, `#3c6ecf` | `#0f1117`, `#e2e8f0`, `#a1aab6`, `#6baef1` |

### Font research summary

- Forum evidence (Hacker News threads on favourite monospace fonts, the Monaspace release, the Commit Mono release, and Berkeley Mono) praises JetBrains Mono most among open faces, then Iosevka, Monaspace, Commit Mono, and Fira Code; Berkeley Mono and PragmataPro lead the paid ones. Reddit blocks automated reads, so its evidence came from search snippets only.
- Sans faces for personal sites: Inter is the roundup default ("use one font everywhere"), Geist is the 2026 fashion, IBM Plex Sans is the open corporate standard; Hanken Grotesk, Switzer, Satoshi, Mona Sans, Public Sans, Manrope, Figtree, and Atkinson Hyperlegible had no forum mentions.
- Availability checked: IBM Plex Mono and IBM Plex Sans are OFL licensed, on Google Fonts and Fontsource (`@fontsource/ibm-plex-mono` and `@fontsource/ibm-plex-sans`, version 5.3.0 today). The latin 400 and 500 woff2 files are 14.7 and 14.9 kB for the mono and 22.6 and 24.2 kB for the sans, exported by the packages as `./files/*.woff2`.
- WCAG 2.2 AA thresholds confirmed: 1.4.3 text 4.5:1 and large text 3:1, 1.4.11 non text 3:1, 2.4.7 focus visible, 2.4.11 focus not obscured (minimum), 2.5.8 target size 24 by 24 CSS pixels; 2.4.13 focus appearance is AAA. APCA remains a candidate method in the WCAG 3 draft, with Lc 75 as the body text minimum and Lc 60 for larger or bolder text; this spec uses it only as a stretch check on secondary text.

### Astro and Tailwind facts verified in the installed packages

- The Fonts API is stable: `fonts` is a top level option since Astro 6.0. The installed 7.3.4 resolves a local provider `src` written as a package import through Node resolution, so the four Fontsource files can be named directly. Its npm provider reads a package's CSS from `node_modules` but rewrites the file URLs to jsDelivr, downloads them at build, and filters only by format, so it cannot pin four files or build offline.
- The `<Font />` component writes its `@font-face` rules into an inline `<style>`, and when `security.csp` is on the fonts plugin registers that style's hash, so the CSP does not block it. This closes the spec 0001 follow up.
- Tailwind v4.3 turns `@theme` entries into CSS variables that utilities reference with `var()`, so a token holding `light-dark()` resolves per element at use time.
