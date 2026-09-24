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
```
Pass Vitest flags with `pnpm exec vitest run <flags>`: pnpm 12 claims flags such as `--reporter` given to `pnpm test`.

## Specs

Stored in `docs/specs/`, one folder per decision: `docs/specs/NNNN-title/index.md` (+ `rationale.md`, `verify.md`).

## Rules

- Functional: pure functions over plain, `readonly` data. Content goes in, markup comes out. No classes, no shared mutable state; side effects (fetch, DOM) stay in bundled `<script>` tags at the edges.
- Expected failures return explicit results (union types, `undefined`), not thrown exceptions; content errors fail the build through collection schemas.
- Content: profile, socials, and CV live only in `src/content/cv.json` (strict schema in `src/lib/cv-schema.ts`). Pages call `getCv()` from `@/lib/cv` once in frontmatter, then format with the pure helpers in `src/lib/cv-format.ts`; `getCv()` is the one sanctioned throw. Markdown highlighting stays off (`syntaxHighlight: false`) because the CSP blocks Shiki. See [spec 0002](docs/specs/0002-content-model/index.md).
- Keep spec 0001's layout: `pages/`, `layouts/`, `components/`, `content/`, `lib/` (TS helpers, client scripts), `styles/`, `assets/`. Never create `src/fetch.ts`.
- Strict types: no `any`, no non null `!` shortcuts. Add `typescript` only with its range (`^6.0.3`), never `@latest`.
- CSP safe markup: Tailwind classes only, no inline `style=""`, no `define:vars`, no `is:inline` scripts. Close every tag and nest HTML validly.
- Accessibility baseline WCAG AA: semantic HTML, full keyboard use, visible focus, AA contrast in light and dark (system driven, no toggle).
- Design system: build all UI to [design.md](design.md) (art direction and the build mandate); token values live in `src/styles/global.css`. The dev only `/styleguide` page (`src/pages/_dev/`, injected by `astro.config.mjs` under `pnpm dev`, never in `dist/`) renders every component.
- Naming: PascalCase `.astro` components, camelCase functions and variables, kebab-case other files. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Tooling

Chosen by /audit; `/develop tooling` installs exactly this.
- **Lint**: ESLint 10 flat config (`eslint.config.js`) with `typescript-eslint` strict, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y-x` (the ESLint 10 fork of `eslint-plugin-jsx-a11y`); it errors on the Rules above it can check (classes, `any`, `!`, `style=""`, `define:vars`, `is:inline`, `set:html`).
- **Format**: Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.
- **Pre commit**: `simple-git-hooks` (config in `package.json`, installed by `prepare`) runs lint-staged (ESLint + Prettier on staged files), then `astro check`. The hook uses the `pnpm`/Node on git's PATH, so Node 26 must be active there.
- **Tests** (runner set up by `/test`): Vitest for `src/lib` helpers and content schemas; Playwright for built pages (links, keyboard, print, axe checks).
- **Unit tests**: Vitest 5, `vitest.config.ts` resolves `@/*` from tsconfig and runs `src/**/*.test.ts`. Tests sit beside the source, tagged with the spec `AC-N` they cover; schema tests pass `() => z.string()` as the `image` stub.
- **Page tests**: Playwright with `@axe-core/playwright`, config in `playwright.config.ts`, specs in `e2e/`. The `site` project builds and serves `dist/` through wrangler on port 8788 (real headers and CSP); the `styleguide` project runs against `astro dev` on 4321 and reuses one you have open, since Astro allows one dev server per project. Not in CI yet.
- **CI**: GitHub Actions on push and PR: frozen lockfile install, lint, format check, `pnpm build`, tests. Node from `.nvmrc`. Deploying belongs to the Go live spec.

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
Declined: antfu pnpm skill, Cloudflare MCP, Tailwind MCP, openai playwright skill, github-actions-hardening skill, GitHub MCP

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
