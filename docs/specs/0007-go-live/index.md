# 0007. Go live on jorgergo.dev with a gated GitHub Actions deploy

**Date**: 2026-09-25
**Status**: In Progress

## Summary

The site goes live at `https://jorgergo.dev`, which you already own on Cloudflare. Every push to `main` runs the full CI gate (lint, format, build, unit tests, and now the Playwright page tests), and only when it passes does a second job upload the exact `dist/` it tested to the Worker. A short check then requests the live pages, and if they are wrong it rolls the Worker back to the previous version on its own. The rest is one time setup you do by hand in Cloudflare and GitHub: zone settings, the www redirect, a narrow API token, one first deploy from your Mac that attaches the domain, mail records that stop spoofing, a branch rule, and search engine registration.

## Requirements

**User stories**:
- As a recruiter or peer, I want `jorgergo.dev` (or `www.jorgergo.dev`) to open your site over HTTPS, so that the link on your CV or LinkedIn just works.
- As you, I want merging to `main` to publish the change without manual steps, and only if every check passed, so that a broken page never reaches a visitor.
- As you, I want a bad deploy to undo itself and tell you, so that you hear about it from GitHub, not from a recruiter.

**Acceptance criteria**:
- **AC-1**: `wrangler.jsonc` gains `"routes": [{ "pattern": "jorgergo.dev", "custom_domain": true }]`, whose host equals the host of `site` in `astro.config.mjs` (`https://jorgergo.dev`, unchanged from spec 0006 AC-1). Live, `https://jorgergo.dev/` and `https://jorgergo.dev/cv` answer 200 over HTTPS, and each body is byte identical to `dist/index.html` and `dist/cv.html` of the deployed build (proof that no Cloudflare feature rewrites the HTML). `https://jorgergo.dev/missing` answers 404, and its body is byte identical to `dist/404.html`.
- **AC-2**: `https://www.jorgergo.dev/<path>?<query>` answers 301 with `Location: https://jorgergo.dev/<path>?<query>` (path and query kept). `http://jorgergo.dev/<path>?<query>` answers 301 to `https://jorgergo.dev/<path>?<query>`.
- **AC-3**: Live `/` and `/cv` carry every header in the `/*` block of `public/_headers`, each with the same value. `public/_headers` gains a second block, `/_astro/*` with `Cache-Control: public, max-age=31536000, immutable`; live, the stylesheet under `/_astro/` carries it along with every `/*` header (Cloudflare applies every matching block), and no `cache-control` line on `/` or `/cv` contains `immutable` (HTML keeps Cloudflare's revalidate default, so a deploy shows at once). A page test in `e2e/site.spec.ts` checks both blocks on the wrangler served build: the `/*` headers on `/` and on the stylesheet, the cache header on the stylesheet, and no `immutable` on `/`.
- **AC-4**: `wrangler.jsonc` sets `"workers_dev": false` and `"preview_urls": false`. After the first deploy, `portfolio.<your subdomain>.workers.dev` no longer serves the site, so jorgergo.dev is its only address.
- **AC-5**: `.github/workflows/ci.yml` has two jobs. `check` runs on every push to `main` and every pull request. `deploy` has `needs: check` and `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`, so it runs only after a green `check` on `main` and never for a pull request. A red `check` leaves the live site on its last good version.
- **AC-6**: `check` runs, in order: frozen lockfile install, `pnpm lint`, `pnpm format:check`, `pnpm build` (the `astro check` gate), `pnpm exec wrangler deploy --dry-run` (only if build step 1 proves it runs with no Cloudflare values set, since fork PRs have none; otherwise it stays a local check), `pnpm test`, `pnpm exec playwright install --with-deps chromium`, `pnpm exec playwright test` (both projects; its web server runs `astro build` again, so `dist/` now holds the build the page tests saw), then, on a push to `main` only and after Playwright, uploads `dist/` with `actions/upload-artifact@v5` (`name: dist`, `path: dist`, `retention-days: 1`, `if-no-files-found: error`; confirm the current major at build time). `playwright.config.ts` sets `forbidOnly: !!process.env.CI`.
- **AC-7**: `deploy` downloads the `dist` artifact from the same run with `actions/download-artifact@v6` (`name: dist`, `path: dist`, which restores `dist/index.html` where `assets.directory: ./dist` expects it) and runs `pnpm exec wrangler deploy` with no build step, so the deployed files are the ones the page tests passed. The deployed version's message is the commit SHA (`wrangler deploy --message`, present in wrangler 4.137).
- **AC-8**: The workflow level concurrency keeps its `ci-${{ github.ref }}` group but sets `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`: a newer push cancels an older run of the same pull request, and runs on `main` queue instead of cancelling. GitHub keeps one running and one pending run per group, so a third quick push cancels the waiting middle run: only the newest commit deploys, and the middle run shows as cancelled. `deploy` also sits in its own group, `production`, with `cancel-in-progress: false`, so a deploy is never cut off halfway.
- **AC-9**: After `wrangler deploy`, `bash .github/scripts/smoke.sh pages` retries up to 10 times, 15 seconds apart, until every AC-1 and AC-3 check passes and `/og/cv.png` answers 200 with `image/png`. The steps carry the ids `deploy`, `pages`, `rollback`, and `redirects`. If `pages` still fails, `rollback` (`if: failure() && steps.pages.outcome == 'failure'`) runs `pnpm exec wrangler rollback --yes --message "smoke check failed for $GITHUB_SHA"` (`--yes` because the prompt defaults to no) and the job fails red. `redirects` keeps the default condition, so it is skipped after a failed `pages` and runs when `rollback` was skipped; it runs `bash .github/scripts/smoke.sh redirects` against AC-2 with the same retries. A failure there fails the job red without a rollback, because the redirects are zone rules that a code rollback cannot fix. The script follows *Smoke check contract*.
- **AC-10**: The Cloudflare API token is made from the `Edit Cloudflare Workers` template, limited to your account and the `jorgergo.dev` zone, with no expiry. It is stored as the secret `CLOUDFLARE_API_TOKEN` in a GitHub environment named `production` whose deployment branches are limited to `main`, next to the environment variable `CLOUDFLARE_ACCOUNT_ID`. `deploy` declares `environment: production`, and only the deploy and rollback steps receive the two values (step level `env`). No Cloudflare value lives in the repo.
- **AC-11**: The `jorgergo.dev` zone has these settings: Email Address Obfuscation off, Rocket Loader off, Automatic HTTPS Rewrites off, Web Analytics automatic setup off, Zaraz not set up, Bot Fight Mode off, AI bot blocking off, managed `robots.txt` off, AI Labyrinth off, Browser Integrity Check off (it can challenge the smoke check's curl), Cloudflare Fonts off and Automatic Signed Exchanges off (both can change what a page serves), Always Use HTTPS on, Minimum TLS Version 1.2, the zone HSTS setting off (the header comes from `_headers`), DNSSEC on, and domain auto renew on.
- **AC-12**: The zone publishes records that refuse all mail for the domain: TXT at `jorgergo.dev` `v=spf1 -all`, TXT at `_dmarc.jorgergo.dev` `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`, and a null MX (`MX 0 .`) at `jorgergo.dev` when Cloudflare's DNS form accepts `.` as the mail server. `cv.json` keeps `jorgergo@icloud.com`.
- **AC-13**: A GitHub ruleset on `main` requires the `check` status to pass and blocks force pushes and branch deletion; you, as the repo admin, may bypass it.
- **AC-14**: A Google Search Console domain property for `jorgergo.dev` is verified by a DNS TXT record; indexing is requested for `https://jorgergo.dev/` and `https://jorgergo.dev/cv`; the property is imported into Bing Webmaster Tools. No sitemap is added (spec 0006).
- **AC-15**: Spec 0006 AC-14 passes: pasting `https://jorgergo.dev/cv` into LinkedIn's Post Inspector, a new X post, and a WhatsApp chat shows the CV card and the CV title; the home URL shows the home card.
- **AC-16**: `README.md` gives the live URL under its opening line and a `## Deploy` section: a push to `main` deploys after CI passes, a failed smoke check rolls back on its own, a manual rollback is `pnpm exec wrangler rollback` (or Rollback in the dashboard), and the one time Cloudflare and GitHub setup lives in spec 0007.

## Decision

**Chosen option**: Option 1: GitHub Actions deploy job gated on CI

A `deploy` job in the existing CI workflow ships the `dist/` artifact that the `check` job built and page tested, with `wrangler` from the lockfile, then smoke checks the live site and rolls back on failure. The domain link lives in `wrangler.jsonc`; the www redirect, zone settings, and mail records are one time dashboard setup.

**Implementation skills**: `wrangler` (`cloudflare/skills`, `.claude/skills/wrangler/`) · `cloudflare` (`cloudflare/skills`, `.claude/skills/cloudflare/`)

Smaller calls made with it (your picks, plus the ones I settled; reasons in `rationale.md`):

| Choice | Pick |
|---|---|
| Canonical host | The bare `jorgergo.dev`; www redirects to it with a 301 |
| www redirect | A zone Redirect Rule on a proxied `www` record, not Worker code |
| PR previews | None; `pnpm preview` stays the local check |
| workers.dev and preview URLs | Off |
| Wrangler in CI | `pnpm exec wrangler`, not `cloudflare/wrangler-action` |
| Smoke check | `.github/scripts/smoke.sh`, two modes, reads every expectation from the downloaded `dist/` |
| Failed smoke | Automatic `wrangler rollback`, pages mode only |
| Caching | `/_astro/*` immutable for a year; HTML on Cloudflare's default |
| AI crawlers | All allowed |
| Email | None at the domain; SPF, DMARC, and null MX refuse spoofed mail |
| Search | Google Search Console by DNS TXT, imported into Bing |
| Branch rule | `main` requires `check` |
| Path filters | None: every push to `main` deploys, even docs only (unchanged files are not uploaded again) |
| Action versions | Version tags, like the existing steps (`@v7`); the new artifact actions use their current major |

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Data model sketch

No data model. The state this feature adds lives outside the repo:

| Where | What | Owner |
|---|---|---|
| `wrangler.jsonc` | `routes` (custom domain), `workers_dev: false`, `preview_urls: false` | repo |
| `public/_headers` | the new `/_astro/*` block | repo |
| `.github/workflows/ci.yml`, `.github/scripts/smoke.sh` | the gate, deploy, smoke, and rollback | repo |
| Cloudflare zone `jorgergo.dev` | settings (AC-11), `www` AAAA `100::` proxied, the Redirect Rule, mail TXT and MX records, the Search Console TXT | you, in the dashboard |
| Cloudflare account | the API token; the Worker's versions and deployments (rollback history) | you; wrangler |
| GitHub repo | environment `production` (secret and variable), the `main` ruleset | you, in settings |

### State transitions

One per push to `main`:

`check running` → `check red` (stop; the live site is unchanged) · `check green` → `deploying` → `deploy failed` (stop; unchanged) · `deployed` → `smoke pages green` → `smoke redirects green` (done) · `smoke pages red` → `rolled back` (red) · `smoke redirects red` (red, the new version stays live)

### API surface

| Surface | Trigger | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `check` job | push to `main`, any pull request | the commit | pass or fail; artifact `dist` on `main` pushes | none (repo read only) | any step fails → no artifact, no deploy |
| `deploy` job | `check` green on a `main` push | artifact `dist`, `wrangler.jsonc` | a new Worker version live at jorgergo.dev | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` from `production` | apex DNS record conflicts with the custom domain → wrangler error, nothing changes; token invalid → error, nothing changes |
| `smoke.sh pages` | after `wrangler deploy` | `dist/` | exit 0, or 1 with the first failed check printed | none (public HTTPS) | bytes differ, status or header wrong → rollback |
| `smoke.sh redirects` | after `pages` passes | `dist/` | exit 0 or 1 | none | missing Redirect Rule or Always Use HTTPS → red, no rollback |
| `wrangler rollback` | `smoke.sh pages` failed | `--yes`, the message | the previous version live | as `deploy` | no previous version → the step errors and the job is red (the bootstrap deploy prevents this) |
| `www.jorgergo.dev/*` | any request | path, query | 301 to the bare host | public | none |

`smoke.sh` takes one argument, `pages` or `redirects`, and runs from the repo root with `dist/` present. It uses only `curl`, `grep`, `sed`, and `cmp`, so you can also run it on your Mac after building the commit that is live.

### Smoke check contract

- **Shell**: `set -euo pipefail`, but each check runs inside a function whose curl failure (a connection or TLS error on the first attempts) counts as a failed attempt, never a script crash. It prints the origin first, then `attempt N/10: <check> expected <x> got <y>` on the first failed check of an attempt, sleeps 15 seconds, and exits 1 after the tenth attempt.
- **Requests**: `curl -sS --max-time 20 -A "portfolio-smoke/${GITHUB_SHA:-local}" -H 'Accept-Encoding: identity' -o <body> -D <headers> -w '%{http_code}'`, with no `-L`, no `--compressed`, and no `--fail` (the 404 check needs its body). Header dumps have `\r` stripped.
- **Origin and stylesheet**: the first `<link rel="canonical" href="…">` in `dist/index.html`, trailing `/` stripped; the first `/_astro/…\.css` path in `dist/index.html`. Either one empty → exit 1 at once, with no retries.
- **`_headers` grammar**: a line starting with `/` opens a block named by that path; indented `Name: value` lines belong to it until the next unindented line; blank and `#` lines are skipped; name and value are trimmed. The script uses exactly the `/*` and `/_astro/*` blocks.
- **Header match**: a header passes when one response header line matches the name in any case and the value exactly (`grep -i -x -F "name: value"` on the dump). A value merged with commas or sent twice fails, on purpose.
- **`pages` checks**: `/` → 200, bytes equal `dist/index.html`, every `/*` header; `/cv` → 200, bytes equal `dist/cv.html`, every `/*` header; no `cache-control` line on `/` or `/cv` contains `immutable`; the stylesheet → 200 and the `/_astro/*` `Cache-Control`; `/og/cv.png` → 200 and `content-type: image/png`; `/missing` → 404, bytes equal `dist/404.html`.
- **`redirects` checks**: `https://www.<host>/cv?ref=smoke` and `http://<host>/cv?ref=smoke` → each 301 with `location: https://<host>/cv?ref=smoke` exactly.

### Value sourcing

| Action | Value | Source |
|---|---|---|
| deploy | Worker name | `wrangler.jsonc` `name`, `portfolio` (spec 0001) |
| deploy | account | `CLOUDFLARE_ACCOUNT_ID`, variable in environment `production` |
| deploy | credentials | `CLOUDFLARE_API_TOKEN`, secret in environment `production` |
| deploy | files | the `dist` artifact of the same run (built and page tested by `check`) |
| deploy | custom domain host | `wrangler.jsonc` `routes[0].pattern`, kept equal to the host of `site` (if they ever differ, the live bytes stop matching and `smoke.sh pages` fails) |
| deploy | version message | `github.sha` |
| smoke | origin to test | `SMOKE_ORIGIN` when set (a local run against `pnpm preview`), else the `<link rel="canonical">` href in `dist/index.html` (derived from `site`), trailing `/` stripped |
| smoke | expected page bytes | `dist/index.html` for `/`, `dist/cv.html` for `/cv`, `dist/404.html` for `/missing` |
| smoke | expected headers | the `/*` block of `dist/_headers` (copied from `public/_headers`), each `Name: value` line |
| smoke | expected cache header and file | the `/_astro/*` block of `dist/_headers`; the first `/_astro/*.css` href in `dist/index.html` |
| smoke | share image | `/og/cv.png` (spec 0006 `SHARE_PAGES`), expected `content-type: image/png` |
| smoke | www and http URLs | `https://www.` and `http://` plus the canonical host; the probe path `/cv?ref=smoke` |
| smoke | retries | 10 attempts, 15 seconds apart (covers edge propagation; the certificate already exists from the bootstrap deploy, build step 9) |
| smoke | user agent | `portfolio-smoke/` plus `GITHUB_SHA` (`local` outside CI) |
| rollback | target version | wrangler's previous deployment (no version ID passed); the bootstrap deploy guarantees one exists before the first CI deploy |
| check | Node and pnpm | `.nvmrc` and `packageManager`, as today |
| check | browser | Chromium from the lockfile's `@playwright/test` |
| Search Console | TXT value | issued by Google when you add the domain property |

### Key invariants

- Nothing reaches the Worker unless `check` passed on that exact commit, and the uploaded bytes are the ones Playwright tested.
- `site`, the canonical links, the card footers, and the `routes` host name one host: `jorgergo.dev`.
- No Cloudflare feature may change a page's bytes; the smoke check fails on any difference.
- The token never leaves the `production` environment, and only two steps see it.
- The Worker stays assets only (no `main` script), as spec 0001 decided.

### Security model

The site is public and read only, and so is the repo. The only secret is the Cloudflare token: scoped to one account and one zone, readable only by jobs that target `production` from `main`, and passed only to the wrangler steps. Pull requests, including ones from forks, never see it. HSTS comes from `_headers`; `.dev` is also on the browsers' HSTS preload list as a whole, so plain HTTP never reaches a visitor anyway. SPF, DMARC, and the null MX stop anyone from sending mail that passes as `@jorgergo.dev`. No PII beyond what spec 0002 already publishes.

### Configuration required

- `CLOUDFLARE_API_TOKEN` (GitHub environment secret, `production`): lets wrangler upload versions, deploy, roll back, and manage the custom domain.
- `CLOUDFLARE_ACCOUNT_ID` (GitHub environment variable, `production`): the account wrangler targets, so the token needs no permission to list accounts.
- `WRANGLER_SEND_METRICS: 'false'` (job level env in `check` and `deploy`, quoted as a string): keeps wrangler's telemetry prompt and upload out of CI.

### Critical test scenarios

- Happy path: merge a PR → `check` green → `deploy` uploads → `smoke.sh pages` and `redirects` pass → the live `/cv` matches `dist/cv.html`, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-7**, **AC-9**
- Gate: push a branch whose page test fails → the PR shows `check` red, the ruleset blocks the merge, and `deploy` never runs, verifies **AC-5**, **AC-6**, **AC-13**
- Failure: a deploy whose live bytes differ (for example Email Address Obfuscation switched back on) → `smoke.sh pages` fails after its retries → `wrangler rollback` runs → the job is red, verifies **AC-9**, **AC-11**
- Redirect failure: disable the Redirect Rule, rerun `deploy` → `smoke.sh redirects` fails red, and the new version stays live, verifies **AC-2**, **AC-9**
- Auth: a pull request from a fork runs `check` only; its logs never show the token, and `deploy` is skipped, verifies **AC-5**, **AC-10**
- Concurrency: two quick pushes to `main` → the second run waits for the first deploy instead of cancelling it; a third push cancels the waiting second run, verifies **AC-8**

## Build plan

Skateboard: the thinnest usable whole is the site live at jorgergo.dev through the gated pipeline, so steps 1 to 10 ship together at the first merge. Steps 11 to 14 grow it after launch. Steps 7 to 9 and 11 to 14 are yours: they sign in to Cloudflare and GitHub and change account settings, so an agent cannot do them.

**Repo work** (branch `feat/go-live`; the PR runs `check` only)

1. [x] `wrangler.jsonc`: add `routes` with the custom domain, `workers_dev: false`, and `preview_urls: false`. Confirm with `pnpm build && pnpm exec wrangler deploy --dry-run` in a shell with no `CLOUDFLARE_*` values and no wrangler login; if it asks for an account, the dry run stays out of CI (AC-6), satisfies **AC-1**, **AC-4**, **AC-6**
2. [x] `public/_headers`: add the `/_astro/*` block. In `e2e/site.spec.ts`, add a test that `/` and the stylesheet under `/_astro/` carry every `/*` header, the stylesheet carries the cache header, and no `cache-control` on `/` contains `immutable`, satisfies **AC-3**
3. [x] `playwright.config.ts`: `forbidOnly: !!process.env.CI`. `ci.yml` `check`: the dry run (if step 1 allows it), Playwright install and run, the `dist` upload after Playwright on `main` pushes, `WRANGLER_SEND_METRICS`, and the new concurrency rule; workflow `permissions` stay `contents: read`, satisfies **AC-6**, **AC-8**
4. [x] `.github/scripts/smoke.sh` per *Smoke check contract*, every expectation read from `dist/` per *Value sourcing*. Before merging, run `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` against `pnpm preview` to prove the byte and header checks, satisfies **AC-1**, **AC-3**, **AC-9**
5. [x] `ci.yml` `deploy`: `needs: check`, the `if`, `environment: production`, its concurrency group, checkout, pnpm, Node, frozen install, download `dist`, then the steps `deploy` (`pnpm exec wrangler deploy --message "$GITHUB_SHA"`), `pages`, `rollback`, and `redirects` exactly as AC-9 states, satisfies **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-10**
6. [x] README: the live URL and the `## Deploy` section, satisfies **AC-16**

**Your one time setup before the merge**

7. [ ] Cloudflare zone: apply every AC-11 setting. In DNS, confirm that no A, AAAA, or CNAME record sits at the apex (the custom domain cannot attach if one does; delete a registrar parking record). TXT and MX records there are fine. Add `www` AAAA `100::` proxied, then a Redirect Rule (the `Redirect from WWW to root` template): hostname equals `www.jorgergo.dev` → dynamic `concat("https://jorgergo.dev", http.request.uri.path)`, 301, preserve query string, satisfies **AC-2**, **AC-11**
8. [ ] Cloudflare token (AC-10 scope) → GitHub environment `production` limited to `main`, with the secret and the variable, satisfies **AC-10**
9. [ ] Bootstrap deploy from your Mac, on `feat/go-live` once steps 1 to 8 are done: `pnpm exec wrangler login`, then `pnpm build && pnpm exec wrangler deploy`. This attaches the custom domain, provisions its certificate, proves the apex is free, and leaves a version the first CI run can roll back to. Wait until `bash .github/scripts/smoke.sh pages` passes against the live site. Then prove the token: `pnpm exec wrangler logout`, read the token into `CLOUDFLARE_API_TOKEN` with `read -s` (so it stays out of your shell history), set `CLOUDFLARE_ACCOUNT_ID`, and run `pnpm exec wrangler deploy` again. It must succeed with the token alone. The "no manual steps" rule covers everyday changes; this is one time setup, satisfies **AC-1**, **AC-4**, **AC-10**

**Launch**

10. [ ] Merge the PR. Watch `deploy` pass its smoke checks, then open jorgergo.dev, www, and the old `workers.dev` address (it should no longer serve the site), satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-9**

**Grow (after launch)**

11. [ ] Mail records: SPF, DMARC, and the null MX, satisfies **AC-12**
12. [ ] GitHub ruleset on `main`, satisfies **AC-13**
13. [ ] Google Search Console by DNS TXT, request indexing of `/` and `/cv`, import into Bing, satisfies **AC-14**
14. [ ] The LinkedIn, X, and WhatsApp share checks, then tick them in spec 0006's `verify.md`, satisfies **AC-15**

## Consequences

**Positive**:
- Merging is publishing: no manual step, and nothing ships that failed a check.
- The bytes the page tests passed are the bytes visitors get, and the smoke check proves Cloudflare left them untouched.
- A bad deploy lasts about three minutes (the retry window) before it rolls itself back.
- Spec 0001's open question about Cloudflare's build image running Node 26 and pnpm 12 goes away: CI builds, Cloudflare only serves.
- The Playwright suite finally runs on every PR.

**Negative / tradeoffs**:
- `check` gets slower, about 1 to 2 minutes for the Chromium install and the page tests; `deploy` adds about a minute of its own.
- A long lived token sits in GitHub. Its narrow scope and the `main` only environment limit the damage; if it ever leaks, revoke it in Cloudflare and make a new one.
- The www redirect, zone settings, and mail records live in the dashboard, not the repo. This spec is their only record, so a change there should update it.
- The very first deploy is manual (build step 9), from your Mac, so the domain and certificate exist before CI ever deploys and a rollback always has a version to return to.
- A smoke failure caused by the zone (for example a setting switched back on) still triggers a rollback that cannot fix it. The job goes red either way, and the rollback is harmless.
- Without previews, a visual change is checked only on your machine before merge.
- Every push to `main`, docs included, runs the full gate and a deploy.

**Neutral**:
- `/sync` should update `AGENTS.md`: Playwright now runs in CI, deploying is live, and the CI line no longer defers to Go live.
- The Worker keeps no `main` script; a future server route (the contact form) would be its own spec.

## Follow-up

- [ ] Spec 0001: tick the Go live follow-up and drop the Cloudflare build image caveat (a small in place update, after launch).
- [ ] Spec 0006: tick its Go live follow-up and the AC-14 `verify.md` line once step 14 passes.
- [ ] Revisit PR previews (Workers Previews, wrangler 4.135 or later) if visual reviews ever need a shared URL.
- [ ] Revisit an address at the domain (Cloudflare Email Routing) if you want one on the CV.
