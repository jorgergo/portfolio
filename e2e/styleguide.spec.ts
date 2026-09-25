import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLOR_ROLES, CONTRAST_PAIRS } from '@/lib/contrast';
import {
  axeViolations,
  focusables,
  rgb,
  scrollsSideways,
  tabOrder,
  tokens,
} from './helpers';

// Spec 0003 components on /styleguide under `astro dev`: the only page that
// renders every component (the home page holds NavRow alone, spec 0004). Link
// names that a NavRow would also match (`github @jorgergo`) are `exact`.

// The dev toolbar is Astro's, not the site's: keep it out of Tab order and axe.
const DEV_TOOLBAR = 'astro-dev-toolbar';

const open = async (page: Page): Promise<void> => {
  await page.goto('/styleguide');
  await page.evaluate(
    (selector) => document.querySelector(selector)?.remove(),
    DEV_TOOLBAR,
  );
};

const panel = (page: Page, name: 'Light' | 'Dark'): Locator =>
  page.locator('section').filter({
    has: page.getByRole('heading', { level: 2, name, exact: true }),
  });

// Moves focus onto the element with the keyboard, so :focus-visible applies.
const keyboardFocus = async (page: Page, target: Locator): Promise<void> => {
  await target.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
};

const transitionSeconds = (target: Locator): Promise<number> =>
  target.evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).transitionDuration),
  );

test.describe('style guide page', () => {
  for (const scheme of ['light', 'dark'] as const) {
    // covers: AC-13
    test(`shows the light and dark panels side by side under a ${scheme} system setting`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page);
      const light = panel(page, 'Light');
      const dark = panel(page, 'Dark');

      await expect(light).toHaveCSS('background-color', rgb('light', 'bg'));
      await expect(dark).toHaveCSS('background-color', rgb('dark', 'bg'));
      const [left, right] = [
        await light.boundingBox(),
        await dark.boundingBox(),
      ];
      expect(left?.y).toBe(right?.y);
      expect(left?.x ?? 0).toBeLessThan(right?.x ?? 0);
    });

    // covers: AC-2 (rendered contrast), AC-9
    test(`passes axe WCAG 2.2 AA under a ${scheme} system setting`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await open(page);

      expect(await axeViolations(page, [DEV_TOOLBAR])).toEqual([]);
    });
  }

  for (const [name, scheme] of [
    ['Light', 'light'],
    ['Dark', 'dark'],
  ] as const) {
    // covers: AC-13
    test(`the ${name} panel lists every token with its value`, async ({
      page,
    }) => {
      await open(page);
      const section = panel(page, name);

      for (const role of COLOR_ROLES) {
        await expect(section).toContainText(
          `${role} ${tokens[scheme][role] ?? 'missing'}`,
        );
      }
    });

    // covers: AC-2, AC-13
    test(`the ${name} panel reports every contrast pair as passing`, async ({
      page,
    }) => {
      await open(page);
      const rows = panel(page, name).getByRole('listitem');

      for (const pair of CONTRAST_PAIRS) {
        await expect(rows.filter({ hasText: pair.name })).toHaveText(
          /:1 · Lc \d+ ·\s+pass\s*$/,
        );
      }
    });

    // covers: AC-13
    test(`the ${name} panel lists the print values and every icon`, async ({
      page,
    }) => {
      await open(page);
      const section = panel(page, name);
      const printLine = COLOR_ROLES.map(
        (role) => `${role} ${tokens.print[role] ?? 'missing'}`,
      ).join(' · ');

      await expect(section).toContainText(`Print: ${printLine}`);
      const icons = section
        .locator('div')
        .filter({ has: page.getByRole('heading', { name: 'Icons' }) })
        .getByRole('listitem');
      await expect(icons).toHaveText([
        'GitHub',
        'LinkedIn',
        'Mail',
        'ArrowUpRight',
        'Download',
      ]);
      for (const icon of await icons.all()) {
        await expect(icon.locator('svg')).toHaveCount(1);
      }
    });
  }

  // covers: AC-5
  test('nothing scrolls sideways at 320px, long strings wrap', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page);

    expect(await scrollsSideways(page)).toBe(false);
  });
});

