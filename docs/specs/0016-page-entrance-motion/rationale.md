# 0016. Page entrance as a staggered fade up in CSS: rationale

The decision record behind [index.md](index.md): the problem, the options, why CSS keyframes won, and the evidence. `/develop` does not read this file.

## Context

The site is still on every load: the page paints whole, and the only motion is the 150ms colour change on hover and the command menu's short fade. You looked at t3.gg and liked how its page arrives, one block after another. Your scope row 19 asks for that here, short and quiet, with nothing else on the page moving.

The forces:

- **Spec 0003 AC-10.** "The only animation on the base pages is `transition-colors`", and "no element is hidden at rest waiting for an animation". Spec 0015 added the menu's fade as the one exception. A page entrance bends the first line, and t3.gg's way of doing it breaks the second.
- **The hashed CSP.** No `style=""` attribute, no `define:vars`, and no `is:inline` script (spec 0001). t3.gg sets each block's delay through an inline `animation-delay`, which the CSP here would block.
- **One script per page.** A page test fails a second script (spec 0014 AC-13, carried by spec 0015), and the menu's script imports nothing, so no content code reaches the client.
- **Reduced motion.** Today's global rule shortens durations to 0.01ms but keeps `animation-delay`. A hidden block with a delay would still arrive late, a stagger of pops.
- **Print and the PDF.** `render-pdf.ts` loads `/cv` and prints it with no motion setting, and nothing checks the PDF's ink, so a block caught mid fade would print faint with no failure.
- **The page tests.** They measure positions and run axe right after load. A block mid fade would fail contrast, or sit 20px low, on any run.
- **Tailwind.** Version 4 has no `animation-delay` utility, its scan reads source text, so a class built at runtime generates nothing, and arbitrary values are banned in components.
- **Blocks at different depths.** On home the blocks are a `<header>`, `<li>` rows inside `<nav>` and `<ol>`, and a footer that lives in `BaseLayout`, not the page.
- **Page loads, not a single page app.** Every move between pages is a full load, so whatever plays, plays again.
- **Skateboard.** The smallest change that gives every page the cascade.

**Deep links, found after the build (2026-11-07).** `/check verify` opened `/cv#experience`, `#projects`, and `#education` directly and found each heading 20px above the top of the window once the entrance settled, in Chromium, Firefox, WebKit, and Android Chrome, while reduced motion landed exactly right. A browser picks where a fragment lands from the target's painted box, and at that moment the target's section still sat on its start frame, 20px low. The section then rose and carried the heading out of view. Layout never shifted. The Consequences had expected only a view that "can stay empty for up to 350ms", so the lasting offset was a defect, not a cost anyone had accepted. The fix had to stay CSS only, with no script and no CSP change, and the target can change after load, by a typed hash or by Back between two fragments.

## Options considered

### Option 1: CSS keyframes with a `backwards` fill and one class per block (chosen)

A `from` only keyframe in the stylesheet, a functional Tailwind utility that sets the delay by step, and a small helper that holds the cap. A block's start frame exists only while its animation does.

**Pros**:
- Nothing is hidden at rest, so spec 0003's rule holds in spirit and in fact.
- No script, no dependency, nothing for the CSP to weigh, and one script per page holds.
- Runs off the main thread, and starts with the first paint, so there is no flash.
- Reduced motion and print are handled by one media query around the rule.

**Cons**:
- Each page writes its order by hand and passes a `footerStep`, which can drift from the markup; a page test guards it.
- A fixed list of eight class names; the cap is a design rule, so that fits, but changing it touches `ENTER_CLASSES`.
- CSS cannot tell a first visit from a move between pages, so it replays on every load.

### Option 2: copy t3.gg's pattern, an `opacity-0` class and inline delays

An `opacity-0` class on each block, the keyframe with a `forwards` fill, and an inline `animation-delay`.

**Pros**:
- The exact pattern you liked, proven on a live site.
- Each delay sits next to its element, in one place.

**Cons**:
- Blocked: the hashed CSP refuses inline delays, so they would need to move to classes anyway.
- Breaks "nothing hidden at rest": if the animation never runs, the content stays invisible.
- t3.gg has no reduced motion rule, so this one would need adding, and `opacity-0` would need undoing under reduced motion and on paper.

