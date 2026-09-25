import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  axeViolations,
  basics,
  distFile,
  distFiles,
  rgb,
  scrollsSideways,
  tabOrder,
} from './helpers';

// Spec 0003 on the built site (dist/ through wrangler): the shell every page
// shares, fonts and CSP, keyboard, print, and the 320px floor. The home page
// block at the end covers spec 0004.

type PageCase = {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly stops: readonly string[];
};

const PAGES: readonly PageCase[] = [
  {
    path: '/',
    title: basics.name,
    description: basics.bio,
    h1: basics.name,
    // Spec 0004 AC-7: the menu rows, then the social rows, and nothing after.
    stops: [
      'a "Skip to content"',
      'a "01 cv"',
      'a "github @jorgergo"',
      'a "linkedin in/jorgergo"',
      'a "email jorgergo@icloud.com"',
    ],
  },
  {
    path: '/cv',
    title: 'CV',
    description: basics.bio,
    h1: basics.name,
    stops: ['a "Skip to content"', 'a "← home"'],
  },
  {
    path: '/missing',
    title: 'Not found',
    description: 'This page does not exist.',
    h1: 'Not found',
    stops: ['a "Skip to content"', 'a "Back to the home page"', 'a "← home"'],
  },
];

const SCHEMES = ['light', 'dark'] as const;

// The src of the Plex Mono 400 @font-face the Font component emits.
const monoRegularUrl = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => {
    const faces = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule) => rule instanceof CSSFontFaceRule);
    const face = faces.find(
      ({ style }) =>
        /^"?IBM Plex Mono-[^"]*"?$/.test(
          style.getPropertyValue('font-family'),
        ) && style.getPropertyValue('font-weight') === '400',
    );
    return face?.style
      .getPropertyValue('src')
      .match(/url\("?([^")]+)"?\)/)?.[1];
  });

// Every @page margin, found through @layer and @media blocks.
const pageMargins = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() => {
    const walk = (rules: CSSRuleList): string[] =>
      [...rules].flatMap((rule) => {
        if (rule instanceof CSSPageRule)
          return [rule.style.getPropertyValue('margin')];
        return rule instanceof CSSGroupingRule ? walk(rule.cssRules) : [];
      });
    return [...document.styleSheets].flatMap((sheet) => walk(sheet.cssRules));
  });

