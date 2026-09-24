# 0001. Static Astro site on Cloudflare

**Date**: 2026-09-23
**Status**: In Progress

## Summary

The site is built with Astro 7 (a framework that turns pages into plain HTML at build time) and styled with Tailwind CSS v4. It is hosted for free on Cloudflare, which will also sell you the domain. There is no server, database, or login, and every page is prebuilt, which suits content that only changes when you edit it. The build fails on any type or content error, so a broken CV field can never go live. TypeScript stays on version 6, because the tool that runs that check does not support version 7 yet.

## Decision

**Chosen option**: Option 1: Astro 7 + Tailwind v4 + Cloudflare Workers static assets.

A single, fully static Astro project in strict TypeScript, styled with Tailwind v4, with vanilla TypeScript for the little interactivity it needs, deployed as static assets on Cloudflare.

**Implementation skills**: `astro` (`astrolicious/agent-skills`, `.claude/skills/astro/`) · `cloudflare` + `wrangler` (`cloudflare/skills`, `.claude/skills/cloudflare/`, `.claude/skills/wrangler/`) · `accessibility` (`addyosmani/web-quality-skills`, `.claude/skills/accessibility/`)

> **Override of the `astro` skill:** do **not** run `astro add cloudflare` or install `@astrojs/cloudflare`. This site is `output: 'static'` and Cloudflare serves `dist/` as plain assets, so it needs no adapter. An adapter only arrives with a spec that introduces a server route.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Architecture | One static site (a monolith), no backend | Nothing is per visitor or per request, so every page is prebuilt HTML. |
| Language | TypeScript 6 (`typescript: ^6.0.3`), strict (`astro/tsconfigs/strict`, `@/*` → `src/*` alias) | One content source feeds home, CV, and PDF; typos must fail the build. Held on 6 because `@astrojs/check` peers on `^5 \|\| ^6` (see *Version pins*). |
| Framework | Astro 7 (`astro: ^7.3.4`, Vite 8 and the Rust compiler inside), `output: 'static'`, no SSR adapter | Zero JS by default, with typed content collections built in; the current major, so no upgrade right after launch. |
| HTML whitespace | `compressHTML: true` (HTML rules: one space kept between inline elements) | Astro 7's new default (`'jsx'`) strips whitespace that contains a line break between inline elements (JSX rules), so two links written on separate lines in a template render glued together ("GitHubLinkedIn") in bio and CV text. |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, one `src/styles/global.css` (`@import "tailwindcss"` + `@theme` tokens) | Tokens live in CSS; `print:` and `dark:` variants cover the print ready CV and system driven light/dark. |
| Light / dark | Tailwind's default `dark:` variant (follows `prefers-color-scheme`), no toggle | The scope says to follow the system setting. The media strategy needs no JS and gives no flash. |
| Interactivity | Vanilla TS in Astro `<script>` tags (bundled), native `<dialog>` for overlays; no UI framework integration | Keeps the JS near zero. Add a framework island only if a later spec justifies one. |
| Content | Astro content collections; the shape and file format (for example a JSON Resume style `cv.json`) are decided in the Content model spec | Schema validated at build; a single source for every page. |
| Fonts | Astro Fonts API (top level `fonts` config, stable), self hosted at build; the scaffold leaves it unconfigured (system font stack) until the Design system spec picks typefaces | No third party request; generated fallbacks prevent layout shift. |
| Images | `astro:assets` `<Image>` (sharp at build time only), source files in `src/assets/` | AVIF/WebP with explicit sizes, so there's no layout shift. |
| URLs | `build.format: 'file'`, `trailingSlash: 'never'` → `/cv` | Short, single canonical links for a résumé or LinkedIn. |
| Security | `public/_headers` baseline (including HSTS) + Astro's hashed CSP (top level `security.csp`, stable), enabled in the scaffold | Header scanners pass; CSP hashes cover bundled scripts. See *CSP rules* below. |
| Hosting | Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory: "./dist"`, `not_found_handling: "404-page"`, `html_handling: "drop-trailing-slash"`, no `main`), free plan | Free, unlimited static bandwidth, and the domain, DNS, and TLS all in one place. |
| Domain | Buy from Cloudflare Registrar (at cost) | DNS lives in the same account as the host (the Go live spec executes this). |
| Repo | Public GitHub repo, default branch `main`; MIT license for the code, README states the CV content is all rights reserved | The source is part of the portfolio; the host deploys from it; your personal content stays yours. |
| Runtime | Node 26 (`.nvmrc` = `26`, `engines.node: ">=26"`; no `engine-strict`, so pnpm warns on a wrong Node instead of failing) | Tracks the line that becomes LTS around October 2026, so no major upgrade right after launch. `engine-strict` is left off because pnpm applies it to every package, and a dependency that caps its engines below 26 would block the install. |
| Package manager | pnpm, latest stable at scaffold time, exact `x.y.z` in `packageManager`; build approvals in `pnpm-workspace.yaml` as `allowBuilds: { esbuild: true, workerd: true }` (pnpm 12 reads them there, not from `package.json`; sharp 0.35 ships prebuilt binaries and has no install script; workerd, used by wrangler, does); `pnpm-lock.yaml` committed | Strict dependency resolution; pnpm switches itself to the pinned version, so Corepack isn't needed. |
| Build gate | `"build": "astro check && astro build"` (`@astrojs/check`, `typescript` `^6.0.3`, `wrangler` as devDependencies) | A type or content schema error can never reach a deploy. |
| Versions | Caret ranges of the latest release at scaffold time, except `typescript` (see *Version pins*); the lockfile is the real pin | Patch updates flow in on purpose; builds stay reproducible. |
| Observability | None at launch | A static site with no backend; analytics are deferred (cookieless if added). |

Deliberately absent: database, auth, background jobs, file storage, search, SSR. Adding any of them is a new spec.

### Project layout

```
src/
  pages/        index.astro, cv.astro, 404.astro   (one file per route)
  layouts/      BaseLayout.astro                    (html shell, head, fonts, global.css)
  components/   shared .astro components
  content/      content collection data             (shape: Content model spec)
  content.config.ts
  assets/       images processed by astro:assets
  styles/       global.css                          (Tailwind import + @theme tokens)
  lib/          plain TS helpers and client scripts
