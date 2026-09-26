# portfolio

## Stack

Source of truth: [spec 0001](docs/specs/0001-stack-architecture/index.md). Read its CSP, version pin, and Astro 7 compiler rules before changing config.
- **Language / Runtime**: TypeScript 6 strict (`astro/tsconfigs/strict`, `@/*` → `src/*`), Node 26 (`.nvmrc`; run `fnm use` in a fresh shell)
- **Framework**: Astro 7, `output: 'static'`, no SSR adapter, `compressHTML: true`, `/cv` style URLs (no trailing slash)
- **Key dependencies**: Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `src/styles/global.css`), Astro content collections, `@astrojs/check`, wrangler
- **Hosting**: Cloudflare Workers static assets (`wrangler.jsonc` serves `dist/`), headers in `public/_headers`
- **Package manager**: pnpm 12 (pinned in `packageManager`); build approvals live in `pnpm-workspace.yaml` `allowBuilds`, not in `package.json`

## Build approach

**Skateboard**: ship the smallest complete site a visitor would actually use (home plus CV live), then grow it release by release.

## Commands

```bash
pnpm install
pnpm dev       # astro dev (no CSP here)
pnpm build     # astro check && astro build: the gate
pnpm preview   # wrangler dev on dist/: check _headers and CSP here
pnpm lint      # eslint, zero warnings allowed (lint:fix to autofix)
pnpm format    # prettier --write (format:check in CI)
pnpm test      # vitest run (test:watch to watch)
pnpm exec playwright test   # page tests in e2e/ (first run: pnpm exec playwright install chromium)
bash .github/scripts/smoke.sh pages   # after pnpm build: does the live site serve dist/? (SMOKE_ORIGIN=http://localhost:8787 tests pnpm preview; redirects mode checks the 301s)
```
Pass Vitest flags with `pnpm exec vitest run <flags>`: pnpm 12 claims flags such as `--reporter` given to `pnpm test`.

## Specs

Stored in `docs/specs/`, one folder per decision: `docs/specs/NNNN-title/index.md` (+ `rationale.md`, `verify.md`).

## Rules