### Option 3: the Web Animations API through the `motion` package

A bundled script finds the blocks and animates them, as `design.md` reserved for page motion.

**Pros**:
- Spec 0003's sanctioned library, allowed by the CSP.
- A script could skip the entrance after the first page of a visit.
- Delays computed from DOM order, so pages write no steps.

**Cons**:
- Fails the one script rule, or grows the menu's script, which imports nothing today.
- The script runs after first paint, so either the page flashes whole before animating, or something must hide it first, which breaks the no script case.
- A dependency, for motion that needs no decisions at runtime.
- `prefers-reduced-motion` and print each need their own branch.

### Option 4: `@starting-style` transitions, as the command menu does

The technique spec 0015 uses for the menu: a transition on `opacity` and `translate`, with `@starting-style` as the first frame and `transition-delay` by step.

**Pros**:
- Already a pattern on the site, and CSS only.
- Also leaves nothing hidden if it does not run.

**Cons**:
- `transition` collides with `transition-colors` on links, sharing one property list and one delay, so a row's hover colour would wait for its step.
- The delay stays on the element at rest, so hover would lag for as long as the class is there.
- First load behaviour is less proven across engines than a plain keyframe.

### Deep links (2026-11-07): what the block that holds the target does

Each option targets the block that is or holds the fragment target, `:is(:target, :has(:target))`, inside `enter-*`, except the first.

