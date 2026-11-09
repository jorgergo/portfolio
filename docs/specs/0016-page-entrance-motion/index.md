# 0016. Page entrance as a staggered fade up in CSS

**Date**: 2026-10-29
**Status**: In Progress
**Amends**: [0003](../0003-design-system/index.md) AC-10 and its motion library rule · [0008](../0008-home-page-centered-menu/index.md) AC-7 · [0015](../0015-command-menu-panel/index.md) AC-17 and its motion invariant

## Summary

When a page loads, its opening blocks now arrive one after another from the top: each fades in while rising 20px, 50ms after the one before, the numbers measured on t3.gg. It runs on every page in plain CSS with no script, and everything has settled within 950ms. A block is hidden only while its own animation runs, so with reduced motion, on paper, and in the PDF the page is simply there, complete. A link to a section, such as `/cv#experience`, lands exactly where it would with motion off, because the block that holds the target fades in place without rising. This ends the rule that colour is the only motion on the base pages, so spec 0003 and `design.md` change with it.

## Requirements

**User stories**:
- As a visitor, I want a page to arrive in a short, ordered cascade, so that the site feels made with care without making me wait.
- As a visitor who asks for reduced motion, I want every page complete on the first frame, so that nothing moves or lags.
- As a recruiter printing the CV or saving the PDF, I want every block at full ink, so that no text comes out faint.
- As a visitor with a slow eye or a fast hand, I want links to work from the first frame, so that the motion never gets in my way.
- As the site owner, I want a new row in `cv.json` or `SITE_NAV` to take its place in the order with no code edit, so that content changes stay content changes.
- As a visitor who follows a link to a CV section, I want its heading at the top of the window, so that the link takes me where it says.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1** (motion values): `src/styles/global.css` adds four variables beside the other `--motion-*` on `:root`: `--motion-enter: 600ms`, `--motion-enter-rise: 20px`, `--motion-enter-step: 50ms`, and `--motion-enter-ease: cubic-bezier(0.16, 1, 0.3, 1)`. These are t3.gg's measured values. `--motion-ease` stays the curve of every colour transition and of the command menu's fade; only the entrance uses the new curve.
- **AC-2** (the animation): `global.css` adds `@keyframes enter` and the functional utility `@utility enter-*` exactly as written under *Composition*. The keyframes hold one `from` frame (`opacity: 0`, `translate: 0 var(--motion-enter-rise)`) and no `to` frame, so a block ends on its own resting style. The utility applies only inside `@media screen and (prefers-reduced-motion: no-preference)`. Its fill mode is `backwards`, never `forwards` or `both`, so nothing lingers once a block has settled.
- **AC-3** (nothing hidden at rest): no block carries `opacity-0` or any other class, attribute, or script that hides it. The `backwards` fill is the only thing that holds a block on its start frame, and only while the animation exists. With every animation cancelled, every block computes `opacity: 1` and `translate: none`.
- **AC-4** (the helper): `src/lib/entrance.ts` imports nothing and exports `ENTER_CLASSES`, the eight literal strings `enter-0` to `enter-7` written out so Tailwind's scan finds them, its type `EnterClass`, and `enterClass(step: number)`, which drops any fraction, clamps the step to 0 through 7, and returns `enter-<step>`, so every number gives a real class. Every block takes its class through `enterClass`; no page or component writes an `enter-` class by hand. Vitest in `src/lib/entrance.test.ts` covers steps 0, 1, 7, 8, 20, -1, and 2.5, and that `ENTER_CLASSES` holds eight entries.
- **AC-5** (the blocks): each page marks the blocks in the *Composition* table, in that order, starting at step 0. Everything inside a block moves with it, with no nested stagger. Blocks past the eighth take step 7 through `enterClass` and enter together. A row added to `cv.json` or `SITE_NAV` takes its step with no code edit.
- **AC-6** (the footer): `BaseLayout` gains `footerStep?: number | undefined`. Given a step, it passes `enterClass(footerStep)` to `SiteFooter` through its existing `class` prop, beside `print:hidden` when `printFooter` is false. Omitted, the footer stays still, which only the dev `/styleguide` page does. Every built page passes the step after its last content block, so the footer always enters last.
- **AC-7** (what stays still): the corner `menu` button, the skip link, `<main>`, the page wrappers, and the command menu carry no entrance, and the menu keeps its own fade from spec 0015. The entrance plays once per page load and never loops. Nothing animates on scroll, and hover stays colour only.
- **AC-8** (timing): with motion on, every block (the one that holds a fragment target included, AC-16) computes `animation-name: enter`, a 0.6s duration, the AC-1 curve, a `backwards` fill, and a delay of its step times 50ms. Each page settles at its last step times 50ms plus 600ms: 850ms on `/` and `/projects`, 800ms on `/contact`, 750ms on the 404 page, and 950ms on `/about` and `/cv`. No page takes longer than 950ms, whatever its content.
- **AC-9** (reduced motion): under `prefers-reduced-motion: reduce`, no block computes an animation, `document.getAnimations()` is empty after load, and every block sits at full opacity in its resting place on the first frame. The global reduced motion rule in `global.css` also gains `animation-delay: 0s !important`, so no later animation can keep a delay there.
- **AC-10** (print and PDF): under print media no block computes an animation, and every block prints at full ink on every page, even when printing starts mid entrance. `src/lib/render-pdf.ts` also calls `page.emulateMedia({ reducedMotion: 'reduce' })` before `page.goto`, as a second guard, since nothing checks the PDF's ink. `dist/cv.pdf` still passes `checkCvPdf`.
- **AC-11** (no script, no CSP change): the entrance is CSS alone. Each built page still ships only the command menu's script, no element gains a `style` attribute, `pnpm preview` logs no CSP violation, no dependency is added, and with JavaScript off the entrance still plays.
- **AC-12** (the page works during the entrance): links work from the first frame by click, tap, and Tab. Layout does not shift, because `translate` moves paint only. No vertical scrollbar appears at any moment on a page that fits its viewport, because the 80px of padding under the footer holds its 20px start offset. Nothing scrolls sideways at 320px. A fragment link lands as AC-16 says.
- **AC-13** (accessibility): with motion on, once the entrance has settled, every page passes an axe WCAG 2.2 AA check in light and dark. The entrance ends within a second, well inside the five seconds of WCAG 2.2.2 (Pause, Stop, Hide). No `role` and no `target` are added.
- **AC-14** (page tests): `playwright.config.ts` sets `reducedMotion: 'reduce'` in the shared `use` block, so existing tests see a still page. A single test that asserts a real duration or a running transition calls `page.emulateMedia({ reducedMotion: 'no-preference' })` before it loads its page; today that is the menu's fade test in `e2e/site.spec.ts` (`the panel and its backdrop fade in over 150ms`) and `links change colour with the 150ms theme transition` in `e2e/styleguide.spec.ts`, and the suite names any other by failing. The menu block's `settled` helper needs no edit: it waits for the dialog's own animations, which end at once under reduced motion. `e2e/helpers.ts` gains `freezeEntrance(page)`, which a test calls before `page.goto`: it opens a CDP session (the browser's debugging protocol) and sends `Animation.enable` and `Animation.setPlaybackRate` with rate 0, so every animation holds at its first frame, and the test seeks by setting `currentTime` on `document.getAnimations()`. It also gains `pageSettled(page)`, which polls `document.getAnimations().length` until it reaches 0, the one page wide wait behind every "once settled" check. A new `page entrance` block in `e2e/site.spec.ts`, tagged `spec 0016`, sets `test.use({ reducedMotion: 'no-preference' })` for the whole block and derives every expectation from `cv.json`, `SITE_NAV`, and the site's own helpers, so a valid content edit needs no test edit; it reads the `/cv` section count from `main section` in the page, never from a third copy of that list. The `nothing animates` test emulates motion on, waits for `pageSettled`, and allows the `enter` keyframes on elements with an `enter-` class alone. `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm exec playwright test` pass.
- **AC-15** (docs): `design.md` records the entrance in its character line and its Motion section, and drops "Motion is limited to colour changes and the command menu's short fade in". Spec 0003 AC-10 gains an "Amended by 0016" note, its token table gains the four variables, and its motion library rule reads: predetermined motion is written in CSS, and the `motion` package is kept for motion CSS cannot express. Spec 0015 gains an "Amended by 0016" note beside AC-17 and its invariant that the menu's fade is the only motion beyond colour. The `review-animations` skill reviews the result before merge.
- **AC-16** (deep links, added 2026-11-07): a fragment link lands where it would with motion off. A browser scrolls to a fragment by the target's painted box, so a block still on its start frame would carry the target 20px out of place for good. The block that is the target or holds it sets `--motion-enter-rise: 0px` through the `&:is(:target, :has(:target))` rule inside `enter-*`, exactly as written under *Composition*, so it fades in place at its own step while every other block still rises. It keeps every AC-8 value (name, duration, curve, fill, and delay); only its start frame loses the offset. With motion on, opening `/cv#<id>` directly for each `/cv` section heading leaves that heading, once settled, at the same `scrollY` and the same place in the window (within 1px) as with reduced motion, in Chromium, Firefox, and WebKit, so `#experience`, `#projects`, and `#education` put their heading at the top of the window. Changing the hash after load, or going Back between two fragments, starts no animation, so no entrance replays. The rule matches only an `enter-` block, so the skip link's `#main`, which never enters, changes nothing.

