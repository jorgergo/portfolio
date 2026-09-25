# 0007. Rationale: go live on jorgergo.dev

Back to the build spec: [index.md](index.md).

## Context

Every Release 1 page is built and verified, but it only runs on your machine. The scope's Go live row asks for the site at your domain over HTTPS, with every change deploying without manual steps. You already own `jorgergo.dev` on Cloudflare Registrar, and `site` already points at it (spec 0006).

Specs 0001 and 0006 left Go live these jobs:
- choose the deploy pipeline (Workers Builds git integration or an external CI)
- attach the domain to the Worker and confirm `site`
- turn off the zone features that inject scripts, which the hashed CSP blocks (Email Address Obfuscation breaks the `mailto:` link)
- decide the AI crawler setting
- run the live share checks (0006 AC-14)

Spec 0001 also flagged an unverified risk: whether Cloudflare's build image runs Node 26 and pnpm 12.

The forces:
- The project runs at GA rigor, and CI already runs lint, format, the `astro check` build gate, and Vitest. The Playwright page tests (headers, CSP, axe, keyboard, print) exist but do not run in CI.
- The site is static and holds no data, so a rollback loses nothing, and a failed deploy can simply leave the last good version live.
- You work alone, and the repo is public, so any credential must stay out of reach of pull requests.
- A recruiter is the audience. A broken or rewritten page (a zone feature injecting a blocked script) costs more than a slower pipeline does.

## Options considered

### Option 1: GitHub Actions deploy job gated on CI

A `deploy` job with `needs: check` downloads the `dist/` that `check` built and page tested, and runs `wrangler deploy`, with a scoped token in a GitHub environment.

**Pros**: nothing deploys unless every check passed on that commit; the tested bytes are the shipped bytes; Node and pnpm come from `.nvmrc` and `packageManager`, exactly as in CI; one pipeline to read.
**Cons**: a long lived Cloudflare token lives in GitHub; more YAML to own; deploy logs live in GitHub, not the Cloudflare dashboard.

### Option 2: Cloudflare Workers Builds

Connect the repo in the dashboard; Cloudflare builds and deploys on every push to `main`.

**Pros**: no token in GitHub; build and deploy logs sit beside the Worker; almost no config.
**Cons**: it builds on its own, in parallel with CI, so a commit that fails lint or tests can still go live; the Node 26 and pnpm 12 support of its build image is the open question from spec 0001; the page tests would not gate it.

### Option 3: Workers Builds running the whole gate

As Option 2, with the build command set to lint, format check, build, and tests.

**Pros**: the gate runs before the deploy with no token in GitHub.
**Cons**: the gate is defined twice (in `ci.yml` and in the dashboard) and drifts; the Playwright tests need Chromium and a running wrangler in Cloudflare's image, which is unproven; the image question from spec 0001 still stands.

### Option 4: Manual `wrangler deploy`

You run `pnpm build && pnpm exec wrangler deploy` from your Mac.

**Pros**: no pipeline and no stored token.
**Cons**: it breaks the scope's "no manual steps" rule; a deploy can skip the checks or ship a dirty working tree.

## Rationale

Option 1 is the only one where the deploy is downstream of every check, which is what GA rigor and a recruiter audience call for. It also removes the build image risk spec 0001 flagged instead of testing it, because Cloudflare never builds. Its cost, a token in GitHub, is contained by the `production` environment (only `main` can use it), a scope of one account and one zone, and passing it only to two steps. Option 2 is the runner up. It suits a project whose CI is thin or advisory; here it would let a red commit ship.

