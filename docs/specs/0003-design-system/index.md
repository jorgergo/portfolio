# 0003. Design system and UI foundation

**Date**: 2026-09-24
**Status**: Proposed

## Summary

The site gets one small visual language that every page shares: six colour roles that switch between light and dark by the visitor's system setting, two typefaces (IBM Plex Mono for the interface, IBM Plex Sans for CV prose), a 640px column, quiet motion, a print layer for the CV, and eight small components. The Claude Design draft is the starting point, not the answer: its warm paper feel is kept, its light colours are corrected because three of them failed the WCAG AA contrast bar, and its header, toggle, and inline styles are dropped. A unit test proves the contrast numbers on every build, and a style guide page exists only in development.

## Requirements

**User stories**:
- As a visitor, I want the site to read comfortably in my system's light or dark mode, on my phone, by keyboard, and on paper, so that nothing about the presentation gets in the way of the content.
- As the site owner, I want the look defined once (colours, type, spacing, components) with the accessibility bar enforced by the build, so that I can polish details in one place and never ship a colour that fails contrast.
- As the builder of a later page (home, CV, metadata, command menu, portfolio), I want tokens, a page shell, and components with written rules, so that I compose rather than invent, and the site stays one site.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `src/styles/global.css` defines the six colour tokens in `@theme` exactly as the token table (`--color-bg`, `--color-fg`, `--color-muted`, `--color-line`, `--color-accent`, `--color-accent-warm`), each as `light-dark(<light>, <dark>)`, and `:root` sets `color-scheme: light dark`. No `.astro` file under `src/` uses a `dark:` variant, a literal hex colour, or a Tailwind palette class (`text-stone-500` and the like); colours come only from the tokens, and the two `theme-color` metas in `BaseLayout.astro` are computed from the parsed tokens, not written by hand.
- **AC-2**: Every text pair in the contrast table (fg, muted, accent, accent-warm on bg, and bg on accent, in light, dark, and print) is at least 4.5:1; the focus ring (accent on bg) and the button border (muted on bg) are at least 3:1; muted, accent, and accent-warm text reach APCA |Lc| 55 or more in every scheme. `src/lib/contrast.test.ts` proves this by parsing `global.css` (imported with `?raw`); changing any of those values to a failing one makes `pnpm test` fail, naming the pair and the scheme.
- **AC-3**: IBM Plex Mono and IBM Plex Sans, weights 400 and 500, normal style, latin subset, woff2 only, come from the pinned `@fontsource` packages through the `fonts` option in `astro.config.mjs` with the local provider, one variant per file. `dist/` contains exactly four font files, every page preloads only the Plex Mono 400 file, no page requests a third party origin, `pnpm build` needs no network for fonts, and `pnpm preview` shows no CSP violation.
- **AC-4**: Body text is mono at 1rem (16px) with line height 1.6 in `fg` on `bg`; `Prose` switches to sans; meta text is `text-sm` (0.875rem); labels are `text-xs` (0.75rem), uppercase, tracked 0.1em, in accent; the home page h1 is `text-title` (1.375rem, line height 1.3) at weight 500 and inner page h1s are `text-lg` (1.125rem) at weight 500; `b` and `strong` render at weight 500. Components use rem based `text-*` utilities, never pixel sizes.
- **AC-5**: The content column is `max-w-content` (40rem), centred, with page padding `pt-10 px-6 pb-20` and `gap-14` between main and footer; sections sit `gap-14` (56px) apart and blocks `gap-6` (24px). At 320px wide nothing scrolls sideways and long URLs or emails wrap (`overflow-wrap: anywhere` on `body`). An `xs` breakpoint token (30rem, 480px) exists for the CV page spec's column collapse.
- **AC-6**: Every page renders through `BaseLayout`, which outputs `<html lang="en">`, `<meta name="color-scheme" content="light dark">`, two `theme-color` metas whose values are the light and dark `bg` tokens (`#f2ede3`, `#1b1916`), `<title>` and `<meta name="description">` from its two required props, the two `<Font />` components, a skip link as the first focusable element that moves focus to `<main id="main">`, and `SiteFooter` on every page: `City, CC · YYYY` (city and country code from `cv.json`, the UTC year of the build) plus a `← home` link on every route except `/`. In this feature `/` and `/cv` pass `basics.bio` as their description (the metadata spec refines it) and the 404 page passes `Not found` and `This page does not exist.`
- **AC-7**: `TextLink` renders an underlined link (1px thick, `underline-offset-link`, underline in muted) in `fg` that turns accent-warm (text and underline) on hover and on keyboard focus, and whose underline is 2px under `prefers-contrast: more`. `IconLink`, `Button` links, and the footer link carry no underline and turn accent-warm on hover and focus. External `https` and `mailto:` links open in the same tab (no `target` attribute anywhere), and an external `IconLink` shows the ArrowUpRight icon after its label.
- **AC-8**: Every interactive element shows a 2px solid accent outline offset 3px on `:focus-visible` and no outline after a mouse click; keyboard tab order follows the visual order: skip link, main content, footer. The `<main>` container is the one element allowed to hide its outline (it only receives focus from the skip link).
- **AC-9**: `src/components/` holds `SkipLink`, `SiteFooter`, `TextLink`, `SectionHeading`, `TagChip`, `IconLink`, `Button`, and `Prose`, and `src/components/icons/` holds `GitHub`, `LinkedIn`, `Mail`, `ArrowUpRight`, and `Download`, with the props in the API table. Every component renders semantic HTML: real heading elements, `<a>` for navigation, `<button>` for actions, icons `aria-hidden="true"` next to visible text, no ARIA roles on generic elements, and no UI library import. `README.md` carries a Credits section with the Tabler (MIT) and Lucide (ISC) notices.
- **AC-10**: The only animation on the base pages is Tailwind's `transition-colors` (colour, background, border, outline, text decoration, fill, stroke) at the theme defaults set in `@theme` (150ms, the motion easing); `--motion-quick` (150ms), `--motion-base` (250ms), `--motion-slow` (400ms), and `--motion-ease` are defined on `:root`; under `prefers-reduced-motion: reduce` every animation and transition is disabled site wide; no element is hidden at rest waiting for an animation.
- **AC-11**: Under `@media print` the tokens take the paper values from the token table, `color-scheme` is `light`, `@page` sets an 18mm margin, the root font size is 11pt (so `text-sm` prints at about 9.6pt), the column drops its minimum height and padding, the skip link, the footer home link, and every `Button` are hidden, links print as plain text without underline, and `TagChip` prints as plain text with no border.
- **AC-12**: Under `forced-colors: active` links keep their underline, the focus outline remains, and icons and borders draw in `currentColor`; under `prefers-contrast: more` muted text uses `fg` and `TextLink` underlines are 2px; the theme-color and color-scheme metas of AC-6 exist; the 320px rule of AC-5 holds.
- **AC-13**: `pnpm dev` serves `/styleguide` from `src/pages/_dev/styleguide.astro`, rendered through `BaseLayout` with a `scheme-light` panel and a `scheme-dark` panel side by side. Each panel shows every colour token as a `bg-*` swatch with its live WCAG ratio and APCA Lc (computed by `src/lib/contrast.ts` from `global.css?raw`), the print values as text, both type surfaces as specimens, the spacing scale in use, and every component and icon once (hover and focus states shown by interacting). `pnpm build` writes no `styleguide` file into `dist/`.
- **AC-14**: `design.md` at the repo root records the character, the two surfaces rule, the token roles with pointers to `global.css` (no duplicated values), the type scale, the spacing and layout rules, the component list with usage rules, motion, print, hardening, do's and don'ts, responsive behaviour, and the design source (this spec, and the Claude Design draft as a starting point only).
- **AC-15**: `pnpm build`, `pnpm lint`, `pnpm format:check`, and `pnpm test` pass; `/`, `/cv`, and the 404 page render through the shell; `/` and `/cv` show `basics.name` in the styled h1 and the 404 page shows `Not found` with a `TextLink` home; the `AGENTS.md` bans hold (no `style=""`, `define:vars`, `is:inline`, or `set:html` anywhere under `src/`).