- Functional: pure functions over plain, `readonly` data. Content goes in, markup comes out. No classes, no shared mutable state; side effects (fetch, DOM) stay in bundled `<script>` tags at the edges.
- Expected failures return explicit results (union types, `undefined`), not thrown exceptions; content errors fail the build through collection schemas.
- Content: profile, socials, and CV live only in `src/content/cv.json` (strict schema in `src/lib/cv-schema.ts`). Pages call `getCv()` from `@/lib/cv` once in frontmatter (the other callers are `SiteFooter`, which reads the location itself, see spec 0003, and the card and icon endpoints, see spec 0006), then format with the pure helpers in `src/lib/cv-format.ts`; `getCv()` is the one sanctioned throw in a page, and those endpoints also throw when a piece their image needs is missing. Markdown highlighting stays off (`syntaxHighlight: false`) because the CSP blocks Shiki. See [spec 0002](docs/specs/0002-content-model/index.md).
- A network added to `NETWORKS` in `src/lib/cv-schema.ts` needs a handle rule in `formatProfileHandle` (`src/lib/cv-format.ts`): the `satisfies Record<Network, …>` clause fails `astro check` until it has one (spec 0004).
- Keep spec 0001's layout: `pages/` (dev only pages in `pages/_dev/`), `layouts/`, `components/` (icons in `components/icons/`), `content/`, `lib/` (TS helpers, client scripts), `styles/`, `assets/`. Never create `src/fetch.ts`.
- Site navigation: the home page menu is `SITE_NAV` in `src/lib/site-nav.ts`, site structure rather than CV content (lowercase labels, absolute hrefs with no trailing slash, only pages that exist, planned order `about`, `cv`, `portfolio`, `contact`). A new page's spec adds its own row, and the page test fails a row whose page does not answer 200. Menu and social rows are `NavRow` (`src/components/NavRow.astro`): a muted prefix (a number hidden from assistive tech, or a key kept in the link name) then the label. See [spec 0004](docs/specs/0004-home-page/index.md).
- CV page: every dated entry is a `CvEntry` (`src/components/CvEntry.astro`: date on the right of line 1, location on the right of line 2, an optional `Prose` body, `splittable` for grouped roles) and every keyed row a `KeyedList` row. Roles are sorted with `sortNewestFirst`, then grouped with `groupConsecutive`. A CV rule with a branch lives in a pure, Vitest covered helper in `src/lib/cv-format.ts` (as `formatSkillRows` and `firstUrl` do), never inline in the page. A document page passes `printFooter={false}` to `BaseLayout`, which hides `SiteFooter` on paper (it takes a `class` prop); every other page keeps its footer city line in print. See [spec 0005](docs/specs/0005-cv-page/index.md).
- Page metadata: every page's title, description, canonical, and share tags come from `pageMeta` in `src/lib/site-meta.ts` through `BaseLayout`'s `share` prop, never hand written head tags. A page that gets a share card adds its row to `SHARE_PAGES` and its rule to `DESCRIPTIONS` (the `satisfies` clause fails `astro check` until it does); every absolute URL derives from `site` in `astro.config.mjs`. The cards and icons are drawn at build time (`/og/[page].png`, `/favicon.svg`, `/apple-touch-icon.png`): `share-card.ts` builds pure layout trees, and `render-image.ts` is the only module that loads fonts and runs Satori and sharp. Text the card draws is limited by the schema (card font glyphs less `FONT_GAPS`, 24 character name parts, 24 character city, 60 character footer), so bad content fails the build. See [spec 0006](docs/specs/0006-metadata-share-cards/index.md).
- Strict types: no `any`, no non null `!` shortcuts. Add `typescript` only with its range (`^6.0.3`), never `@latest`.
- CSP safe markup: Tailwind classes only, no inline `style=""`, no `define:vars`, no `is:inline` scripts. Close every tag and nest HTML validly.
- Accessibility baseline WCAG AA: semantic HTML, full keyboard use, visible focus, AA contrast in light and dark (system driven, no toggle).
- No ARIA `role` on generic elements or lists (the style guide test asserts none under `body`); a repeated landmark gets its own `aria-label` (`Pages`, `Elsewhere`).
- Design system: build all UI to [design.md](design.md) (art direction and the build mandate); token values live in `src/styles/global.css`, and the dev only `/styleguide` page renders every component. See [spec 0003](docs/specs/0003-design-system/index.md).
- Colours come only from the six tokens: never a `dark:` variant, a literal colour, or a Tailwind palette class such as `text-stone-500`. No arbitrary Tailwind values in components.
- Links open in the same tab: no `target` on any link, internal or external.
- `src/pages/_dev/` is dev only: Astro never routes it, `astro.config.mjs` injects its `/styleguide` page under `pnpm dev`, and nothing in it reaches `dist/`.
- Deploying: a merge to `main` publishes to jorgergo.dev once the CI gate passes. Keep the `routes` host in `wrangler.jsonc` equal to `site` and the Worker assets only (no `main` script). `smoke.sh` compares the live pages and every `public/_headers` value with `dist/` exactly and rolls a mismatch back, so no Cloudflare feature may rewrite page bytes, and only `/_astro/*` gets the immutable cache. `headerBlocks` in `e2e/helpers.ts` reads `_headers` the way `smoke.sh` does, so change both together. Dashboard settings (zone, www redirect, mail records) are recorded only in spec 0007, so a change there updates it. See [spec 0007](docs/specs/0007-go-live/index.md).
- Naming: PascalCase `.astro` components, camelCase functions and variables, kebab-case other files. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Tooling

