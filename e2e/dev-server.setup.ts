import { expect, test as setup } from '@playwright/test';

// The site project's build rewrites .astro/, and the dev server answers with a
// full page reload or two. Wait until /styleguide has been quiet for two
// seconds, so no style guide test loses its page in the middle of a check.
setup('the dev server has settled after the build', async ({ page }) => {
  const navigations: number[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(Date.now());
  });

  await page.goto('/styleguide');

  await expect
    .poll(() => Date.now() - (navigations.at(-1) ?? 0), {
      timeout: 20_000,
      intervals: [250],
    })
    .toBeGreaterThan(2_000);
});