## Decision

**Chosen option**: Option 1: a semantic token system on Tailwind v4, two Plex typefaces, the draft's palette corrected, eight small components.

Six colour roles written once as `light-dark()` tokens, IBM Plex Mono as the interface face on every page with IBM Plex Sans for CV prose, the draft's hues kept and their lightness corrected to pass AA in both modes, a print token layer, a fixed set of base components, a development only style guide, and a Vitest test that proves the contrast numbers.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) for the Fonts API, `injectRoute`, and component conventions · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) for the skip link, focus, target size, and reduced motion patterns · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) for `@theme`, `@theme inline`, variants, and v4 gotchas · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) for the contrast test · `review-animations` (`emilkowalski/skills`, `.agents/skills/review-animations/`) for the motion rules now and the projects page later.

Settled while writing (each with the runner up):

- **Token names by role, not by hue.** `bg`, `fg`, `muted`, `line`, `accent` (olive, for structure: labels, selection, focus ring), `accent-warm` (terracotta, for interaction: hover, active). Runner up: `olive` and `terracotta`, which reads well today and wrong the day a hue changes.
- **The colour tokens hold `light-dark()` values inside `@theme`**, so `bg-bg`, `text-muted`, `border-line`, `outline-accent`, and friends switch by the system setting with no JavaScript; `:root { color-scheme: light dark }` is what makes `light-dark()` resolve. Print, the contrast preference, and forced colours override the same variables in `@layer base`, which beats the theme layer in Tailwind's cascade. Runner up: a `prefers-color-scheme` media block repeating every value.
- **The palette has exactly one source.** `BaseLayout` imports `global.css?raw`, parses the tokens with `parseColorTokens`, and writes the two `theme-color` metas from the light and dark `bg` values. No literal colour exists anywhere outside `global.css`. Runner up: two hand written metas kept in sync by a test.
- **No opacity modifiers on colour tokens** (`text-fg/80` and the like): the muted role exists so that every secondary colour is a measured token, not a blend the test cannot see.
- **Spacing uses Tailwind's numeric scale with documented meanings** (`gap-14` between sections and between main and footer, `gap-6` inside a block, `pt-10 px-6 pb-20` for the page, `gap-2` between an icon and its label) rather than custom named spacing tokens. The added theme tokens sit in namespaces confirmed in Tailwind 4.3: `--container-content: 40rem` (`max-w-content`), `--tracking-label: 0.1em` (`tracking-label`), `--text-underline-offset-link: 0.2em` (`underline-offset-link`), and `--breakpoint-xs: 30rem` (`xs:`). No arbitrary values appear in components. Runner up: named spacing tokens, whose namespace behaviour changed between Tailwind 4.0 and 4.1.
- **Type scale**: `--text-title: 1.375rem` with `--text-title--line-height: 1.3` for the home h1, and the default `--text-base--line-height` raised to 1.6; every other step is Tailwind's default (`text-xs`, `text-sm`, `text-base`, `text-lg`). Weight 500 is the only emphasis weight, so `b` and `strong` are set to 500 in the base layer; 600 and 700 are not shipped, and without that rule browsers would fake a bold. Runner up: a full custom scale, which the two pages do not need.
- **Fonts are loaded with `fontProviders.local()`, one variant per file**, each `src` a package import of the exact Fontsource file (for example `@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2`). Astro resolves a package import through Node resolution (the packages export `./files/*.woff2`), copies the four files into `dist/`, hashes the generated `<style>`, and never touches the network. Runner up: the npm provider, which reads the package CSS from `node_modules` but rewrites the file URLs to a CDN, downloads them at build, and filters only by format, so it can neither pin four files nor build offline.
- **Fonts are registered in Tailwind with `@theme inline`** (`--font-mono: var(--font-plex-mono)`, `--font-sans: var(--font-plex-sans)`), the pattern the Astro docs give, so `font-mono` and `font-sans` point at Astro's generated families with their metric matched fallbacks. The `<Font />` for Plex Mono preloads only the 400 file (`preload={[{ weight: 400 }]}`); Plex Sans is not preloaded, since it appears only on the CV page below the header.
- **Transitions come from the theme defaults.** `@theme` sets `--default-transition-duration: 150ms` and `--default-transition-timing-function: cubic-bezier(0.2, 0, 0, 1)` (the same values as `--motion-quick` and `--motion-ease`), so components write a bare `transition-colors` and never a duration class. Runner up: `duration-150` on every component, which drifts from the tokens.
- **Icons share one drawing style**: all five are outline icons on a 24 unit grid with a 2 unit stroke in `currentColor` and no fills, so the GitHub and LinkedIn marks (Tabler, MIT) match Mail, ArrowUpRight, and Download (Lucide, ISC). Each icon file names its source and the icon set version in a comment, and `README.md` reproduces both licence notices. Runner up: Simple Icons' filled GitHub mark, which would sit next to outline icons.
- **`SiteFooter` reads `getCv()` itself** for the city and country code, so the layout stays dumb and the 404 page gets the same footer. Pages keep calling `getCv()` for their own content; the second call is served from Astro's in memory content store. This spec authorises that exception to the `AGENTS.md` rule "pages call `getCv()` once" until `/sync` rewords it (see Follow-up). The footer shows `City, CC` from `basics.location` directly (your `Toluca, MX`), not `formatLocation`, which spells the country out.
- **The footer year is the UTC year of the build** (`new Date().getUTCFullYear()`). The site is rebuilt on every push, so it drifts only if nothing is pushed in a new year; that is accepted and noted in Consequences. Runner up: a hand maintained constant, which drifts worse.
- **The home link decision uses `Astro.routePattern`**, not `Astro.url.pathname`: with `build.format: 'file'` the pathname is `/index.html` during the build, so a pathname check would ship the link on the home page.
- **Buttons have a `muted` border** (4.6:1 in light, 7.6:1 in dark) and chips a `line` hairline (decorative). A button's text identifies it, so WCAG does not require the border to reach 3:1, but a visible boundary reads better on paper and in screenshots. Both use `rounded-xs` (2px); nothing else on the site is rounded.
- **`<main>` is the only element allowed `focus-visible:outline-none`**: it receives focus only from the skip link, and a ring around the whole page reads as a bug.
- **The style guide is a real page under `src/pages/_dev/`**, a folder Astro never routes on its own, injected at `/styleguide` by a four line inline integration only when the command is `dev`. It renders through `BaseLayout` and shows light and dark side by side with Tailwind's `scheme-light` and `scheme-dark` utilities (`light-dark()` resolves per element), so no JavaScript and no toggle are needed. Runner up: a dynamic route whose `getStaticPaths` returns nothing in production.
- **`design.md` lives at the repo root** (the path `/develop` reads) and holds direction and rules with pointers; values live in `global.css` and are never copied into it.
- **Motion library rule for later pages**: Motion (the `motion` package) is the one sanctioned library. It may set styles only through the CSSOM and the Web Animations API (which the hashed CSP allows) and must never inject a `<style>` element (which the CSP blocks). It is imported only on a page that animates, inside a bundled `<script>`, and every animation checks `prefers-reduced-motion` first. Nothing installs in this feature.
- **The two column CV pattern belongs to the CV page spec.** This spec only supplies the `xs` breakpoint (480px) at which that spec collapses its date column, and the rule that the pattern is written once, in the CV page.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Design source