## Decision

**Chosen option**: Option 1: CSS keyframes with a `backwards` fill, one `enter-<step>` class per block.

Each block carries one class that sets its delay; the stylesheet does the rest, with no script, no hidden state, and nothing for the CSP to weigh.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `review-animations` (`emilkowalski/skills`, `.agents/skills/review-animations/`)

Your picks: every page; the heading, each row, then the footer as the blocks; the footer enters last; t3.gg's motion as measured, chosen on the bench; a cap of 8 steps; nothing moves under reduced motion; page tests on reduced motion by default; a second PDF guard in `render-pdf.ts`; each section as one block on the CV; the corner `menu` button stays still; no References section.

Settled while writing (each with the runner up):

- **One class per block, with an explicit step.** The blocks sit at different depths (a `<header>`, then `<li>` rows inside an `<ol>`, then the footer in `BaseLayout`), so only an explicit step can order them. Runner up: a parent class with `:nth-child` delays, which cannot cross those depths.
- **`enterClass` over a dynamic class string.** Tailwind scans source text, so `enter-${step}` alone would generate nothing; the literal list in `ENTER_CLASSES` is what it finds, and the helper holds the cap in one place. Runner up: `@source inline("enter-{0..7}")`, which still needs a helper for the cap.
- **`footerStep` as a `BaseLayout` prop.** The footer lives in the layout but its place depends on the page. A page test fails a wrong number. Runner up: a chain of `:has()` rules in CSS, which needs no prop but hides the order in the stylesheet.
- **`translate`, not `transform`.** The keyframe leaves any transform a block has alone, and pairs with having no `to` frame. Runner up: `transform: translateY()`, as t3.gg writes it.
- **One media query inside the utility.** A block writes one class, and both guards sit in one place. Runner up: `motion-safe:` and `print:` variants on every block.
- **The step lands on the `<a>` in `NavRow`.** Its existing `class` prop goes there, and the link fills its `<li>`, so the row looks the same and `NavRow` needs no new prop. Runner up: a second prop for the `<li>`.
- **Four variables named `--motion-enter*`.** They sit with the other motion values and keep `--motion-ease` meaning what it means today. Runner up: a Tailwind `--animate-enter` theme value, which would hold the same numbers with no gain, since the utility already writes the animation.
- **No style guide entry.** The entrance is not a component, and a replay control would need a second script. `/styleguide` omits `footerStep`, so it stays still.
- **`page.emulateMedia` for a single test, `test.use` for a block.** Playwright allows `test.use` only around a whole group of tests, and the menu's fade test sits inside a 1,500 line block. Runner up: a nested group around each test.
- **A frozen timeline for tests that need one moment.** Rate 0 holds the entrance before the first frame, whereas pausing after load races the page. Runner up: pausing through the Web Animations API, which works in every engine but can miss an animation that has already ended.
- **No migration.** Nothing is stored, and reverting the merge restores the still pages.
- **No rise on the block that holds a fragment target (added 2026-11-07, after `/check verify` found deep links landing 20px low).** One variable, set by `:is(:target, :has(:target))`, keeps the one animation and every AC-8 value, and changing it never restarts anything. Runner up: a 0s duration and delay on that block, which shows the target at once but bends AC-8 for it. `animation: none` there replays an entrance whenever the target moves, and leaving the offset cuts the heading off; see [rationale.md](rationale.md).

