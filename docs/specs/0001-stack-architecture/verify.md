# Verify: Stack & architecture · spec 0001 · updated 2026-09-23
_Steps derived from the scope's Done when for feature 1 (spec 0001 has no numbered acceptance criteria, so DW-1 and DW-2 stand in for them). `/check verify` runs these; `/test` locks the durable ones._

- **DW-1**: the stack and hosting choice are recorded in a spec.
- **DW-2**: the empty scaffold runs locally and builds clean.

## UI / manual
- [x] `pnpm dev`, open `/` and `/cv` → each page shows its placeholder line → DW-2
- [x] `pnpm build && pnpm preview`, open `/`, `/cv`, `/nope` in a browser → pages render, `/nope` shows the 404 page, and the console shows no CSP violations → DW-2

## Commands
- [x] `node -v` → v26.x (matches `.nvmrc`) → DW-2
- [x] `rm -rf node_modules && pnpm install` → finishes with no "ignored build scripts" warning → DW-2
- [x] `pnpm build` → `astro check` reports 0 errors, and `dist/` holds `index.html`, `cv.html`, `404.html`, `_headers`, `favicon.svg` → DW-2
- [x] `grep -c 'content-security-policy' dist/index.html` → 1 (hashed CSP `<meta>` present) → DW-2
- [x] With `pnpm preview` running, `curl -sI localhost:8787/` → all five `_headers` lines present (nosniff, Referrer-Policy, Permissions-Policy, HSTS, `frame-ancestors 'none'`) → DW-2
- [x] `curl -sI localhost:8787/cv/` and `curl -sI localhost:8787/cv.html` → 307 to `/cv`, and `/cv` itself → 200 → DW-2
- [x] `curl -sI localhost:8787/nope` → 404, and the body is the 404 page → DW-2
- [x] Spec 0001 exists with a `## Proposed stack` naming Astro 7, Tailwind v4, and Cloudflare Workers static assets → DW-1

## Acceptance-criteria coverage
- DW-1 covered by the last command step.
- DW-2 covered by every other step.