**Smaller choices** (your picks unless marked settled):
- **Bare domain canonical, www redirects.** `site`, the canonical links, and the card footers already use the bare host; a 301 keeps typed or old www links working. Runner up: no www at all.
- **Redirect Rule for www.** Free, runs at the edge, and keeps the Worker assets only (spec 0001's "no `main`"). Runner up: a Worker script that redirects by host, which puts code on every request.
- **No PR previews, workers.dev off.** You work alone and `pnpm preview` already serves the real headers and CSP; one public host means no duplicate copy for search engines. Runner up: Workers Previews per PR.
- **Page tests in the gate, deploying the tested `dist/`.** The page tests are the only check on headers, CSP, and axe; uploading after Playwright means the uploaded `dist/` is the one it rebuilt and tested.
- **`pnpm exec wrangler`.** The lockfile's wrangler, and no third party action holding the token. Runner up: `cloudflare/wrangler-action`.
- **Smoke check with automatic rollback.** A static site has no data a rollback could strand. Byte comparison (settled) is stricter than a status check: it catches any zone feature that rewrites HTML, which is the exact CSP risk spec 0001 raised. Splitting the redirect checks out (settled) avoids a rollback that cannot fix a zone rule.
- **Every expectation read from `dist/` (settled).** The origin comes from the canonical link, the headers from `_headers`, and the bytes from the files, so a content or header change never needs a smoke script edit (the same rule as spec 0005 AC-16 and spec 0006 AC-18).
- **Year long cache on `/_astro/*`.** Those names carry a content hash, so they never go stale; HTML keeps revalidating so a deploy shows at once. Runner up: Cloudflare's default ETag revalidation.
- **All AI crawlers allowed.** A portfolio exists to be found, including through assistants, and the content is public in the repo anyway. Runner up: the managed `robots.txt` that refuses training. `/check verify` (2026-09-25) found the zone serving `/robots.txt` anyway: Cloudflare's Content Signals Policy, which free plan zones get when the site has no `robots.txt` of its own. You kept it: the text is comments only, with no signals and no rules, so it allows every crawler just as a 404 would. Turning it off (Security Settings) would make `/robots.txt` a 404 again.
- **No mail, anti spoof records.** Nothing to run, and it stops phishing from `@jorgergo.dev`. Runner up: Email Routing to iCloud.
- **Search Console and Bing by DNS.** No page change, faster indexing of your name, and a view of how you appear. Runner up: skip it.
- **Ruleset requiring `check`.** With deploys on every push to `main`, a red merge would leave `main` undeployable until fixed. Runner up: no rule.
- **Zone settings (settled).** Everything that rewrites HTML or injects scripts goes off (Email Address Obfuscation, Rocket Loader, Automatic HTTPS Rewrites, Web Analytics automatic setup, Zaraz), because the hashed CSP blocks it, and the byte check fails on it. Bot Fight Mode stays off because its challenges can block the LinkedIn, X, and WhatsApp preview fetchers (0006 AC-14). Minimum TLS 1.2 drops only clients too old for this site's CSS. The zone HSTS setting stays off so the header is not sent twice.
- **No token expiry (settled).** A token that silently expires breaks deploys a year later with a confusing error; scope and the environment limit a leak instead. Runner up: a one year expiry with a reminder.
- **A manual bootstrap deploy (added after the cross check).** The custom domain and its certificate are created on the first deploy, which can outlast the smoke retry window, and a rollback then has no earlier version. One deploy from your Mac before the merge settles both, and it proves the apex is free. It also means the CI token only has to deploy to a domain that already exists, which sidesteps the doubt about whether the `Edit Cloudflare Workers` template can attach a new custom domain. Runner up: let CI attach the domain, with a longer first retry window.
- **Main runs queue, PR runs cancel (settled).** Cancelling a run on `main` could cut a deploy off halfway; on a PR only the newest commit matters.

## Interview record

Your answers, in order: the domain is already bought on Cloudflare; the bare domain is canonical and www redirects; deploy through GitHub Actions after CI; no PR previews; the page tests join the gate; deploy the tested `dist/`; `pnpm exec wrangler deploy`; a curl smoke check; workers.dev off; the www redirect as a Redirect Rule; all AI crawlers allowed; a year long cache on `/_astro/*`; the custom domain in `wrangler.jsonc`; a narrow token in a `production` environment; no email, with anti spoof records; Google and Bing by DNS; automatic rollback on a failed smoke check; a ruleset requiring `check`; no References section.

## Cross check (2026-09-25)

A read only review on Fable 5.1 found no design problem and 14 gaps the build would have had to guess at. All were applied on your pick:
- the smoke script's exact contract: the curl flags, the `_headers` grammar, the header match rule, and the retry behavior
- `wrangler rollback --yes` (the prompt defaults to no; checked in wrangler 4.137)
- the step ids
- the artifact action versions and paths
- the 404 byte check against `dist/404.html`
- the http redirect keeping the query
- "no `immutable` on HTML" in place of "no cache header"
- only A, AAAA, and CNAME records blocking the apex
- Browser Integrity Check, Cloudflare Fonts, and Automatic Signed Exchanges added to the zone settings
- the note that a third push cancels a waiting run
- the dry run staying out of CI if it needs an account
- the bootstrap deploy and the local token test