test.describe('TextLink', () => {
  const textLink = (page: Page): Locator =>
    panel(page, 'Light').getByRole('link', {
      name: 'TextLink to the home page',
    });

  // covers: AC-7
  test('is underlined at rest: fg text, a 1px muted underline 0.2em below', async ({
    page,
  }) => {
    await open(page);
    const link = textLink(page);

    await expect(link).toHaveCSS('color', rgb('light', 'fg'));
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await expect(link).toHaveCSS('text-decoration-thickness', '1px');
    await expect(link).toHaveCSS(
      'text-decoration-color',
      rgb('light', 'muted'),
    );
    await expect(link).toHaveCSS('text-underline-offset', '3.2px');
  });

  // covers: AC-7
  test('turns text and underline accent-warm on hover', async ({ page }) => {
    await open(page);
    const link = textLink(page);

    await link.hover();

    await expect(link).toHaveCSS('color', rgb('light', 'accent-warm'));
    await expect(link).toHaveCSS(
      'text-decoration-color',
      rgb('light', 'accent-warm'),
    );
  });

  // covers: AC-7
  test('turns text and underline accent-warm on keyboard focus', async ({
    page,
  }) => {
    await open(page);
    const link = textLink(page);

    await keyboardFocus(page, link);

    await expect(link).toHaveCSS('color', rgb('light', 'accent-warm'));
    await expect(link).toHaveCSS(
      'text-decoration-color',
      rgb('light', 'accent-warm'),
    );
  });
});

test.describe('links without an underline', () => {
  const cases = [
    {
      name: 'IconLink',
      link: (page: Page) =>
        panel(page, 'Light').getByRole('link', { name: 'GitHub', exact: true }),
    },
    {
      name: 'Button link',
      link: (page: Page) =>
        panel(page, 'Light').getByRole('link', { name: 'Button as a link' }),
    },
    {
      name: 'footer home link',
      link: (page: Page) =>
        page
          .getByRole('contentinfo')
          .getByRole('link', { name: 'home', exact: true }),
    },
  ] as const;

  for (const { name, link } of cases) {
    // covers: AC-7
    test(`the ${name} has no underline and turns accent-warm on hover`, async ({
      page,
    }) => {
      await open(page);
      const target = link(page);
      await expect(target).toHaveCSS('text-decoration-line', 'none');

      await target.hover();

      await expect(target).toHaveCSS('color', rgb('light', 'accent-warm'));
    });

    // covers: AC-7
    test(`the ${name} turns accent-warm on keyboard focus`, async ({
      page,
    }) => {
      await open(page);
      const target = link(page);

      await keyboardFocus(page, target);

      await expect(target).toHaveCSS('color', rgb('light', 'accent-warm'));
    });
  }
});

