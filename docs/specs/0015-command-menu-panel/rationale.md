# 0015. Command menu as a panel over the page: rationale

The decision record behind [index.md](index.md): the problem, the options, why the panel and the bottom sheet won, and the evidence. `/develop` does not read this file.

## Context

Spec 0014 shipped the command menu as a sheet that covers the whole viewport in the page's own colours: a `menu` title and `close` on top, a `filter` label beside a field, nine keyed rows 40px tall and 4px apart in the page's 16px body size, and a key line, all inside the page padding. You looked at it beside cv.jarocki.me's menu on 13 Oct 2026 and called it bloated: a whole page for nine links, nothing to show which row Enter opens, and a focused field that draws the 2px focus ring 3px outside a field that already has a bottom rule, a double frame.

The forces:

- **What a visitor expects.** A Cmd+K menu on the web is a small panel over the page with a search row and a selected first row (cv.jarocki.me, GitHub, Linear). The sheet reads as a separate page, and the `page` key written five times down its left column adds words without meaning.
- **The design system.** Six colour roles and nothing else, no shadow, `rounded-xs` as the only radius, motion limited to colour, the global 2px ring on every focus, and no ARIA `role` under `body` (a style guide test asserts it). A panel over a page needs some way to separate it from the text behind, and a selected row needs a look.
- **Contrast on a selected ground.** The only token a row could sit on is `line`. Measured with the site's own `contrastRatio`: `fg` on `line` is 10.07:1 in light, but `muted`, `accent`, and `accent-warm` on `line` all fall to about 3.7:1 in light. `line` against `bg` is 1.26:1, too faint to show a state by itself (WCAG asks 3:1 for that).
- **The iPhone keyboard.** A bottom anchored sheet sits on the layout viewport's bottom edge, and on iOS the keyboard covers that edge. What happens to the field when the sheet shrinks as rows filter out decides where the field can go.
- **Everything that works today.** The shortcut rules, the footer and corner triggers, invoker commands, the one script, the print rules, and their tests are proven (spec 0014's verify and review). The redesign should leave them alone.
- **Skateboard.** Ship the whole redesigned menu in one merge.

## Options considered

### Option 1: a panel over the dimmed page, a bottom sheet on touch (chosen)

A 512px panel near the top of the viewport over a dimmed page on a fine pointer, and a sheet on the bottom edge on touch, both with one field row, three headed groups, a selected first row on a keyboard open, real links, and a short fade in.

**Pros**:
- Matches what visitors expect from Cmd+K, at a measured 515px instead of the whole screen.
- Keeps every row a real link and needs no ARIA role.
- The sheet puts the menu near the thumb that opened it from the corner button.

**Cons**:
- Needs a seventh colour (the scrim), an exception to the focus ring on rows, and the site's first motion beyond colour.
- Two shapes by input type to build and test.

### Option 2: keep the sheet and tighten it

Fix in place: drop the title, the filter word, and the key line, set rows at 14px, mark the first row, and fix the double frame, all still on a full viewport sheet.

**Pros**:
- No new colour, no motion, no click outside rule; the smallest change.

**Cons**:
- The page still vanishes, the complaint that started this; a tighter list at the top of an empty screen looks unfinished on a computer.

### Option 3: a combobox palette (the cmdk pattern)

The panel of Option 1, but focus stays in the field and the arrows move an `aria-activedescendant` highlight over `role="option"` items in a `role="listbox"`.

**Pros**:
- The caret never leaves the field while you arrow, exactly as cv.jarocki.me behaves.

**Cons**:
- Needs `combobox`, `listbox`, and `option` roles, an exception to the no role rule and its style guide test.
- Options cannot be links, so middle click, copy link, and a screen reader's link list stop working, and the script must follow them by hand.

### Option 4: a top panel on phones too

Option 1's panel on every device, 16px from the edges near the top on a phone.

**Pros**:
- One shape everywhere, one set of layout tests; the field at the top works with the keyboard.

**Cons**:
- On a phone the panel sits far from the corner button that opened it, and you preferred the sheet on the bench.

## Rationale

The complaint was the page vanishing behind a bloated list, so Option 2 fixes the symptoms but not the problem. Option 1 brings the menu to the shape visitors expect while keeping the parts of spec 0014 that work: the rows stay links (where Option 3 would trade them for roles and lose link behaviour for the sake of a caret that stays put), and the shortcut, triggers, script, and print rules carry over untouched (Context: everything that works today).

Each rule the panel bends is the smallest bend that works. The scrim carries no text, so a decorative token like `line` costs no contrast pair. The selected row could only sit on `line`, where only `fg` stays readable in light, so the row turns fully `fg` and a `›` mark (10.07:1) carries the state that the 1.26:1 ground cannot; the same mark keeps the state in forced colours mode. That look is clearer than a ring around a filled row, so the ring yields on rows only. The fade is CSS on the theme's own 150ms default, invisible under reduced motion, and needs no script.

The bottom sheet was your pick over Option 4, and the iPhone proof decided its one open detail: with the field at the top of the sheet, filtering shrank the sheet down behind the keyboard and took the field with it; with the field at the foot, Safari kept it above the keyboard at every step (Evidence: the iPhone proof). Putting the field last on touch costs a DOM order that differs from what you see, which screen readers and Tab follow; that is the smaller cost than a field you cannot see.

## Evidence

### The bench

https://claude.ai/artifact/TRQWNGcKHCNyzmWPNPFJH5 (private), built 13 Oct 2026: the six tokens in light and dark, Plex Mono and Plex Sans from Google Fonts, the real nine rows, a live configurator (surface, selected look, rows, arrow keys, motion, key line, phone shape, scheme, device), presets for the recommendation, a close copy of cv.jarocki.me, and today's sheet, plus four true size 360 × 640 phone frames. Measured there with the fonts loaded: every row 40px, the panel 512px wide and 515px tall with all nine rows (49px field row, 12px list padding, three 28px headings, 8px between groups, nine 40px rows, 2px of border), so on a 640px phone it ends 539px down.

### cv.jarocki.me, measured

Read in the browser on 13 Oct 2026 at 1024 × 768 and 375 × 812:

| Part | Value |
|---|---|
| Panel | 512px (`max-w-lg`), centred at half the viewport height, 1px `#e5e7eb` border, 8px corners, a large soft shadow |
| Page behind | `bg-black/20` |
| Field row | 48px, 14px text, a search icon, `Type a command or search...`, a 16px × at the corner |
| Rows | 44px, 14px, two groups with 12px medium headings (`Actions`, `Links`) |
| On open | the first row selected (`aria-selected="true"`, gray ground) |
| Pattern | `role="combobox"` on the field, `listbox` and `option` for the rows |
| Motion | 150ms fade and zoom on open and close |
| Row text | every row renders at 50% opacity (its `data-[disabled]:opacity-50` matches `data-disabled="false"`): 3.79:1 at rest and 3.32:1 selected, below AA |
| Phone | full width, centred, focus in the field so the keyboard opens |
| Filtering | the panel shrinks around its centre, so the field jumps |

### Contrast of the candidate pairs

From `contrastRatio` and `apcaContrast` in `src/lib/contrast.ts`:

| Pair | Light | Dark |
|---|---|---|
| `fg` on `line` | 10.07:1, Lc 77.0 | 10.79:1, Lc 83.7 |
| `muted` on `line` | 3.68:1, Lc 52.3 | 6.20:1, Lc 52.7 |
| `accent` on `line` | 3.67:1, Lc 52.2 | 6.21:1, Lc 52.8 |
| `accent-warm` on `line` | 3.68:1, Lc 51.9 | 6.19:1, Lc 52.8 |
| `line` on `bg` | 1.26:1 | 1.23:1 |
| `accent` on `bg` (the focus line) | 4.63:1 | 7.62:1 |

### The iPhone proof

A scratch page with a real `<dialog>` bottom sheet in the site's colours and the real nine rows, served from this Mac and opened in Safari on the iPhone 17 simulator, iOS 26.3, on 13 Oct 2026. Safari's floating toolbar sat below the corner button and below the open sheet, with no safe area rule.

| Variant | Before the keyboard | Keyboard open | After typing `git` |
|---|---|---|---|
| A: field at the top of the sheet | sheet from 165 to 714 of a 714px viewport, all rows visible | visual viewport 377px tall, panned 45px; the field and the first four rows visible | the sheet shrank toward the layout viewport's bottom edge, behind the keyboard: field and result gone |
| B: field at the foot of the sheet | sheet from 165 to 714, the field last | Safari panned the field to just above the keyboard, seven rows visible above it | the `contact` heading, the GitHub row, and the field in view above the keyboard |

### Tailwind classes

Compiled with the project's Tailwind 4.3.3 on 13 Oct 2026, with no arbitrary values: `top-1/7`, `max-h-3/4`, `max-h-5/6`, `max-w-lg` (32rem), `scale-98`, `translate-y-2`, `pl-6.5`, `starting:open:opacity-0` and `starting:open:backdrop:opacity-0` (both inside `@starting-style`), `pointer-coarse:starting:open:translate-y-2`, `backdrop:bg-scrim` (once the token exists), `data-selected:bg-line`, `group-data-selected:visible`, `has-focus:after:opacity-100`, `after:-bottom-px`, `pointer-coarse:after:-top-px`, and `transition` (whose property list includes opacity, scale, and translate).
