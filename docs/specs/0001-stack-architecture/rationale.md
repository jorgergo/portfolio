# 0001. Stack and architecture: rationale

The decision record behind [index.md](index.md). `/develop` does not need this file; it explains why.

## Context

You're building an extremely minimal personal site in English: a home page (name, short bio, links) and a Harvard style CV page for Release 1. A CV PDF download and a Cmd+K command menu follow in Release 2, and a portfolio page in Release 3 (basis: `docs/scope/scope.md`). Recruiters and peers are the audience, and look and feel is the top priority. The visual references (fbold.dev, t3.gg, cv.jarocki.me) are type led, content first pages with almost no client side behaviour.

Forces that shape the choice:

- **Content changes only when you edit it.** Nothing on the site is per visitor or per request. There is no login, no database, and no user generated data. Everything is known at build time.
- **One content source feeds several outputs.** The home page, the CV page, and later the PDF must read the same data (scope feature 3). A typo in a field name should fail loudly, not render a blank section.
- **Solo developer, free tier budget.** You'll operate this alone, so anything that needs a running server, patching, or a paid plan is a cost with no matching benefit.
- **Public source.** The repo will be public on GitHub, so the code itself is part of the portfolio and should look deliberate.
- **Performance and polish are visible.** Peers will open DevTools, run Lighthouse, or check response headers. A heavy JS bundle or layout shift on a two page site reads as carelessness.
- **You're buying the domain now**, so DNS, HTTPS, and hosting can be picked together.

Not deciding means every later feature (content model, design system, pages) guesses at file locations, styling approach, and rendering model, and would likely have to be redone.

## Options considered

Each option is a full stack, not a single tool.

### Option 1: Astro 7 + Tailwind v4 + Cloudflare Workers static assets

