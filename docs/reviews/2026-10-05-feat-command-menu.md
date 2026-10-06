# Review, feat/command-menu, 2026-10-05

**Reviewed by**: Sonnet 5.5 (author on a different model)
**Scope**: 19 files, branch vs main
**Verdict**: Approve with nits

## Summary

You added a command menu: a `<dialog>` sheet of keyed `NavRow` links, opened by invoker buttons, with one small bundled script for the shortcut, the filter, and the arrow keys. The code follows spec 0014 closely and respects the AGENTS.md rules (pure helpers, no markup built in the script, tokens only, no inline style). I found no blockers or majors. The notes below are small edge cases and tidy ups.

## Minor

### 🟡 Arrow keys steal IME candidate selection, `src/components/CommandMenu.astro:171`
**Problem**: The dialog's keydown handler checks `isComposingKey` for Enter, but not for ArrowDown and ArrowUp. While a visitor composes text in the filter field with an input method, the arrows choose candidates. Your handler calls `preventDefault()` and moves focus to a row instead.
**Why it matters**: Someone typing with a Japanese or Chinese keyboard cannot pick a candidate with the arrows. Focus jumps away mid composition. The spec asks for the IME guard on the shortcut and Enter only, so this is a gap in the spec too.
**Suggested fix**: Return early from the arrow branch when `isComposingKey(event)` is true. Add a page test beside the existing composing Enter test.

### 🟡 Invoker open focuses the field one frame late, `src/components/CommandMenu.astro:123`
**Problem**: For an invoker button on a fine pointer, the field is focused in the `toggle` handler, which fires after the open. The handler also calls `reset()`, which wipes the field.
**Why it matters**: A fast typist can type a character or two before `toggle` fires, and that text is wiped. The shortcut path avoids this with `openedByScript`, but the button path has no guard. The window is about one frame, so it is rare.
**Suggested fix**: In the `toggle` handler, only call `reset()` when the field is empty or the rows are all shown, or skip the reset when the field already has focus. The reset at the start of open is already done by `close` and the earlier open.

## Nits

- ⚪ `src/components/SiteFooter.astro:23`, the new comment sits at the end of the frontmatter with no code under it. Move it above the markup it describes (the button) or into a JSX comment.
- ⚪ `e2e/site.spec.ts:1`, the file grew by about 1100 lines and is now over 5000 lines. Consider splitting the `command menu` block into `e2e/command-menu.spec.ts` so it is easier to navigate.
- ⚪ `src/components/CommandMenu.astro:97`, the script returns silently if any hook element is missing. That is safe, but a dev only `console.warn` would make a markup typo easy to spot.
- ⚪ `src/lib/site-nav.ts:44`, `MenuRow.key` is a plain `string`. The 8 character limit is held by a test only. This is fine, and it matches how `formatContactRows` does it.

## Strengths

- `command-menu.ts` imports nothing, so the client bundle carries no schema or Zod code. The reason is written in the file header.
- The `toggle` race (`openedByScript`) is understood, commented, and covered by a dedicated page test.
- Good attention to input edge cases: Latin versus non Latin layouts, Dvorak, Safari `keyCode` 229, modified clicks, and a letter typed on a row landing in the field.
- The filter text is the link's accessible name, so what you see, type, and hear agree.
- The script never builds markup, and the page behind is locked with one CSS rule. The fixed corner button is documented with its exact bottom space.
- `focusables` now ignores rendered hidden elements through `checkVisibility()`. The Tab order tests stay honest.

## Test coverage

Unit tests cover every exported helper in `command-menu.ts` with the cases the spec lists (match, count, hint, shortcut accept and refuse tables, `nextFocus` table). `site-nav.test.ts` covers the nine rows, `current` per route, no profiles, and the accented file name. The page tests cover the dialog, the focus paths, the touch context, no script, download, modified click, Back, 320px, axe in both schemes, print, and CSP. The one gap is arrow keys during IME composition (see the first minor).
