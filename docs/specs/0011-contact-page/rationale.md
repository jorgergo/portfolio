# 0011. Rationale: contact page as keyed rows for email, GitHub, and LinkedIn

The decision record behind [index.md](index.md). `/develop` does not read this file.

## Context

Your GitHub, LinkedIn, and email are on the home page today, as three keyed rows under the menu (spec 0004). Spec 0008 takes them off the home page so it can be only your name, a tagline, and the menu, and it moves them to `/contact`. Spec 0008 cannot ship until `/contact` exists: its task 4 adds a page test that fails when `SITE_NAV` has no `/contact` row, so the home page never drops your links before they have a new home. `/contact` is the last page blocking the redesign.

The page has one job: let a recruiter or a peer reach you through the channel they prefer, fast, on any screen. You have three channels in `cv.json` (`basics.email` and two `basics.profiles`), and the address is already public on `/cv`, `/about`, and the home page. The site is static, ships no script on content pages, and passes a hashed CSP (spec 0001), so anything interactive costs a script and a hash. A contact form is in the scope's Deferred list; it would need a server route, bot protection, and a rate limit, which a static site does not have.

Constraints that shape the answer: profile content lives only in `cv.json` behind a strict schema (spec 0002); colours, type, and spacing come from spec 0003's tokens; menu and social rows are `NavRow` (spec 0004); every page gets its title, description, and share card through `pageMeta` (spec 0006); the deploy smoke check must know every page (spec 0007); and your intro stays by role, never employer.

## Options considered

### Option 1: The draft's contact frame, keyed `NavRow` rows under a heading

The heading `contact`, then one list of keyed rows (`email`, `github`, `linkedin`), each a muted key and a link, built from `cv.json` through one helper.

**Pros**:
- Matches the draft's contact frame almost exactly, with no new component: `NavRow kind="key"` already draws the 80px key, the 16px gap, and the row.
- The same row the home menu uses, so the site keeps one interaction pattern and 40px tap targets.
- Nothing to keep true except `cv.json`; no sentence can go stale.

**Cons**:
- A very short page: three lines under a heading, with a lot of empty space above the footer on a desktop.
- It reads like a list of links, not an invitation to write.
- Inside an `<address>` rather than a `<nav>`, Safari's VoiceOver reads the rows as three links, not a list of three (the Tailwind reset heuristic specs 0004, 0009, and 0010 recorded).

### Option 2: One sentence with inline links, like `/about`'s closing

A line such as "Email me at jorgergo@icloud.com, or find me on GitHub and LinkedIn.", with each channel a `TextLink`, in a new `contact` block in `cv.json`.

**Pros**:
- Warm and personal; reads as an invitation.
- Reuses `/about`'s `{email}` marker pattern.

**Cons**:
- Small, inline tap targets on a phone, and three links inside a sentence are slower to scan.
- A sentence to write and keep true, plus a marker per channel so the URLs stay in `basics`.
- Loses the keyed row look that ties the site together.

### Option 3: Reuse the `/cv` contact line

The muted `text-sm` line of `/cv` (address, `github.com/jorgergo`, `linkedin.com/in/jorgergo`, dot separated) as the page's content.

**Pros**:
- Zero new markup; the pattern is already tested.
- Full paths say exactly where each link goes.

**Cons**:
- Meta text styling (small, muted) for the page's main content, which inverts the hierarchy.
- `min-h-6` targets, 24px tall, below the 40px rows every other menu uses.

### Option 4: A contact form

A name, email, and message form that sends you a mail.

**Pros**:
- A visitor without a mail app can still write to you.
- The address could leave the page.

**Cons**:
- Needs a server route, a mail provider, a Turnstile check, and a rate limit on a site that has none (spec 0001), plus a script and a CSP change.
- The address stays public on `/cv` and `/about` anyway.
- It is in the scope's Deferred list; building it now doubles this feature.

## Rationale

Option 1 is the smallest page that does the job well. The one thing a visitor needs is the channel, one tap away, and a labelled 40px row gives exactly that on a phone and a desktop. It reuses `NavRow`, so the page adds no component, and it matches the draft you chose as the design source, which already drew these rows. Every value comes from `cv.json` through one tested helper, so the page cannot drift from the CV.

Option 2's warmth costs copy you have to keep true and small inline targets; you chose no intro, and the rows carry the meaning on their own. Option 3 would make the page's only content look like footnotes. Option 4 is a real feature with real infrastructure and stays deferred; this page is where it would go later.

The extras you declined (availability, time zone, copy button, hiding the address) each either go stale silently on a static site, repeat what the footer says, need a script, or protect nothing because the address is public elsewhere. Leaving them out keeps the page true with no maintenance.

## Evidence

### The draft's contact frame (`Portfolio.dc.html`, read 2026-09-26)

| Part | Draft | This spec |
|---|---|---|
| Heading | `contact`, 18px, weight 500 | `text-lg font-medium` (18px, 500) |
| Heading to rows | 24px | `gap-6` (24px) |
| Row order | email, github, linkedin | same |
| Key column | 80px, muted | `w-20` (80px), `text-muted` |
| Key to value | 16px | `gap-x-4` (16px across; a wrapped value sits right under its key) |
| Row height | at least 44px | at least 40px (`min-h-10`, spec 0008 kept `NavRow`'s height) |
| Row spacing | 4px | `gap-1` (4px) |
| Values | `jorgergo@icloud.com`, `@jorgergo`, `in/jorgergo` | same, from `formatContactRows` |
| External arrow | none | on the two `https` rows (spec 0003) |
| Wrapper | a `div` | an `<address class="not-italic">` |
| Position | top aligned | top aligned |
| Footer | `← back`, city, year, no rule | spec 0003's footer: rule, `← home`, city, year |

### Sizes used in the spec

Plex Mono advances 0.6em per glyph: 9.6px at 16px on Mac and 10px in headless Linux Chromium (see the Plex Mono width comment in `e2e/site.spec.ts`). The column at a 320px viewport is 272px. The email row needs 80px, 16px, and 19 glyphs: about 278px on Mac and 286px in CI, so the address wraps under its key on a phone, as it does on the home page today. The GitHub row (`@jorgergo`, 9 glyphs, plus an 8px gap and the 16px arrow) is about 206px, and the LinkedIn row (`in/jorgergo`, 11 glyphs) about 225px, so both stay on one line.