The Claude Design project "Minimalist Developer Portfolio" (file `Portfolio.dc.html`) is the starting point: it set the warm paper character, the olive and terracotta pair, the mono interface, the 640px column, and the uppercase section labels. It is not final design or content, and nothing in it is copied verbatim; its header, theme toggle, typing animation, and inline styles are dropped, and its light colours are corrected. This spec is the source of truth; `design.md` records the direction for later builds.

### Data model sketch

There is no persisted data. The model is the token set, written once in `src/styles/global.css` and read by every page. Colours (hex, sRGB):

| Token | Role | Light | Dark | Print |
|---|---|---|---|---|
| `--color-bg` | page ground | `#f2ede3` | `#1b1916` | `#ffffff` |
| `--color-fg` | body text, headings, link text | `#2b2722` | `#e6dfd2` | `#1a1815` |
| `--color-muted` | meta text (dates, contact line, footer, chips), underline colour, button border | `#71695c` | `#b2aa9a` | `#4a4540` |
| `--color-line` | hairlines: footer rule, chip border (decorative, no contrast requirement) | `#dcd4c4` | `#2d2a25` | `#d4d0c8` |
| `--color-accent` | structure: section labels, selected text ground, focus ring | `#646f3f` | `#baaa7c` | `#4f5a2c` |
| `--color-accent-warm` | interaction: hover and active text, hover border | `#a5532a` | `#e29a70` | `#1a1815` |