test.describe('IconLink', () => {
  const EXTERNAL = ['GitHub', 'LinkedIn'];

  // covers: AC-7
  test('an external https link ends with the arrow icon after its label', async ({
    page,
  }) => {
    await open(page);

    for (const name of EXTERNAL) {
      const link = panel(page, 'Light').getByRole('link', {
        name,
        exact: true,
      });
      await expect(link).toHaveAttribute('href', /^https:\/\//);
      await expect(link.locator('span + svg')).toHaveCount(1);
      await expect(link.locator('svg')).toHaveCount(2);
    }
  });

  // covers: AC-7
  test('a mailto or same site link shows only its own icon', async ({
    page,
  }) => {
    await open(page);
    const section = panel(page, 'Light');
    const mail = section.locator('a[href^="mailto:"]');
    const download = section.getByRole('link', { name: 'Download the CV' });

    await expect(mail.locator('svg')).toHaveCount(1);
    await expect(download).toHaveAttribute('href', '/cv');
    await expect(download.locator('svg')).toHaveCount(1);
  });

  // covers: AC-7
  test('no link on the page opens a new tab', async ({ page }) => {
    await open(page);

    await expect(page.locator('a[target]')).toHaveCount(0);
  });
});

// Spec 0004: the NavRow anatomy on its two pinned examples.
test.describe('NavRow', () => {
  const numberRow = (page: Page): Locator =>
    panel(page, 'Light').getByRole('link', { name: 'cv', exact: true });
  const keyRow = (page: Page): Locator =>
    panel(page, 'Light').getByRole('link', {
      name: 'github @jorgergo',
      exact: true,
    });
  // A row's two spans: the prefix, then the label (with the arrow inside).
  const spans = (row: Locator): Locator => row.locator(':scope > span');

  // covers: AC-4, AC-9
  test('draws a numbered row in an ol and a keyed row in a ul, each a flex link at least 40px tall', async ({
    page,
  }) => {
    await open(page);
    const section = panel(page, 'Light');

    await expect(section.locator('ol > li > a[href="/cv"]')).toHaveCount(1);
    await expect(
      section.locator('ul > li > a[href="https://github.com/jorgergo"]'),
    ).toHaveCount(1);
    for (const row of [numberRow(page), keyRow(page)]) {
      await expect(row).toHaveCSS('display', 'flex');
      await expect(row).toHaveCSS('min-height', '40px');
      await expect(row).toHaveCSS('column-gap', '16px');
      await expect(row).toHaveCSS('text-decoration-line', 'none');
      expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(40);
    }
  });

  // covers: AC-4
  test('hides a number from assistive tech in a w-6 column and keeps a key in the name in a w-20 column', async ({
    page,
  }) => {
    await open(page);
    const number = spans(numberRow(page)).first();
    const key = spans(keyRow(page)).first();

    await expect(number).toHaveText('01');
    await expect(number).toHaveAttribute('aria-hidden', 'true');
    await expect(number).toHaveCSS('width', '24px');
    await expect(key).toHaveText('github');
    await expect(key).not.toHaveAttribute('aria-hidden');
    await expect(key).toHaveCSS('width', '80px');
    for (const prefix of [number, key]) {
      await expect(prefix).toHaveCSS('color', rgb('light', 'muted'));
      await expect(prefix).toHaveCSS('flex-shrink', '0');
    }
  });

  // covers: AC-4
  test('ends an https row with the arrow inside the label span, and a same site row with none', async ({
    page,
  }) => {
    await open(page);

    await expect(spans(keyRow(page)).nth(1).locator('svg')).toHaveCount(1);
    await expect(keyRow(page).locator('svg')).toHaveCount(1);
    await expect(numberRow(page).locator('svg')).toHaveCount(0);
  });

  // covers: AC-4
  test('on hover the label and the arrow turn accent-warm while the prefix stays muted', async ({
    page,
  }) => {
    await open(page);
    const row = keyRow(page);
    await expect(spans(row).nth(1)).toHaveCSS('color', rgb('light', 'fg'));

    await row.hover();

    await expect(spans(row).nth(1)).toHaveCSS(
      'color',
      rgb('light', 'accent-warm'),
    );
    await expect(row.locator('svg')).toHaveCSS(
      'color',
      rgb('light', 'accent-warm'),
    );
    await expect(spans(row).nth(0)).toHaveCSS('color', rgb('light', 'muted'));
  });

  // covers: AC-4
  test('on keyboard focus the label turns accent-warm while the prefix stays muted', async ({
    page,
  }) => {
    await open(page);
    const row = keyRow(page);

    await keyboardFocus(page, row);

    await expect(spans(row).nth(1)).toHaveCSS(
      'color',
      rgb('light', 'accent-warm'),
    );
    await expect(spans(row).nth(0)).toHaveCSS('color', rgb('light', 'muted'));
    await expect(row).toHaveCSS('outline-style', 'solid');
  });

  // covers: AC-9
  test('the spacing list shows gap-1 and gap-4 beside the spec 0003 steps', async ({
    page,
  }) => {
    await open(page);
    const steps = panel(page, 'Light')
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Spacing' }) })
      .getByRole('listitem');

    await expect(steps).toContainText([
      'gap-1',
      'gap-2',
      'gap-4',
      'gap-6',
      'pt-10',
      'gap-14',
      'pb-20',
    ]);
  });
});

test.describe('semantic HTML', () => {
  // covers: AC-9
  test('SectionHeading renders real h2 and h3 elements, with an optional id', async ({
    page,
  }) => {
    await open(page);

    await expect(
      page.getByRole('heading', { level: 2, name: 'Light', exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 3, name: 'Components', exact: true }),
    ).toHaveCount(2);
    await expect(page.locator('h3#light-heading')).toHaveText(
      'SectionHeading as h3',
    );
    await expect(page.locator('h3#dark-heading')).toHaveText(
      'SectionHeading as h3',
    );
  });

  // covers: AC-9
  test('Button is a link with an href and a real button without one', async ({
    page,
  }) => {
    await open(page);
    const section = panel(page, 'Light');

    await expect(
      section.getByRole('link', { name: 'Button as a link' }),
    ).toHaveAttribute('href', '/cv');
    await expect(
      section.getByRole('button', { name: 'Button as a button' }),
    ).toHaveAttribute('type', 'button');
  });

  // covers: AC-9
  test('every icon is hidden from assistive tech and never focusable', async ({
    page,
  }) => {
    await open(page);
    const icons = page.locator('main svg');

    await expect(icons).not.toHaveCount(0);
    await expect(
      page.locator('main svg:not([aria-hidden="true"])'),
    ).toHaveCount(0);
    await expect(page.locator('main svg:not([focusable="false"])')).toHaveCount(
      0,
    );
  });

  // covers: AC-9
  test('adds no ARIA roles to generic elements', async ({ page }) => {
    await open(page);

    await expect(page.locator('body [role]')).toHaveCount(0);
  });
});

test.describe('keyboard focus', () => {
  // covers: AC-8
  test('Tab visits every link and button in document order, skip link first and footer last', async ({
    page,
  }) => {
    await open(page);
    const expected = await focusables(page);

    const order = await tabOrder(page);

    expect(order).toEqual(expected);
    expect(order.at(0)?.label).toBe('a "Skip to content"');
    expect(order.at(-1)?.label).toBe('a "← home"');
  });

  // covers: AC-8
  test('every stop shows a 2px solid accent ring offset 3px', async ({
    page,
  }) => {
    await open(page);
    const stops = await focusables(page);

    for (const { label } of stops) {
      await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => {
        const el = document.activeElement;
        if (el === null) return undefined;
        const style = getComputedStyle(el);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
          // The dark panel resolves the accent token to its dark value.
          dark: el.closest('.scheme-dark') !== null,
        };
      });
      expect(ring, `${label}: focus left the page`).toBeDefined();
      if (ring === undefined) return;
      expect(ring, label).toMatchObject({
        style: 'solid',
        width: '2px',
        offset: '3px',
        color: rgb(ring.dark ? 'dark' : 'light', 'accent'),
      });
    }
  });

  // covers: AC-8
  test('a mouse click shows no ring', async ({ page }) => {
    await open(page);
    const button = panel(page, 'Light').getByRole('button', {
      name: 'Button as a button',
    });

    await button.click();

    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-style', 'none');
  });
});