## Rationale

Reasoning, options, and the evidence: see [rationale.md](rationale.md).

## Feature design

### Design source

The private bench at https://claude.ai/artifact/CpAqHBm6Ve5Svsc3254Zpc (built 29 Oct 2026) compares five candidates and a tunable one on copies of the home and about pages, and t3.gg as measured is the one you chose. Spec 0003's tokens and `design.md` otherwise apply unchanged. No colour, type, or spacing changes.

### Composition

The CSS, in `src/styles/global.css`:

```css
@keyframes enter {
  from {
    opacity: 0;
    translate: 0 var(--motion-enter-rise);
  }
}

@utility enter-* {
  @media screen and (prefers-reduced-motion: no-preference) {
    animation: enter var(--motion-enter) var(--motion-enter-ease) backwards;
    animation-delay: calc(--value(integer) * var(--motion-enter-step));

    /* AC-16: a fragment link lands by the painted box, so the block that
       is or holds the target fades in place, with no rise. */
    &:is(:target, :has(:target)) {
      --motion-enter-rise: 0px;
    }
  }
}
```

Tailwind 4.3.3 builds the nested rule as one more rule per step, `.enter-3:is(:target, :has(:target)) { --motion-enter-rise: 0px; }`, inside the same media query, and still builds nothing for `enter-[1]` or `enter-foo`. The keyframes read the variable on the element they animate, so the override reaches that one block's start frame alone. Never write `animation: none` there: when the target later moves to another block, the first block's animation returns and its entrance plays again.

