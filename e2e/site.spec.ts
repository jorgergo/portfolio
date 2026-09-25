import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  firstUrl,
  formatDateRange,
  formatLocation,
  formatMonth,
  formatProfilePath,
  formatSkillRows,
  groupConsecutive,
  joinMeta,
  sortByDateDesc,
  sortNewestFirst,
  spanOf,
  type Group,
} from '@/lib/cv-format';
import {
  formatPageTitle,
  OG_TYPE,
  pageMeta,
  SHARE_IMAGE,
  SHARE_PAGES,
  TWITTER_CARD,
} from '@/lib/site-meta';
import {
  axeViolations,
  basics,
  cv,
  distFile,
  distFiles,
  pngSize,
  rgb,
  scrollsSideways,
  site,
  tabOrder,
  toLocal,
  tokens,
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

// Spec 0005 AC-12: the /cv body links in document order, derived from the
// fixture, so an entry that gains or loses a url in cv.json moves the expected
// stops with it. A group links through `firstUrl`, as the page does.
const linked = <T>(
  items: readonly T[],
  name: (item: T) => string,
  url: (item: T) => string | undefined,
): readonly string[] =>
  items.flatMap((item) =>
    url(item) === undefined ? [] : [`a "${name(item)}"`],
  );

const groupUrl = (group: {
  readonly items: readonly { readonly url?: string | undefined }[];
}): string | undefined => firstUrl(group.items);

const CV_STOPS: readonly string[] = [
  'a "Skip to content"',
  `a "${basics.email}"`,
  ...(basics.profiles ?? []).map(({ url }) => `a "${formatProfilePath(url)}"`),
  ...linked(
    groupConsecutive(sortNewestFirst(cv.work), (role) => role.name),
    (group) => group.key,
    groupUrl,
  ),
  ...linked(
    sortNewestFirst(cv.education),
    (entry) => entry.institution,
    (entry) => entry.url,
  ),
  ...linked(
    groupConsecutive(
      sortNewestFirst(cv.volunteer ?? []),
      (role) => role.organization,
    ),
    (group) => group.key,
    groupUrl,
  ),
  ...linked(
    sortByDateDesc(cv.certificates ?? []),
    (certificate) => certificate.name,
    (certificate) => certificate.url,
  ),
  'a "← home"',
];

// Spec 0006 AC-3, AC-4: titles and descriptions come from cv.json through
// site-meta.ts, as the pages get them.
const homeMeta = pageMeta('home', cv, site);
const cvMeta = pageMeta('cv', cv, site);

const PAGES: readonly PageCase[] = [
  {
    path: '/',
    title: homeMeta.title,
    description: homeMeta.description,
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
    title: cvMeta.title,
    description: cvMeta.description,
    h1: basics.name,
    stops: CV_STOPS,
  },
  {
    path: '/missing',
    title: formatPageTitle(basics, 'Not found'),
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

// Every head element as `tag key` (a meta's name or property, a link's rel),
// so a test can read the tag order.
const headTags = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() =>
    [...document.head.children].map((el) => {
      const tag = el.tagName.toLowerCase();
      const key =
        tag === 'link'
          ? el.getAttribute('rel')
          : (el.getAttribute('name') ?? el.getAttribute('property'));
      return key === null ? tag : `${tag} ${key}`;
    }),
  );

// The tags that follow the description meta: the share tags in spec 0006
// AC-5 order on a page with a SHARE_PAGES row, then the two icon links.
const ICON_LINKS = ['link icon', 'link apple-touch-icon'] as const;
const SHARE_TAGS = [
  'link canonical',
  'meta og:type',
  'meta og:site_name',
  'meta og:title',
  'meta og:description',
  'meta og:url',
  'meta og:image',
  'meta og:image:type',
  'meta og:image:width',
  'meta og:image:height',
  'meta og:image:alt',
  'meta twitter:card',
] as const;

const tagsAfterDescription = async (page: Page): Promise<readonly string[]> => {
  const tags = await headTags(page);
  return tags.slice(
    tags.indexOf('meta description') + 1,
    tags.indexOf('link apple-touch-icon') + 1,
  );
};

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

    // covers: spec 0006 AC-8, AC-9
    test('links the generated favicon, then the Apple touch icon', async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
        'href',
        '/favicon.svg',
      );
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
        'type',
        'image/svg+xml',
      );
      await expect(
        page.locator('link[rel="apple-touch-icon"]'),
      ).toHaveAttribute('href', '/apple-touch-icon.png');
      expect((await tagsAfterDescription(page)).slice(-2)).toEqual(ICON_LINKS);
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
    // On /missing the footer link is the third stop, after the skip link and
    // the TextLink (on /cv the contact links come first, spec 0005).
    await page.goto('/missing');
    const home = page.getByRole('contentinfo').getByRole('link');

    await page.keyboard.press('Tab');
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

  // covers: spec 0006 AC-5
  test('carries no canonical and no share tag', async ({ page }) => {
    await page.goto('/missing');

    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
    await expect(page.locator('meta[name^="twitter:"]')).toHaveCount(0);
    expect(await tagsAfterDescription(page)).toEqual(ICON_LINKS);
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
  test('the CV label line is meta text: text-sm in muted', async ({ page }) => {
    await page.goto('/cv');
    const label = page.getByText(
      joinMeta(basics.label, formatLocation(basics.location)),
      { exact: true },
    );

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

// Spec 0006: every expected value comes from cv.json through site-meta.ts and
// `site` from astro.config.mjs, so a content edit or a new domain needs no
// test edit.
for (const { key, path } of SHARE_PAGES) {
  const meta = pageMeta(key, cv, site);
  const share = meta.share;

  test.describe(`share tags on ${path}`, () => {
    // covers: spec 0006 AC-5
    test('carries the canonical and share tags right after the description', async ({
      page,
    }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      expect(await tagsAfterDescription(page)).toEqual([
        ...SHARE_TAGS,
        ...ICON_LINKS,
      ]);
    });

    // covers: spec 0006 AC-5
    test('carries each share tag once and no other anywhere in the head, so no og:locale and no twitter:site', async ({
      page,
    }) => {
      await page.goto(path);
      const shareTags = (await headTags(page)).filter((tag) =>
        /^(meta (og|twitter):|link canonical$)/.test(tag),
      );

      expect(shareTags).toEqual(SHARE_TAGS);
    });

    // covers: spec 0006 AC-1, AC-3, AC-4, AC-5
    test('fills every tag from cv.json and site', async ({ page }) => {
      await page.goto(path);
      const content = (property: string) =>
        page.locator(`meta[property="${property}"]`);

      expect(share).toBeDefined();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        share?.url ?? 'missing',
      );
      await expect(content('og:type')).toHaveAttribute('content', OG_TYPE);
      await expect(content('og:site_name')).toHaveAttribute(
        'content',
        share?.siteName ?? 'missing',
      );
      await expect(content('og:title')).toHaveAttribute('content', meta.title);
      await expect(content('og:description')).toHaveAttribute(
        'content',
        meta.description,
      );
      await expect(content('og:url')).toHaveAttribute(
        'content',
        share?.url ?? 'missing',
      );
      await expect(content('og:image')).toHaveAttribute(
        'content',
        share?.image.url ?? 'missing',
      );
      await expect(content('og:image:type')).toHaveAttribute(
        'content',
        SHARE_IMAGE.type,
      );
      await expect(content('og:image:width')).toHaveAttribute(
        'content',
        String(SHARE_IMAGE.width),
      );
      await expect(content('og:image:height')).toHaveAttribute(
        'content',
        String(SHARE_IMAGE.height),
      );
      await expect(content('og:image:alt')).toHaveAttribute(
        'content',
        share?.image.alt ?? 'missing',
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        TWITTER_CARD,
      );
    });

    // covers: spec 0006 AC-5
    test('keeps og:title, og:description, and og:url equal to the title, description, and canonical', async ({
      page,
    }) => {
      await page.goto(path);
      const attribute = (selector: string, name: string) =>
        page.locator(selector).getAttribute(name);

      expect(await attribute('meta[property="og:title"]', 'content')).toBe(
        await page.title(),
      );
      expect(
        await attribute('meta[property="og:description"]', 'content'),
      ).toBe(await attribute('meta[name="description"]', 'content'));
      expect(await attribute('meta[property="og:url"]', 'content')).toBe(
        await attribute('link[rel="canonical"]', 'href'),
      );
    });

    // covers: spec 0006 AC-6, AC-13
    test('its og:image answers a 1200×630 PNG under 300 KB', async ({
      page,
      request,
      baseURL,
    }) => {
      await page.goto(path);
      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content');
      const response = await request.get(toLocal(image ?? '', baseURL ?? ''));
      const body = await response.body();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe(SHARE_IMAGE.type);
      expect(body.length).toBeLessThan(300_000);
      expect(pngSize(body)).toEqual({
        width: SHARE_IMAGE.width,
        height: SHARE_IMAGE.height,
      });
    });
  });
}

test.describe('icons', () => {
  // covers: spec 0006 AC-8
  test('/favicon.svg answers an SVG with its dark switch', async ({
    request,
  }) => {
    const response = await request.get('/favicon.svg');
    const svg = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\/svg\+xml/);
    expect(svg).toContain('prefers-color-scheme: dark');
    expect(svg).toContain(`fill="${tokens.light.bg ?? 'missing'}"`);
    expect(svg).toContain(`{fill:${tokens.dark.bg ?? 'missing'}}`);
    expect(svg).toContain(`{fill:${tokens.dark.fg ?? 'missing'}}`);
    expect(svg).not.toMatch(/<text|@font-face/);
  });

  // covers: spec 0006 AC-9
  test('/apple-touch-icon.png answers a 180×180 PNG', async ({ request }) => {
    const response = await request.get('/apple-touch-icon.png');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(pngSize(await response.body())).toEqual({ width: 180, height: 180 });
  });
});

test.describe('build output', () => {
  // covers: AC-3
  test('ships exactly four self hosted woff2 files', () => {
    const fonts = distFiles().filter((file) => file.endsWith('.woff2'));

    expect(fonts).toHaveLength(4);
  });

  // covers: spec 0006 AC-6, AC-8, AC-9
  test('writes one card per SHARE_PAGES row and both icons', () => {
    const files = distFiles();

    for (const { key } of SHARE_PAGES) expect(files).toContain(`og/${key}.png`);
    expect(files).toContain('favicon.svg');
    expect(files).toContain('apple-touch-icon.png');
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
      ...(basics.profiles ?? []).map(({ url }) => url),
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

// Spec 0005: the CV as a Harvard style document on /cv, checked against the
// fixture so a content edit moves the expectations with it.
test.describe('cv page', () => {
  const SECTIONS = [
    { id: 'summary', heading: 'Summary', present: true },
    { id: 'experience', heading: 'Experience', present: cv.work.length > 0 },
    { id: 'education', heading: 'Education', present: cv.education.length > 0 },
    {
      id: 'leadership',
      heading: 'Leadership & activities',
      present: (cv.volunteer ?? []).length > 0,
    },
    { id: 'awards', heading: 'Awards', present: (cv.awards ?? []).length > 0 },
    {
      id: 'certifications',
      heading: 'Certifications',
      present: (cv.certificates ?? []).length > 0,
    },
    {
      id: 'skills',
      heading: 'Skills & interests',
      present: formatSkillRows(cv).length > 0,
    },
  ].filter(({ present }) => present);

  const contacts = [
    { href: `mailto:${basics.email}`, text: basics.email },
    ...(basics.profiles ?? []).map(({ url }) => ({
      href: url,
      text: formatProfilePath(url),
    })),
  ];
  const work = groupConsecutive(sortNewestFirst(cv.work), (role) => role.name);
  const group = work.find(({ items }) => items.length > 1);
  const education = sortNewestFirst(cv.education);
  const awards = sortByDateDesc(cv.awards ?? []);
  const certificates = sortByDateDesc(cv.certificates ?? []);

  const wrapper = (page: Page): Locator => page.locator('main#main > div');
  const section = (page: Page, id: string): Locator =>
    page.locator(`section[aria-labelledby="${id}"]`);
  // An entry's root sits two levels above its heading; its lines are its
  // child divs (line 1, line 2 when present, then the body or the slot).
  const entryOf = (heading: Locator): Locator => heading.locator('xpath=../..');
  const lines = (entry: Locator): Locator => entry.locator(':scope > div');
  const meta = (entry: Locator): Locator =>
    lines(entry).first().locator('span');
  // The right values (a date, then a location when there is one) sit straight
  // under the pair lines; the Prose body, the one div in `font-sans`, holds
  // the summary, the bullets, or the coursework line. Optional parts are read
  // as arrays, so a missing one counts as zero instead of failing (AC-16).
  const rightValues = (entry: Locator): Locator =>
    entry.locator(':scope > div > span');
  const subtitles = (entry: Locator): Locator =>
    entry.locator(':scope > div:not(.font-sans) > p');
  const body = (entry: Locator): Locator =>
    entry.locator(':scope > div.font-sans');
  const optional = (value: string | undefined): readonly string[] =>
    value === undefined ? [] : [value];

  // covers: spec 0005 AC-1, AC-2, AC-3
  test('the header holds the name, the label line, and the contact links, then the sections in order', async ({
    page,
  }) => {
    await page.goto('/cv');
    const header = wrapper(page).locator(':scope > header');
    const items = header.locator('address > ul > li');
    const sections = wrapper(page).locator(':scope > section');

    await expect(wrapper(page).locator(':scope > *')).toHaveCount(
      SECTIONS.length + 1,
    );
    await expect(wrapper(page).locator(':scope > *').first()).toHaveJSProperty(
      'tagName',
      'HEADER',
    );
    await expect(wrapper(page)).toHaveCSS('row-gap', '56px');
    await expect(header).toHaveCSS('row-gap', '8px');
    await expect(header.locator(':scope > *')).toHaveCount(3);
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(
      basics.name,
    );
    await expect(header.locator(':scope > p')).toHaveText(
      joinMeta(basics.label, formatLocation(basics.location)),
    );
    await expect(header.locator(':scope > p')).toHaveCSS(
      'color',
      rgb('light', 'muted'),
    );
    await expect(header.locator('address')).toHaveCSS('font-style', 'normal');
    await expect(items).toHaveCount(contacts.length);
    for (const [index, { href, text }] of contacts.entries()) {
      const item = items.nth(index);
      const link = item.getByRole('link');
      await expect(item).toHaveCSS('display', 'flex');
      await expect(link).toHaveText(text);
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveCSS('color', rgb('light', 'fg'));
      await expect(link).toHaveCSS('text-decoration-line', 'none');
      await expect(link).toHaveCSS('min-height', '24px');
      await expect(item.locator('span[aria-hidden="true"]')).toHaveCount(
        index < contacts.length - 1 ? 1 : 0,
      );
    }
    await expect(header.locator('address span[aria-hidden="true"]')).toHaveText(
      contacts.slice(1).map(() => '·'),
    );
    await expect(sections).toHaveCount(SECTIONS.length);
    for (const [index, { id, heading }] of SECTIONS.entries()) {
      await expect(sections.nth(index)).toHaveAttribute('aria-labelledby', id);
      await expect(sections.nth(index).locator(`:scope > h2#${id}`)).toHaveText(
        heading,
      );
      await expect(sections.nth(index)).toHaveCSS('row-gap', '24px');
      await expect(sections.nth(index).locator(`h2#${id}`)).toHaveCSS(
        'border-bottom-width',
        '1px',
      );
    }
    await expect(section(page, 'summary').locator('p')).toHaveText(
      basics.summary,
    );
    await expect(section(page, 'summary').locator('p')).toHaveCSS(
      'font-family',
      /^"IBM Plex Sans-/,
    );
  });

  // covers: spec 0005 AC-2, AC-12
  test('a contact link turns accent-warm on hover and shows the ring on keyboard focus', async ({
    page,
  }) => {
    await page.goto('/cv');
    const link = page.locator('address').getByRole('link').first();

    await link.hover();
    await expect(link).toHaveCSS('color', rgb('light', 'accent-warm'));

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await expect(link).toHaveCSS('outline-width', '2px');
    await expect(link).toHaveCSS('outline-offset', '3px');
  });

  // covers: spec 0005 AC-2
  test('a contact link turns accent-warm on keyboard focus alone, with no hover', async ({
    page,
  }) => {
    await page.goto('/cv');
    const link = page.locator('address').getByRole('link').first();

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('color', rgb('light', 'accent-warm'));
  });

  // covers: spec 0005 AC-4
  test('every linked entry title turns accent-warm on hover, its underline with it', async ({
    page,
  }) => {
    await page.goto('/cv');
    const links = page.locator('main section h3 a');
    test.skip((await links.count()) === 0, 'the fixture has no linked entry');

    for (const link of await links.all()) {
      await link.hover();
      await expect(link).toHaveCSS('color', rgb('light', 'accent-warm'));
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
      await expect(link).toHaveCSS(
        'text-decoration-color',
        rgb('light', 'accent-warm'),
      );
    }
  });

  // covers: spec 0005 AC-2, AC-8
  test('a date and a keyed row key stay muted under the pointer', async ({
    page,
  }) => {
    // Reduced motion drops the colour transition, so a hover colour, if one
    // existed, would show at once instead of partway through 150ms.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/cv');
    const date = meta(entryOf(page.locator('main section h3').first()));
    const keys = page.locator('main dt');
    const targets = (await keys.count()) > 0 ? [date, keys.first()] : [date];

    for (const target of targets) {
      await target.hover();
      // A colour that should not change passes on its first read, so wait
      // until the pointer has landed before reading it.
      await expect
        .poll(() => target.evaluate((el) => el.matches(':hover')))
        .toBe(true);
      await expect(target).toHaveCSS('color', rgb('light', 'muted'));
    }
  });

  // covers: spec 0005 AC-4, AC-5
  test('consecutive roles at one company group under one company line', async ({
    page,
  }) => {
    test.skip(group === undefined, 'the fixture has no consecutive roles');
    if (group === undefined) return;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cv');
    const company = section(page, 'experience').getByRole('heading', {
      level: 3,
      name: group.key,
    });
    const entry = entryOf(company);
    const roles = entry.locator(':scope > div').last().locator(':scope > div');
    const span = spanOf(group.items);
    const url = firstUrl(group.items);

    await expect(company).toHaveCSS('font-weight', '500');
    await expect(company.getByRole('link')).toHaveCount(
      url === undefined ? 0 : 1,
    );
    await expect(meta(entry)).toHaveText(
      formatDateRange(span.startDate, span.endDate),
    );
    await expect(lines(entry)).toHaveCount(2);
    await expect(entry).toHaveCSS('break-inside', 'auto');
    await expect(lines(entry).first()).toHaveCSS('break-after', 'avoid');
    await expect(entry.locator(':scope > div').last()).toHaveCSS(
      'row-gap',
      '16px',
    );
    await expect(roles).toHaveCount(group.items.length);
    for (const [index, role] of group.items.entries()) {
      const heading = roles.nth(index).getByRole('heading', { level: 4 });
      await expect(heading).toHaveText(role.position);
      await expect(heading).toHaveCSS('font-weight', '400');
      await expect(roles.nth(index)).toHaveCSS('break-inside', 'avoid');
      // Line 2 holds the location alone, and exists only when there is one.
      await expect(rightValues(roles.nth(index))).toHaveText([
        formatDateRange(role.startDate, role.endDate),
        ...optional(role.location),
      ]);
      await expect(subtitles(roles.nth(index))).toHaveCount(0);
      await expect(roles.nth(index).locator('li')).toHaveCount(
        role.highlights.length,
      );
    }
    // Only grouped roles render as h4.
    await expect(page.locator('h4')).toHaveCount(
      work
        .filter(({ items }) => items.length > 1)
        .reduce((count, { items }) => count + items.length, 0),
    );
  });

  // covers: spec 0005 AC-4, AC-5
  test('a company with one role is a single entry: company and dates, position and location, bullets', async ({
    page,
  }) => {
    const single = work.find(({ items }) => items.length === 1);
    test.skip(single === undefined, 'the fixture has no single role company');
    if (single === undefined) return;
    await page.goto('/cv');
    const [role] = single.items;
    const entry = entryOf(
      section(page, 'experience').getByRole('heading', {
        level: 3,
        name: single.key,
      }),
    );

    await expect(entry).toHaveCSS('break-inside', 'avoid');
    await expect(meta(entry)).toHaveText(
      formatDateRange(role.startDate, role.endDate),
    );
    await expect(lines(entry).nth(1).locator('p')).toHaveText(role.position);
    await expect(lines(entry).nth(1).locator('p')).toHaveCSS(
      'font-weight',
      '400',
    );
    await expect(lines(entry).nth(1).locator('span')).toHaveText(
      optional(role.location),
    );
    await expect(body(entry)).toHaveCount(
      role.summary !== undefined || role.highlights.length > 0 ? 1 : 0,
    );
    await expect(body(entry).locator(':scope > p')).toHaveText(
      optional(role.summary),
    );
    await expect(entry.locator('ul > li')).toHaveText([...role.highlights]);
    if (role.highlights.length > 0) {
      await expect(entry.locator('ul')).toHaveCSS('list-style-type', 'disc');
    }
    await expect(entry.locator('h4')).toHaveCount(0);
  });

  // Experience and Leadership & activities share one rule (AC-5): the roles
  // sorted newest first, then grouped by company or organization, so every
  // entry of both sections is checked in order, not only the first of a kind.
  type Role = {
    readonly position: string;
    readonly url?: string | undefined;
    readonly location?: string | undefined;
    readonly startDate: string;
    readonly endDate?: string | undefined;
    readonly summary?: string | undefined;
    readonly highlights: readonly string[];
  };
  const ROLE_SECTIONS: readonly {
    readonly id: string;
    readonly groups: readonly Group<Role>[];
  }[] = [
    { id: 'experience', groups: work },
    {
      id: 'leadership',
      groups: groupConsecutive(
        sortNewestFirst(cv.volunteer ?? []),
        (role) => role.organization,
      ),
    },
  ];

  for (const { id, groups } of ROLE_SECTIONS) {
    // covers: spec 0005 AC-4, AC-5
    test(`the ${id} section lists every entry newest first, each with its span, roles, location, and bullets`, async ({
      page,
    }) => {
      test.skip(groups.length === 0, `the fixture has no ${id} entries`);
      await page.goto('/cv');
      const titles = section(page, id).getByRole('heading', { level: 3 });

      await expect(titles).toHaveText(groups.map(({ key }) => key));
      for (const [index, group] of groups.entries()) {
        const entry = entryOf(titles.nth(index));
        const span = spanOf(group.items);
        const [role, ...others] = group.items;

        await expect(titles.nth(index).getByRole('link')).toHaveCount(
          firstUrl(group.items) === undefined ? 0 : 1,
        );
        await expect(meta(entry)).toHaveText(
          formatDateRange(span.startDate, span.endDate),
        );
        if (others.length > 0) {
          await expect(entry.getByRole('heading', { level: 4 })).toHaveText(
            group.items.map(({ position }) => position),
          );
          continue;
        }
        await expect(subtitles(entry)).toHaveText([role.position]);
        await expect(rightValues(entry)).toHaveText([
          formatDateRange(role.startDate, role.endDate),
          ...optional(role.location),
        ]);
        await expect(body(entry).locator(':scope > p')).toHaveText(
          optional(role.summary),
        );
        await expect(body(entry).locator('li')).toHaveText([
          ...role.highlights,
        ]);
      }
    });
  }

  // covers: spec 0005 AC-6, AC-7
  test('education, awards, and certificates render newest first with the date on the right', async ({
    page,
  }) => {
    await page.goto('/cv');
    const degrees = section(page, 'education').getByRole('heading', {
      level: 3,
    });

    await expect(degrees).toHaveText(education.map((e) => e.institution));
    for (const [index, entry] of education.entries()) {
      const root = entryOf(degrees.nth(index));
      await expect(degrees.nth(index).getByRole('link')).toHaveCount(
        entry.url === undefined ? 0 : 1,
      );
      await expect(meta(root)).toHaveText(
        formatDateRange(entry.startDate, entry.endDate),
      );
      await expect(lines(root).nth(1).locator('p')).toHaveText(
        joinMeta(`${entry.studyType}, ${entry.area}`, entry.score),
      );
      await expect(lines(root).nth(1).locator('span')).toHaveText(
        optional(entry.location),
      );
      const courses = entry.courses ?? [];
      await expect(body(root).locator('p')).toHaveText(
        courses.length > 0 ? [`Coursework: ${courses.join(', ')}.`] : [],
      );
    }

    const awardTitles = section(page, 'awards').getByRole('heading', {
      level: 3,
    });
    await expect(awardTitles).toHaveText(awards.map((a) => a.title));
    for (const [index, award] of awards.entries()) {
      const root = entryOf(awardTitles.nth(index));
      await expect(awardTitles.nth(index).getByRole('link')).toHaveCount(0);
      await expect(meta(root)).toHaveText(formatMonth(award.date));
      await expect(lines(root).nth(1).locator('p')).toHaveText(award.awarder);
      await expect(body(root).locator('p')).toHaveText(optional(award.summary));
    }

    const names = section(page, 'certifications').getByRole('heading', {
      level: 3,
    });
    await expect(names).toHaveText(certificates.map((c) => c.name));
    for (const [index, certificate] of certificates.entries()) {
      const root = entryOf(names.nth(index));
      const link = names.nth(index).getByRole('link');
      await expect(link).toHaveCount(certificate.url === undefined ? 0 : 1);
      if (certificate.url !== undefined) {
        await expect(link).toHaveAttribute('href', certificate.url);
      }
      await expect(meta(root)).toHaveText(formatMonth(certificate.date));
      await expect(lines(root).nth(1).locator('p')).toHaveText(
        certificate.issuer,
      );
      await expect(lines(root)).toHaveCount(2);
    }
  });

  // covers: spec 0005 AC-8
  test('Skills & interests is one keyed list: groups, technologies, languages, interests', async ({
    page,
  }) => {
    test.skip(
      !SECTIONS.some(({ id }) => id === 'skills'),
      'the fixture has no skills',
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cv');
    const rows = section(page, 'skills').locator('dl > div');
    // The rows and their order are formatSkillRows's, proven by its Vitest
    // cases (AC-15); this checks the page draws exactly those rows.
    const expected = formatSkillRows(cv);

    await expect(section(page, 'skills').locator('dl')).toHaveCount(1);
    await expect(rows.locator('dt')).toHaveText(expected.map(({ key }) => key));
    await expect(rows.locator('dd')).toHaveText(
      expected.map(({ values }) => joinMeta(...values)),
    );
    for (const row of await rows.all()) {
      await expect(row.locator('dt')).toHaveCSS('width', '160px');
      await expect(row.locator('dt')).toHaveCSS('color', rgb('light', 'muted'));
      await expect(row).toHaveCSS('break-inside', 'avoid');
    }
  });

  // covers: spec 0005 AC-11
  test('at 479px a pair stacks at one x, and at 480px it shares a line ending at the column edge', async ({
    page,
  }) => {
    const title = section(page, 'experience')
      .getByRole('heading', { level: 3 })
      .first();
    const boxes = async () => ({
      title: await title.boundingBox(),
      meta: await meta(entryOf(title)).boundingBox(),
    });

    await page.setViewportSize({ width: 479, height: 800 });
    await page.goto('/cv');
    const narrow = await boxes();
    expect(narrow.meta?.x).toBe(narrow.title?.x);
    expect(narrow.meta?.y ?? 0).toBeGreaterThanOrEqual(
      (narrow.title?.y ?? 0) + (narrow.title?.height ?? 0),
    );

    await page.setViewportSize({ width: 480, height: 800 });
    const wide = await boxes();
    expect(wide.meta?.y ?? 0).toBeLessThan(
      (wide.title?.y ?? 0) + (wide.title?.height ?? 0),
    );
    expect((wide.meta?.y ?? 0) + (wide.meta?.height ?? 0)).toBeGreaterThan(
      wide.title?.y ?? 0,
    );
    // The column is 480px wide here with px-6, so the text area ends at 456.
    expect((wide.meta?.x ?? 0) + (wide.meta?.width ?? 0)).toBeCloseTo(456, 0);
  });

  // covers: spec 0005 AC-4, AC-11
  test('from 480px no date or location wraps, at 480px, 640px, and 1280px', async ({
    page,
  }) => {
    // Every right value is a span straight under one of its entry's pair
    // lines. Its lines are the distinct tops of its text fragments; its width
    // on one line is their sum. A location may wrap only when it alone is
    // wider than the line (AC-4), so the check skips any value wider than
    // half its row, which keeps it true for any schema valid cv.json.
    const rightValues = (target: Page) =>
      target.evaluate(() => {
        const headings = [
          ...document.querySelectorAll('main section :is(h3, h4)'),
        ];
        const values = headings.flatMap((heading) => [
          ...(heading.parentElement?.parentElement?.querySelectorAll(
            ':scope > div > span',
          ) ?? []),
        ]);
        return {
          headings: headings.length,
          values: values.map((span) => {
            const range = document.createRange();
            range.selectNodeContents(span);
            const rects = [...range.getClientRects()].filter(
              (rect) => rect.width > 0,
            );
            return {
              text: span.textContent,
              lines: new Set(rects.map((rect) => Math.round(rect.top))).size,
              width: rects.reduce((sum, rect) => sum + rect.width, 0),
              row: span.parentElement?.getBoundingClientRect().width ?? 0,
            };
          }),
        };
      });

    await page.goto('/cv');
    for (const width of [480, 640, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const { headings, values } = await rightValues(page);

      // Every entry and role has a date, so none of them can go unchecked.
      expect(values.length).toBeGreaterThanOrEqual(headings);
      for (const value of values.filter(({ width: w, row }) => w <= row / 2)) {
        expect(value.lines, `${value.text ?? ''} at ${String(width)}px`).toBe(
          1,
        );
      }
    }
  });

  // covers: spec 0005 AC-11
  test('at 320px every contact item wraps whole, its separator on the same line', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/cv');
    const items = page.locator('address > ul > li');

    expect(await scrollsSideways(page)).toBe(false);
    for (const item of await items.all()) {
      const link = await item.getByRole('link').boundingBox();
      const dots = item.locator('span[aria-hidden="true"]');
      expect((link?.x ?? 0) + (link?.width ?? Infinity)).toBeLessThanOrEqual(
        320,
      );
      // The last item has no dot; every other dot shares its link's line.
      if ((await dots.count()) === 0) continue;
      const dot = await dots.boundingBox();
      expect((dot?.y ?? 0) + (dot?.height ?? 0)).toBeGreaterThan(link?.y ?? 0);
      expect(dot?.y ?? Infinity).toBeLessThan(
        (link?.y ?? 0) + (link?.height ?? 0),
      );
    }
  });

  // covers: spec 0005 AC-11
  test('the heading outline never skips a level, and nothing carries a role, style, or target', async ({
    page,
  }) => {
    await page.goto('/cv');

    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
        Number(h.tagName.slice(1)),
      ),
    );
    expect(levels[0]).toBe(1);
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (const [index, level] of levels.entries()) {
      expect(level, `heading ${index}`).toBeLessThanOrEqual(
        (levels[index - 1] ?? 0) + 1,
      );
    }
    expect(levels.filter((level) => level === 2)).toHaveLength(SECTIONS.length);
    await expect(page.locator('body [role]')).toHaveCount(0);
    await expect(page.locator('body [style]')).toHaveCount(0);
    await expect(page.locator('a[target]')).toHaveCount(0);
  });

  // covers: spec 0005 AC-12
  test('every Tab stop shows the 2px accent ring offset 3px', async ({
    page,
  }) => {
    await page.goto('/cv');

    for (const label of CV_STOPS) {
      await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => {
        const el = document.activeElement;
        if (el === null || el === document.body) return undefined;
        const style = getComputedStyle(el);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
        };
      });
      expect(ring, label).toEqual({
        style: 'solid',
        width: '2px',
        offset: '3px',
        color: rgb('light', 'accent'),
      });
    }
  });

  // covers: spec 0005 AC-10, AC-12
  test('ships no script and loads only the page, the stylesheet, and three Plex files', async ({
    page,
  }) => {
    expect(distFile('cv.html')).not.toMatch(/<script/i);
    const paths: string[] = [];
    page.on('request', (request) =>
      paths.push(new URL(request.url()).pathname),
    );

    await page.goto('/cv', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    expect(paths.filter((path) => path.endsWith('.js'))).toEqual([]);
    expect(paths.filter((path) => path.endsWith('.css'))).toHaveLength(1);
    // Mono 400, Mono 500, and Sans 400; four files ship in dist/.
    expect(paths.filter((path) => path.endsWith('.woff2'))).toHaveLength(3);
    // Headless Chromium skips the favicon, so it is allowed, not required.
    expect(paths.filter((path) => !/\.(css|woff2|svg)$/.test(path))).toEqual([
      '/cv',
    ]);
  });

  test.describe('print', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
      await page.goto('/cv');
    });

    // covers: spec 0005 AC-10
    test('hides the footer and the skip link, and nothing else', async ({
      page,
    }) => {
      await expect(page.locator('footer')).toBeHidden();
      await expect(page.locator('footer')).toHaveCSS('display', 'none');
      await expect(page.locator('a[href="#main"]')).toHaveCSS(
        'display',
        'none',
      );
      const hidden = await page.evaluate(
        () =>
          [...document.querySelectorAll('main *')].filter(
            (el) => getComputedStyle(el).display === 'none',
          ).length,
      );
      expect(hidden).toBe(0);
    });

    // covers: spec 0005 AC-10
    test('tightens the gaps to 1.5rem and 1rem at the 11pt root', async ({
      page,
    }) => {
      await expect(page.locator('html')).toHaveCSS('font-size', '14.6667px');
      await expect(wrapper(page)).toHaveCSS('row-gap', '22px');
      for (const { id } of SECTIONS) {
        await expect(section(page, id)).toHaveCSS('row-gap', '14.6667px');
      }
    });

    // covers: spec 0005 AC-10
    test('keeps entries, keyed rows, headings, and a group line whole across pages', async ({
      page,
    }) => {
      const first = education[0];
      test.skip(first === undefined, 'the fixture has no education');
      if (first === undefined) return;
      const entry = entryOf(
        section(page, 'education').getByRole('heading', {
          level: 3,
          name: first.institution,
        }),
      );

      await expect(entry).toHaveCSS('break-inside', 'avoid');
      for (const { id } of SECTIONS) {
        await expect(page.locator(`h2#${id}`)).toHaveCSS(
          'break-after',
          'avoid',
        );
      }
      for (const row of await page.locator('dl > div').all()) {
        await expect(row).toHaveCSS('break-inside', 'avoid');
      }
      if (group !== undefined) {
        const root = entryOf(
          section(page, 'experience').getByRole('heading', {
            level: 3,
            name: group.key,
          }),
        );
        await expect(root).toHaveCSS('break-inside', 'auto');
        await expect(lines(root).first()).toHaveCSS('break-after', 'avoid');
      }
    });

    // covers: spec 0005 AC-10
    test('prints the paper tokens: plain ink links, muted meta, white paper', async ({
      page,
    }) => {
      const contact = page.locator('address').getByRole('link').first();
      // A CV with no linked entry, or no keyed rows, has nothing to check there.
      const bodyLinks = page.locator('main h3 a');
      const keys = page.locator('dt');

      await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
      await expect(page.locator('html')).toHaveCSS(
        'background-color',
        rgb('print', 'bg'),
      );
      const links =
        (await bodyLinks.count()) > 0
          ? [contact, bodyLinks.first()]
          : [contact];
      for (const link of links) {
        await expect(link).toHaveCSS('text-decoration-line', 'none');
        await expect(link).toHaveCSS('color', rgb('print', 'fg'));
      }
      await expect(meta(entryOf(page.locator('main h3').first()))).toHaveCSS(
        'color',
        rgb('print', 'muted'),
      );
      if ((await keys.count()) > 0) {
        await expect(keys.first()).toHaveCSS('color', rgb('print', 'muted'));
      }
    });
  });
});
