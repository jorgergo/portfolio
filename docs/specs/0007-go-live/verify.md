# Verify: Go live · spec 0007 · updated 2026-09-25
_Steps derived from spec 0007 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

Most steps need the live site, so they run after the bootstrap deploy (build step 9) or after the merge (build step 10). The local steps run from the repo root on `feat/go-live`. A smoke run on your Mac needs a `dist/` built from the commit that is live. Break steps change a setting, check, then restore it.

During the build, `/develop` already ran the local steps once: the dry run with no Cloudflare values, the pages smoke check against `pnpm preview`, the full gate with `CI=1`, and each smoke failure case on a scratch copy of `dist/` (changed bytes, a missing or changed header, a changed cache value, no cache block, no canonical, a server that is down). Each failure named the check it broke and exited 1.

## Commands (local)
- [ ] In a shell with no `CLOUDFLARE_*` values and no wrangler login: `pnpm build && pnpm exec wrangler deploy --dry-run` → exits 0 with `--dry-run: exiting now.` → AC-6
- [ ] `pnpm preview`, then `SMOKE_ORIGIN=http://localhost:8787 bash .github/scripts/smoke.sh pages` → `attempt 1/10: every check passed`, exit 0 → AC-1, AC-3, AC-9
- [ ] `pnpm exec playwright test --project site -g "response headers"` → three passing tests: `/` and `/cv` carry every `/*` header and no `immutable`; the stylesheet carries every `/*` header and the `/_astro/*` cache line → AC-3
- [ ] Add `test.only` to any page test, run `CI=1 pnpm exec playwright test` → the run fails on the `.only`; remove it → AC-6 (`forbidOnly`)
- [ ] Read `wrangler.jsonc` → `routes` holds `jorgergo.dev` with `custom_domain: true`, equal to the host of `site` in `astro.config.mjs`; `workers_dev` and `preview_urls` are `false` → AC-1, AC-4
- [ ] Read `.github/workflows/ci.yml` → `check` runs install, lint, format check, build, the dry run, unit tests, the Chromium install, the page tests, then the `dist` upload only on a push to `main`; `deploy` has `needs: check`, the push to `main` `if`, `environment: production`, the `production` concurrency group with no cancelling, and the steps `deploy`, `pages`, `rollback`, `redirects`; only `deploy` and `rollback` receive the two Cloudflare values; the workflow concurrency cancels only for pull requests → AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- [ ] Read `README.md` → the live URL under the opening line, and a `## Deploy` section with the automatic deploy, the automatic rollback, the manual rollback, and a link to spec 0007 → AC-16

## Live (after the bootstrap deploy, then again after the merge)
- [ ] `curl -sS -o /dev/null -w '%{http_code}\n' https://jorgergo.dev/` and `/cv` → `200`; `/missing` → `404` → AC-1
- [ ] Build the commit that is live, then `bash .github/scripts/smoke.sh pages` → every check passed (bytes of `/`, `/cv`, `/missing` equal `dist/`, every `/*` header, the stylesheet cache, `/og/cv.png` as `image/png`) → AC-1, AC-3, AC-9
- [ ] `bash .github/scripts/smoke.sh redirects` → every check passed: `https://www.jorgergo.dev/cv?ref=smoke` and `http://jorgergo.dev/cv?ref=smoke` answer 301 to `https://jorgergo.dev/cv?ref=smoke` → AC-2
- [ ] `curl -sSI https://www.jorgergo.dev/` → 301 to `https://jorgergo.dev/` (the empty path case) → AC-2
- [ ] Open `portfolio.<your subdomain>.workers.dev` → it no longer serves the site → AC-4
- [ ] In the Cloudflare dashboard, walk the AC-11 list for the `jorgergo.dev` zone → every setting as listed, DNSSEC on, auto renew on → AC-11
- [ ] `curl -sS https://jorgergo.dev/robots.txt | grep -v -e '^#' -e '^[[:space:]]*$'` → prints nothing (the Content Signals Policy comments only, no rules) → AC-11
- [ ] Open the token in Cloudflare → made from `Edit Cloudflare Workers`, one account, zone `jorgergo.dev`, no expiry; in GitHub, environment `production` limits deployments to `main` and holds the secret `CLOUDFLARE_API_TOKEN` and the variable `CLOUDFLARE_ACCOUNT_ID`; `git grep -i cloudflare_api_token` shows only the workflow's `secrets.` reference → AC-10