Chosen by /audit; `/develop tooling` installs exactly this.
- **Lint**: ESLint 10 flat config (`eslint.config.js`) with `typescript-eslint` strict, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y-x` (the ESLint 10 fork of `eslint-plugin-jsx-a11y`); it errors on the Rules above it can check (classes, `any`, `!`, `style=""`, `define:vars`, `is:inline`, `set:html`).
- **Format**: Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.
- **Pre commit**: `simple-git-hooks` (config in `package.json`, installed by `prepare`) runs lint-staged (ESLint + Prettier on staged files), then `astro check`. The hook uses the `pnpm`/Node on git's PATH, so Node 26 must be active there.
- **Tests** (runner set up by `/test`): Vitest for `src/lib` helpers and content schemas; Playwright for built pages (links, keyboard, print, axe checks).
- **Unit tests**: Vitest 5, `vitest.config.ts` resolves `@/*` from tsconfig and runs `src/**/*.test.ts`. Tests sit beside the source, tagged with the spec `AC-N` they cover; schema tests pass `() => z.string()` as the `image` stub. Only `cv-schema.test.ts` reads the live `cv.json`; other unit tests hold today's words in inline fixtures, so a valid content edit needs no test edit (spec 0006 AC-18).
- **Page tests**: Playwright with `@axe-core/playwright`, config in `playwright.config.ts`, specs in `e2e/`. The `site` project builds and serves `dist/` through wrangler on port 8788 (real headers and CSP); the `styleguide` project runs against `astro dev` on 4321 and reuses one you have open, since Astro allows one dev server per project. CI runs every project on each push and PR.
- **Page test conventions**: the `/cv` cases derive every expectation from `cv.json` through the site's own helpers and count an optional part before reading it, so a valid content edit needs no test edit (spec 0005 AC-16). An AI agent's shell makes `astro dev` detach into the background, so the config sets `ASTRO_DEV_BACKGROUND=0`; do the same for any `astro dev` you start from one, and clear a leftover server with `pnpm exec astro dev stop`.
- **CI**: GitHub Actions on push and PR (`.github/workflows/ci.yml`): frozen lockfile install, lint, format check, `pnpm build`, `wrangler deploy --dry-run`, `pnpm test`, then the Playwright page tests. Node from `.nvmrc`. A push to `main` then runs `deploy`: it ships the `dist/` the page tests passed, runs `.github/scripts/smoke.sh`, and rolls back on its own when the pages fail (spec 0007).

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

- [astro](.claude/skills/astro/): `astrolicious/agent-skills`, Astro components, config, content collections (never run `astro add cloudflare`; see spec 0001)
- [cloudflare](.claude/skills/cloudflare/): `cloudflare/skills`, Cloudflare product choices and hosting
- [wrangler](.claude/skills/wrangler/): `cloudflare/skills`, `wrangler.jsonc`, local preview, deploys
- [accessibility](.claude/skills/accessibility/): `addyosmani/web-quality-skills`, WCAG 2.2 audits and fixes
- [vitest](.agents/skills/vitest/): `antfu/skills`, writing and configuring Vitest tests
- [tailwind-4-docs](.agents/skills/tailwind-4-docs/): `lombiq/tailwind-agent-skills`, Tailwind v4 docs lookups; its docs snapshot stays local (gitignored), so run the skill's initialization step once per clone
- [animation-vocabulary](.agents/skills/animation-vocabulary/): `emilkowalski/skills`, names a motion effect from a vague description
- [review-animations](.agents/skills/review-animations/): `emilkowalski/skills`, reviews animation and motion code; loads only when you invoke it by name

MCP servers: Astro Docs (connected), Playwright MCP (connected)
Declined: antfu pnpm skill, Cloudflare MCP, Tailwind MCP, openai playwright skill, github-actions-hardening skill, GitHub MCP, a11y-color-contrast-mcp, motion-dev-mcp, fontsource-mcp, google-fonts-mcp, Figma MCPs, mcp-ink-design, typography audit MCP, css-mcp, FontOfWeb MCP, tailwind-v4-shadcn skill, framer-motion-animator skill, impeccable skill, codebase-design skill, extract-design-system skill, web-typography skill, effective-print-design skill, fixing-accessibility skill, json-render image skill (Satori), claude-seo seo-image-gen skill, Satori MCP (none exists)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