The blocks, in order, each starting at step 0:

| Page | Blocks in order | `footerStep` | Blocks today, with the footer | Settled |
|---|---|---|---|---|
| `/` | the `<header>` (name and tagline) · each `SITE_NAV` row | `SITE_NAV.length + 1` | 6 | 850ms |
| `/about` | the `<h1>` · the intro `<p>` · each `about.items` `<li>` · the closing `<p>` | `about.items.length + 3` | 11 | 950ms |
| `/cv` | the header's top row (name, label, `Download PDF`) · the `<address>` · each rendered `<section>` | `rendered.length + 2` | 11 | 950ms |
| `/projects` | the `<h1>` · each project `<li>` | `projects.length + 1` | 6 | 850ms |
| `/contact` | the `<h1>` · each contact row | `rows.length + 1` | 5 | 800ms |
| `/404` | the `<h1>` · the first `<p>` · the second `<p>` | `3` | 4 | 750ms |

Today on `/about` and `/cv` the last four blocks enter together at step 7.

### Data model sketch

None. Nothing is stored, and `cv.json` and its schema do not change.

### State transitions

A block has three moments, all held by the browser: on its start frame during its delay, running for 600ms, then at rest with no trace of the animation. A page restored by Back or Forward from the browser's page cache does not replay; a reload does. A block that is or holds the document's target (`:target`, set by the fragment in the URL) goes through the same three moments with no offset on its start frame. When the target moves after load, only that variable changes and the animation's name stays, so nothing restarts.

### API surface

| Name | Signature | Output | Errors |
|---|---|---|---|
| `ENTER_CLASSES` (`src/lib/entrance.ts`) | `readonly ['enter-0', …, 'enter-7']` | the eight class names | none |
| `EnterClass` | `(typeof ENTER_CLASSES)[number]` | the type of one name | none |
| `enterClass` | `(step: number) => EnterClass` | `enter-<step>`, with any fraction dropped and the step clamped to 0 through 7 | none |
| `enter-*` (`src/styles/global.css`) | a Tailwind utility taking an integer | the animation and its delay, with no rise on the block that is or holds the fragment target | none |
| `BaseLayout` | gains `footerStep?: number \| undefined` | the footer's step | none |
| `NavRow`, `SiteFooter` | unchanged | the step arrives through `class` | none |
| `freezeEntrance` (`e2e/helpers.ts`) | `(page: Page) => Promise<void>` | every animation held at its first frame, called before `page.goto` | Chromium only |
| `pageSettled` (`e2e/helpers.ts`) | `(page: Page) => Promise<void>` | resolves once `document.getAnimations()` is empty | fails the test on the poll's timeout |

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Render a block | its step | its place in the page's order, passed to `enterClass` |
| Render a block past the eighth | step 7 | `enterClass`, from the length of `ENTER_CLASSES` |
| Render the footer | its step | `footerStep`, the page's block count from `SITE_NAV`, `cv.json`, or `rendered` |
| Play a block | duration, rise, gap between steps, curve | the four variables of AC-1 |
| Play a block | its delay | the step in its class name times `--motion-enter-step` |
| Decide whether to play | motion on or off, screen or paper | the `@media` query inside `enter-*` |
| Land a fragment link | the rise of the block that is or holds the target, `0px` | the `&:is(:target, :has(:target))` rule inside `enter-*`, from the URL's fragment |
| Print the PDF | reduced motion | `page.emulateMedia` in `render-pdf.ts` |