## Pipeline (after the merge)
- [ ] Merge a PR → `check` green, then `deploy` green with `pages` and `redirects` passed and `rollback` skipped; the Worker's newest version message is the merge commit SHA → AC-5, AC-7, AC-9
- [ ] Open a PR → only `check` runs; `deploy` shows as skipped; no `dist` artifact is uploaded → AC-5, AC-6
- [ ] Open a PR whose page test fails → `check` red, no deploy, the live site unchanged (the smoke check against the old build still passes) → AC-5
- [ ] Push to the same PR twice quickly → the older run is cancelled. Push to `main` twice quickly → the second run waits for the first deploy; a third push cancels the waiting second → AC-8
- [ ] Break step: switch Email Address Obfuscation on, rerun the last `deploy` → `pages` fails after its 10 attempts (the bytes differ), `rollback` runs, the job is red; switch it off again and rerun → green → AC-9, AC-11
- [ ] Break step: disable the www Redirect Rule, rerun `deploy` → `pages` passes, `redirects` fails red, `rollback` stays skipped, the new version stays live; enable the rule and rerun → green → AC-2, AC-9

## Grow (after launch)
- [ ] `dig +short TXT jorgergo.dev` shows `v=spf1 -all`; `dig +short TXT _dmarc.jorgergo.dev` shows the DMARC record; `dig +short MX jorgergo.dev` shows `0 .` if Cloudflare accepted it; `cv.json` still lists `jorgergo@icloud.com` → AC-12
- [ ] GitHub ruleset on `main`: `check` required, force pushes and deletion blocked, you on the bypass list → AC-13
- [ ] Search Console shows the `jorgergo.dev` domain property verified by DNS TXT, with indexing requested for `/` and `/cv`; Bing Webmaster Tools lists the imported site → AC-14
- [ ] Paste `https://jorgergo.dev/cv` into LinkedIn's Post Inspector, a new X post, and a WhatsApp chat → the CV card and CV title; the home URL → the home card → AC-15

## Value sourcing (vary the input, check the output)
- [ ] Break step: in a scratch copy of `dist/`, change the canonical in `index.html` to another host and run the smoke check with no `SMOKE_ORIGIN` → it tests that host, so the origin comes from the canonical; remove the canonical → exit 1 at once with no retries → (smoke origin)
- [ ] Break step: add an indented `X-Test: 1` line under `/*` in a scratch `dist/_headers` → the smoke check and the page test both demand it and fail → (expected headers)
- [ ] Break step: in a scratch copy, remove the `/_astro/*` block → the smoke check exits 1 at once → (expected cache header)
- [ ] Break step: append a byte to scratch `dist/cv.html` → `/cv body expected the bytes of dist/cv.html got different bytes` → (expected page bytes)
- [ ] After a CI deploy, read the Worker's Deployments tab → the version message is the commit SHA; the `pages` step log opens with the origin it tested → (version message, origin)
- [ ] After a rollback, the Deployments tab shows the previous version live with the message `smoke check failed for <sha>` → (rollback target)
- [ ] Read the `deploy` job log → the files came from the `dist` artifact download, with no build step in the job → (deploy files)

## Acceptance-criteria coverage
- AC-1 local read, live curl, live smoke `pages` · AC-2 live smoke `redirects`, www curl, Redirect Rule break step · AC-3 page test, local and live smoke · AC-4 config read, workers.dev check · AC-5 pipeline merge, PR, failing PR · AC-6 dry run, `forbidOnly`, workflow read · AC-7 merge SHA, deploy log · AC-8 quick pushes · AC-9 smoke runs, obfuscation break step · AC-10 token and environment check · AC-11 dashboard walk, obfuscation break step · AC-12 dig · AC-13 ruleset · AC-14 Search Console · AC-15 share checks · AC-16 README read
