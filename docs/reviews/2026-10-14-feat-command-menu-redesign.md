# Review, feat/command-menu-redesign, 2026-10-14

**Reviewed by**: Fable 5.1 (author on Opus, a different model)
**Scope**: 19 files, branch vs main
**Verdict**: Approve with nits

## Summary

You turned the full page sheet of spec 0014 into a panel over the dimmed page on a fine pointer and a bottom sheet with its field at the foot on touch, with grouped rows from a new `commandMenuGroups` helper, one selected row kept in a single `data-selected` attribute, hover and arrow keys that keep focus and selection in step, a click outside guarded against drags, and a CSS only fade. The code follows spec 0015 closely and keeps every AGENTS.md rule I checked: pure helpers over readonly data, a script that imports only the pure module and builds no markup, Tailwind classes only, the six tokens plus the one named `scrim` exception, no `role`, no `target`, no `dark:` variant. Lint, `astro check`, and all 571 unit tests pass on this machine. I found no blockers or majors. The two minors are documentation that now disagrees with the code; the rest are small tidy ups.

## Minor

### 🟡 `AGENTS.md` still describes spec 0014's menu, `AGENTS.md:44`
**Problem**: The command menu rule says the menu "is a full page `<dialog>` of `NavRow kind="key"` rows", that its rows come from `commandMenuRows`, that the script "only toggles `hidden`, sets `textContent`, moves focus, and opens or closes the dialog", that `NavRow` takes `current` and `download`, and it points to spec 0014. Line 40 says `CommandMenu` builds its rows "see spec 0014", and line 54 says colours come only from the six tokens with no word about `scrim`. The code now has `commandMenuGroups` (`src/lib/site-nav.ts:49`), a script that also toggles `data-selected` (`src/components/CommandMenu.astro:218`), a `NavRow` without those two props (`src/components/NavRow.astro:4`), and `--color-scrim` (`src/styles/global.css:21`). `AGENTS.md` is not in this branch's diff.
**Why it matters**: `AGENTS.md` is the first thing every later skill and agent reads. A change that follows it would call a helper that no longer exists, hand `NavRow` props it no longer accepts, or flag `backdrop:bg-scrim` as a banned colour. Spec 0015's follow up already lists this `/sync`, so you know; the review records it so it does not slip past the merge.
**Suggested fix**: Run `/sync` (or edit the three lines by hand) with the merge: a panel on a fine pointer and a bottom sheet on touch, `commandMenuGroups` for the rows, `data-selected` among what the script may write, `NavRow` without `current` and `download`, the `scrim` exception on the colour rule, and spec 0015 as the reference on lines 40 and 44.

### 🟡 Spec 0015 names two classes the code rightly does not use, `docs/specs/0015-command-menu-panel/index.md:23`
**Problem**: AC-2 says "`print:hidden` keeps it off paper", but the dialog carries `print:open:hidden` (`src/components/CommandMenu.astro:38`). That is the correct class: `open:flex` compiles to `.open\:flex:is([open], :popover-open, :open)`, specificity (0,2,0), which beats a plain `print:hidden` at (0,1,0), so a menu left open when the visitor prints would reach the paper. AC-6 says the row list is `min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5`, but the code uses `flex-auto` plus `flex flex-col gap-1` (`src/components/CommandMenu.astro:79`); `flex-auto` is the safer basis for a list whose height must follow its rows inside a dialog with no set height. Neither deviation is explained in the spec or its rationale.
**Why it matters**: The spec is the contract this change is checked against, and the next person to touch the menu will read it before the code. Someone "correcting" the code back to the spec's `print:hidden` would print the open menu; the page test `in print the menu and both buttons never show` (`e2e/site.spec.ts:5723`) would catch it, but only after the confusion.
**Suggested fix**: Update AC-2 to name `print:open:hidden` with the one line reason (the `open` variant outranks `print:hidden`), and AC-6 to the list classes as shipped. If you prefer, add both to "Settled while writing" instead, as the spec does for `top-1/7`.

## Nits

- ⚪ `src/lib/site-nav.ts:42`, `isExternal` is the third copy of `/^https?:\/\//` (`src/components/NavRow.astro:20` and `src/components/IconLink.astro:29` hold the others). Export one helper and import it in both components, so a future rule such as `mailto:` lives in one place.
- ⚪ `design.md:88`, "The only rounded corners are `rounded-xs` on buttons and chips" now leaves out the menu panel and its rows, which both take `rounded-xs`.
- ⚪ `e2e/site.spec.ts:5575`, the CDP test asserts that `document` holds exactly one passive `pointerdown` listener. It pins the mechanism of commit 274c9d5 rather than the behaviour (a backdrop tap in iOS Safari), which Chromium cannot show. Keep it, but a comment saying it is a regression guard would tell a later reader why a different valid wiring fails it.
- ⚪ `e2e/site.spec.ts:5480`, Enter on a focused row (as opposed to Enter in the field) has no test on this branch or the last one. The native click goes through the same list handler as the mouse test, so the risk is low; one `press('Enter')` after `ArrowDown` would close the gap.

## Strengths

- The selection lives in one DOM attribute with one writer, `select()` (`src/components/CommandMenu.astro:218`), so "at most one selected row, always a visible one" is easy to see and easy to keep.
- `print:open:hidden` shows real care with specificity; an open menu would otherwise print, and the page test proves it does not.
- The hover guard (a move with the same coordinates changes nothing) and the drag guard (`pointerdown` and `click` both on the dialog) each have a dedicated page test, including the still mouse case while rows slide under the cursor and the drag from the field to the dimmed page.
- Every page test expectation derives from `commandMenuGroups`, `SITE_NAV`, `formatContactRows`, and `global.css`; the `scrim` helper in `e2e/helpers.ts:129` reads the token from the same file the site ships, so a token change needs no test edit.
- The style guide's ring test now branches by element kind (row, field, everything else) instead of carving out exceptions by name, so the two places where the ring yields are the only two that can.
- The tradeoffs are written down where the next reader will look: the DOM order against the visual order on the touch sheet, the scrollbar gutter strip on Windows, and the first motion beyond colour.

## Test coverage

Vitest covers the new helper logic fully: `commandMenuGroups` (today's three groups exactly, `current` per route, no profiles, the accented file name, `external` on the two profile rows), the twelve case `nextFocus` table, the four `formatMatchCount` strings, and the `selected row: fg on line` pair in both the pairs list and the floors fixture. All 571 unit tests pass, and `pnpm lint` and `astro check` are clean on this machine. The page tests cover every acceptance criterion in spec 0015 with behaviour assertions (computed colours, boxes, focus, URLs, the download event) rather than class lists, in desktop, touch, 320px, tablet, reduced motion, no script, and no invoker contexts. I did not run them, since they need a build; `verify.md` records them passing. Two gaps worth knowing: Enter on a focused row is not exercised (see the last nit), and the VoiceOver step in `verify.md:20` is ticked but says it was accepted without a run, so the heading jumps and the announcement order inside the dialog rest on axe and the live region string tests alone. Firefox and WebKit saw only the proof step, as the build plan intended; CI stays Chromium.
