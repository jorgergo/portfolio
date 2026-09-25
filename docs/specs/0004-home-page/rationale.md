# 0004. Home page: rationale

The decision record behind [index.md](index.md). `/develop` does not need this file; it explains why.

## Context

> ⚠️ Premise note: the About and Contact split adds two pages to a site the scope calls extremely minimal, on a release whose skateboard was home plus CV. The failure mode is a home menu pointing at pages that do not exist yet, or a release that waits on two more features before anything goes live. The framing used here: the home page ships now with the one row that exists, keeps the socials so it is complete on its own, and About and Contact are enrolled as small separate features that add their rows when they land.

The home page is the placeholder shell from spec 0003: your name in the styled h1 and the bio, nothing else. The scope asks for an extremely minimal page in the spirit of t3.gg (a name, one or two lines, links to the CV and the socials) with its own title and description, reading well on phone and desktop in light and dark. Recruiters are the first audience and peers the second, so the CV must be one click away and the socials on the first screen.

Three earlier decisions fix most of the page before it is designed. Spec 0001 makes it a static Astro page with a hashed Content Security Policy (a browser rule that blocks inline styles and unlisted scripts). Spec 0002 supplies the content: `basics.name`, `basics.bio` (at most 160 characters), up to two `profiles` (GitHub and LinkedIn), and the email, all required except the profiles. Spec 0003 fixes the look: six colour tokens, Plex Mono, a 640px column, eight components, no header and no theme toggle, and a footer with `← home` on inner pages. Its follow up hands this spec exactly four questions: compose the page from the built pieces, decide the numbered row style, the optional avatar, and whether the draft's typing cursor returns.

During the interview you reframed the page as a menu of the site (about, cv, portfolio, contact) and chose About and Contact as separate pages, with the socials on the home page as well. On the day this ships only the CV page exists, so the design has to be complete with one menu row and grow without a redesign. Your standing preference for this project is evidence first: measured numbers, real references, the Claude Design draft as a guide only.

## Options considered

### Option 1: A numbered page menu plus keyed social rows, drawn by one new row component (chosen)

Name and bio, then `01 cv` (and later `about`, `portfolio`, `contact`) as numbered rows, then `github @jorgergo`, `linkedin in/jorgergo`, `email …` as keyed rows. Both lists use one `NavRow` component: a full width link with a muted prefix column and a label, the external arrow from spec 0003 on `https` rows. No avatar, no motion, no script.

**Pros**:
- One row anatomy for both groups, so the page reads like a well kept plain text file, the character `design.md` asks for.
- Complete on day one with a single menu row, and each later page adds one line to `SITE_NAV`.
- Zero JavaScript, and the Contact page and the command menu reuse the component and the list.
- The numbers and keys need no new icon, so the six icon rule of spec 0003 holds.

**Cons**:
- A new component and three new spacing meanings in `design.md`.
- The single `01 cv` row reads thin until About and Contact ship.
- The socials are duplicated on the home page and the Contact page.

### Option 2: The t3.gg shape on the built components only

Name and bio, then the three `IconLink` rows spec 0003 built (GitHub, LinkedIn, mail icons with labels), with the CV and the future pages as `TextLink`s in a sentence or a plain list.

**Pros**:
- No new component and no `design.md` change; the icons were drawn for exactly this.
- Closest to the scope's original wording.

**Cons**:
- Two row styles once a menu exists (icons for socials, underlines or a sixth icon for pages), and icons compete visually with a numbered list.
- A CV row has no icon: either a sixth icon (a decision spec 0003 reserved) or an underlined text link that reads differently from its neighbours.
- Does not give you the menu you described.

### Option 3: One numbered list mixing pages and socials

`01 cv`, `02 github`, `03 linkedin`, `04 email`, with later pages inserted and everything renumbered.

**Pros**:
- One list, one style, the least markup.

**Cons**:
- Pages and profiles are different kinds of things; a screen reader hears one long list with no boundary.
- Every new page renumbers the socials too, and a `01 about … 06 email` list is a table of contents for a site this small.

