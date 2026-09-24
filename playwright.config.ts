import { defineConfig, devices } from '@playwright/test';

// Page tests for spec 0003. Two servers: the built site through wrangler, so
// the real headers, CSP, and 404 handling apply, and `astro dev` for
// /styleguide, the one page that renders every component (it never reaches
// dist/). The built site gets its own port and a fresh build on every run, so
// a `pnpm preview` left open on 8787 never serves a stale dist/. The servers
// run the local binaries directly: `pnpm exec` starts them in their own process
// group, which Playwright cannot stop, so the run would hang at teardown.
const BIN = './node_modules/.bin';
const SITE = 'http://localhost:8788';
const DEV = 'http://localhost:4321';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'] },
  projects: [
    { name: 'site', testMatch: 'site.spec.ts', use: { baseURL: SITE } },
    {
      name: 'dev server',
      testMatch: 'dev-server.setup.ts',
      use: { baseURL: DEV },
    },
    {
      name: 'styleguide',
      testMatch: 'styleguide.spec.ts',
      use: { baseURL: DEV },
      dependencies: ['dev server'],
    },
  ],
  webServer: [
    {
      command: `${BIN}/astro build && ${BIN}/wrangler dev --port 8788`,
      url: SITE,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      // Astro allows one dev server per project, so reuse the one you have
      // open; CI has none, so it starts one.
      command: `${BIN}/astro dev`,
      url: `${DEV}/styleguide`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
