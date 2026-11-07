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

## Rationale

The choice turned on one fact about CSS fill modes. t3.gg hides content with a class, and needs the animation to show it. A `backwards` fill turns that around: the content is visible by default, and only a running animation can hold it on its start frame. That single change keeps spec 0003's "nothing hidden at rest", makes reduced motion and print safe by leaving the rule out under those media, and leaves nothing for a failed animation to strand. Option 2 could not ship under the CSP at all, and fixing that leaves it worse than Option 1 on every count but familiarity.

Option 3 is the path `design.md` set out, written before the one script rule existed. It solves a problem this motion does not have: nothing about the entrance is decided at runtime, so a script only adds a flash risk and a second bundle. CSS also runs off the main thread, which matters most during page load. The rule is narrowed rather than dropped, so a later drag or a spring still has its library.

Option 4 is close, and the menu proves it works. It loses because every row here is a link with a colour transition, and sharing the transition property would delay hover. Keyframes leave `transition-colors` alone.

You chose t3.gg's numbers as measured over my recommendation, a quieter version with a 12px rise at 400ms on the existing `--motion-slow`. Both use the same curve and step. Your pick is fine: the expo out curve covers most of its distance in the first third of its run, so 600ms reads faster than the number suggests, and the cost is a new duration variable and 200ms more to settle. The spec records that cost under Consequences.

The cap and the footer step come from the same aim. Without a cap the CV would run for seconds below the fold. With one, the sequence is a fixed length on any content, 950ms at worst, the same as t3.gg's own total.

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

### Cross check

Fable 5.1 read the spec on 29 Oct 2026, with the text and the repo as its only sources. It found one wrong instruction (`test.use` inside a single test), three gaps in the page tests (holding a moment, a page wide settled wait, and the `/cv` count), and one gap in `enterClass` (steps below 0 or with a fraction). It confirmed the block counts, the settle times, and the design's behaviour in the three engines from its own knowledge. Each fix above was then proven or applied on your pick, and for the first finding the fix is simpler than the nested groups it suggested.