### Key invariants

- A block is never hidden unless its own animation is running.
- One class per block, always from `enterClass`; steps never pass 7.
- The footer always enters last, on every built page.
- No page settles later than 950ms.
- The entrance is CSS alone: no script, no `style` attribute, no new dependency, and one script per page holds.
- Only `opacity` and `translate` animate.
- A fragment link lands where it would with motion off: the block that is or holds the target never rises, and still runs `enter`.
- With reduced motion on, or on paper, nothing animates.
- `--motion-ease` stays the curve of colour transitions and the menu's fade; `--motion-enter-ease` is the entrance's alone.

### Security model

Unchanged: a public static site with no users. The animation lives in the hashed stylesheet, so the CSP policy is untouched. Nothing to authorise.

### Configuration required

None. No environment variable, no secret, no new dependency.

### Critical test scenarios

`site.spec` is `e2e/site.spec.ts`, and `verify` is a manual step in [verify.md](verify.md). The `site.spec` scenarios run with motion on unless they say otherwise.

- Helper (Vitest): steps 0, 1, 7, 8, 20, -1, and 2.5, and eight class names, verifies **AC-4**.
- Happy path (`site.spec`): on `/`, the six blocks in DOM order compute `enter`, 0.6s, the AC-1 curve, `backwards`, and delays of 0, 50, 100, 150, 200, and 250ms; after `pageSettled`, each is at opacity 1 with no `translate`, verifies **AC-1**, **AC-2**, **AC-5**, **AC-6**, **AC-8**.
- Every page (`site.spec`): on each page the blocks' delays equal their place times 50ms, capped at 350ms, from counts read off the content (`main section` in the page for `/cv`), and the footer comes last, verifies **AC-5**, **AC-6**, **AC-8**.
- Hidden at rest (`site.spec`): with every animation cancelled, every block computes opacity 1 and `translate: none`, and no block carries `opacity-0`, verifies **AC-3**.
- What stays still (`site.spec`): the corner button in a touch context, the skip link, and `<main>` have no animation, and the `enter` keyframes appear only on `enter-` elements, verifies **AC-7**, **AC-14**.
- Reduced motion (`site.spec`, with `reducedMotion: 'reduce'` emulated): every block computes `animation-name: none`, and `getAnimations()` is empty right after load, verifies **AC-9**.
- Failure case, printing mid entrance (`site.spec`): on every page, call `freezeEntrance`, load, seek to 100ms, then switch to print media; each block computes no animation and opacity 1, verifies **AC-10**.
- No script (`site.spec`): with JavaScript off a block still computes `enter`, and each page still ships only the menu's script, verifies **AC-11**.
- Built CSS (`site.spec`): the stylesheet holds `@keyframes enter`, and the utility sits inside the `screen` and `no-preference` query, beside each step's minified AC-16 rule, `.enter-N:is(:target,:has(:target)){--motion-enter-rise:0px}` (Lightning CSS keeps a custom property's value and the `:is()` list as written), verifies **AC-2**, **AC-16**.
- Early click (`site.spec`): call `freezeEntrance`, load `/`, assert the last row computes opacity 0, then click it; the page opens, verifies **AC-12**.
- Scrollbar (`site.spec`): call `freezeEntrance`, load `/` at 1280×800, and seek to each step's start time; `scrollHeight` equals `clientHeight` each time, and at 320px nothing scrolls sideways, verifies **AC-12**.
- Accessibility (`site.spec`): axe in light and dark on each page after `pageSettled`, verifies **AC-13**.
- Failure case, deep link landing (`site.spec`): the ids are each `main section`'s `aria-labelledby` (its `SectionHeading` id), read from the page. For each id, load `about:blank` and then `/cv#<id>`, so every load is a fresh document with its own entrance (a second load of the same path would only move the hash). Wait for `pageSettled` and `document.fonts.ready`, then read `scrollY` and the heading's top. Do the same after `page.emulateMedia({ reducedMotion: 'reduce' })`; each pair of readings agrees within 1px. Then, with motion on again and the page landed on the first id and settled, for each other id: set `location.hash`, wait two animation frames, and read `document.querySelector(':target').id` (the new id) and `document.getAnimations().length` (0), verifies **AC-16**, **AC-12**.
- Failure case, deep link first frame (`site.spec`): call `freezeEntrance`, then for each section but the last, load `about:blank` and then `/cv#<id>`. The section that holds the target computes `animation-name: enter`, the 0.6s duration, the AC-1 curve, a `backwards` fill, its step's delay, opacity 0, and a `translate` with no vertical offset (`none`, `0px`, or `0px 0px`, read as the second value, 0 when absent); the next section, the control, computes `enter`, opacity 0, and `0px 20px`, verifies **AC-16**, **AC-8**.
- Deep link in three engines (`verify`): `/cv#experience`, `#projects`, and `#education` at 1280×800 in Chromium, Firefox, and WebKit, then a hash change and Back, verifies **AC-16**.
- PDF ink (`verify`): print `dist/cv.pdf` and check its text is solid, verifies **AC-10**.
- Other engines (`verify`): Firefox and WebKit in the Playwright Docker image, and the iPhone and Android checks, verifies **AC-2**, **AC-9**, **AC-10**, **AC-12**.
- Docs (`verify`): `design.md` and spec 0003 read as AC-15 says, and the `review-animations` findings are closed, verifies **AC-15**.
- Auth and permission: not applicable; the site has no users.