test.describe('type', () => {
  // covers: AC-4
  test('Prose switches to Plex Sans', async ({ page }) => {
    await open(page);
    const prose = panel(page, 'Light')
      .locator('div')
      .filter({ hasText: /^\s*Prose switches to sans/ });

    await expect(prose).toHaveCSS('font-family', /^"IBM Plex Sans-/);
  });

  // covers: AC-4
  test('SectionHeading is a label: text-xs, uppercase, tracked 0.1em, in accent', async ({
    page,
  }) => {
    await open(page);
    const label = page.locator('h3#light-heading');

    await expect(label).toHaveCSS('font-size', '12px');
    await expect(label).toHaveCSS('text-transform', 'uppercase');
    await expect(label).toHaveCSS('letter-spacing', '1.2px');
    await expect(label).toHaveCSS('color', rgb('light', 'accent'));
  });

  // covers: AC-4
  test('b renders at weight 500, the only emphasis weight', async ({
    page,
  }) => {
    await open(page);

    await expect(
      panel(page, 'Light').getByText('Weight 500', { exact: true }),
    ).toHaveCSS('font-weight', '500');
  });
});

test.describe('TagChip', () => {
  // covers: AC-9, AC-11
  test('draws a 1px line border on screen', async ({ page }) => {
    await open(page);
    const chip = panel(page, 'Light').getByText('TypeScript', { exact: true });

    await expect(chip).toHaveCSS('border-top-width', '1px');
    await expect(chip).toHaveCSS('border-top-color', rgb('light', 'line'));
  });
});

test.describe('motion', () => {
  // covers: AC-10
  test('links change colour with the 150ms theme transition', async ({
    page,
  }) => {
    await open(page);
    const link = panel(page, 'Light').getByRole('link', {
      name: 'TextLink to the home page',
    });

    await expect(link).toHaveCSS('transition-duration', '0.15s');
    await expect(link).toHaveCSS(
      'transition-timing-function',
      'cubic-bezier(0.2, 0, 0, 1)',
    );
    await expect(link).toHaveCSS('transition-property', /(^|, )color(,|$)/);
  });

  // covers: AC-10
  test('defines the motion variables on :root', async ({ page }) => {
    await open(page);

    const motion = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return ['quick', 'base', 'slow', 'ease'].map((name) =>
        root.getPropertyValue(`--motion-${name}`).trim(),
      );
    });

    expect(motion).toEqual([
      '150ms',
      '250ms',
      '400ms',
      'cubic-bezier(0.2, 0, 0, 1)',
    ]);
  });

  // covers: AC-10
  test('reduced motion makes every transition instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);

    for (const target of [
      panel(page, 'Light').getByRole('link', {
        name: 'TextLink to the home page',
      }),
      panel(page, 'Light').getByRole('link', { name: 'GitHub', exact: true }),
      panel(page, 'Light').getByRole('button', { name: 'Button as a button' }),
    ]) {
      expect(await transitionSeconds(target)).toBeLessThan(0.001);
    }
  });
});

