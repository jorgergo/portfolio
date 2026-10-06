# 0014. Command menu: rationale

The decision record behind [index.md](index.md): the problem, the options, why the sheet won, and the evidence. `/develop` does not read this file.

## Context

Scope feature 10 asks for a Cmd+K or Ctrl+K menu for quick jumps (pages, socials, the PDF download), like cv.jarocki.me, that works fully by keyboard, gives phone visitors a small button, and never prints. Specs 0001, 0004, and 0005 each left it a note: weigh `hotkeypad` against a hand built `<dialog>`, build the pages from `SITE_NAV` and the socials from the profiles, and consider the CV section anchors.

The forces:

- **The site ships no JavaScript today.** Five page tests assert "ships no script", and specs 0004, 0005, and 0008 to 0011 each recorded it for their page. Spec 0001 planned the exception: vanilla TypeScript in bundled `<script>` tags and native `<dialog>` for overlays, no UI framework.
- **The hashed CSP.** Astro hashes bundled scripts and styles into a meta tag, so no inline `style=""`, no `is:inline`, no injected `<style>`. A library that styles itself at runtime fights it.
- **The design system.** Six colour tokens and nothing else, no shadow, a 2px radius at most, motion limited to colour changes, no ARIA `role` on generic elements or lists (the style guide test asserts none under `body`), and every link in the same tab. A command palette's usual look (a floating panel over a dimmed page, a highlighted option) needs a scrim colour and a selection style the system does not have.
- **Phones.** Measured on the built site at 360px wide, the footer sits 527px down `/`, 807px down `/about`, 1,305px down `/projects`, 519px down `/contact`, and 5,454px down `/cv`, 8.7 screens. A trigger that lives only in the footer is out of reach where a menu matters most.
- **The type.** Plex Mono's shipped latin file has `↑` and `↓` but no `⌘`, so a key hint drawn with the Mac symbol would fall back to a system face.
- **Skateboard.** The smallest complete menu ships whole, then grows.

## Options considered

### Option 1: hand built `<dialog>` sheet of keyed links (chosen)

A native modal `<dialog>` that fills the viewport on the page ground, holding the title, a filter field, and the rows as `NavRow` links. Buttons open it with invoker commands (`commandfor`, `command="show-modal"`); a small bundled script adds the shortcut, the filter, and the arrow keys, and wires the buttons where invoker commands are missing.

**Pros**:
- The browser does the hard parts: the focus trap, Esc, the inert page behind, the top layer, and focus return.
- Every row is a plain link, so the no role rule, middle click, and screen readers all work as on the rest of the site.
- No new colour or style: the sheet is the page ground, the rows are `/contact`'s rows.
- The buttons work with no script where invoker commands exist.

**Cons**:
- The site's first script, and the five "no script" tests change.
- Invoker commands are recent, so the script carries a small fallback for older engines.
- The sheet hides the page completely, so the menu reads as a separate view rather than an overlay.

### Option 2: hand built palette panel with an ARIA combobox

The common Cmd+K pattern: a bordered panel over a dimmed page, focus kept in the field, `aria-activedescendant` pointing at a highlighted `role="option"` inside a `role="listbox"`.

**Pros**:
- The look people know from GitHub and Linear; the page stays visible around it.
- Focus never leaves the field, so typing and arrowing mix freely.

**Cons**:
- Needs `role="combobox"`, `listbox`, and `option`, an exception to the no role rule, and options are not links, so the script must follow them.
- Needs a scrim (a seventh colour value outside the tokens and the contrast test) and a highlight style.
- On a 640px phone the panel nearly fills the screen anyway (bench 1B).

### Option 3: `hotkeypad`

The framework free palette the Astro port of cv.jarocki.me uses.

**Pros**:
- Shortcut, filter, and keyboard handling come ready made.

**Cons**:
- It renders its own markup and ships its own stylesheet, so matching the six tokens means overriding its CSS, and its markup must be audited against the hashed CSP and the no role rule.
- A dependency for nine rows, and its look is not the site's.