Measured contrast (WCAG ratio, APCA Lc): light muted 4.64 (Lc 67), accent 4.63 (Lc 66), accent-warm 4.65 (Lc 66), fg 12.71 (Lc 91); dark muted 7.61 (Lc 55), accent 7.62 (Lc 55), accent-warm 7.59 (Lc 55), fg 13.24 (Lc 86); print muted 9.47, accent 7.42, fg 17.72. The dark Lc values sit just above 55, which is why the test pins the maths with fixtures. The full table with every pair is in [rationale.md](rationale.md).

Other tokens and variables:

| Name | Value | Used for |
|---|---|---|
| `--font-mono` (`@theme inline`) | `var(--font-plex-mono)` | the default face: `html`, meta, labels, nav, chips, buttons, footer |
| `--font-sans` (`@theme inline`) | `var(--font-plex-sans)` | `Prose` only |
| `--text-title`, `--text-title--line-height` | `1.375rem`, `1.3` | home page h1 |
| `--text-base--line-height` | `1.6` | body copy |
| `--tracking-label` | `0.1em` | uppercase labels |
| `--text-underline-offset-link` | `0.2em` | `TextLink` underline offset (`underline-offset-link`) |
| `--container-content` | `40rem` | `max-w-content`, the content column |
| `--breakpoint-xs` | `30rem` | the `xs:` variant (480px), for the CV page's column collapse |
| `--default-transition-duration`, `--default-transition-timing-function` | `150ms`, `cubic-bezier(0.2, 0, 0, 1)` | every `transition-colors` |
| `--motion-quick`, `--motion-base`, `--motion-slow` | `150ms`, `250ms`, `400ms` | reveals and staggers on later pages (read by Motion) |
| `--motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` | the one easing curve |

Type scale in use (rem, computed at 16px): `text-xs` 0.75rem (12px) labels and footer · `text-sm` 0.875rem (14px) meta, chips, buttons · `text-base` 1rem (16px) body, line height 1.6 · `text-lg` 1.125rem (18px) inner page h1 and the CV name · `text-title` 1.375rem (22px) home h1. Weights: 400 for everything, 500 for h1, names, positions, `b`, and `strong`.

### State transitions

None. The only states are CSS states on links and buttons (rest, hover, focus visible, active) and the print medium.

### API surface

Build time Astro components and one TypeScript module; no HTTP. Every component accepts a `class` prop merged with `class:list` unless noted.

| Component (file) | Props | Renders | Rules |
|---|---|---|---|
| `BaseLayout` (`src/layouts/BaseLayout.astro`) | `title: string` (req), `description: string` (req) | the html shell: metas (the two `theme-color` values from `parseColorTokens(global.css?raw)`), `<Font />` twice, `SkipLink`, a centred column, `<main id="main" tabindex="-1">` with the slot, `SiteFooter` | the only place `global.css` is loaded as a stylesheet; body is `flex min-h-dvh flex-col`, the column `mx-auto flex w-full max-w-content flex-1 flex-col gap-14 px-6 pt-10 pb-20 print:min-h-0 print:p-0`, main `flex flex-col gap-14 focus-visible:outline-none` |
| `SkipLink` (`src/components/SkipLink.astro`) | none | `<a href="#main">Skip to content</a>` | `sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:bg-bg focus:px-3 focus:py-2 focus:text-sm print:hidden`; the ring comes from the global rule |
| `SiteFooter` (`src/components/SiteFooter.astro`) | none | `<footer class="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted">` with, when `Astro.routePattern !== '/'`, `<a href="/" class="inline-flex min-h-6 items-center transition-colors hover:text-accent-warm focus-visible:text-accent-warm print:hidden"><span aria-hidden="true">←</span> home</a>` first, then `<span class="ml-auto">{city}, {countryCode} · {year}</span>` | city and code from `getCv().basics.location`, year from `new Date().getUTCFullYear()` |
| `TextLink` (`src/components/TextLink.astro`) | `href: string` (req) | `<a>` with the slot as text | `text-fg underline decoration-1 decoration-muted underline-offset-link transition-colors hover:text-accent-warm hover:decoration-accent-warm focus-visible:text-accent-warm focus-visible:decoration-accent-warm contrast-more:decoration-2 print:no-underline`; never `target` |
| `SectionHeading` (`src/components/SectionHeading.astro`) | `as?: 'h2' \| 'h3'` (default `h2`), `id?: string` | a real heading element | `font-mono text-xs uppercase tracking-label text-accent` |
| `TagChip` (`src/components/TagChip.astro`) | none | `<span>` with the slot | `inline-flex items-center rounded-xs border border-line px-2 py-0.5 font-mono text-sm text-muted print:border-0 print:p-0` |
| `IconLink` (`src/components/IconLink.astro`) | `href: string` (req), `icon: 'github' \| 'linkedin' \| 'mail' \| 'arrow-up-right' \| 'download'` (req), `label: string` (req) | `<a>` with the icon, the visible label, and `ArrowUpRight` after the label when `href` starts with `http` | `inline-flex min-h-10 items-center gap-2 font-mono text-fg transition-colors hover:text-accent-warm focus-visible:text-accent-warm`; icons `size-5` (trailing arrow `size-4`) and `aria-hidden="true"`; never `target` |
| `Button` (`src/components/Button.astro`) | `href?: string`, `type?: 'button' \| 'submit'` (default `button`) | `<a>` when `href` is given, else `<button>`; slot as content | one variant: `inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xs border border-muted px-3 font-mono text-sm text-fg transition-colors hover:border-accent-warm hover:text-accent-warm focus-visible:border-accent-warm print:hidden` |
| `Prose` (`src/components/Prose.astro`) | none | `<div>` with the slot | `font-sans text-pretty`; sets only the face and wrapping; the CV page spec adds paragraph and list rhythm with numeric utilities; links inside it are `TextLink` |
| Icons (`src/components/icons/*.astro`) | `class?: string` | one `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` | `GitHub` and `LinkedIn` from Tabler (`brand-github`, `brand-linkedin`), `Mail`, `ArrowUpRight`, `Download` from Lucide; path data copied by hand; source and version in a comment |
| Style guide (`src/pages/_dev/styleguide.astro`) | none | through `BaseLayout` (title `Style guide`): two panels, `scheme-light` and `scheme-dark`, each with token swatches (`bg-*` utilities) and their numbers, then type specimens, spacing, every component and icon | dev only, injected at `/styleguide` by the integration below; print values shown as text |

