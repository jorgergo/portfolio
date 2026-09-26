# 0008. Rationale: home page as a centred name, tagline, and menu

The decision record behind [index.md](index.md). `/develop` does not read this file.

## Context

> ⚠️ Premise note: taking the social rows off the home page undoes one of spec 0004's user stories (a peer finds your GitHub, LinkedIn, and email on the first screen). Shipped alone, it would leave those links only on `/cv`, two scrolls into a document. The right framing is a move, not a removal: the links go to `/contact`, and the home page redesign ships only once `/contact` exists. The spec enforces that with a test (AC-5).

Spec 0004 shipped the home page as the name, a one sentence bio, a numbered menu (`01 cv` alone), and keyed social rows, top aligned in the 640px column. Two things now pull against it:

- **The intro names an employer.** The bio reads "…release automation at Ford." You want to be introduced by your role and your approach, not by where you work. The bio is also the meta description and the share preview text (spec 0006), so it shows up in search results and link previews too.
- **The page does not feel like its references.** You prefer the Claude Design draft's home frame (name, a short muted line, a numbered menu, lots of air) and want the block centred like t3.gg and fbold.dev. Today's page reads as a top aligned list with a paragraph at its head.

Constraints that shape the answer: profile content lives only in `cv.json` behind a strict schema (spec 0002); colours, type, and spacing come from spec 0003's tokens and components; the page ships no script and passes the hashed CSP (spec 0001); `SITE_NAV` lists only pages that exist (spec 0004); and About and Contact are planned but not built, so today the menu has one row.

A theme selector (auto, light, dark) was raised and then dropped during the interview; spec 0003's system driven colours stand.

## Options considered

### Option 1: Centred block, left aligned text, on the existing components

Name, muted tagline, and the `NavRow` menu in one block that shrinks to its widest line and sits in the middle of the page; text inside stays left aligned. Socials move to `/contact`.

**Pros**:
- Matches t3.gg's composition and the draft's content.
- The `01` to `04` numbers keep one column and the labels one left edge.
- No new component: one layout prop and two stock utilities.

**Cons**:
- Needs a layout change (`<main>` must grow), so `BaseLayout` gains a prop.
- The home block and every row narrow to the name's width, so hover and focus areas shrink.

### Option 2: Every line centred, like fbold.dev

Each line centred on its own axis inside a centred block.

**Pros**:
- Strongly symmetric; reads as a title card.

**Cons**:
- The numbers and labels no longer line up; the menu would have to drop its numbers, a core part of spec 0004's design.
- Centred mono text on lines of different lengths looks ragged on both sides.

### Option 3: Adopt the draft whole

The draft's home frame as drawn: a top bar with `~ jorgergo` and a theme toggle, a typed tagline with a blinking cursor, 15px body text, 44px rows, and a footer without a rule, top aligned.

**Pros**:
- The exact look you pointed at, with a terminal flavour.

**Cons**:
- The toggle and the typing need scripts; the typing hides text at rest and animates beyond colour, both against spec 0003.
- The top bar changes every page, and on home it repeats your name.
- Top aligned, so it does not give you the centred feel you asked for.

### Option 4: Fix in place

Keep today's top aligned column; swap the bio for the tagline and delete the social rows.

**Pros**:
- The smallest diff; no layout prop.

**Cons**:
- A three row menu at the top of a tall empty page looks unfinished, the thing the design mandate calls a placeholder.
- Misses the centred composition you asked for.

## Rationale

Option 1 answers both forces with the least new surface. Replacing the bio with a tagline removes the employer from the intro while the rewritten bio keeps a useful search snippet. Centring the block, rather than each line, gives the t3.gg feel you asked for without breaking the numbered menu that ties the site together. Everything else reuses what spec 0003 and spec 0004 built: `NavRow`, `SITE_NAV`, the tokens, the footer.

Option 3's charm is mostly motion and chrome, which the design system rules out for good reasons (reduced motion, text visible at rest, no scripts under the CSP); you dropped the toggle yourself. Option 4 is cheaper by one prop, but with three short rows at the top of a tall screen the page would look like a placeholder.

The phased ship (bio now, layout after About and Contact) follows from the premise note: the intro fix has no dependency and should not wait; the layout change moves your links, so it waits for their new home.

## Evidence

### Reference measurements (2026-09-26, 1024×768 window)

| | t3.gg | fbold.dev | Draft home frame |
|---|---|---|---|
| Block position | centred both ways: 124px above, 123px below | centred both ways, in a bordered box | top aligned, 640px column |
| Column | fixed 320px, text left aligned | shrinks to fit, every line centred | 640px, left aligned |
| Name | 20px, `theo` | none (a `WELCOME` label) | 22px, weight 500 |
| Line under name | 14px, grey, `builds things` | none | muted, typed `builds things` with a blinking cursor |
| Name to first link | 64px | n/a | 40px |
| Menu row pitch | 48px | 36px | 48px (44px rows, 4px gap) |
| Socials on home | a row of short links at the bottom | a `github` button | none (they live on the contact frame) |
| Theme control | none | an icon button | a word (`dark` or `light`) at the top right |

### Today's page, for comparison

Top aligned in the 640px column: the name (22px), the bio in `fg` over two lines, 56px, `01 cv`, 56px, three keyed social rows, then the footer with its rule. In a 1024×768 window the block runs from 40px to 408px down, and the rest of the window above the footer is empty.

### Sizes used in the spec

Plex Mono advances 0.6em per glyph: 9.6px at 16px on Mac and 10px in headless Linux Chromium (observed in CI, see the Plex Mono width comment in `e2e/site.spec.ts`). The column at a 320px viewport is 272px (320 minus 24px of padding each side). The name at `text-title` (22px) is 21 glyphs of 13.2px, 277.2px measured on the live page (273px in CI), so it is the widest line on desktop and wraps to two lines at 320px. The tagline, 26 glyphs, is 250px on Mac and 260px in CI, one line in both; 27 glyphs is the most that fits in CI.