public/         favicon, _headers                   (copied verbatim to dist/)
astro.config.mjs · wrangler.jsonc · tsconfig.json · .nvmrc · package.json
```

### Baseline `_headers`

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: frame-ancestors 'none'
```

Astro's CSP adds the script and style hashes through a `<meta>` tag on every page. The `_headers` line carries only `frame-ancestors`, because a `<meta>` CSP can't set it. Cloudflare provides HTTPS, but on a custom domain HSTS is opt in, so the header sets it.

### CSP rules

- Enable it with the top level `security: { csp: true }`. It is stable since Astro 6.0, so there is no `experimental` flag.
- Classes only: no inline `style=""` attributes and no `define:vars` (the hashed `style-src` blocks them). Client code goes in bundled `<script>` tags, never `is:inline`.
- Do not use the Astro 7.1 escape hatch that allows inline style attributes (`{ resource: "'unsafe-inline'", kind: "attribute" }`). If something seems to need it, that is a new decision, not a config tweak.
- The CSP exists only in the build output, so check the console for violations on `pnpm preview` (`wrangler dev`), not on `astro dev`.

### Version pins

- `astro: ^7.3.4`. The scaffold takes the latest 7.x at that moment; stay on the 7 line.
- `typescript: ^6.0.3`. **Do not install `typescript@latest`**: it resolves to 7.x, which is outside the `^5.0.0 || ^6.0.0` peer range of `@astrojs/check` (`^0.9.10`), so `astro check` (and the build gate) would run on a TypeScript it doesn't support. Caret on 6 stays inside the 6 line (only 6.0.2 and 6.0.3 exist today, so in practice it's exact until a 6.x patch ships).
- Raise `typescript` to 7 only when `@astrojs/check` adds 7 to its peer range (see Follow-up).