### Option 4: The draft as drawn

Name, a typed tagline with a blinking terracotta cursor, then four lowercase numbered rows (about, cv, projects, contact), no socials on the home page.

**Pros**:
- The strongest character, and it is the draft you made.

**Cons**:
- JavaScript and a script hash for a typing effect; your bio is over 100 characters, so at the draft's 90ms per character it takes about ten seconds to read, and the draft's tagline `builds things` is t3.gg's line, not yours.
- Three dead rows on day one (about, projects, contact do not exist).
- No socials on the home page, which the scope's Done when requires.

## Rationale

Option 1 is chosen because it satisfies the two forces that pull against each other: your menu framing (a home page that lists the site) and the day one reality (only the CV page exists). A list that holds shipped pages only, numbered from position, is complete with one row and needs no redesign at four. The keyed social rows keep the scope's Done when intact (links to the CV and the socials on the home page) while sharing the menu's row anatomy, so the page has one visual rule instead of two.

Option 2 was the reuse path and the recommended answer before the interview; it lost when you chose the menu, because a page list and icon rows side by side make two row styles, and the CV row needs a sixth icon. Option 3 breaks the semantic boundary between pages and profiles for no gain. Option 4 keeps the most character but ships dead rows and a ten second animation for a page that should be readable in two seconds; `design.md` says nothing moves unless it has to, and here nothing has to.

The measurements behind the small calls: Plex Mono advances 0.6em per glyph, so `01` needs about 19px and `linkedin` about 77px, which is why the prefix columns are `w-6` and `w-20` (the same 24px and 80px the draft used). The row height stays at the design system's `min-h-10` rather than the draft's 44px, because the system already fixed that minimum and the 4px row gap gives a 44px pitch anyway. The same arithmetic shows the email row needs about 278px in the 272px column at 320px, which is why key rows wrap a value whole instead of letting `overflow-wrap: anywhere` split the address. The lists carry no `role`: Tailwind's preflight removes list styling and Safari's VoiceOver then drops the list role, except for lists inside a `<nav>`, which both of these are; an explicit role would also fail the lint preset and the style guide's no roles test.

## Evidence

### Reference check (fetched 2026-09-24 by a read only helper on the cheapest model)

| Site | What the home page shows today | Links | Layout | Motion |
|---|---|---|---|---|
| t3.gg | `theo`, one line (`builds things`), then two plain text link groups: products and pages (t3 code, t3.chat, youtube, create-t3-app, blog, sponsors), then socials (gh, x, yt, twitch, discord). No photo, no email. | plain text, no labels above the groups | single column, centred | none, no theme toggle |
| fbold.dev | a nav (about, portfolio, blog) with decorative Unicode glyphs before each item, then a single `github` link. No name line, no photo, no email. | plain text | single column, centred | none, no theme toggle |
| cv.jarocki.me | GitHub avatar, name, a one line tagline, a three line bio, icon links (GitHub, LinkedIn, X), then a text line with the email as an address | icon plus label, then plain text separated by slashes | single column, left aligned | none, no theme toggle |

What it settled: the menu of pages is fbold.dev's shape; the socials as a second group on the home page is t3.gg's; the email shown as an address is cv.jarocki.me's; none of the three animates or shows a toggle, and only the CV site shows a photo.

### The Claude Design draft (`Portfolio.dc.html`, project "Minimalist Developer Portfolio")

Read through the connected Claude Design tool on 2026-09-24. Its home frame: a header crumb (`~ jorgergo`) with a theme toggle (both dropped by spec 0003), an `h1` at 22px weight 500, a muted tagline typed at 90ms per character with a blinking terracotta `_`, then a nav of four rows (`01 about`, `02 cv`, `03 projects`, `04 contact`), each a flex link 44px tall with a 24px muted number column and a 16px gap, rows 4px apart, lowercase labels, no socials. Its contact frame: an `h1` `contact`, then three rows of the same anatomy with an 80px muted word column: `email jorgergo@icloud.com`, `github @jorgergo`, `linkedin in/jorgergo`. Its CV header shows the socials as full paths (`github.com/jorgergo`). Top aligned, left aligned, 640px column, padding 40px 24px 80px, footer `← back` and `Toluca, MX · 2026`. The draft used inline styles and a hash router, neither of which the CSP or the static build allows.

