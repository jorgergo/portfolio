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
```
Lint, format, and test scripts arrive with `/develop tooling` (see Tooling).

## Specs

Stored in `docs/specs/`, one folder per decision: `docs/specs/NNNN-title/index.md` (+ `rationale.md`, `verify.md`).

## Rules

- Functional: pure functions over plain, `readonly` data. Content goes in, markup comes out. No classes, no shared mutable state; side effects (fetch, DOM) stay in bundled `<script>` tags at the edges.
- Expected failures return explicit results (union types, `undefined`), not thrown exceptions; content errors fail the build through collection schemas.
- Keep spec 0001's layout: `pages/`, `layouts/`, `components/`, `content/`, `lib/` (TS helpers, client scripts), `styles/`, `assets/`. Never create `src/fetch.ts`.
- Strict types: no `any`, no non null `!` shortcuts. Add `typescript` only with its range (`^6.0.3`), never `@latest`.
- CSP safe markup: Tailwind classes only, no inline `style=""`, no `define:vars`, no `is:inline` scripts. Close every tag and nest HTML validly.
- Accessibility baseline WCAG AA: semantic HTML, full keyboard use, visible focus, AA contrast in light and dark (system driven, no toggle).
- Naming: PascalCase `.astro` components, camelCase functions and variables, kebab-case other files. Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Tooling

Chosen by /audit; `/develop tooling` installs exactly this.
- **Lint**: ESLint 9 flat config with `typescript-eslint`, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y`.
- **Format**: Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.
- **Pre commit**: a git hook runner runs lint-staged (ESLint + Prettier on staged files), then `astro check`.
- **Tests** (runner set up by `/test`): Vitest for `src/lib` helpers and content schemas; Playwright for built pages (links, keyboard, print, axe checks).
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

MCP servers: Astro Docs (connected), Playwright MCP (recommended)
Declined: antfu pnpm skill, Cloudflare MCP, Tailwind MCP, openai playwright skill, github-actions-hardening skill, GitHub MCP

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
