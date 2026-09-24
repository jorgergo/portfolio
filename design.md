---
name: portfolio-design-system
source: 'spec 0003 (docs/specs/0003-design-system/index.md); the Claude Design draft "Minimalist Developer Portfolio" was the starting point only'
character: 'Warm paper and quiet mono type. One narrow column of text, an olive accent for structure, a terracotta accent for interaction, light or dark by the visitor system setting, and nothing that moves unless it has to.'
tokens: 'real values live in src/styles/global.css (the @theme block, the :root motion variables, and the print block); read them there, never duplicated here'
contrast: 'every text pair at least 4.5:1 in light, dark, and print; muted, accent, and accent warm at least APCA Lc 55; the focus ring and the button border at least 3:1; proven on every test run by src/lib/contrast.test.ts'
---

# Design system

The look of the site, defined once. Values live in `src/styles/global.css`. This file records the direction and the rules, so a later page composes instead of inventing. The source of truth is [spec 0003](docs/specs/0003-design-system/index.md).

## Character

Warm paper, not white. A single column of text set in a monospace face, the way a well kept plain text file reads, with the CV prose in a matching sans. Two accents only: olive for structure (labels, selected text, the focus ring) and terracotta for interaction (hover, active). Light and dark follow the visitor's system setting, with no toggle and no flash. Motion is limited to colour changes. Everything is visible at rest. Details carry the design: the underline offset, the tracked labels, the hairline footer rule, the two point radius on a chip.

### Build mandate

You are a senior product designer shipping a small, finished site. Every page ships complete: real content from `src/content/cv.json`, a considered layout inside the column, the page shell (skip link, main, footer) from `BaseLayout`, and every state a control can be in (rest, hover, focus visible, active, print). Compose from the tokens and the eight components below. Do not add a colour, a font, an icon, a radius, or a shadow without a spec. Minimal is the point. Empty is not. A page with one heading and one paragraph is a placeholder, not a page.

## Source

Spec 0003 is the source of truth: its token table, its component table, and its acceptance criteria. The Claude Design draft "Minimalist Developer Portfolio" (`Portfolio.dc.html`) set the starting point (warm paper, olive and terracotta, a mono interface, a 640px column, uppercase labels) and nothing more. Its header, theme toggle, typing animation, and inline styles were dropped, and its light colours were corrected to pass contrast. Later pages take their composition from their own spec (home, CV, metadata, portfolio).

## Two surfaces

Mono is the default face on every page: headings, body text, meta text, labels, links, chips, buttons, and the footer. Sans appears in exactly one place, inside `Prose`, for CV paragraphs and lists. Never set `font-sans` anywhere else, and never nest `Prose` inside `Prose`.

## Tokens

Six colour roles, each written once as `light-dark(light, dark)` in the `@theme` block of `src/styles/global.css`, with a paper value in the `@media print` block of the same file. Use them through Tailwind utilities (`bg-bg`, `text-fg`, `text-muted`, `border-line`, `text-accent`, `hover:text-accent-warm`), never through a literal.

| Token         | Role                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `bg`          | the page ground                                                                         |
| `fg`          | body text, headings, link text                                                          |
| `muted`       | meta text (dates, contact line, footer, chips), the underline colour, the button border |
| `line`        | hairlines: the footer rule, the chip border (decorative, no contrast requirement)       |
| `accent`      | structure: section labels, selected text ground, the focus ring                         |
| `accent-warm` | interaction: hover and active text, hover border                                        |

Other tokens in the same file: the `text-title` size and line height, the body line height, `tracking-label`, `underline-offset-link`, `max-w-content` (the column), the `xs` breakpoint, the transition defaults, and the `--motion-*` variables on `:root`. Fonts come from Astro's Fonts API (`astro.config.mjs`) and reach Tailwind through `@theme inline` as `font-mono` and `font-sans`.

Rules: no `dark:` variants (the tokens switch by themselves), no opacity modifiers on colour tokens (`text-fg/80` makes a colour the test cannot see), no arbitrary values (`text-[13px]`), no Tailwind palette classes (`text-stone-500`). A value the tokens do not cover is a decision for `/architect`, not an inline value.

## Type scale

Tailwind's default steps plus one custom size, all rem based:

| Utility                  | Use                                                |
| ------------------------ | -------------------------------------------------- |
| `text-xs`                | uppercase labels (`SectionHeading`), the footer    |
| `text-sm`                | meta text, chips, buttons                          |
| `text-base`              | body copy, line height 1.6 (the default on `body`) |
| `text-lg font-medium`    | inner page h1 and the CV name                      |
| `text-title font-medium` | the home page h1                                   |

Weights: 400 for everything, 500 for h1, names, positions, `b`, and `strong`. Only 400 and 500 ship, so never write `font-semibold` or `font-bold`, the browser would fake them. Labels are `text-xs uppercase tracking-label text-accent`. Never use a pixel size.

## Colour and contrast bar

WCAG 2.2 AA is the requirement of record, checked in light, dark, and print: every text pair at least 4.5:1, the focus ring and the button border at least 3:1. On top of that, muted, accent, and accent warm text must reach APCA Lc 55 in every scheme, a floor that keeps faint secondary text out even when the ratio passes. `src/lib/contrast.test.ts` proves all of it from the CSS on every `pnpm test`. The pairs and thresholds live in `CONTRAST_PAIRS` in `src/lib/contrast.ts`. Change a token and the test names the pair that broke and the scheme it broke in. Never convey meaning by colour alone.