`src/lib/contrast.ts` (pure, `readonly` data, no side effects, no file reads; callers pass the CSS text in):

| Export | Signature | Returns |
|---|---|---|
| `contrastRatio` | `(fg: string, bg: string) => number` | the WCAG 2.2 ratio (21 for black on white) |
| `apcaContrast` | `(text: string, bg: string) => number` | the APCA Lc (algorithm 0.0.98G, negative for light text on dark) |
| `parseColorTokens` | `(css: string) => ColorTokens` | `{ light, dark, print }`, each a record of role name (`bg`, `fg`, ...) to six digit hex |
| `CONTRAST_PAIRS` | `readonly` list of `{ name, fg, bg, minRatio, minLc? }` | the pairs AC-2 checks, the single place the thresholds live |

`parseColorTokens` strips comments, then cuts the `@theme { ... }` block and the `@media print { ... }` block out by brace depth (so nested `:root` and `@page` blocks and Prettier's line wrapping do not matter), and matches `--color-<role>: light-dark(#hex, #hex)` in the first and `--color-<role>: #hex` in the second. A value that is not six digit hex (for example the `prefers-contrast` override, which is outside both blocks anyway) is skipped, and a missing role is reported by the test as a missing token, never as a crash.

`CONTRAST_PAIRS` (every pair is checked in light, dark, and print; the failure label is `<name> (<scheme>)`):

| name | fg | bg | minRatio | minLc |
|---|---|---|---|---|
| `body: fg on bg` | `fg` | `bg` | 4.5 | |
| `meta: muted on bg` | `muted` | `bg` | 4.5 | 55 |
| `label: accent on bg` | `accent` | `bg` | 4.5 | 55 |
| `hover: accent-warm on bg` | `accent-warm` | `bg` | 4.5 | 55 |
| `selection: bg on accent` | `bg` | `accent` | 4.5 | |
| `focus ring: accent on bg` | `accent` | `bg` | 3 | |
| `button border: muted on bg` | `muted` | `bg` | 3 | |

`src/styles/global.css` sketch (values from the tables; base styles use plain CSS with the variables):

```css
@import 'tailwindcss';

@theme {
  --color-bg: light-dark(#f2ede3, #1b1916);
  --color-fg: light-dark(#2b2722, #e6dfd2);
  --color-muted: light-dark(#71695c, #b2aa9a);
  --color-line: light-dark(#dcd4c4, #2d2a25);
  --color-accent: light-dark(#646f3f, #baaa7c);
  --color-accent-warm: light-dark(#a5532a, #e29a70);
  --text-title: 1.375rem;
  --text-title--line-height: 1.3;
  --text-base--line-height: 1.6;
  --tracking-label: 0.1em;
  --text-underline-offset-link: 0.2em;
  --container-content: 40rem;
  --breakpoint-xs: 30rem;
  --default-transition-duration: 150ms;
  --default-transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

@theme inline {
  --font-mono: var(--font-plex-mono);
  --font-sans: var(--font-plex-sans);
}

@layer base {
  :root {
    color-scheme: light dark;
    --motion-quick: 150ms;
    --motion-base: 250ms;
    --motion-slow: 400ms;
    --motion-ease: cubic-bezier(0.2, 0, 0, 1);
  }
  html {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-plex-mono);
    -webkit-font-smoothing: antialiased;
  }
  body { font-size: 1rem; line-height: 1.6; overflow-wrap: anywhere; }
  b, strong { font-weight: 500; }
  ::selection { background-color: var(--color-accent); color: var(--color-bg); }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  @media (prefers-contrast: more) {
    :root { --color-muted: var(--color-fg); }
  }
  @media (forced-colors: active) {
    a { text-decoration: underline; }
    :focus-visible { outline: 2px solid; }
  }
  @media print {
    :root {
      color-scheme: light;
      --color-bg: #ffffff;
      --color-fg: #1a1815;
      --color-muted: #4a4540;
      --color-line: #d4d0c8;
      --color-accent: #4f5a2c;
      --color-accent-warm: #1a1815;
    }
    @page { margin: 18mm; }
    html { font-size: 11pt; }
    a { color: inherit; text-decoration: none; }
  }
}
```

`astro.config.mjs` additions (everything already there stays):

```js
import { defineConfig, fontProviders } from 'astro/config';

const plexFile = (family, weight) =>
  `@fontsource/ibm-plex-${family}/files/ibm-plex-${family}-latin-${weight}-normal.woff2`;

const plex = (family, fallbacks) => ({
  provider: fontProviders.local(),
  fallbacks,
  options: {
    variants: [
      { weight: 400, style: 'normal', src: [plexFile(family, 400)] },
      { weight: 500, style: 'normal', src: [plexFile(family, 500)] },
    ],
  },
});

const devStyleguide = {
  name: 'dev-styleguide',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/styleguide', entrypoint: './src/pages/_dev/styleguide.astro' });
      }
    },
  },
};

export default defineConfig({
  // existing options unchanged
  integrations: [devStyleguide],
  fonts: [
    { ...plex('mono', ['ui-monospace', 'Menlo', 'Consolas', 'monospace']), name: 'IBM Plex Mono', cssVariable: '--font-plex-mono' },
    { ...plex('sans', ['system-ui', 'sans-serif']), name: 'IBM Plex Sans', cssVariable: '--font-plex-sans' },
  ],
});
```

The four files (sizes from the 5.3.0 packages): `ibm-plex-mono-latin-400-normal.woff2` 14.7 kB, `ibm-plex-mono-latin-500-normal.woff2` 14.9 kB, `ibm-plex-sans-latin-400-normal.woff2` 22.6 kB, `ibm-plex-sans-latin-500-normal.woff2` 24.2 kB. The home page loads the two mono files (about 30 kB); the CV page loads all four (about 76 kB). If a Fontsource major release renames the files, the build fails at config time, which is the failure wanted.

`BaseLayout.astro` head, in order: charset, viewport, `color-scheme` meta, the two `theme-color` metas with `media="(prefers-color-scheme: light)"` and `dark` and `content` from the parsed tokens, `<title>`, description meta, the favicon link, `<Font cssVariable="--font-plex-mono" preload={[{ weight: 400 }]} />`, `<Font cssVariable="--font-plex-sans" />`.

`design.md` sections, in order: Character · Source · Two surfaces (the typography rule) · Tokens (roles and pointers) · Type scale · Colour and contrast bar · Spacing and layout · Components and usage rules · Motion · Print · Hardening · Do's and don'ts · Responsive behaviour.

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Theme tokens (AC-1) | the six colours in light, dark, print | the token table in this spec (decided here) |
| Theme colour metas (AC-6) | `#f2ede3`, `#1b1916` | `parseColorTokens(global.css?raw)` in `BaseLayout`'s frontmatter, light and dark `bg` |
| Fonts (AC-3) | the four woff2 files | package imports of the Fontsource files named above, resolved by `fontProviders.local()` from the `@fontsource/ibm-plex-mono` and `@fontsource/ibm-plex-sans` devDependencies (`^5.3.0`) |
| Fonts (AC-3) | family names in CSS | Astro's `--font-plex-mono` and `--font-plex-sans` (the `cssVariable` values) |
| Fonts (AC-3) | CSP hashes for the font styles | Astro's fonts plugin, automatic under `security.csp` |
| Fonts (AC-3) | fallback metrics | Astro's optimized fallbacks from the last generic family |
| Page title and description (AC-6) | text | `/`: title `Home`, description `basics.bio`; `/cv`: title `CV`, description `basics.bio`; 404: title `Not found`, description `This page does not exist.`; style guide: title `Style guide`, description `Design system tokens and components`; the home, CV, and metadata specs refine the words later |
| 404 page (AC-15) | body | h1 `Not found` (`text-lg font-medium`) and a `TextLink` to `/` reading `Back to the home page` |
| Footer (AC-6) | `City, CC` | `getCv().basics.location.city` and `countryCode` |
| Footer (AC-6) | `YYYY` | `new Date().getUTCFullYear()` at build time |
| Footer (AC-6) | whether `← home` shows | `Astro.routePattern !== '/'` |
| Skip link (AC-6) | target | `#main`, the id on `<main>` in `BaseLayout` |
| IconLink (AC-7) | external marker | `href` starts with `http` |
| IconLink (AC-9) | icon markup | the five icon components; path data from Tabler and Lucide at the versions current at build, named in each file |
| Credits (AC-9) | licence texts | the Tabler MIT notice and the Lucide ISC notice, copied from each project's licence file into `README.md` |
| Style guide (AC-13) | the live contrast numbers | `parseColorTokens` over `global.css?raw`, then `contrastRatio` and `apcaContrast`, per panel |
| Style guide (AC-13) | the route | `injectRoute` in the `dev-styleguide` integration, `command === 'dev'` only |
| Contrast test (AC-2) | the pairs and thresholds | `CONTRAST_PAIRS` in `src/lib/contrast.ts` (the table above) |
| Print (AC-11) | point sizes | root 11pt; every other size follows the rem scale |
| Motion (AC-10) | durations and easing | the `@theme` transition defaults and the `--motion-*` variables (decided here) |
| Later pages | icons beyond the five, more colours, a second accent shade, the CV grid | a new decision through `/architect` or the owning page spec, never an inline value |

### Key invariants

- Colours come only from the six tokens; `dark:` variants and literal colours never appear outside `global.css` (the theme-color metas are computed from it).
- Every text token pair is at least 4.5:1 in light, dark, and print; muted, accent, and accent-warm are at least Lc 55; the ring and the button border are at least 3:1.
- Mono is the default face on every page; sans exists only inside `Prose`.
- The focus rule is global; no component removes its outline except `<main>`.
- No inline styles, no `<style>` injection at runtime, no `target` on links, no ARIA role on a generic element, no arbitrary Tailwind values in components.
- Content is visible at rest; reduced motion disables all motion; no third party request for fonts or anything else, at build or at runtime.
- `src/pages/_dev/` never reaches `dist/`.
- `contrast.ts` is pure: same input, same output, no reads of the file system inside the library (the test, the layout, and the style guide pass the CSS text in).

### Security model

Public static pages with no users and no write path. The only change to the privacy surface is positive: fonts are served from the site itself, so no visitor request reaches a font host. No compliance scope applies. Icons are inline SVG written by hand from open licensed sets (Tabler, MIT; Lucide, ISC); each icon file names its source, and `README.md` carries a Credits section with both licence notices.

### Configuration required

No environment variables, secrets, or credentials. Two new devDependencies added with their range: `@fontsource/ibm-plex-mono@^5.3.0` and `@fontsource/ibm-plex-sans@^5.3.0`. No `pnpm-workspace.yaml` build approval is needed (font packages have no install scripts).

### Critical test scenarios

- Happy path: `pnpm build` produces styled pages with four self hosted font files, the shell, the footer, and the skip link; `/` and `/cv` show the name in the styled h1 and the 404 page shows `Not found` with a link home, verifies **AC-1**, **AC-3**, **AC-4**, **AC-6**, **AC-15**.
- Contrast regression: with the light `muted` token changed to `#8d8576`, `pnpm test` fails naming `meta: muted on bg (light)`; restored, it passes; the reference fixtures (`#888888` on `#ffffff` gives 3.545:1 and Lc 63.06; `#ffffff` on `#888888` gives Lc −68.54; `#000000` on `#aaaaaa` gives Lc 58.15; `#aaaaaa` on `#000000` gives Lc −56.24; black on white gives 21:1) pass, verifies **AC-2**.
- Keyboard: on `/styleguide`, Tab reaches the skip link first; Enter lands in `<main>`; every link and button shows the olive ring; a mouse click shows none; on `/cv` the footer link is the last stop and on `/` it is absent, verifies **AC-6**, **AC-8**.
- Links: on `/styleguide` a `TextLink` is underlined at rest and terracotta on hover; an external `IconLink` carries the arrow and no `target`, verifies **AC-7**.
- Preferences: on `/styleguide`, reduced motion removes the hover transition; `prefers-contrast: more` turns muted text into `fg` and thickens underlines; forced colours keep underlines and the ring, verifies **AC-10**, **AC-12**.
- Print: print preview of `/styleguide` in dark mode shows white paper, near black ink, no skip link, no footer link, no buttons, plain text links and chips, 18mm margins, verifies **AC-11**.
- Style guide: `/styleguide` opens in `pnpm dev` and `find dist -iname '*styleguide*'` finds nothing after `pnpm build`, verifies **AC-13**.
- Documentation: `design.md` has every section of AC-14, verifies **AC-14**.
- Auth/permission: not applicable; the site has no users.

## Build plan

Skateboard: the thinnest usable whole first (tokens, fonts, and the shell make every existing page look finished), then the components later pages compose, then the proofs and the documentation.

1. Add the two `@fontsource` devDependencies, the `fonts` entries (local provider, four package imports) and the `dev-styleguide` integration in `astro.config.mjs`, and write `src/styles/global.css` with the tokens, `@theme inline` fonts, and the base layer (colour scheme, motion variables, body and strong rules, selection, focus, reduced motion, contrast preference, forced colours, print), satisfies **AC-1**, **AC-10**, **AC-11**, **AC-12**, and the config half of **AC-3**.
2. Write `src/lib/contrast.ts` (`contrastRatio`, `apcaContrast`, `parseColorTokens`, `CONTRAST_PAIRS`), then rebuild `BaseLayout.astro` (metas from the parsed tokens, both `<Font />`, the column, `<main id="main">`), write `SkipLink`, `SiteFooter`, and `TextLink`, and pass `title` and `description` from `index.astro`, `cv.astro`, and `404.astro` with the name (or `Not found`) in a styled h1, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-15**.
3. Write `SectionHeading`, `TagChip`, `IconLink` with the five icon components, `Button`, and `Prose`, and add the Credits section to `README.md`, satisfies **AC-7**, **AC-9**.
4. Write `src/lib/contrast.test.ts` (fixtures, every `CONTRAST_PAIRS` entry in every scheme, missing token reporting), satisfies **AC-2**.
5. Write `src/pages/_dev/styleguide.astro` and confirm it appears in `pnpm dev` and not in `dist/`, satisfies **AC-13**.
6. Write `design.md`, then run the gate (`pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`) and the manual checks in [verify.md](verify.md) for print, preferences, and 320px, satisfies **AC-14**, **AC-15**, and the manual halves of **AC-11** and **AC-12**.

## Consequences

**Positive**:
- Every later page composes tokens and eight components; the look cannot drift page by page.
- Light and dark cost zero JavaScript and never flash; the print layer makes the CV page printable from day one, and the PDF can reuse it.
- Contrast is a failing test, not a review comment; the APCA floor catches faint secondary text that the ratio alone lets through.
- Fonts are pinned by the lockfile and copied from the packages, so builds are reproducible offline and visitors make no third party requests.
- The style guide gives a place to judge every detail in both modes, side by side, without shipping it.

**Negative / tradeoffs**:
- `light-dark()` needs Chrome 123, Safari 17.5, or Firefox 120 (all 2024). Older browsers cannot compute the tokens and fall back to the browser defaults: black text on a white page in the Plex fonts, readable but unstyled.
- About 30 kB of fonts on the home page and 76 kB on the CV page, and two Fontsource packages (about 1.5 MB each) in `node_modules`, of which four files ship.
- The font config names four package paths by hand; a Fontsource major release that renames files breaks the build until the paths are updated (loudly, at config time).
- The footer year is the build year, so a site not rebuilt in a new year shows the old one until the next push.
- `SiteFooter` calls `getCv()` in addition to the page, an exception this spec authorises until the `AGENTS.md` rule is reworded.
- The style guide only runs under `pnpm dev`, so `/check verify` has to use the dev server for that criterion, and until the home and CV pages are built it is the only place the components can be exercised.
- APCA Lc 55 is a regression floor for secondary text, below APCA's own guidance for body copy (Lc 75 to 90); it keeps faint text out, it does not certify APCA conformance.
- Named spacing was avoided on purpose, so section rhythm is documented as `gap-14` rather than a semantic name; a reader of the markup must know the convention.

**Neutral**:
- Page composition (which sections, the numbered nav rows, the optional avatar, the CV's two column grid) belongs to the home and CV page specs; this spec supplies the pieces, the `xs` breakpoint, and the rules.
- Motion beyond colour transitions arrives with the portfolio page spec, which installs Motion under the rules above.
- Favicon, canonical links, Open Graph images, real descriptions, and the `site` value belong to the metadata spec; until then `/` and `/cv` describe themselves with `basics.bio`.
- Playwright and an automated axe pass arrive with `/test` later; until then rendered accessibility is covered by the token test and the manual steps.

## Follow-up

- [ ] Home page spec: compose the page from `IconLink` rows and `TextLink`, decide the numbered row style, the optional avatar, and whether the draft's typing cursor returns as a Motion effect that respects reduced motion.
- [ ] CV page spec: build on `Prose`, `SectionHeading`, and `TagChip`; write the two column grid once (`xs:` collapse at 480px), decide chip separators in print (`print:` commas), `break-inside-avoid` on entries, and one page fit; keep the PDF spec on the same tokens.
- [ ] Portfolio page spec: install `motion` (the sanctioned library), use the `--motion-*` tokens, honour reduced motion, and review the result with the `review-animations` skill.
- [ ] Metadata and share cards spec: real descriptions replacing `basics.bio`, favicon drawn with the tokens, canonical and Open Graph tags in `BaseLayout`.
- [ ] `/test` (later): once Playwright is installed, add an axe pass over `/` and `/cv` in light and dark to complement the token test.
- [ ] `/sync` after the build: add `tailwind-4-docs` (`.agents/skills/tailwind-4-docs/`, `lombiq/tailwind-agent-skills`), `review-animations` (`.agents/skills/review-animations/`, `emilkowalski/skills`), and `animation-vocabulary` (`.agents/skills/animation-vocabulary/`, `emilkowalski/skills`, a naming glossary for motion effects) to root `AGENTS.md` `## Agent skills`; extend the `Declined:` line with the MCP servers and skills declined during this decision (a11y-color-contrast-mcp, motion-dev-mcp, fontsource-mcp, google-fonts-mcp, Figma MCPs, mcp-ink-design, typography audit MCP, css-mcp, FontOfWeb; tailwind-v4-shadcn, framer-motion-animator, impeccable, codebase-design, extract-design-system, web-typography, effective-print-design, fixing-accessibility); reword the `getCv()` rule to allow `SiteFooter`; add the rules "colours only from the six tokens, never `dark:`", "no `target` on links", "no arbitrary Tailwind values in components", and "`src/pages/_dev/` is dev only" to `## Rules`; mention `design.md` and the layout addition of `src/components/icons/` and `src/pages/_dev/`.
- [ ] Spec 0001: tick its follow up "confirm Astro's CSP hashes the inline style the Fonts API emits" (confirmed in the installed 7.3.4: the fonts plugin registers the hash).
- [ ] The comparison bench used for this decision (fonts, four palettes, light and dark, paper sample) is a private artifact at https://claude.ai/artifact/RFYjdoa1NgwhPxnsydfByQ; reuse it when a later page needs a new colour or a second look at a face.