### Option 4: no script, a `popover` list

Buttons open a `popover` list of links with `popovertarget`, with no shortcut and no filter.

**Pros**:
- Zero JavaScript; the site stays script free.

**Cons**:
- No Cmd+K and no filter, which is the feature the scope asks for.
- A popover is not modal: no focus trap and no inert page.

## Rationale

The site's character decided most of it. A plain text site with no shadow, no motion, and six colours reads best when the menu is another plain text view in the same column, not a floating card over a dimmed page; the sheet needs no new token, while the panel needs a scrim the contrast test cannot see (Context: the design system). Keyed `NavRow` rows reuse what `/contact` already proved, keep every row a real link, and keep the no role rule whole, where the combobox pattern would break it for the sake of a highlight style.

A hand built dialog beats `hotkeypad` because the browser now does what libraries used to: `showModal()` gives the focus trap, Esc, and the inert page, and invoker commands let the buttons open it with no script at all. What remains for the script is small (a shortcut, a substring filter, arrow keys), so a dependency would add more markup to override than code it saves (Context: the CSP and the design system).

The phone measurements settled the trigger. A footer button is out of reach 8.7 screens down the CV, and a top button scrolls away with the page, so the corner button, the pattern cv.jarocki.me uses, is the one place a phone visitor always finds it. Keying it to `pointer: coarse` rather than a width puts it on every touch first device, tablets included, and keeps `xs` the only width breakpoint.

## Evidence

### The bench

https://claude.ai/artifact/PehqDEvq5rDJE3eDWRrvCM (private), built 2026-10-05: the six tokens in light and dark, Plex Mono and Plex Sans from Google Fonts, the real rows, 360 × 640 phone frames at true size on `/cv`, and a full size `<dialog>` demo opened with Cmd or Ctrl+K. What it showed:

- **Surface.** 1A, the sheet, keeps nothing behind the rows; 1B, the panel over a scrim, needs the seventh colour and nearly fills a 640px phone; 1C, the panel with no scrim, separates from the page text only by its muted border.
- **Rows.** 2A, keyed, fits all nine rows on a 640px phone (title row 40px, field 40px, nine 40px rows 4px apart, `gap-6` between blocks, inside the 40px top and 80px bottom padding). 2B, groups, adds three labels and pushes the last rows past 640px. 2C, plain words, hides the email address behind the word `email`.
- **Trigger.** 3A, the footer, is out of reach on `/cv`; 3B, the corner, is one tap away everywhere but covers the end of a line as text scrolls; 3C, the top, scrolls away on `/cv` and adds the header the site dropped in spec 0003.

### Footer position at 360px

Measured on `dist/` in Chromium at 360 × 640, after `document.fonts.ready`:

| Page | Page height | Footer starts at | Screens |
|---|---|---|---|
| `/` | 640px | 527px | 1.0 |
| `/about` | 928px | 807px | 1.4 |
| `/cv` | 5,575px | 5,454px | 8.7 |
| `/projects` | 1,426px | 1,305px | 2.2 |
| `/contact` | 640px | 519px | 1.0 |

### Glyphs

The `latin` range of `@fontsource/ibm-plex-mono` (`unicode.json`) covers `U+2000-206F` (so `·` and `›`) and `U+2191` and `U+2193` (`↑`, `↓`), but not `U+2318` (`⌘`) or `U+23CE` (`⏎`). The hint is written in words (`cmd k`, `ctrl k`), and the key line uses only `↑ ↓`.

### Platform

Astro 7's JSX types (`node_modules/astro/astro-jsx.d.ts`) already list `command` (with `show-modal` and `close`) and `commandfor` on buttons, Tailwind v4 ships the `pointer-coarse:` variant, and the ESLint preset (`flat/jsx-a11y-recommended`) forbids `autofocus`, so the dialog relies on its own focus rule. Invoker command support (Chrome 135, Firefox 144, Safari 26.2) is from memory, not checked on the web; build task 1 proves it in all three engines before anything else is built.