## Spacing and layout

Tailwind's numeric scale with fixed meanings:

| Spacing            | Meaning                                           |
| ------------------ | ------------------------------------------------- |
| `gap-14`           | between sections, and between main and the footer |
| `gap-6`            | between blocks inside a section                   |
| `gap-2`            | between an icon and its label                     |
| `pt-10 px-6 pb-20` | the page padding, set once in `BaseLayout`        |

The content column is `max-w-content` (640px), centred, on every page. `body` is a full height flex column and the footer sits at the bottom with `mt-auto`. Long words, emails, and URLs wrap (`overflow-wrap: anywhere` on `body`). The only rounded corners are `rounded-xs` on buttons and chips. Nothing has a shadow.

## Components and usage rules

All in `src/components/`, all semantic HTML, no UI library. Each takes a `class` prop merged with `class:list` unless noted.

- `BaseLayout` (`src/layouts/`): the shell every page renders through. Required props `title` and `description`. It loads the stylesheet, computes the theme colour metas from the tokens, loads both fonts (preloading only Plex Mono 400), and places `SkipLink`, `<main id="main">`, and `SiteFooter`.
- `SkipLink`: the first focusable element. Do not add another.
- `SiteFooter`: `City, CC · YYYY` from the CV, plus `← home` on every route except `/`. It reads `getCv()` itself, an exception spec 0003 allows.
- `TextLink`: a link inside running text. Underlined at rest in muted, terracotta text and underline on hover and focus. Use it for every link in prose. Never add `target`.
- `SectionHeading`: a real `h2` (or `h3` with `as`) styled as an uppercase label. Pick the level from the document outline, never for the look.
- `TagChip`: a hairline chip for skills and technologies. Prints as plain text.
- `IconLink`: an icon with a visible label (`github`, `linkedin`, `mail`, `arrow-up-right`, `download`). An `https` link gets the arrow after its label on its own. Never an icon alone.
- `Button`: one variant. A link when `href` is given, otherwise a real `<button>`. Use it for an action, not for navigation inside text. Hidden in print.
- `Prose`: the sans surface for CV paragraphs and lists. It sets the face and wrapping only. The CV page adds rhythm with numeric utilities.
- Icons (`src/components/icons/`): five outline icons on a 24 unit grid, stroke 2, `currentColor`, hidden from assistive tech. Sized with `size-5` (or `size-4` for the trailing arrow). A sixth icon is a decision.

Links open in the same tab everywhere. Icons sit next to visible text. No ARIA roles on generic elements.

## Motion

The only animation on the base pages is `transition-colors`, at the theme defaults (150ms and the one easing), so components never write a duration class. The `--motion-quick`, `--motion-base`, `--motion-slow`, and `--motion-ease` variables on `:root` are for later pages. Under `prefers-reduced-motion: reduce` every transition and animation is disabled site wide. Nothing is hidden at rest waiting for an animation. A later page that animates uses the `motion` package only, through the CSSOM and the Web Animations API (the CSP blocks injected `<style>` elements), imported in a bundled `<script>` on that page alone, checking reduced motion first, and reviewed with the `review-animations` skill.

## Print

The tokens take their paper values, `color-scheme` becomes `light`, the page gets an 18mm margin, and the root size drops to 11pt so the rem scale follows. The column drops its minimum height and padding. The skip link, the footer home link, and every `Button` are hidden. Links print as plain text without underline, and chips print as plain text without a border. The CV page builds on this layer, and the PDF spec reuses it.

## Hardening

- `prefers-contrast: more`: muted text uses `fg`, and `TextLink` underlines are 2px.
- `forced-colors: active`: links keep their underline, the focus outline stays, icons and borders draw in `currentColor`.
- Focus: every interactive element shows a 2px accent outline offset 3px on `:focus-visible`, and nothing after a mouse click. The rule is global. Only `<main>` hides its outline, because it receives focus from the skip link alone.
- Selection: accent ground with `bg` text.
- No inline styles, no `define:vars`, no `is:inline`, no `set:html` (the hashed CSP blocks them, and the linter fails them).
- Fonts are self hosted from the Fontsource packages: no third party request at build or at runtime.

## Do's and don'ts

Do:

- compose pages from the eight components and the tokens
- read colours through the utilities (`text-muted`, `border-line`)
- keep one `h1` per page and a real heading order
- keep every link in the same tab, with visible text
- check the style guide (`/styleguide` under `pnpm dev`) in both panels before you call a page done

Don't:

- write a hex colour, a `dark:` variant, an opacity modifier, or an arbitrary value in a component
- add a font weight above 500, a pixel font size, a shadow, or a radius beyond `rounded-xs`
- add an icon, a colour, or a second accent shade without a spec
- put `target` on a link, an ARIA role on a `div` or `span`, or a `style` attribute anywhere
- ship anything from `src/pages/_dev/`, it is development only

## Responsive behaviour

Mobile first. The column is fluid up to 640px with 24px side padding, so at 320px nothing scrolls sideways and long strings wrap. Interactive rows are at least 40px tall (`min-h-10` on `IconLink` and `Button`). The footer link is `min-h-6` because it is a text link inside a text line. The only breakpoint in use is `xs` (480px), reserved for the CV page's column collapse. Use `sm` and up only when a spec asks. Body text stays 16px at every size. Both colour schemes are first class: check every page in light and dark, and in print preview.