## Build plan

Skateboard: the mechanism lands with nothing moving yet, then home becomes the first usable whole, then the other pages follow. The suite stays green after every step. No migration: reverting the merge restores the still pages.

1. Proof first: on a scratch page under `astro dev`, the AC-2 CSS and a few blocks. In Chromium, Firefox, and WebKit (run the two extra engines in the Playwright Docker image, since macOS Firefox does not launch here), confirm the `backwards` start frame during a delay, full ink when print media arrives mid entrance, nothing animating under reduced motion, and no scrollbar from the footer's offset. If an engine fails any of these, stop and return to `/architect`. Delete the scratch page, satisfies **AC-2**, **AC-9**, **AC-10**, **AC-12**.
2. Mechanism: the four variables, the keyframes, the utility, and `animation-delay: 0s !important` in `src/styles/global.css`; `src/lib/entrance.ts` with `src/lib/entrance.test.ts`; `footerStep` on `BaseLayout`; `reducedMotion: 'reduce'` in `playwright.config.ts`, with `page.emulateMedia({ reducedMotion: 'no-preference' })` in every test that asserts a real duration; `freezeEntrance` and `pageSettled` in `e2e/helpers.ts`; the `page.emulateMedia` line in `src/lib/render-pdf.ts`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-9**, **AC-10**, **AC-14**.
3. Home, end to end: the blocks and `footerStep` on `src/pages/index.astro`, and the `page entrance` block in `e2e/site.spec.ts` for `/`, covering timing, hidden at rest, what stays still, reduced motion, printing mid entrance, no script, the early click, the scrollbar, and axe, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-11**, **AC-12**, **AC-13**, **AC-14**.
4. The other pages: the blocks and `footerStep` on `about`, `cv`, `projects`, `contact`, and `404`, with the `page entrance` tests widened to every page and the `nothing animates` test rewritten, satisfies **AC-5**, **AC-6**, **AC-8**, **AC-13**, **AC-14**.
5. Docs and the gate: the `design.md` lines, the spec 0003 notes, the `review-animations` skill on the result, then `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm exec playwright test`, and the steps in [verify.md](verify.md), satisfies **AC-10**, **AC-14**, **AC-15**.
6. Deep links (added 2026-11-07, after `/check verify`): the nested `&:is(:target, :has(:target))` rule and its comment inside `enter-*` in `src/styles/global.css`, and in the `page entrance` block of `e2e/site.spec.ts` the two deep link tests (landing, and first frame) and the AC-16 literal in the built stylesheet test; then the gate again, and in [verify.md](verify.md) the deep link step in Chromium, Firefox, and WebKit and its two break steps, satisfies **AC-12**, **AC-16**.

