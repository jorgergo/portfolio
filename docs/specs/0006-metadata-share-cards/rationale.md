# 0006. Rationale: page metadata and share cards

The decision record behind [index.md](index.md). `/develop` does not read this file.

## Context

Today every page passes a placeholder head: `/` uses your name as its title, `/` and `/cv` share the bio as their description, and no page has a canonical link or Open Graph tags. A link to the site pasted into LinkedIn, X, or WhatsApp shows a bare URL or a scraped guess. Recruiters see that preview before they see the site, so it is the first impression for most visitors who arrive from a message or a post.

Earlier specs handed this work here: spec 0001 left `site` unset for this spec to set, spec 0003 left the favicon (a `#171717` square outside the tokens) and the canonical and Open Graph tags, spec 0004 left the inner title pattern, and spec 0005 fixed `CV · name` and left structured data to decide.

The forces that shaped the choice:
- **One source of truth** (spec 0002, `AGENTS.md`): name, role, bio, and city live only in `cv.json`, colours only in `global.css`. A share card is a second rendering of the same facts, so a hand made image would be a second copy that drifts silently.
- **The hashed CSP and the no script rule** (spec 0001): nothing may add a script or an inline style to a page. Head `<meta>` and `<link>` tags are fine; anything drawn must be a file.
- **`build.format: 'file'`**: `Astro.url.pathname` reads `/cv.html` during the build, so any URL built from the request is wrong in `dist/`.
- **Platforms read one fixed image**: a share image cannot follow the viewer's light or dark setting, it is shown as small as 300 to 350px wide in phone feeds, X shows almost nothing but the image, and WhatsApp may drop large images.
- **Look and feel is the top priority** (the scope), and you want design choices measured, not guessed.
- **The real test needs the live domain**: previews can only be checked on platforms once Go live puts the site at its address.

## Options considered

The load bearing choice was how the card images get made; the head tags follow the same pattern whichever way the images are made.

### Option 1: Satori at build time, rasterized by sharp

An Astro endpoint per image turns `cv.json`, the parsed tokens, and the Plex Mono `.woff` files into an SVG with Satori (text becomes vector shapes), and sharp turns that into a PNG.

**Pros**:
- Content, colours, and domain come from their one source on every build; a content edit updates the cards.
- The card logic is a pure function (content in, node tree out), testable like the other helpers.
- Output is identical on any machine because text is converted to shapes before rasterizing.
- The same pipeline draws the favicon and the Apple icon.

**Cons**:
- One new dependency, still before version 1.0, with a CSS subset (flexbox only).
- Its text shaping runs on `harfbuzzjs` WebAssembly, which must load inside Vite's build (not yet proven there; the bench ran plain Node).
- Its declarations expect React's `ReactNode`, typed loosely here because React is not installed.

### Option 2: PNG files exported by hand

Design the cards in a design tool and commit them to `public/`.

**Pros**:
- No new dependency and no build step; any visual effect is possible.

**Cons**:
- Name, role, colours, and domain live in a second place and go stale without any warning (a new role title leaves every preview wrong).
- Each later page needs another hand made image.

### Option 3: Screenshot an HTML card with Playwright

Render a real HTML page styled with the site's own CSS and screenshot it at build time.

**Pros**:
- Pixel exact with the site's CSS, including anything Satori's CSS subset lacks.

