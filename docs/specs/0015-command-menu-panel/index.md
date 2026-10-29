# 0015. Command menu as a panel over the page

**Date**: 2026-10-13
**Status**: Accepted
**Supersedes**: [0014](../0014-command-menu/index.md)

## Summary

The command menu stops covering the whole page. On a computer it opens as a small panel near the top of the screen over the dimmed page: one search row, three small groups of links, and the first row already selected, so Enter goes straight there. On a phone or tablet it rises as a sheet from the bottom edge with the search field at its foot, which keeps the field above the keyboard while you type. The shortcut, the two buttons, the one small script, and every link stay as spec 0014 built them.

## Requirements

**User stories**:
- As a keyboard visitor, I want Cmd+K or Ctrl+K to open a compact menu with the first row already chosen, so that a jump takes one or two keys and the page stays in view.
- As a mouse visitor, I want the row under my pointer to be the one Enter opens, so that pointing and typing agree.
- As a phone visitor, I want the menu near my thumb, with the search field staying above the keyboard while I type, so that nothing I need hides behind it.
- As a screen reader user, I want a named dialog of grouped links that tells me which page I am on and what Enter will open, so that it works like the rest of the site.
- As the site owner, I want the groups and rows built from `SITE_NAV` and `cv.json`, so that a new page or profile joins the menu with no menu edit.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1** (rows): `commandMenuGroups(basics, routePattern)` in `src/lib/site-nav.ts` replaces `commandMenuRows` and returns `readonly MenuGroup[]`, where `MenuGroup` is `{ readonly heading: 'pages' | 'contact' | 'file'; readonly rows: readonly MenuRow[] }` and `MenuRow` is `{ readonly name: string; readonly detail: string; readonly href: string; readonly current: boolean; readonly external: boolean; readonly download?: string | undefined }`. In order: `pages` holds home (`name: 'home'`, `href: '/'`), then one row per `SITE_NAV` entry (its `label` as `name`, its `href`), each with `detail: ''`; `contact` holds one row per `formatContactRows(basics)` row, its `key` as `name` and its `label` as `detail`, `href` unchanged; `file` holds one row, `name` `CV_PDF_PATH` without its leading slash (`cv.pdf`), `detail: 'download'`, `href` `CV_PDF_PATH`, `download` `cvPdfFileName(basics.name)`. `current` is true only on the page row whose `href` equals `routePattern`; `external` is true when `href` starts with `http://` or `https://`; a group with no rows is left out. Today that is three groups and nine rows. Vitest in `src/lib/site-nav.test.ts`, with inline fixtures, covers today's groups exactly; `current` for `/`, `/cv`, and `/404`; no `profiles` (the contact group keeps the email row alone, seven rows); the accented file name; and `external` on the two profile rows only.
- **AC-2** (panel on a fine pointer): `CommandMenu` draws `<dialog id="command-menu" aria-labelledby="command-menu-title">` whose first child is `<h2 id="command-menu-title" class="sr-only">menu</h2>`: the visible title is gone and the dialog keeps the name `menu`. Where the main input is a fine pointer, the open dialog is a panel: `fixed inset-x-4 top-1/7 bottom-auto m-0 mx-auto w-auto max-w-lg max-h-3/4` (16px from each side at least, 512px wide at most, its top one seventh of the way down, at most three quarters of the viewport tall), `open:flex flex-col overflow-hidden overscroll-contain` (`open:flex`, never a bare `flex`, which would beat the browser's `display: none` on the closed dialog), `rounded-xs border border-line bg-bg p-0 text-fg`, and no shadow; its `::backdrop` is `bg-scrim`. The panel's height follows its rows (515px with today's nine), its top never moves while rows filter out, and only the row list scrolls when the rows outgrow the panel. `print:open:hidden` keeps it off paper: a bare `print:hidden` would lose to `open:flex`, whose `[open]` match outranks it, so a menu left open would print. Spec 0014's key line and its `data-menu-keys` hook are gone. `html` gains `scrollbar-gutter: stable` in the base layer beside the scroll lock, so hiding the scrollbar while the menu is open never shifts the page visible behind it.
- **AC-3** (scrim token): `src/styles/global.css` adds `--color-scrim: light-dark(#2b27222e, #00000080);` to its `@theme` block: `fg` at 18% in light, black at 50% in dark. It is decorative (no text sits on it), the only colour outside the six roles, and only the command menu's `::backdrop` uses it. `parseColorTokens` ignores it (the existing case for variables outside the six roles covers that), so the token changes no contrast result.
- **AC-4** (bottom sheet on a coarse pointer): where touch is the main input (`pointer-coarse:`), the open dialog is a bottom sheet: `inset-x-0 top-auto bottom-0`, still `mx-auto max-w-lg` (full width on a phone, 512px and centred on a wider touch screen such as an iPad), `max-h-5/6` (a strip of dimmed page always shows above it to tap), its bottom border off and its bottom corners square. The field row sits at the foot of the sheet under the rows (`pointer-coarse:order-last`), with its rule on its top edge. No keyboard opens at open: focus goes to the close button, as spec 0014 AC-6 had. iOS keeps the sheet clear of the home indicator and of Safari's toolbar with no safe area rule, because the viewport meta stays without `viewport-fit=cover` (spec 0014 AC-11).
- **AC-5** (field row): the block after the heading is the field row, `relative flex min-h-12 shrink-0 items-center gap-3 pr-4 pl-8`, with a 1px `line` rule on its bottom edge (its top edge on a coarse pointer: `pointer-coarse:border-t pointer-coarse:border-b-0`). In the DOM the close button comes first and the field second, and the button carries `order-last` so it shows on the right; a dialog opened with no script therefore focuses the button, never the field. The button is exactly `<button type="button" commandfor="command-menu" command="close" class="order-last inline-flex min-h-6 items-center rounded-xs border border-line px-1.5 text-xs text-muted transition-colors hover:border-accent-warm hover:text-accent-warm focus-visible:border-accent-warm focus-visible:text-accent-warm pointer-coarse:min-h-10 pointer-coarse:border-0 pointer-coarse:px-0 pointer-coarse:text-sm"><span class="pointer-coarse:hidden">esc</span><span class="sr-only pointer-coarse:not-sr-only"> close</span></button>`: on a fine pointer it shows the `esc` key and its name is `esc close`; on a coarse pointer it shows `close`, at least 40px tall with no border, named `close`. The field is a `<label hidden data-menu-filter class="min-w-0 flex-1">` (not positioned) holding a visually hidden `search pages and links` and a `type="text"` input with that same text as its placeholder (`placeholder:text-muted`), `text-base` (16px, so iOS never zooms), `h-12 w-full`, transparent ground, no border, `focus-visible:outline-none`, `autocomplete="off"`, `spellcheck="false"`, `autocapitalize="off"`, `enterkeyhint="go"`. While the input has focus, a 2px `accent` line (4.63:1 light, 7.62:1 dark) lies over the row's whole rule: the label carries `after:absolute after:inset-x-0 after:-bottom-px after:h-0 after:border-t-2 after:border-accent after:opacity-0 focus-within:after:opacity-100 pointer-coarse:after:-top-px pointer-coarse:after:bottom-auto`, and since the label is not positioned, its `::after` spans the row. It shows only while the field itself has focus (never for the button), moves nothing, and, being a border, still draws in forced colours mode. Today's double frame (a ring around a field that already has a rule) is gone.
- **AC-6** (groups and rows): below the field row, a `data-menu-list` block (`flex min-h-0 flex-auto flex-col gap-1 overflow-y-auto overscroll-contain p-1.5`, so the groups sit `gap-1` apart; `flex-auto` rather than `flex-1`, so the list starts from its rows' own height in a dialog with no set height, and `min-h-0` lets it shrink and scroll once the rows outgrow the panel) holds one `data-menu-group` wrapper per `commandMenuGroups` group: an `<h3 id="command-menu-<heading>">` with its `heading` (`text-xs text-muted pt-2 pb-1 pl-6.5`), then a `<ul aria-labelledby="command-menu-<heading>">`, one `<li>` per row; the ids are `${COMMAND_MENU_ID}-${heading}`. Each row is one link, `group flex min-h-10 flex-wrap items-center rounded-xs px-2.5 text-sm text-fg` with no gap, holding in order: an `aria-hidden` `›` in a 16px column (`w-4 shrink-0`, invisible until selected); the `name` in a `<span data-menu-name class="min-w-0">`; then the detail span, `ml-auto inline-flex items-center gap-2 pl-4 text-muted`, holding the `detail`, followed by the arrow (`size-4`) when `external`, or the download icon (`size-4`) when `download` is set, with the `download` attribute on the link. The current page's row gets `aria-current="page"` and a muted `aria-hidden` `here` as its detail span's content. Measured from the panel's inner edges: the field's text, every heading, and every name start 32px in (6px list padding, 10px row padding, 16px mark column; 26px heading padding; the field row's 32px); every detail and the `esc` key end 16px in. A detail too long for its line wraps to a second line, still right aligned. Each link's name reads as its text: `cv`, `email jorgergo@icloud.com`, `github @jorgergo`, `cv.pdf download`.
- **AC-7** (the selected look): a row with `data-selected` or `:focus-visible` gets the `line` ground, its `›` shows, and every part of it (name, detail, icons, `here`) draws in `fg`, because on the `line` ground only `fg` passes 4.5:1 in light (10.07:1, where `muted` falls to 3.68:1). That look replaces the global 2px ring on rows (`focus-visible:outline-none`); rows and the field (AC-5) are the two places on the site where the ring yields. The `›` in `fg` keeps the state visible in forced colours mode, where grounds vanish. `CONTRAST_PAIRS` gains `selected row: fg on line` at 4.5:1, checked in light, dark, and print, and the floors fixture in `src/lib/contrast.test.ts` ("holds the spec 0003 floors for every pair") gains the same entry. Rows have no hover style of their own: on a fine pointer the selection is the hover.
- **AC-8** (selection): the script keeps at most one selected row among the visible rows and marks it by toggling `data-selected` on that link, the only attribute it writes besides `hidden`. An open that puts focus in the field (the shortcut always, a button on a fine pointer) selects the first row; an open that leaves focus on the close button (a button on a coarse pointer) selects none. Every `input` selects the first visible row, or none when no row is left, on every device. Focus entering the field (a tap on it, Tab, Shift+Tab) while none is selected selects the first visible row, so on a phone the first row shows as selected once the field has focus. On a fine pointer, a mouse that moves over a row selects it: the script listens for `pointermove` on the `data-menu-list` block, acts only when `pointerType` is `mouse` and `clientX` or `clientY` differs from the last move it handled (the moves a browser fires when rows filter out or the list scrolls under a still mouse change nothing), and finds the row with `closest('a')`. Focus stays in the field when it was there, and moves to that row (`focus({ preventScroll: true })`) when focus was on another row, so the highlight and Enter never point at different rows. Focus landing on a row selects it. Enter in the field follows the selected row through its `click()`, so it closes and follows exactly as a click does; with none selected, or during IME composition (`isComposingKey`), Enter does nothing. Every reset (spec 0014 AC-7: the start of every open and every close) clears the selection.
- **AC-9** (arrow keys): `nextFocus(index, selected, count, key)` replaces today's three argument version. From the field (`index` `-1`), ↓ goes to the row after the selected one (`selected + 1`, at most the last), or to the first row when none is selected, and ↑ stays in the field. From a row, ↓ goes to the next row and stops at the last, ↑ goes to the previous row, and ↑ from the first row returns to the field, where the first row stays selected. With no rows, ↓ stays in the field. ↓ on the close button moves to the field and ↑ there does nothing. A printable key on a row moves focus to the field, which takes the character (spec 0014 AC-8). Vitest in `src/lib/command-menu.test.ts` covers the whole table.
- **AC-10** (filter and announcements): the filter keeps spec 0014 AC-7: a row stays when `rowMatches` finds the query in its text (the link's text without the `aria-hidden` parts, so its `name` and `detail`). The script also hides a group whose rows are all hidden, and with no row left it shows the muted `no match` line, a `<p hidden aria-hidden="true" data-menu-empty class="py-2 pl-6.5 text-sm text-muted">` inside the `data-menu-list` block, so its text starts on the same 32px line. `formatMatchCount(count, query, target)` gains the selected row's name and returns `''` for an empty query, `no match`, `1 row, enter opens github`, or `N rows, enter opens home`; after each `input` the script writes it into the `sr-only` live region, reading `target` as the `textContent` of the selected link's `data-menu-name` span (the name alone, `github`, not the whole link name). Nothing is announced on open, on the arrow keys (focus moves speak for themselves), or on hover. Vitest covers the strings.
- **AC-11** (click outside): a click on the dimmed page closes the menu. The script closes the dialog when both the `pointerdown` and the `click` landed on the dialog element itself (a backdrop click targets the dialog, while any click on the panel's contents targets a child), so a text selection dragged from the field out to the page does not close it. A press on the dimmed page released on a row does close it (the `click` then targets the dialog, the two elements' common ancestor); that is accepted. No `closedby` attribute. With JavaScript off, Esc and the close button still close it.
- **AC-12** (motion): the dialog takes `transition origin-top` and opens from `starting:open:opacity-0 starting:open:scale-98` (the panel fades in from 98%), or on a coarse pointer from `pointer-coarse:origin-bottom pointer-coarse:starting:open:scale-100 pointer-coarse:starting:open:translate-y-2` (the sheet fades in from 8px lower); its backdrop takes `backdrop:transition-opacity starting:open:backdrop:opacity-0`. All of it runs on the theme's default duration and easing (150ms, the `--motion-quick` value, and the site curve), with no duration class and no script. Closing is instant, because only the open state starts a change and nothing sets `transition-behavior: allow-discrete`. Under `prefers-reduced-motion: reduce` the global rule turns it off; that rule's selector list in `src/styles/global.css` gains `::backdrop` beside `*, ::before, ::after`, so the backdrop's fade stops too.
- **AC-13** (carried from spec 0014, unchanged): the shortcut (0014 AC-5: Cmd or Ctrl+K toggles it, with its key and code rules and the platform hint); the two triggers, one per device (AC-4: the footer button with its hint and `aria-keyshortcuts`, the corner `Button` on touch, invoker commands, and the script's fallback wiring); the open steps on `toggle` for an invoker open (AC-6), where the script now reveals the field alone since the key line is gone (AC-2); a plain activation closes then follows, while a modified or middle click keeps the menu open (AC-9); the page behind locked (AC-10); the corner button 24px from the edges, never covering the footer (AC-11); nothing in print, with `dist/cv.pdf` still passing `checkCvPdf` (AC-12); exactly one bundled script per page, no CSP violation, and no markup built by the script (AC-13, widened by AC-8 to toggling `data-selected`); and `src/lib/command-menu.ts` importing nothing, with `COMMAND_MENU_ID` still `command-menu` (AC-15).
- **AC-14** (accessibility): with the menu open, every page passes an axe WCAG 2.2 AA check in light and dark, in a desktop context and in a touch context. The dialog's name is `menu`; no element under `body` has a `role` attribute; no link has `target`; no element has `style`. Rows are at least 40px tall, the coarse pointer close button at least 40px, and the `esc` key at least 24px tall and wide. At 320px wide with the menu open nothing scrolls sideways, as a panel or as a sheet, and the email row's address stays whole, beside its name or on a second line, right aligned (AC-6).
- **AC-15** (`NavRow` back to its old contract): `NavRow` drops the `current` and `download` props spec 0014 added, since the menu no longer draws `NavRow`. It renders exactly as specs 0004 and 0011 define, and the home and `/contact` tests pass with no edit.
- **AC-16** (page tests): `e2e/site.spec.ts` rewrites its `command menu` block, tagged `spec 0015`, deriving every expectation from `commandMenuGroups`, `SITE_NAV`, `formatContactRows`, and `cv.json`, so a valid content edit needs no test edit. It covers the panel's geometry in a desktop context, including the 32px text line and the 16px right edge of AC-6, and its backdrop, whose computed colour must equal AC-3's literals (alpha 46/255 in light and 128/255 in dark, since the contrast helpers read the six roles only); the bottom sheet in a touch context (`hasTouch`, `isMobile`, after asserting `matchMedia('(pointer: coarse)')` matches), with the field below the rows and the sheet's bottom edge on the viewport's; the field row and its focus line; the groups and the row anatomy; the selected look and its colours; selection on open, on input, on focus entering the field, and on a real mouse move (and none on a still mouse while typing); the new arrow walk; Enter following the selected row; the live region strings; a backdrop click that closes and a drag that does not; the motion (the built stylesheet holds the dialog's and the backdrop's `@starting-style` rules, the open dialog computes a 150ms `transition-duration`, and under reduced motion 0.01ms); and every AC-13 rule the existing block already proves, kept. `e2e/styleguide.spec.ts` follows AC-17. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass.
- **AC-17** (style guide and docs): the `/styleguide` `Command menu` section shows `CommandMenu`'s `preview`, the panel's content in a plain static `<div>` with the field showing, the first row selected, and no live region, in a light and a dark panel; the preview's root keeps only `max-w-lg rounded-xs border border-line bg-bg text-fg` (no positioning, backdrop, motion, or pointer classes), and it writes no ids, so its headings carry no `id` and its lists no `aria-labelledby`. The section drops the two `NavRow` examples. `e2e/styleguide.spec.ts` checks it, scoped to that section and to each panel, and its Tab test "every stop shows a 2px solid accent ring offset 3px" expects, for the preview's field and rows, the AC-5 focus line and the AC-7 selected look instead of the ring. `design.md` records the panel and the bottom sheet, the scrim as the one colour outside the six roles, the selected row as the one place the ring yields, the field's focus line, the menu's fade as the site's one motion beyond colour, `NavRow` without `current` and `download`, and "command menu" as the name for this dialog.

## Decision

**Chosen option**: Option 1: a panel over the dimmed page on a fine pointer and a bottom sheet with its field at the foot on a coarse pointer, grouped rows, the first row selected when the field opens with focus, and arrows that move focus between real links.

The menu stays plain HTML that the browser opens and closes; the script keeps its keyboard layer, now with one selected row, and still builds no markup.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `review-animations` (`emilkowalski/skills`, `.agents/skills/review-animations/`)

Your picks: everything recommended on the bench (the dimmed page, a 512px panel near the top with a line edge, 2px corners, and no shadow; one 48px field row with an `esc` key and no title, filter word, or key line; three groups with the detail on the right, 40px rows at 14px; the first row preselected with a line ground and an `fg` mark; arrows that move focus; a 150ms fade in and nothing out), except a bottom sheet on a phone; spec 0015 supersedes 0014; a 512px bottom sheet on touch tablets; the highlight follows the mouse; a seventh token for the scrim; no swipe to close; the sheet fades in from 8px lower; the live region names what Enter opens after typing; the field at the foot of the sheet, after the iPhone proof; no References section.

Settled while writing (each with the runner up):

- **`commandMenuGroups` replaces `commandMenuRows`.** The return shape changes from a flat list to groups, so a new name keeps old callers from compiling against the wrong shape. Runner up: keeping the name with a new type.
- **The helper computes `external`.** It is a branch (`http` or not), which `AGENTS.md` puts in a covered helper; `NavRow` computed it inline before. Runner up: the regex inside `CommandMenu`.
- **The menu draws its rows itself, not through `NavRow`.** The rows now have a mark column, a right detail, and a selected look that no other list has; folding that into `NavRow` would give the home and `/contact` rows props they never use. The row stays markup inside `CommandMenu` rather than a new component, so `design.md` keeps twelve components. Runner up: a `CommandRow` component.
- **Group headings are `<h3>` under the hidden `<h2>`, each naming its list through `aria-labelledby`.** Screen readers can jump by heading inside the dialog, and no `role` is needed. Runner up: a plain muted `<p>` label.
- **The close button comes before the field in the DOM.** The dialog focuses its first focusable element when it opens without the script; with the field first, an iPhone would open its keyboard. `order-last` puts the button back on the right. Runner up: `autofocus` on the button, which the lint preset forbids.
- **`esc close` as the name on a fine pointer.** The visible label must be part of the name (WCAG 2.5.3), and `close` says what it does. Runner up: `aria-keyshortcuts="Escape"` with the name `close`, which leaves the visible `esc` out of the name.
- **Click outside in the script, not `closedby="any"`.** One path in every engine, checked by one test, with the pointer pair guard against drags. Runner up: `closedby` with the script as a fallback, two paths to keep in step.
- **The focus line is the label's `::after`, a 2px border shown by `focus-within:`.** On the label it lights for the field alone (on the row, `has-focus:` would also light for the close button, which is focused on every touch open); the unpositioned label lets it span the row; a border survives forced colours mode where a background would not. Runner up: recolouring the 1px rule alone, which reads as faint.
- **Hover acts on real mouse moves only.** Browsers fire pointer moves when the content under a still mouse changes, so filtering would hand the selection to whatever row slid under the cursor. Runner up: `mouseenter` on each row, which has the same problem.
- **Motion in CSS through `starting:` utilities.** No script animation, nothing for the CSP to weigh, and the global reduced motion rule already covers it. Runner up: the `motion` package through the Web Animations API, which `design.md` reserves for page motion.
- **`top-1/7`, the nearest fraction to the bench's 15%.** Arbitrary values are banned, and `top-1/6` sits lower. **`max-h-3/4`** keeps 515px inside a 768px tall window with room to spare; **`max-h-5/6`** on the sheet leaves a strip of dimmed page to tap.

## Rationale

Reasoning, the options, the bench, and the measurements: see [rationale.md](rationale.md).

## Feature design

### Design source

The bench at https://claude.ai/artifact/TRQWNGcKHCNyzmWPNPFJH5 (private, 13 Oct 2026): the six tokens in light and dark, Plex Mono and Plex Sans, the real nine rows, a live configurator, and true size phone frames, with cv.jarocki.me's menu measured beside it. You picked the recommended combination with a bottom sheet on phones; the iPhone proof then moved the sheet's field to its foot. Tokens, type, and the other components come from `design.md` and spec 0003, changed only where AC-3, AC-5, AC-7, and AC-12 say.

### Composition

On a computer, over the dimmed `/cv`, the panel 512px wide with its top one seventh of the way down:

```
┌──────────────────────────────────────────────┐
│    search pages and links              esc   │
├──────────────────────────────────────────────┤
│    pages                                     │
│ ›  home                                      │  ← selected: line ground
│    about                                     │
│    cv                                  here  │
│    projects                                  │
│    contact                                   │
│    contact                                   │
│    email             jorgergo@icloud.com     │
│    github                    @jorgergo ↗     │
│    linkedin                in/jorgergo ↗     │
│    file                                      │
│    cv.pdf                       download ⤓   │
└──────────────────────────────────────────────┘
```

On a phone, the sheet on the bottom edge, nothing selected until the field has focus:

```
│ (dimmed page, tap to close)                  │
┌──────────────────────────────────────────────┐
│    pages                                     │
│    home                                      │
│    …                                         │
│    cv.pdf                       download ⤓   │
├──────────────────────────────────────────────┤
│    search pages and links            close   │
└──────────────────────────────────────────────┘
```

The footer and the corner button stay as spec 0014 drew them.

### Data model sketch

No stored data and no `cv.json` change. The groups are derived at build time:

| Shape (module) | Fields |
|---|---|
| `MenuGroup` (`src/lib/site-nav.ts`) | `heading: 'pages' \| 'contact' \| 'file'`, `rows: readonly MenuRow[]` (never empty) |
| `MenuRow` (`src/lib/site-nav.ts`) | `name: string` (left), `detail: string` (right, `''` for a page), `href: string`, `current: boolean`, `external: boolean`, `download?: string` (the PDF row only) |

Runtime state lives in the DOM only: the dialog's `open`, the field's value, each row's and group's `hidden`, and the one `data-selected` link.

### State transitions

```
closed ──(shortcut, footer button, corner button)──▶ open
open ──(Esc, esc or close, the shortcut, a backdrop click, following a row)──▶ closed
open: selected = first row ──(↓ ↑, hover, focus on a row)──▶ another row
open: any ──(input)──▶ first visible row, or none
```

Every open and every close resets the field, the filter, and the selection; an open that focuses the field then selects the first row.

### API surface

Build time and client side only, no HTTP beyond the static files.

| Item (module) | Signature or props | Returns | Errors |
|---|---|---|---|
| `commandMenuGroups` (`src/lib/site-nav.ts`) | `(basics: { readonly name: string } & Parameters<typeof formatContactRows>[0], routePattern: string) => readonly MenuGroup[]` | three groups, nine rows today | none; no `profiles` gives seven rows |
| `commandMenuRows`, `MenuRow` (old shape) | removed | | |
| `COMMAND_MENU_ID` (`src/lib/command-menu.ts`) | `'command-menu'` | unchanged | none |
| `rowMatches` | `(text: string, query: string) => boolean` | unchanged | none |
| `formatMatchCount` | `(count: number, query: string, target: string) => string` | `''`, `no match`, `1 row, enter opens <target>`, `N rows, enter opens <target>` | none |
| `shortcutHint`, `isComposingKey`, `isMenuShortcut` | unchanged | unchanged | none |
| `nextFocus` | `(index: number, selected: number, count: number, key: 'ArrowDown' \| 'ArrowUp') => number` | the next focus, `-1` for the field | none |
| `CommandMenu` (`src/components/CommandMenu.astro`) | `preview?: boolean` | the dialog and its script, or the static preview | the `getCv()` throw (spec 0002) |
| `NavRow` | drops `current` and `download` | the row as in specs 0004 and 0011 | none |
| `Button`, `SiteFooter`, `BaseLayout` | unchanged | unchanged | none |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render the groups | headings, names, details, hrefs, order | `commandMenuGroups`: the `pages`, `contact`, and `file` literals, the home literal, `SITE_NAV`, `formatContactRows(basics)`, `CV_PDF_PATH` |
| Render a row | `current`, `external` | `commandMenuGroups`: `href === routePattern`; `href` starting with `http://` or `https://` |
| Render the PDF row | the saved file name | `cvPdfFileName(basics.name)` (spec 0013) |
| Render the panel | the dimmed page | `--color-scrim` (AC-3) |
| Render the panel | `menu`, `search pages and links`, `esc`, `close`, `here`, `download`, `no match`, `›` | literals in `CommandMenu` and `commandMenuGroups`, the bench words you kept |
| Render the panel or sheet | which shape | `pointer-coarse:` (the main input), no script |
| Open | which row is selected | the open path: the first row when focus lands in the field (the shortcut, or a button where `matchMedia('(pointer: fine)')` matches), else none |
| Hover | which row is selected | the row under a `pointermove` with `pointerType` `mouse` and new coordinates, on the `data-menu-list` block |
| Focus enters the field | which row is selected | the first visible row, when none is selected |
| Input | which row is selected | the first visible row after the filter |
| Enter in the field | which link follows | the `data-selected` link |
| Announce | the live region text | `formatMatchCount(visible rows, field value, the textContent of the selected link's data-menu-name span)` |
| Render the groups | heading ids and list labels | `${COMMAND_MENU_ID}-${heading}`, left out in the preview |
| Backdrop click | whether to close | `pointerdown` and `click` both targeting the dialog element |
| Open | the fade | `@starting-style` from the `starting:` utilities, the default transition duration and easing |
| Everything AC-13 carries | as spec 0014 | spec 0014's value sourcing table, unchanged |

### Key invariants

- One dialog per page, one script per page, one visible trigger per device.
- The menu's groups always equal `commandMenuGroups(basics, routePattern)`: no row is written by hand in a component or a test.
- At most one row carries `data-selected`, always a visible one, and Enter in the field follows exactly that row.
- The script never creates elements or writes HTML: it toggles `hidden` and `data-selected`, sets `textContent`, moves focus, and opens or closes the dialog.
- With JavaScript off, the page is today's page plus a closed dialog of links that the buttons open where invoker commands exist.
- Colours come from the six tokens plus `scrim`, and `scrim` appears only on the menu's `::backdrop`. No arbitrary value, no `dark:` variant, no shadow, no radius beyond `rounded-xs`.
- The menu's fade is the only motion beyond colour on the site, CSS only, and absent under reduced motion.
- The corner button is the only fixed element on the site, and it never covers the footer.

### Security model

Unchanged from spec 0014: a public static site with no users. The filter text never leaves the page, the script writes no markup, and the CSP policy is untouched (a CSS transition needs no permission). Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, `styleguide.spec` is `e2e/styleguide.spec.ts`, `verify` is a manual step in [verify.md](verify.md).

- Groups helper (Vitest): today's groups, `current` per route, no profiles, the accented file name, `external`, verifies **AC-1**.
- Client helpers (Vitest): the `nextFocus` table and the four `formatMatchCount` strings, verifies **AC-9**, **AC-10**.
- Contrast (Vitest): `selected row: fg on line` in light, dark, and print, verifies **AC-7**.
- Happy path (`site.spec`): on every page Ctrl+K opens the panel with focus in the field and `home` selected; the groups equal `commandMenuGroups`; typing `git` leaves the GitHub row selected and the live region says `1 row, enter opens github`; Enter follows it, verifies **AC-2**, **AC-6**, **AC-8**, **AC-10**.
- Panel look (`site.spec`): the panel is at most 512px wide, its top one seventh down, its border `line`, no shadow, the backdrop `scrim`; the field row is 48px with no outline and a 2px accent line while focused, verifies **AC-2**, **AC-3**, **AC-5**.
- Selected look (`site.spec`): the selected row's ground is `line`, its `›` is visible, and its name and detail compute to `fg`; a row focused by ↓ looks the same and shows no outline, verifies **AC-7**.
- Selection and keys (`site.spec`): hovering `about` selects it and Enter in the field follows it; ↓ from the field goes to the second row, ↑ from the first row returns to the field, a letter on a row lands in the field, verifies **AC-8**, **AC-9**.
- Click outside (`site.spec`): a click on the backdrop closes; a drag from the field to the backdrop does not; a click inside the panel's padding does not, verifies **AC-11**.
- Bottom sheet (`site.spec`, `verify`): in a touch context the corner button opens a sheet whose bottom edge meets the viewport's, the field row below the last row, focus on `close`, nothing selected, and no focus line; focusing the field selects the first row and shows the line; on a real or simulated iPhone, and on Android, the field stays above the keyboard after typing, verifies **AC-4**, **AC-5**, **AC-8**.
- Still mouse (`site.spec`): with the mouse resting over the list, typing `git` keeps the GitHub row selected even as other rows slide under the cursor, verifies **AC-8**.
- Motion (`site.spec`): the `@starting-style` rules are in the built CSS, the open dialog computes 150ms, and 0.01ms under reduced motion; closing removes it the same frame, verifies **AC-12**.
- Failure case, no script (`site.spec`): with JavaScript disabled the footer button opens the panel of links with no field, focus on `esc`, and Esc closes it, verifies **AC-5**, **AC-13**.
- Carried rules (`site.spec`): the existing shortcut, trigger, toggle, modified click, Back, PDF download, scroll lock, print, CSP, and Tab stop tests stay green, adjusted to the new names, verifies **AC-13**.
- Accessibility (`site.spec`): axe in light and dark, desktop and touch, with the menu open; no `role`, `target`, or `style`; sizes; 320px with no sideways scroll, verifies **AC-14**.
- `NavRow` (`site.spec`, `styleguide.spec`): the home and `/contact` tests pass unedited, verifies **AC-15**.
- Style guide (`styleguide.spec`): the preview in both panels, the first row selected, verifies **AC-17**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the redesigned menu ships whole in one merge, after a short proof that the browsers do what the design leans on. No migration: reverting the merge restores spec 0014's sheet.

1. [x] Proof first: on a scratch page under `astro dev`, a `<dialog>` with the AC-12 classes and `backdrop:bg-scrim`; in Chromium, Firefox, and WebKit (install the two extra Playwright browsers locally for this check only, as spec 0014 did) confirm the panel and the backdrop fade in on open and vanish at once on close, that a backdrop click gives the dialog element as the target of both `pointerdown` and `click`, and that `has-focus:` shows the field's line. If one engine skips the backdrop's fade, accept a backdrop that appears at once there and note it in `verify.md`; if `@starting-style` fails on the dialog itself, open instantly and return to `/architect`. Delete the scratch page, satisfies **AC-11**, **AC-12**.
2. [x] Helpers and tokens: `MenuGroup`, `MenuRow`, and `commandMenuGroups` in `src/lib/site-nav.ts` (removing `commandMenuRows`) with the AC-1 cases in `src/lib/site-nav.test.ts`; the new `nextFocus` and `formatMatchCount` in `src/lib/command-menu.ts` with their cases in `src/lib/command-menu.test.ts`; `--color-scrim`, `::backdrop` in the reduced motion rule, and `scrollbar-gutter: stable` on `html` in `src/styles/global.css`; the `selected row: fg on line` pair in `CONTRAST_PAIRS` and in the floors fixture of `src/lib/contrast.test.ts`, satisfies **AC-2**, **AC-1**, **AC-3**, **AC-7**, **AC-9**, **AC-10**.
3. [x] Components: rewrite `src/components/CommandMenu.astro` (the hidden heading, the field row, the groups and rows, the `no match` line, the live region, the panel and sheet classes, the motion classes, a Spec 0015 comment, and the `preview` body) and its script (selection with `data-selected`, hover, the new arrow walk, Enter, the announcement, click outside, the rest unchanged); remove `current` and `download` from `NavRow`, satisfies **AC-2**, **AC-4** to **AC-8**, **AC-10** to **AC-13**, **AC-15**.
4. [x] Page tests: rewrite the `command menu` block in `e2e/site.spec.ts` from `commandMenuGroups` (desktop, touch, reduced motion, and no script contexts), keep every carried rule, and update any test that imported `commandMenuRows`, satisfies **AC-13**, **AC-14**, **AC-16**.
5. [x] Style guide, docs, and the gate: the `Command menu` section with the new preview and without the `NavRow` examples, its `styleguide.spec` checks, and the ring test's expectation for the preview's field and rows; the `design.md` lines; run the `review-animations` skill on the fade; then `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`, and the steps in [verify.md](verify.md), the iPhone simulator steps among them, satisfies **AC-4**, **AC-16**, **AC-17**.

## Consequences

**Positive**:
- The menu reads as a menu: 515px of panel instead of the whole screen, the page still in view behind it, and the first row's Enter shown before you press it.
- On a phone the field sits near the thumb and stays above the keyboard while you type, proven on iOS 26 before the build.
- The double frame around the field is gone, and the focus line is a real 2px indicator.
- `NavRow` goes back to one job (the home and `/contact` rows).
- A new page or profile still joins the menu, in the right group, with no menu or test edit.

**Negative / tradeoffs**:
- The palette gains a seventh value, `scrim`. It carries no text and the contrast test skips it, but "six colours, nothing else" now has a named exception.
- Rows show focus with the selected look, and the field with its line, instead of the global ring, the first exceptions to that rule; the `fg` mark, the accent border, and the contrast pair guard them.
- The menu's fade is the site's first motion beyond colour, and it ends `design.md`'s "opens and closes instantly".
- Two shapes by input type: the panel and the sheet double the menu's layout tests, and a touch laptop or an iPad with a keyboard gets the sheet with keyboard behaviour.
- On touch the field shows below the rows but comes first in the DOM, and in the field row the close button comes before the field in the DOM; screen readers and Tab follow the DOM.
- The script grows (selection, hover, click outside, the richer announcement), and its write rule widens to `data-selected`.
- Without JavaScript, clicking the dimmed page does nothing; Esc and the close button still work.
- `html` keeps a scrollbar gutter on every page (`scrollbar-gutter: stable`): where scrollbars take space (Windows, Linux), a short page shows an empty strip where the scrollbar would be.
- Rows and the field are two places where the global focus ring yields to another indicator.
- The `command menu` page test block is largely rewritten, and spec 0014's `verify.md` steps no longer describe the menu.

**Neutral**:
- Spec 0014 is superseded; its shortcut, trigger, script, and print decisions carry forward here through AC-13.
- The bench and the iPhone proof are recorded in `rationale.md`.
- `pointer-coarse:` now also switches the menu's shape, still the site's only input media variant; `xs` stays the only width breakpoint.

## Follow-up

- [x] `/sync`: the `AGENTS.md` command menu rule (a panel on a fine pointer and a bottom sheet on touch, `commandMenuGroups` for the rows, `data-selected` among what the script may write, the fade), the colour rule's `scrim` exception, and the `NavRow` line without `current` and `download`. Done in the `/sync` after the build (PR #36).
- [ ] Check the bottom sheet on a real iPhone once it ships; the proof ran in the iOS Simulator only.
- [ ] The deferred CV section jumps would now be a fourth group; revisit with the panel's 3/4 height in mind.