## Consequences

**Positive**:
- Every page arrives with the cascade you liked on t3.gg, in about the same 950ms at worst.
- No script, no dependency, and no CSP change: one class per block and a few lines of CSS.
- Unlike t3.gg, nothing can stay hidden. If the animation does not run, the page is simply there.
- Reduced motion, print, and the PDF stay safe by how the rule is built, not by a later override.
- The page tests stop racing colour transitions, since the suite runs still by default.

**Negative / tradeoffs**:
- Every page load takes 750ms to 950ms to settle, including moves between your own pages. A first visit only rule would need a script running before first paint, which the one script rule and the CSP rule out.
- 600ms runs past the 300ms limit in the `review-animations` standards for UI controls. That limit is for controls, and the entrance is occasional, but it is the longest motion on the site by far.
- The site gains a second easing curve, ending spec 0003's "one easing curve" wording for everything but transitions.
- Spec 0015's "the only motion beyond colour" stops being true, and `design.md`'s calm "motion is limited to colour" line goes with it.
- Each page now carries `enterClass` calls and a `footerStep` number that must agree. A page test guards them, but they are one more thing to get right on a new page.
- The page tests now run on a state most visitors do not see. The `page entrance` block covers the motion, but a layout bug that shows only with motion on would pass the older tests.
- The browser may report a later Largest Contentful Paint (when the biggest text first shows), by at most 350ms when the biggest block sits at the last step.
- A deep link such as `/cv#experience` lands on a block at a later step, so that view can stay empty for up to 350ms before the block fades in. That block fades in place without its rise (AC-16), so a deep link's first view moves a little less than a load from the top.
- A link focused early shows a faint focus ring until its block settles, for under a second.
- Past the cap, the last blocks arrive together, so on `/about` the final two items, the closing line, and the footer enter as one.

**Neutral**:
- The `motion` package stays unused. The rule that reserved it for page motion narrows to motion CSS cannot express, and spec 0003's plan to install it for the portfolio page no longer applies to entrances.
- The share cards, `smoke.sh`, and `public/_headers` are untouched.
- `freezeEntrance` uses Chromium's debugging protocol, so it works only in the Chromium page tests. Firefox and WebKit are checked in [verify.md](verify.md).
- During its run a block forms its own stacking context (a separate paint layer), which nothing on these pages depends on, and it leaves no trace afterward.
- A text fragment link (`#:~:text=`, which search results add) sets no `:target`, so its block still rises. The browser centres that text, possibly while its block is still rising, so it settles up to 20px above the centre, still in view. This is reasoned, not measured: Playwright's navigations do not trigger the text scroll.
- If the hash changes while the entrance still runs (its first 950ms), the block that gains or loses the target moves by what is left of its 20px. No link on the site moves the target from one block to another today, but the skip link's `#main` moves it off one: pressed during the entrance on `/cv#experience`, it lets Experience move by what is left of its rise.
- Firefox before 121 has no `:has()`. `:is()` forgives a selector it cannot read, so the rule shrinks to `:target` alone, which matches no CV section (the id sits on the heading), and those visitors keep the 20px offset. Older Safari may not read the variable again during a running animation (not measured), which matters only when the hash changes during the entrance.

## Follow-up

- [ ] `/sync`: add a page entrance rule to the `AGENTS.md` `## Rules` (`enterClass` for every block, `footerStep` on every page, CSS only, and the AC-16 rule that the block holding a fragment target never rises), update the command menu rule's "the site's one motion beyond colour", and note the page tests' reduced motion default under `## Tooling`.
- [ ] A new page's spec lists its blocks and its `footerStep`, as the *Composition* table does. The History page (scope row 17) is the first; its anchors land right through AC-16 as long as each target is, or sits inside, an `enter-` block.
- [ ] Measure Largest Contentful Paint on the live site after the merge. If it moves past 2.5s on a slow connection, revisit the delays.