**Cons**:
- Every build (your machine, CI, and Cloudflare's build image) then needs a headless Chromium of about 150 MB and a running server.
- Slow and fragile compared with a pure function, for a card that needs only flexbox and text.

### Option 4: `astro-og-canvas`

An Astro focused package on CanvasKit (Skia compiled to WebAssembly) that draws cards from a small set of options.

**Pros**:
- Built for Astro content, little code.

**Cons**:
- A fixed layout (title, description, logo, border): the page label, the hairline, and the two sided footer row need workarounds.
- Its own font and colour configuration duplicates what the tokens already hold.

### Option 5: A hand written SVG template rasterized by sharp

A pure function writes the card as an SVG string with `<text>` elements, and the installed sharp turns it into a PNG. Raised by the cross check.

**Pros**:
- No new dependency; the one source rule holds, and the two layouts (name on one line or two) are simple.

**Cons**:
- sharp draws SVG with librsvg, which ignores `@font-face` and uses the fonts installed on the machine, so Plex Mono would have to be installed on every build machine (yours, CI, Cloudflare) or the card silently falls back to another face.
- Converting the text to paths instead needs a font parser (another dependency) and hand written shaping for kerning and accents, which is what Satori already does.

## Rationale

Option 1 is the only one that keeps the one source rule and stays cheap to run. A hand made image (Option 2) breaks that rule on day one, and the cards exist mostly for recruiters seeing a role title, the very thing that changes. A browser in the build (Option 3) buys fidelity this card does not need, since the design is text on a flat ground with one rule, which Satori renders exactly. Option 4 fights the layout you chose. Option 5 looks lighter but ties the output to fonts installed on each machine, the exact nondeterminism Satori removes by turning text into shapes. Satori with the `sharp` you already ship adds one package with no native build step.

The head tags follow the rest of the site: a row in a table (`SHARE_PAGES`, like `SITE_NAV`), pure helpers with Vitest cases, and pages that spread the result into `BaseLayout`. Deriving the canonical from the row's path avoids the `.html` trap entirely. Titles and descriptions derive from `cv.json` because you chose that for the CV description, and it keeps spec 0002's follow up ("read `name`, `label`, and `bio` rather than duplicating them"). The two caps turn a silent layout break into a build error, the same way the schema already treats content errors.

Per page cards cost nothing extra once the images are generated, and a CV link that says CV tells a recruiter what they will open. `site` is set now to the domain you plan to buy, so Go live only confirms it. No sitemap, no robots.txt, and no JSON-LD for now: two linked pages need no sitemap, a missing robots.txt means everything may be crawled, and JSON-LD would need a lint exception for `set:html` for a gain Google does not promise on a personal home page.

## Bench evidence

Rendered on 2026-09-25 in a scratch folder (never the repo) with Satori 0.33.5, the project's sharp 0.35.4, the Plex Mono latin `.woff` files at 400 and 500, and the light tokens (`bg #f2ede3`, `fg #2b2722`, `muted #71695c`, `line #dcd4c4`, `accent #646f3f`). Private comparison page: https://claude.ai/artifact/X7BKQJsYWRkHH8upwCwmTa

| Render | Size | Notes |
|---|---|---|
| Balanced home card | 1200×630, 37.8 KB | name on one line |
| Balanced CV card | 1200×630, 39.3 KB | |
| Balanced worst case (30 character name, 27 character role) | 1200×630, 43.4 KB | name on two lines, role above the rule |
| Bold CV card (name 88px, role 44px) | 1200×630, 44.6 KB | your own name wraps to two lines |
| Bold worst case | 1200×630, 49.4 KB | still clears the rule |
| Favicon light and dark at 16, 32, 64px | under 1 KB each | `J` legible at 16px |
| Apple icon | 180×180, 2.1 KB | opaque |

Findings that set the spec:
- **The name at 88px does not fit.** Plex Mono advances 0.6em per glyph, so 21 characters at 88px are about 1109px against a 1040px box; at 72px they are about 907px. You picked the balanced size for this reason.
- **Feed sizes**: at a 350px phone feed width the balanced name is about 21px and the role about 12px; at X's 504px card the role is about 17px.
- **Satori writes colours exactly as given** (`fill="#f2ede3"`, `fill="#2b2722"` in the output), which is what lets the favicon switch to the dark tokens with a CSS rule keyed on those fills.
- **Weight**: every card is 38 to 50 KB, far below the roughly 300 KB above which WhatsApp tends to drop a preview.

## Interview record

Your picks, in order: title `name · role` for home; the CV description derived from `cv.json`; the card built from the site's own design; one card per page; the layout with name, role, and a footer row; light paper; a `J` favicon in Plex Mono; an SVG favicon plus a 180px Apple PNG; Satori at build time; `jorgergo.dev` for `site`; no sitemap or robots.txt for now; no JSON-LD for now; schema caps that fail the build; sharp as the rasterizer; the balanced size after the bench. After a cross check on Sonnet 5 you applied its seven fixes: the icon function signatures, the style guide sizes and alt text, the `toLocal` and `pngSize` test helpers, endpoints as sanctioned `getCv()` callers, the literal `SHARE_PAGES` rows, a proof that Satori loads inside Astro's build before anything depends on it, and endpoints that throw (failing `pnpm build`) on states the schema and tests rule out, instead of a quiet 500. You declined the Agent Skills (`vercel-labs/json-render@image`, `kostja94/marketing-skills@open-graph`, `agricidaniel/claude-seo@seo-image-gen`) and the MCP servers (`Jellypod-Inc/satori-mcp-server`, `opengraph-mcp`) that the registry search found, and chose no References section.