What survived: the numbered rows, the keyed contact rows (with `@` and `in/` handles), lowercase labels, the widths. What did not: the typed tagline and cursor, the header, the toggle, the projects row before a projects page exists.

### Cross check (a different model, read only, 2026-09-24)

A second model read the draft spec, the design system spec, `design.md`, `AGENTS.md`, the shell, the helpers, and the page tests, and returned thirteen gaps and two rule conflicts. The load bearing ones, all fixed in `index.md` before acceptance:

- Hiding every prefix from assistive tech dropped `github` and `linkedin` from the social links' names (WCAG 2.5.3). Now only number prefixes are hidden.
- `role="list"` on the lists would fail the a11y lint preset's redundant role rule and the style guide test that asserts no `role` under `body`. The role is dropped; both lists sit inside a `<nav>`, where WebKit keeps list semantics, and `verify.md` checks it in VoiceOver.
- The `verify.md` the build plan pointed at did not exist (spec 0003 shipped its own). It is written with this spec.
- The test scenarios named no home. Each now says whether it runs in `site.spec`, `styleguide.spec`, or as a manual step.
- The handle rules' exhaustiveness was called a Vitest check, but Vitest does no type checking. The rules object is declared with `satisfies` and `astro check` inside `pnpm build` enforces it.
- AC-5 forgot the favicon request the shell makes. It now allows same origin resources and forbids scripts and other origins.
- The style guide examples were unpinned, `e2e/styleguide.spec.ts` was not in the build plan (its substring link locators would match the new `github` row), and the email row broke mid word at 320px. All three are pinned in the criteria now.

Two design questions it raised were decided rather than changed: one shared prefix width for both lists (rejected, dead space before two letter labels, and the groups are separate blocks), and wrapping key rows at narrow widths (accepted, see the Rationale above).

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`: the rules on colours from the six tokens only, no arbitrary Tailwind values, no `target` on links, no ARIA roles on generic elements, `getCv()` once per page.
- Spec 0002 (`docs/specs/0002-content-model/index.md`): the `basics` fields and their caps, `NETWORKS`, the `astro/zod` only rule that keeps helpers testable.
- Spec 0003 (`docs/specs/0003-design-system/index.md`): the tokens, `text-title`, the `min-h-10` row minimum, the spacing meanings, `IconLink`'s external arrow rule (AC-7), the follow up that names this spec's four questions.
- `design.md`: the build mandate, the token roles, the components and usage rules.
- The Claude Design project "Minimalist Developer Portfolio" (`Portfolio.dc.html`), read through the connected tool: https://claude.ai/design/p/36491575-ee92-47a5-99e9-c33c85d34c95
- Installed skills: `astro` (`.claude/skills/astro/`), `tailwind-4-docs` (`.agents/skills/tailwind-4-docs/`), `accessibility` (`.claude/skills/accessibility/`), `vitest` (`.agents/skills/vitest/`).

**Practices & standards**:
- WCAG 2.2 AA: 1.3.1 info and relationships (real lists for lists), 2.4.7 focus visible, 2.5.8 target size, kept by the 40px rows and the global ring.
- WAI-ARIA landmark practice: several `nav` landmarks on one page need unique accessible names.
- Progressive enhancement: static content ships as HTML with no script.
- IBM Plex Mono's fixed advance width of 0.6em, the basis for the prefix column widths.

**Links** (web verified on 2026-09-24 by the reference check):
- t3.gg: https://t3.gg/
- fbold.dev: https://fbold.dev/
- cv.jarocki.me: https://cv.jarocki.me/