**A. Accept the offset and document it.**
- Pro: no code.
- Con: the heading stays cut off for good, in every engine and for every anchor to come (the History page's, for one), and AC-12 fails.

**B. Skip the entrance there, `animation: none`** (the verify report's lead).
- Pro: lands right, and the target shows at once.
- Con: the animation's existence follows `:target`, so when the target moves to another block, the first block's animation returns and its entrance plays again. Measured in all three engines, on a hash change, on Back, and on a hash set after a load with no hash. That breaks AC-7's "plays once", and AC-8 bends for that block.

**C. A 0s duration and a 0s delay there.**
- Pro: lands right, the target shows at once, and nothing replays, since only timing changes.
- Con: AC-8 bends for one block (no 0.6s, no step delay). Below a short target, the next blocks still rise in after it, under content that is already there.

**D. No rise there, `--motion-enter-rise: 0px` (chosen).**
- Pro: lands right in every engine, also when the target arrives while its block sits on its start frame. Nothing replays, since the animation's name never changes. Every block keeps AC-8's values. One declaration, on the variable that already exists. A deep link's view still enters in order, the target first.
- Con: the target stays empty for its own delay (up to 350ms on `/cv`), as the Consequences already said. It rests on keyframes reading `var()` on the element they animate, which all three engines do, measured below, also when the variable changes during the animation.

Also weighed and left: dropping the rise on every block whenever the page has a target, `:root:has(:target) &` (raised by the cross check), which gives a deep linked view one motion, a fade, but changes blocks the link never touches, and the skip link's `#main` would set it off too; moving each `id` to a wrapper that never moves (a second element per CV section, and the anchor leaves the heading that spec 0005 put it on), and a `scroll-margin` offset on the target (right only if the scroll happens on the start frame, and 20px off once the entrance is over).

## Rationale

The choice turned on one fact about CSS fill modes. t3.gg hides content with a class, and needs the animation to show it. A `backwards` fill turns that around: the content is visible by default, and only a running animation can hold it on its start frame. That single change keeps spec 0003's "nothing hidden at rest", makes reduced motion and print safe by leaving the rule out under those media, and leaves nothing for a failed animation to strand. Option 2 could not ship under the CSP at all, and fixing that leaves it worse than Option 1 on every count but familiarity.

Option 3 is the path `design.md` set out, written before the one script rule existed. It solves a problem this motion does not have: nothing about the entrance is decided at runtime, so a script only adds a flash risk and a second bundle. CSS also runs off the main thread, which matters most during page load. The rule is narrowed rather than dropped, so a later drag or a spring still has its library.

Option 4 is close, and the menu proves it works. It loses because every row here is a link with a colour transition, and sharing the transition property would delay hover. Keyframes leave `transition-colors` alone.

You chose t3.gg's numbers as measured over my recommendation, a quieter version with a 12px rise at 400ms on the existing `--motion-slow`. Both use the same curve and step. Your pick is fine: the expo out curve covers most of its distance in the first third of its run, so 600ms reads faster than the number suggests, and the cost is a new duration variable and 200ms more to settle. The spec records that cost under Consequences.

The cap and the footer step come from the same aim. Without a cap the CV would run for seconds below the fold. With one, the sequence is a fixed length on any content, 950ms at worst, the same as t3.gg's own total.

The deep link fix turned on what happens when the target changes. Where a fragment lands depends on the target's painted box, so the target's block must carry no offset at that moment; that rules out A. Option B ties whether the animation exists to `:target`, so the animation restarts the moment the target leaves. A variable or a timing value changes the running animation without restarting it, which leaves C and D. Between those two, D keeps every block on AC-8's numbers and gives a deep link exactly what the spec already promised it: a view empty for at most 350ms, then the section fades in, with nothing left missing. C would show the target sooner, at the price of one block that skips the entrance. If you would rather a deep link show its section at once, C is a one line swap in *Composition*, and AC-8 then needs its exception written in.

## Evidence

### The bench

Private, built 29 Oct 2026: https://claude.ai/artifact/CpAqHBm6Ve5Svsc3254Zpc. Copies of the home and about pages in light and dark, a timeline per candidate, replay, and a quarter speed mode. All candidates run 50ms apart with the cap of 8 steps.

| Candidate | Rise | Duration | Curve | Home settled | About settled |
|---|---|---|---|---|---|
| t3.gg as measured (chosen) | 20px | 600ms | `cubic-bezier(0.16, 1, 0.3, 1)` | 850ms | 950ms |
| Quieter t3.gg (my recommendation) | 12px | 400ms | same | 650ms | 750ms |
| Site curve | 8px | 400ms | `cubic-bezier(0.2, 0, 0, 1)` | 650ms | 750ms |
| Fade only | none | 400ms | expo out | 650ms | 750ms |
| Blur in | 8px and a 4px blur | 500ms | expo out | 750ms | 850ms |

### t3.gg, measured

From scope row 19, 29 Oct 2026: one CSS keyframe (opacity 0 to 1, `translateY(20px)` to 0) at 600ms on `cubic-bezier(0.16, 1, 0.3, 1)`, fill forwards; eight blocks (header, six rows, footer) 50ms apart through inline `animation-delay`; all settled by 950ms; an `opacity-0` class hides the content until it runs; no reduced motion rule.

### Animation standards

The `review-animations` skill's standards: a strong ease out for anything entering, never ease in; 30ms to 80ms between staggered items; only `transform` and `opacity` for performance; and stagger never blocks interaction. Its 300ms limit is for UI controls, and it allows marketing motion to run longer.

### Tailwind proof

Run against the installed Tailwind 4.3.3 on 29 Oct 2026 with its `compile` API. The utility in *Composition* built `enter-0`, `enter-3`, and `enter-7` inside the `screen` and `no-preference` media query, with delays of `calc(0 * var(--motion-enter-step))` and so on, and it generated nothing for `enter-[1]` or `enter-foo`.

### Playwright option

`reducedMotion` is a top level test option in the installed Playwright 1.63 (`use: { reducedMotion: 'reduce' }`), and a describe block can set it through `test.use`.

### Test helper proof

Run in the installed Chromium on 29 Oct 2026, on a small page with the AC-2 keyframes:

| Check | Result |
|---|---|
| `page.emulateMedia({ reducedMotion: 'no-preference' })` before `page.goto`, in a context set to reduce | 0 animations became 2 |
| `Animation.setPlaybackRate` at rate 0, sent before `page.goto` | held at `currentTime` 0, opacity 0, 1.5s after load |
| Setting `currentTime` to 500 while frozen | seeks, opacity 0.90 |
| A real click on the frozen link at opacity 0 | lands, and the next page opens |
| `document.getAnimations().length` with no freeze | 2 at load, 0 after 1.2s |

A plain click on an unfrozen page landed during the link's delay, which is why it cannot prove anything: its timing is a race.

### Deep link probe

Run on 7 Nov 2026 by `/architect`, on four copies of the built `dist/` from the uncommitted build of `feat/page-entrance-motion`: as built, and with options B, C, and D each appended to the stylesheet inside the same `screen` and `no-preference` query. Served locally at 1280×800 with motion on, in Chromium 153 and WebKit 26.6 on macOS and Firefox 155 in the Playwright Docker image (`v1.63.0-noble`). The three engines gave the same numbers on every row (Firefox within 1px on `#education`, from Linux font metrics).

| Variant | `/cv#experience` once settled: `scrollY`, heading top | Hash moved to another section after the entrance | Target set while its block sat on its start frame |
|---|---|---|---|
| As built | 421, −20px | nothing replays | lands 20px low |
| B, `animation: none` | 401, 0 | the block the target left replays its entrance | lands right |
| C, `animation-duration: 0s; animation-delay: 0s` | 401, 0 | nothing replays | lands right |
| D, `--motion-enter-rise: 0px` (chosen) | 401, 0 | nothing replays | lands right |
| Reduced motion, for reference | 401, 0 | | |

- `#projects` and `#education` follow the same pattern (1396 and 2041 with B, C, or D, against 1416 and 2061 as built). `#skills` sits near the end of the page, so the end of the scroll range holds it at 217px in every variant.
- The "hash moved" column also covers Back. After `/cv#experience` settled, the probe moved the hash to `#education`, then to `#experience`, then called `history.back()`: with C or D nothing replayed at any step, and with B each move replayed the entrance of the block the target left, Back included, in all three engines.
- With D, `#projects` lands at 0 at 320, 375, and 1920px wide in all three engines, and at −20px as built.
- Frozen in Chromium on `/cv#education` with D and sought to 0, 250, 300, 400, 550, and 950ms, the heading stays at 0 throughout. The Education section reads `0px` for `translate` while it fades, and the sections below it still rise from `0px 20px`.
- The "target set on the start frame" column pauses every animation at 0ms after a load with no hash, then sets the hash. With D, the paused section's `translate` turns to `0px` at once, so each engine reads the variable again while the animation runs.
- Under print media and under reduced motion, D changes nothing. The skip link's `#main` matches no block.
- Tailwind 4.3.3's `compile`, run against the installed package, builds the nested rule as `.enter-N:is(:target, :has(:target)) { --motion-enter-rise: 0px; }` inside the same media query for `enter-0`, `enter-3`, and `enter-7`, and nothing for `enter-[1]` or `enter-foo`. The probe appended rules to a copy of the stylesheet rather than building them, so the production form was checked separately: the build session's `pnpm build` of 7 Nov 2026 carries `.enter-3:is(:target,:has(:target)){--motion-enter-rise:0px}` in `dist/`, so Lightning CSS keeps the value and the `:is()` list as written.
- The probe ran at 800px tall. On a taller window `#education` may stop short of the top, held by the end of the scroll range, as `#skills` already is; the comparison with reduced motion holds either way.
- A text fragment (`#:~:text=`) sets no `:target`. Playwright's navigation did not scroll to it, so its landing was not measured.

### Cross check

Fable 5.1 read the spec on 29 Oct 2026, with the text and the repo as its only sources. It found one wrong instruction (`test.use` inside a single test), three gaps in the page tests (holding a moment, a page wide settled wait, and the `/cv` count), and one gap in `enterClass` (steps below 0 or with a fraction). It confirmed the block counts, the settle times, and the design's behaviour in the three engines from its own knowledge. Each fix above was then proven or applied on your pick, and for the first finding the fix is simpler than the nested groups it suggested.

Fable 5.1 read the AC-16 amendment on 7 Nov 2026, with the spec, the repo, and the deep link tests the build session had already written as its sources. It found no fault in the design, and from its own knowledge confirmed that a browser sets the target before it scrolls to it, and that the variable updates live in all three engines. It found the test scenarios saying less than those tests do (a fresh document per load, the id source, the wait after a hash change, fonts, which sections, how a zero rise reads), AC-8's claim for the targeted block left untested, an "Other engines" line claiming phone checks that never open a deep link, and a few overstated lines (the skip link, the text fragment, old engines, Back with D). Every fix was applied on your pick; the Back and production stylesheet claims were checked against the probe results and the fresh `dist/` first.