test.describe('prefers-contrast: more', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await open(page);
  });

  // covers: AC-12
  test('muted text takes the body colour', async ({ page }) => {
    const meta = panel(page, 'Light').getByText(
      'Meta in text-sm and muted, for dates and the contact line.',
    );

    await expect(meta).toHaveCSS('color', rgb('light', 'fg'));
  });

  // covers: AC-7, AC-12
  test('TextLink underlines thicken to 2px', async ({ page }) => {
    const link = panel(page, 'Light').getByRole('link', {
      name: 'TextLink to the home page',
    });

    await expect(link).toHaveCSS('text-decoration-thickness', '2px');
  });
});

test.describe('forced colours', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
  });

  // covers: AC-12
  test('every link keeps an underline', async ({ page }) => {
    const section = panel(page, 'Light');

    for (const link of [
      section.getByRole('link', { name: 'TextLink to the home page' }),
      section.getByRole('link', { name: 'GitHub', exact: true }),
      section.getByRole('link', { name: 'Button as a link' }),
    ]) {
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
    }
  });

  // covers: AC-12
  test('the focus ring still shows', async ({ page }) => {
    const link = panel(page, 'Light').getByRole('link', {
      name: 'GitHub',
      exact: true,
    });

    await keyboardFocus(page, link);

    await expect(link).toHaveCSS('outline-style', 'solid');
    await expect(link).toHaveCSS('outline-width', '2px');
  });

  // covers: AC-12
  test('icons draw in currentColor and chips keep their border', async ({
    page,
  }) => {
    const section = panel(page, 'Light');
    const icon = section
      .getByRole('link', { name: 'GitHub', exact: true })
      .locator('svg')
      .first();
    const chip = section.getByText('TypeScript', { exact: true });

    const [stroke, color] = await icon.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.stroke, style.color];
    });
    expect(stroke).toBe(color);
    await expect(chip).toHaveCSS('border-top-style', 'solid');
    await expect(chip).toHaveCSS('border-top-width', '1px');
  });
});

test.describe('print', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    await open(page);
  });

  // covers: AC-11
  test('prints near black ink on white paper, whatever the system setting', async ({
    page,
  }) => {
    await expect(page.locator('html')).toHaveCSS(
      'background-color',
      rgb('print', 'bg'),
    );
    await expect(page.locator('html')).toHaveCSS('color', rgb('print', 'fg'));
  });

  // covers: AC-11
  test('hides every Button, the skip link, and the footer home link', async ({
    page,
  }) => {
    const hidden = [
      ...(await page.getByText('Button as a link').all()),
      ...(await page.getByText('Button as a button').all()),
      page.locator('a[href="#main"]'),
      page.getByRole('contentinfo').locator('a[href="/"]'),
    ];

    expect(hidden).toHaveLength(6);
    for (const element of hidden) {
      await expect(element).toBeHidden();
    }
  });

  // covers: AC-11
  test('prints links as plain text', async ({ page }) => {
    const section = panel(page, 'Light');

    for (const link of [
      section.getByRole('link', { name: 'TextLink to the home page' }),
      section.getByRole('link', { name: 'GitHub', exact: true }),
    ]) {
      await expect(link).toHaveCSS('text-decoration-line', 'none');
    }
  });

  // covers: AC-11
  test('prints TagChip as plain text with no border or padding', async ({
    page,
  }) => {
    const chip = panel(page, 'Light').getByText('TypeScript', { exact: true });

    await expect(chip).toHaveCSS('border-top-width', '0px');
    await expect(chip).toHaveCSS('padding-left', '0px');
  });
});