### Astro 7 compiler rules

The Rust compiler (the only one in Astro 7) is stricter than Astro 6's:

- Close every non void tag (`<p>…</p>`, `<li>…</li>`). An unclosed tag fails the build.
- Nest HTML validly: no block elements (`<div>`, `<ul>`) inside `<p>`. The compiler no longer fixes it; the browser will, and the layout breaks.
- `src/fetch.ts` is a reserved file name. Don't create it; put helpers in `src/lib/`.

### Config files

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  compressHTML: true,
  trailingSlash: 'never',
  build: { format: 'file' },
  security: { csp: true },
  vite: { plugins: [tailwindcss()] },
});
```

`package.json` fields: `"name": "portfolio"`, `"private": true`, `"type": "module"`, `"license": "MIT"`, plus `engines` and `packageManager` from the stack table. Build approvals live in `pnpm-workspace.yaml` (`allowBuilds`), not in a `pnpm` block here.

`package.json` dependencies (the caret of the latest release at scaffold time; these were current on 2026-09-23 and are the floor):

```json
{
  "dependencies": {
    "astro": "^7.3.4"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^6.0.3",
    "wrangler": "^4.137.0"
  }
}
```

Add each package with its range (`pnpm add -D typescript@^6.0.3`), never bare, so `typescript` can't resolve to 7.

`package.json` scripts:

```json
{
  "dev": "astro dev",
  "check": "astro check",
  "build": "astro check && astro build",
  "preview": "wrangler dev"
}
```

`preview` uses `wrangler dev` because `astro preview` ignores `_headers`, so it can't verify the header baseline.

`wrangler.jsonc`:

```jsonc
{
  "name": "portfolio",
  "compatibility_date": "<newest date the installed wrangler supports>",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
    "html_handling": "drop-trailing-slash"
  }
}
```

`tsconfig.json`: `extends: "astro/tsconfigs/strict"` and `compilerOptions.paths: { "@/*": ["./src/*"] }`, nothing else. Astro 7's preset already sets `include` (`.astro/types.d.ts` and everything) and `exclude` (`dist`), so don't repeat them. Astro reads tsconfig paths, so no Vite alias is needed.

`.gitignore`: `node_modules`, `dist`, `.astro`, `.wrangler`, `.env*`. Initialise with `git init -b main`.

### Scaffold contents

The scaffold is structure only; real content and design come from later specs. Write every file by hand from this spec. Don't run `pnpm create astro`: it writes its own tsconfig and README and leaves out the check tooling.

- `index.astro`, `cv.astro`, `404.astro` each render through `BaseLayout` with one line of placeholder text.
- `content.config.ts` exports `collections = {}`.
- `global.css` holds `@import "tailwindcss";` and an empty `@theme {}`.
- `public/_headers` exactly as above; a placeholder favicon.
- `LICENSE` (MIT) and a `README.md` stating the CV content is all rights reserved.
- `pnpm-workspace.yaml` with `allowBuilds` for `esbuild` and `workerd`. After `pnpm install`, the output shows no "ignored build scripts" warning.

### Values the build needs

| Value | Source |
|---|---|
| `site` (absolute URL, used by canonical links, OG, and later the sitemap) | Not set in the scaffold (nothing needs it yet). The Metadata and share cards spec sets it; Go live switches it to the purchased domain. |
| Worker `name` in `wrangler.jsonc` | `portfolio` (it becomes part of the `workers.dev` URL). |
| `compatibility_date` | The newest date the installed `wrangler` supports (it's tied to the bundled `workerd` build and `wrangler` reports it; 2026-09-21 for wrangler 4.137.0). Not the calendar date, which can be newer and fail. |
| `package.json` `name` | `portfolio` (matches the Worker). |
| `LICENSE` copyright holder and year | Holder from `git config user.name` on the scaffolding machine; year is the scaffold year. |
| Node version | `.nvmrc`, which Cloudflare's build image reads. |
| Secrets / env vars | None. |

## Consequences

**Positive**:
- Pages are plain HTML with near zero JS, so they're fast and robust and leave nothing to operate at runtime.
- Content and type errors fail the build, so a broken deploy can't happen silently.
- Costs nothing to run; the only spend is the domain at cost.
- A server route can be added later on the same Worker without migrating hosts.

**Negative / tradeoffs**:
- Node 26 is on the "Current" line until about October 2026. If Cloudflare's build image lags, set `NODE_VERSION` in the build settings, or fall back to 24 temporarily.
- Corepack isn't bundled with Node 26, so install pnpm directly (`npm i -g pnpm` or the standalone installer). `corepack enable` won't work.
- `astro check` adds a few seconds to every build.
- TypeScript is held one major behind (6, while 7 is `latest`). You give up TypeScript 7's faster native checker until `@astrojs/check` supports it, and a plain `pnpm add -D typescript` would pull the wrong major, so always add it with the range.
- The Rust compiler fails the build on markup Astro 6 tolerated (unclosed tags, invalid nesting). That is stricter, but it surfaces as a build error, not a broken page.
- Any Vite plugin must support Vite 8. `@tailwindcss/vite` does (it peers on `^8`); check a new plugin before adding it.
- `compressHTML: true` differs from Astro 7's default, so Astro examples that rely on `'jsx'` whitespace may render with an extra space here.
- Anything that needs a live server (the deferred contact form, request time OG images) needs its own spec.
- The CV PDF (Release 2) has to be generated at build time without a server; whether Cloudflare's build image can run a headless browser is unverified, and the CV PDF spec must decide.
- `.astro` is one more component syntax to learn.
- The hashed CSP blocks the inline styles Shiki (Astro's default markdown highlighter) writes, so code blocks would render unstyled, and the build already warns about it. The Content model spec must pick `markdown.syntaxHighlight: false` or `'prism'` with a stylesheet before any markdown with code fences ships.
- Cloudflare zone features that inject scripts (Email Address Obfuscation, on by default, and Rocket Loader) are blocked by the hashed CSP; a `mailto:` link would render broken. Go live must turn both off.

**Neutral**:
- Every later feature builds on this layout, the `@/` alias, and Tailwind tokens in `global.css`.
- Lint, format, and pre commit hooks belong to Coding standards & tooling (feature 2), not this spec.
- The deploy pipeline (Workers Builds git integration vs a GitHub Action) belongs to the Go live spec; the scaffold only needs `wrangler.jsonc` to be valid.

## Follow-up

- [ ] Run `/audit` (feature 2) after scaffolding so root `AGENTS.md` records this stack; it is currently missing.
- [ ] `astro`, `cloudflare`, `wrangler`, and `accessibility` skill conventions aren't in root `AGENTS.md` `## Agent skills` yet. They apply project wide, so they belong at the root (`/audit` or `/sync` writes them). Record `MCP servers: Astro Docs (https://mcp.docs.astro.build/mcp)` and `Declined: antfu pnpm skill, Cloudflare MCP, Tailwind MCP` on the same section's compact lines.
- [ ] Go live spec: buy the domain on Cloudflare Registrar, attach it to the Worker, switch `site` to it, turn off Email Address Obfuscation and Rocket Loader, and confirm how Cloudflare's build image picks the pnpm version.
- [ ] Content model spec: evaluate a single JSON file for the CV (JSON Resume style), as in midudev's `minimalist-portfolio-json` Astro template (github.com/midudev/minimalist-portfolio-json).
- [ ] Command menu spec: evaluate `hotkeypad` (the framework free palette that template uses) against a hand built `<dialog>`.
- [ ] Design system spec: when fonts are added, confirm Astro's CSP hashes the inline style the Fonts API emits.
- [ ] CV PDF spec: confirm how the PDF is generated at build time (a headless browser in Cloudflare's build image vs a GitHub Action vs a JS PDF renderer).
- [ ] When `@astrojs/check` adds TypeScript 7 to its peer range, update this spec to move `typescript` to `^7` (a small in place update).