for (const { path, title, description, h1, stops } of PAGES) {
  test.describe(`${path}`, () => {
    // covers: AC-6
    test('renders the BaseLayout head from its props', async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        description,
      );
      await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
        'content',
        'light dark',
      );
    });

    // covers: AC-1, AC-6, AC-12
    test('computes one theme-color meta per scheme from the bg token', async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
      await expect(
        page.locator(
          'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
        ),
      ).toHaveAttribute('content', '#f2ede3');
      await expect(
        page.locator(
          'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
        ),
      ).toHaveAttribute('content', '#1b1916');
    });

    // covers: AC-15
    test(`shows "${h1}" in the one h1`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    });

    for (const scheme of SCHEMES) {
      // covers: AC-1, AC-6
      test(`paints the ${scheme} bg and fg tokens under a ${scheme} system setting`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);

        const html = page.locator('html');
        await expect(html).toHaveCSS('background-color', rgb(scheme, 'bg'));
        await expect(html).toHaveCSS('color', rgb(scheme, 'fg'));
      });

      // covers: AC-2 (rendered contrast), AC-9
      test(`passes axe WCAG 2.2 AA in ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);

        expect(await axeViolations(page)).toEqual([]);
      });
    }

    // covers: AC-6
    test('footer shows the CV city, country code, and the UTC year', async ({
      page,
    }) => {
      await page.goto(path);

      const { city, countryCode } = basics.location;
      const year = new Date().getUTCFullYear();
      await expect(page.getByRole('contentinfo')).toContainText(
        `${city}, ${countryCode} · ${year}`,
      );
    });

    // covers: AC-6, AC-8
    test('the skip link is the first Tab stop, shown on focus, and moves focus into main', async ({
      page,
    }) => {
      await page.goto(path);
      const skip = page.getByRole('link', { name: 'Skip to content' });
      const main = page.locator('main#main');
      expect((await skip.boundingBox())?.width).toBeLessThanOrEqual(1);

      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      expect((await skip.boundingBox())?.width).toBeGreaterThan(20);

      await page.keyboard.press('Enter');
      await expect(main).toBeFocused();
      await expect(main).toHaveCSS('outline-style', 'none');
    });

    // covers: AC-6, AC-8
    test('Tab follows the visual order: skip link, main, footer', async ({
      page,
    }) => {
      await page.goto(path);

      const order = await tabOrder(page);

      expect(order.map(({ label }) => label)).toEqual(stops);
    });

    // covers: AC-7
    test('no link opens a new tab', async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('a[target]')).toHaveCount(0);
    });

    // covers: AC-3
    test('requests nothing from another origin and logs no CSP violation', async ({
      page,
      baseURL,
    }) => {
      const origins = new Set<string>();
      const cspErrors: string[] = [];
      page.on('request', (request) =>
        origins.add(new URL(request.url()).origin),
      );
      page.on('console', (message) => {
        if (/content security policy/i.test(message.text()))
          cspErrors.push(message.text());
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      expect([...origins]).toEqual([new URL(baseURL ?? '').origin]);
      expect(cspErrors).toEqual([]);
    });

    // covers: AC-3
    test('preloads only the Plex Mono 400 file and renders body text with it', async ({
      page,
    }) => {
      await page.goto(path);
      const mono400 = await monoRegularUrl(page);

      const preloads = page.locator('link[rel="preload"]');
      await expect(preloads).toHaveCount(1);
      await expect(preloads).toHaveAttribute('href', mono400 ?? 'missing');
      await expect(preloads).toHaveAttribute('as', 'font');
      const monoLoaded = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].some(
          ({ family, status, weight }) =>
            /^IBM Plex Mono-\w+$/.test(family.replaceAll('"', '')) &&
            weight === '400' &&
            status === 'loaded',
        );
      });
      expect(monoLoaded).toBe(true);
    });

    // covers: AC-3
    test('the CSP allows the font style by hash', async ({ page }) => {
      await page.goto(path);

      await expect(
        page.locator('meta[http-equiv="content-security-policy"]'),
      ).toHaveAttribute('content', /style-src [^;]*'sha256-/);
    });

    // covers: AC-5, AC-12
    test('nothing scrolls sideways at 320px and the footer stays readable', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);

      expect(await scrollsSideways(page)).toBe(false);
      const footer = await page.getByRole('contentinfo').boundingBox();
      expect(
        (footer?.x ?? 0) + (footer?.width ?? Infinity),
      ).toBeLessThanOrEqual(320);
    });
  });
}

test.describe('footer home link', () => {
  // covers: AC-6
  test('is absent on the home page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('contentinfo').getByRole('link')).toHaveCount(
      0,
    );
  });

  // covers: AC-6, AC-7
  test('takes you home from /cv without an underline', async ({ page }) => {
    await page.goto('/cv');
    const home = page.getByRole('contentinfo').getByRole('link', {
      name: 'home',
      exact: true,
    });
    await expect(home).toHaveCSS('text-decoration-line', 'none');

    await home.click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      basics.name,
    );
  });

  // covers: AC-8
  test('shows the 2px accent ring offset 3px on keyboard focus', async ({
    page,
  }) => {
    await page.goto('/cv');
    const home = page.getByRole('contentinfo').getByRole('link');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(home).toBeFocused();
    await expect(home).toHaveCSS('outline-style', 'solid');
    await expect(home).toHaveCSS('outline-width', '2px');
    await expect(home).toHaveCSS('outline-offset', '3px');
    await expect(home).toHaveCSS('outline-color', rgb('light', 'accent'));
  });
});

test.describe('404 page', () => {
  // covers: AC-15
  test('answers an unknown path with status 404 and a TextLink home', async ({
    page,
  }) => {
    const response = await page.goto('/missing');
    expect(response?.status()).toBe(404);

    await page.getByRole('link', { name: 'Back to the home page' }).click();

    await expect(page).toHaveURL('/');
  });

  // covers: AC-7
  test('its TextLink is underlined in fg at rest', async ({ page }) => {
    await page.goto('/missing');
    const link = page.getByRole('link', { name: 'Back to the home page' });

    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await expect(link).toHaveCSS('text-decoration-thickness', '1px');
    await expect(link).toHaveCSS('color', rgb('light', 'fg'));
  });
});

test.describe('type and layout', () => {
  // covers: AC-4
  test('body text is Plex Mono at 16px with line height 1.6', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveCSS(
      'font-family',
      /^"IBM Plex Mono-/,
    );
    await expect(page.locator('body')).toHaveCSS('font-size', '16px');
    await expect(page.locator('body')).toHaveCSS('line-height', '25.6px');
  });

  // covers: AC-4
  test('the home h1 is text-title at weight 500', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });

    await expect(h1).toHaveCSS('font-size', '22px');
    await expect(h1).toHaveCSS('line-height', '28.6px');
    await expect(h1).toHaveCSS('font-weight', '500');
  });

  for (const path of ['/cv', '/missing']) {
    // covers: AC-4
    test(`the ${path} h1 is text-lg at weight 500`, async ({ page }) => {
      await page.goto(path);
      const h1 = page.getByRole('heading', { level: 1 });

      await expect(h1).toHaveCSS('font-size', '18px');
      await expect(h1).toHaveCSS('font-weight', '500');
    });
  }

  // covers: AC-4
  test('the CV label is meta text: text-sm in muted', async ({ page }) => {
    await page.goto('/cv');
    const label = page.getByText(basics.label, { exact: true });

    await expect(label).toHaveCSS('font-size', '14px');
    await expect(label).toHaveCSS('color', rgb('light', 'muted'));
  });

  // covers: AC-5
  test('the column is 40rem wide, centred, with the page padding and gaps', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cv');
    const column = page.locator('main').locator('..');

    await expect(column).toHaveCSS('max-width', '640px');
    await expect(column).toHaveCSS('padding', '40px 24px 80px');
    await expect(column).toHaveCSS('row-gap', '56px');
    expect(await column.boundingBox()).toMatchObject({ x: 320, width: 640 });
  });

  // covers: AC-5
  test('long strings wrap anywhere instead of overflowing', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('body')).toHaveCSS('overflow-wrap', 'anywhere');
  });
});

test.describe('print', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    await page.goto('/missing');
  });

  // covers: AC-11
  test('prints the paper tokens in light even under a dark system setting', async ({
    page,
  }) => {
    const html = page.locator('html');

    await expect(html).toHaveCSS('color-scheme', 'light');
    await expect(html).toHaveCSS('background-color', rgb('print', 'bg'));
    await expect(html).toHaveCSS('color', rgb('print', 'fg'));
  });

  // covers: AC-11
  test('sets the root size to 11pt and an 18mm page margin', async ({
    page,
  }) => {
    await expect(page.locator('html')).toHaveCSS('font-size', '14.6667px');
    expect(await pageMargins(page)).toEqual(['18mm']);
  });

  // covers: AC-11
  test('hides the skip link and the footer home link', async ({ page }) => {
    await expect(page.locator('a[href="#main"]')).toHaveCSS('display', 'none');
    await expect(
      page.getByRole('contentinfo').locator('a[href="/"]'),
    ).toBeHidden();
    await expect(page.getByRole('contentinfo')).toContainText(
      basics.location.city,
    );
  });

  // covers: AC-11
  test('prints links as plain text in the ink colour', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Back to the home page' });

    await expect(link).toHaveCSS('text-decoration-line', 'none');
    await expect(link).toHaveCSS('color', rgb('print', 'fg'));
  });

  // covers: AC-11
  test('drops the column minimum height and padding', async ({ page }) => {
    await expect(page.locator('body')).toHaveCSS('min-height', '0px');
    await expect(page.locator('main').locator('..')).toHaveCSS(
      'padding',
      '0px',
    );
  });
});

test.describe('build output', () => {
  // covers: AC-3
  test('ships exactly four self hosted woff2 files', () => {
    const fonts = distFiles().filter((file) => file.endsWith('.woff2'));

    expect(fonts).toHaveLength(4);
  });

  // covers: AC-13
  test('leaves the style guide out of the build', async ({ page }) => {
    const response = await page.goto('/styleguide');

    expect(response?.status()).toBe(404);
    expect(distFiles().filter((file) => /styleguide/i.test(file))).toEqual([]);
  });
});

// Spec 0004: the home page as a numbered menu and keyed social rows.
test.describe('home page', () => {
  const pagesNav = (page: Page): Locator =>
    page.getByRole('navigation', { name: 'Pages' });
  const elsewhereNav = (page: Page): Locator =>
    page.getByRole('navigation', { name: 'Elsewhere' });
  // A row's two spans: the prefix, then the label (with the arrow inside).
  const spans = (row: Locator): Locator => row.locator(':scope > span');

  // covers: AC-1, AC-6
  test('main holds the header, the Pages nav, and the Elsewhere nav, 56px apart', async ({
    page,
  }) => {
    await page.goto('/');
    const main = page.locator('main#main');
    const blocks = main.locator(':scope > *');
    const header = main.locator(':scope > header');

    await expect(blocks).toHaveCount(3);
    await expect(blocks.nth(0)).toHaveJSProperty('tagName', 'HEADER');
    await expect(blocks.nth(1)).toHaveAttribute('aria-label', 'Pages');
    await expect(blocks.nth(2)).toHaveAttribute('aria-label', 'Elsewhere');
    await expect(main).toHaveCSS('row-gap', '56px');
    await expect(header.locator(':scope > *')).toHaveCount(2);
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(
      basics.name,
    );
    await expect(header.locator('p')).toHaveText(basics.bio);
    await expect(header.locator('p')).toHaveCSS('color', rgb('light', 'fg'));
    await expect(header).toHaveCSS('row-gap', '8px');
    await expect(page.locator('main img, main video')).toHaveCount(0);
  });

  // covers: AC-2
  test('the Pages nav is an ordered list of the site pages, numbered from 01', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = pagesNav(page);
    const cv = nav.getByRole('link', { name: 'cv', exact: true });

    await expect(nav.locator('ol')).toHaveCount(1);
    await expect(nav.getByRole('listitem')).toHaveText(['01 cv']);
    await expect(cv).toHaveAttribute('href', '/cv');
    await expect(spans(cv).first()).toHaveText('01');
    await expect(spans(cv).first()).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('body [role]')).toHaveCount(0);
  });

  // covers: AC-3, AC-4
  test('the Elsewhere nav lists each profile, then the email, as keyed rows', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = elsewhereNav(page);
    const links = nav.getByRole('link');
    const hrefs = [
      ...basics.profiles.map(({ url }) => url),
      `mailto:${basics.email}`,
    ];

    await expect(nav.locator('ul')).toHaveCount(1);
    await expect(links).toHaveText([
      'github @jorgergo',
      'linkedin in/jorgergo',
      `email ${basics.email}`,
    ]);
    for (const [index, href] of hrefs.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', href);
    }
    // A key stays in the accessible name; only an https row ends with the arrow.
    await expect(nav.locator('[aria-hidden]')).toHaveCount(2);
    await expect(nav.locator('span[aria-hidden]')).toHaveCount(0);
    await expect(links.nth(0).locator('svg')).toHaveCount(1);
    await expect(links.nth(1).locator('svg')).toHaveCount(1);
    await expect(links.nth(2).locator('svg')).toHaveCount(0);
  });

  // covers: AC-5
  test('ships no script and loads only the page, the stylesheet, and two Plex Mono files', async ({
    page,
  }) => {
    expect(distFile('index.html')).not.toMatch(/<script/i);
    const paths: string[] = [];
    page.on('request', (request) =>
      paths.push(new URL(request.url()).pathname),
    );

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    expect(paths.filter((path) => path.endsWith('.js'))).toEqual([]);
    expect(paths.filter((path) => path.endsWith('.css'))).toHaveLength(1);
    expect(paths.filter((path) => path.endsWith('.woff2'))).toHaveLength(2);
    // Headless Chromium skips the favicon, so it is allowed, not required.
    expect(paths.filter((path) => !/\.(css|woff2|svg)$/.test(path))).toEqual([
      '/',
    ]);
  });

  // covers: AC-6
  test('at 320px the email address moves whole under its key, and back beside it at 330px', async ({
    page,
  }) => {
    const row = elsewhereNav(page).getByRole('link', {
      name: `email ${basics.email}`,
      exact: true,
    });
    const boxes = async () => ({
      key: await spans(row).nth(0).boundingBox(),
      value: await spans(row).nth(1).boundingBox(),
    });

    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    const narrow = await boxes();
    expect(narrow.value?.x).toBe(narrow.key?.x);
    expect(narrow.value?.y ?? 0).toBeGreaterThanOrEqual(
      (narrow.key?.y ?? 0) + (narrow.key?.height ?? 0),
    );
    expect(narrow.value?.height ?? Infinity).toBeLessThan(40);
    expect(
      (narrow.value?.x ?? 0) + (narrow.value?.width ?? Infinity),
    ).toBeLessThanOrEqual(320);
    expect(await scrollsSideways(page)).toBe(false);

    await page.setViewportSize({ width: 330, height: 640 });
    const wide = await boxes();
    expect(wide.value?.y).toBe(wide.key?.y);
    expect(wide.value?.x ?? 0).toBeGreaterThan(
      (wide.key?.x ?? 0) + (wide.key?.width ?? 0),
    );
  });

  // covers: AC-4, AC-7
  test('every row shows the accent ring on keyboard focus and turns its label accent-warm', async ({
    page,
  }) => {
    await page.goto('/');
    const names = [
      'cv',
      'github @jorgergo',
      'linkedin in/jorgergo',
      `email ${basics.email}`,
    ];

    await page.keyboard.press('Tab');
    for (const name of names) {
      await page.keyboard.press('Tab');
      const row = page.getByRole('link', { name, exact: true });
      await expect(row).toBeFocused();
      await expect(row).toHaveCSS('outline-style', 'solid');
      await expect(row).toHaveCSS('outline-width', '2px');
      await expect(row).toHaveCSS('outline-offset', '3px');
      await expect(row).toHaveCSS('outline-color', rgb('light', 'accent'));
      await expect(spans(row).nth(0)).toHaveCSS('color', rgb('light', 'muted'));
      await expect(spans(row).nth(1)).toHaveCSS(
        'color',
        rgb('light', 'accent-warm'),
      );
    }
  });

  // covers: AC-10
  test('every Pages nav href answers 200 with redirects disabled', async ({
    page,
  }) => {
    await page.goto('/');
    const links = await pagesNav(page).getByRole('link').all();
    const hrefs = await Promise.all(
      links.map((link) => link.getAttribute('href')),
    );

    expect(hrefs).not.toEqual([]);
    for (const href of hrefs) {
      const response = await page.request.get(href ?? '', { maxRedirects: 0 });
      expect(response.status(), href ?? 'missing href').toBe(200);
    }
  });
});