Astro builds every page to static HTML and ships no JS unless a component asks for it. Typed content collections validate content with a schema at build time. Tailwind v4 is configured in CSS through its Vite plugin. Cloudflare serves the `dist/` folder from its edge, and its registrar sells the domain at cost (basis: Astro v7 upgrade guide; Tailwind's Astro install guide).

**Pros**: no JS by default, which suits an HTML first site; a schema checked content layer is built in; one vendor for domain, DNS, HTTPS, and hosting; free with unlimited static bandwidth; you can add a server route later on the same Worker without migrating.
**Cons**: `.astro` is one more component syntax to learn; Cloudflare's Workers static assets flow is newer than Pages, so there are fewer tutorials; Astro 7's Rust compiler is stricter about invalid HTML than earlier versions; `astro check` lags TypeScript's newest major, so TypeScript is held on 6.

### Option 2: Next.js 16 static export + Tailwind v4 + Vercel

The React ecosystem standard, exported to static files with `output: 'export'` and hosted on Vercel's Hobby tier.

**Pros**: the largest ecosystem and hiring signal; `cmdk` and every React UI library plug straight in; Vercel's DX is the smoothest there is.
**Cons**: ships the React runtime on every page, even pages with no interactivity; static export drops redirects, rewrites, and server features (basis: Next.js static exports guide); the Hobby tier is for non commercial use only and has bandwidth caps; there's no typed content layer built in.

### Option 3: SvelteKit (adapter-static) + Tailwind v4 + Netlify

SvelteKit prerenders every route through its static adapter (basis: SvelteKit adapters docs). Netlify hosts it with deploy previews.

**Pros**: a tiny runtime and pleasant component ergonomics; prerendering is first class.
**Cons**: content typing is do it yourself (no built in collections); it still hydrates a small runtime by default; Netlify's free tier has a bandwidth cap.

### Option 4: Eleventy 3 + plain CSS + GitHub Pages

The most minimal static generator, with a data cascade and templates, hosted next to the repo (basis: Eleventy docs).

**Pros**: close to zero abstraction; outputs exactly the HTML you write; everything lives in GitHub.
**Cons**: no TypeScript first content schema, so content errors surface as broken pages; weaker component ergonomics for a design system; GitHub Pages has no preview deploys, and custom headers (CSP) aren't supported.

## Rationale

Every force points at a static first framework: the content is known at build time, there's no per visitor state, and the references are type led pages with almost no JS. Option 1 is the only one that is **HTML first by default and has a typed content layer built in**. That matters most for the "one content source, several outputs" force: a bad CV field fails `astro check` instead of shipping. You also named Astro yourself, and nothing in the context argues against it.

Option 2 is the strongest runner up. Choose it only if React specific libraries become central (for example, a heavy interactive portfolio). For this site it adds a runtime visitors pay for and removes server features in exchange for ecosystem size you won't use. Options 3 and 4 are credible, but each drops something that matters here: content typing (3, 4) or custom headers and previews (4).

On hosting, Cloudflare wins on the budget and domain forces. It's free with no bandwidth ceiling, the registrar sells at cost, and DNS, TLS, and hosting share one dashboard. Workers static assets is Cloudflare's current path for new projects, and it leaves a clean upgrade route if a server route ever appears (the deferred contact form). The operational reality is close to zero: no server to patch, and a failed build simply leaves the last good deploy live.

**On Node 26.** You chose Node 26 over Node 24 LTS. Node 26 becomes the LTS line around October 2026 (basis: Node.js release schedule), so the gap is weeks. Accept two small costs: tools may lag briefly, and Corepack no longer ships inside Node (since v25), so pnpm is installed directly rather than activated with `corepack enable`.

**On Astro 7 (updated 2026-09-23).** This spec first named Astro 6. Astro 7 is now the current major (7.3.4), and nothing is scaffolded yet, so moving costs nothing today, while staying on 6 would mean a major upgrade right after launch (the same reasoning as Node 26). What changes for this site: the Fonts API and CSP are stable top level config, so the "experimental flag" hedges are gone; the Rust compiler rejects unclosed tags and stops fixing invalid nesting; Vite 8, which `@tailwindcss/vite` already supports; and a new whitespace default (basis: Astro v7 upgrade guide). Starting on Astro 6 was the runner up. Choose it only if a needed integration had not reached Astro 7, and none in this stack is affected.

**On HTML whitespace.** Astro 7 defaults to `compressHTML: 'jsx'`, which strips whitespace containing a line break between inline elements, the way React does. This site is mostly text with links inside it (bio, CV contact line, socials), so a missed `{" "}` would ship glued words that no type check catches. `compressHTML: true` keeps HTML's rule of one space and still minifies. The runner up, keeping `'jsx'` and adding `{" "}` by hand, fits component heavy apps better than prose.

**On TypeScript 6.** The build gate runs `astro check`, and `@astrojs/check` 0.9.10 declares `typescript` `^5.0.0 || ^6.0.0` as its peer (basis: npm registry, checked 2026-09-23). `typescript@latest` is now 7.0.2, TypeScript's native rewrite, so an unpinned install would put the checker on a major it has not declared support for, and the gate that protects the content would be the least trusted part of the build. Pin `^6.0.3`: the newest supported line, and it follows the project's caret rule. `~6.0.3` and an exact `6.0.3` were weighed. Because 6.0 is the last TypeScript line written in JavaScript, both give almost nothing over `^6` and break the caret convention. `^5` was rejected: it's older with no benefit, and Astro 7's preset (`moduleResolution: "Bundler"`, no `baseUrl`) is already clean under 6. The cost is waiting for TypeScript 7's speed, which a two page site barely notices.

**Security headers.** Astro's CSP emits a hashed policy for every script and style it bundles, which suits a site with almost no JS. A `<meta>` CSP can't set `frame-ancestors`, so the `_headers` file covers that and the other baseline headers (basis: OWASP secure headers guidance).

## References

**Project sources**:
- `docs/scope/scope.md`: feature list, Skateboard build approach, GA workflow, deferred analytics note.
- `referece-images/`: the visual references (fbold, t3, jarocki) that set the HTML first, low JS direction.

**Practices & standards**:
- Static first and "boring technology" for content sites: render at build time when nothing is per request.
- Schema validated content: fail the build, not the page.
- OWASP secure headers guidance (nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors, CSP).
- Node.js release schedule: even majors become LTS each October.
- Pin a tool to its checker's declared peer range, not to `latest`.

**Links** (verified during the landscape check):
- Astro v7 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v7/
- Astro `security.csp` config reference: https://docs.astro.build/en/reference/configuration-reference/#securitycsp
- Astro `fonts` config reference: https://docs.astro.build/en/reference/configuration-reference/#fonts
- Astro 6 release (original choice): https://astro.build/blog/astro-6/
- Tailwind CSS, Astro install guide: https://tailwindcss.com/docs/installation/framework-guides/astro
- Next.js static exports: https://nextjs.org/docs/app/guides/static-exports
- SvelteKit adapters: https://svelte.dev/docs/kit/adapters
- Eleventy docs: https://www.11ty.dev/docs/
- Node.js releases: https://nodejs.org/en/about/releases/
- Cloudflare Workers static assets: cited by name, no link verified.
- npm registry versions and peer ranges (`astro`, `@astrojs/check`, `typescript`, `@tailwindcss/vite`), checked 2026-09-23: cited by name.
