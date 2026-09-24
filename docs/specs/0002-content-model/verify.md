# Verify: Content model · spec 0002 · updated 2026-09-24
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Break steps: change `src/content/cv.json` once, run the command, check the error, then restore the file (`git checkout src/content/cv.json`). Run `pnpm build` with a clean content cache (`pnpm exec astro build --force`, or delete `.astro/`) when a step needs the build to fail on a syntax error.

## UI / manual
- [ ] Open `src/content/cv.json` in VS Code after `pnpm exec astro sync` → autocomplete offers the `main` keys; a typo such as `higlights` or a 161 character `bio` shows an inline error → AC-2
- [ ] `pnpm dev`, visit `/` and `/cv` → each shows the heading `Jorge González Ozorno` → AC-15
- [ ] Read `cv.json` → English Harvard style bullets, no phone number, no street address, role locations as approved → AC-13

## Commands
- [ ] `pnpm build` on the committed `cv.json` → passes with no Shiki or CSP inline style warning → AC-13, AC-14
- [ ] `grep syntaxHighlight astro.config.mjs` → `markdown: { syntaxHighlight: false }` → AC-14
- [ ] Delete `basics.email` → build fails at `basics.email`; set `work` to `[]` → fails at `work` → AC-3
- [ ] Drop every optional section (`volunteer`, `awards`, `certificates`, `skills`, `technologies`, `languages`, `interests`, `profiles`) → build passes → AC-3
- [ ] Rename `highlights` to `higlights` in one role → `Unrecognized key: "higlights"`; add `"$schema"` inside `main` → `Unrecognized key: "$schema"` → AC-4
- [ ] Set a `startDate` to `2023-13`, then `2023-1` → fails with `expected a month as YYYY-MM` → AC-5
- [ ] Set a profile `url` to `http://github.com/jorgergo` → `Invalid URL` → AC-5
- [ ] Set `countryCode` to `XX`, `ZZ`, `mx`, `MXX` → each fails at `basics.location.countryCode`, none crashes the build with a RangeError → AC-5
- [ ] Set a `network` to `X`, a `fluency` to `Expert`, a `level` to `D1`, a `technologies` group's `keywords` to `[]` → each fails at its path → AC-5
- [ ] Set a role's `startDate` to `2023-05` and `endDate` to `2022-01` → `work.N.endDate: endDate is before startDate` → AC-6
- [ ] A 161 character `bio` fails and 160 passes; a sixth highlight fails and 5 pass; a 501 character `summary` fails; a 221 character highlight fails; a ninth course fails → AC-7
- [ ] `grep -n "CV_LIMITS" src/lib/cv-schema.ts` → every cap reads from the one constant (160, 500, 220, 220, 5, 8) → AC-7
- [ ] Add a second `GitHub` profile → `basics.profiles.1.network: duplicate network` → AC-8
- [ ] Add a trailing comma to `cv.json` and build with a clean cache → the file loader error, then `src/content/cv.json is missing or unparsable` → AC-1
- [ ] Add an image to `src/assets/`, set `basics.image` to `"../assets/<file>"` → build passes and `basics.image` types as `ImageMetadata`; remove it → build passes with `image` undefined → AC-12
- [ ] `formatDateRange('2023-01')` → `Jan 2023 – Present`; `('2021-01', '2023-03')` → `Jan 2021 – Mar 2023`; `('2023-03', '2023-03')` → `Mar 2023`; `formatMonth('2023-03')` → `Mar 2023` → AC-9
- [ ] Run the formatters under `TZ=Asia/Tokyo LANG=ja_JP.UTF-8` → identical output (month table, `Present`, en dash are fixed constants) → AC-9
- [ ] `sortNewestFirst`: a current role started 2020 sorts above a closed role started 2023; equal starts sort by later end first; full ties keep file order; the input array is unchanged. `sortByDateDesc` orders by `date`, newest first, same tie rule → AC-10
- [ ] `formatLocation({ city: 'Monterrey', countryCode: 'MX' })` → `Monterrey, Mexico`; also `Toluca, MX` → `Toluca, Mexico` (country name from `regionName`, falls back to the code) → AC-11
- [ ] `pnpm build`, `pnpm lint`, `pnpm format:check` → all clean → AC-15

## Acceptance-criteria coverage
- AC-1: trailing comma step, placeholder pages · AC-2: VS Code step · AC-3: missing email, empty work, optional sections · AC-4: typo and `$schema` steps · AC-5: month, url, country, enum, keyword steps · AC-6: swapped dates · AC-7: caps and `CV_LIMITS` · AC-8: duplicate profile · AC-9: formatter and time zone steps · AC-10: sort step · AC-11: location step · AC-12: avatar step · AC-13: committed content and manual read · AC-14: config grep and clean build · AC-15: placeholder pages and final checks

## Known gap (not an AC failure)
- With a warm `.astro/` cache, a JSON syntax error in `cv.json` does not fail `pnpm build` locally: Astro logs the loader error and serves the last good content. A clean build (CI, `--force`) fails as designed. Raise with `/architect content model` if it should fail locally too.
