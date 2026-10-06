import { describe, expect, it } from 'vitest';
import { formatContactRows } from '@/lib/cv-format';
import { commandMenuRows, formatRowNumber, SITE_NAV } from '@/lib/site-nav';

describe('formatRowNumber', () => {
  // covers: AC-8
  it.each([
    [0, '01'],
    [9, '10'],
  ])('numbers position %i as %s', (index, expected) => {
    expect(formatRowNumber(index)).toBe(expected);
  });

  // covers: AC-8
  it('pads a single digit and leaves two digits alone', () => {
    expect(formatRowNumber(1)).toBe('02');
    expect(formatRowNumber(10)).toBe('11');
  });
});

describe('SITE_NAV', () => {
  // covers: AC-2
  it('holds lowercase labels and absolute hrefs with no trailing slash', () => {
    expect(SITE_NAV.length).toBeGreaterThan(0);
    for (const { label, href } of SITE_NAV) {
      expect(label).toBe(label.toLowerCase());
      expect(href).toMatch(/^\/[a-z-]+$/);
    }
  });

  // covers: AC-2
  it('keeps the planned order for the pages that exist', () => {
    const planned = ['about', 'cv', 'projects', 'contact'];
    const positions = SITE_NAV.map(({ label }) => planned.indexOf(label));

    expect(positions).not.toContain(-1);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
  });
});

describe('commandMenuRows', () => {
  const basics = {
    name: 'Jorge González Ozorno',
    email: 'jorgergo@icloud.com',
    profiles: [
      {
        network: 'GitHub',
        username: 'jorgergo',
        url: 'https://github.com/jorgergo',
      },
      {
        network: 'LinkedIn',
        username: 'jorgergo',
        url: 'https://www.linkedin.com/in/jorgergo/',
      },
    ],
  } as const;

  const currentLabels = (routePattern: string): readonly string[] =>
    commandMenuRows(basics, routePattern)
      .filter(({ current }) => current)
      .map(({ label }) => label);

  // covers: spec 0014 AC-1
  it("gives today's nine rows: home, the pages, the contacts, the PDF", () => {
    expect(commandMenuRows(basics, '/about')).toEqual([
      { key: 'page', label: 'home', href: '/', current: false },
      { key: 'page', label: 'about', href: '/about', current: true },
      { key: 'page', label: 'cv', href: '/cv', current: false },
      { key: 'page', label: 'projects', href: '/projects', current: false },
      { key: 'page', label: 'contact', href: '/contact', current: false },
      {
        key: 'email',
        label: 'jorgergo@icloud.com',
        href: 'mailto:jorgergo@icloud.com',
        current: false,
      },
      {
        key: 'github',
        label: '@jorgergo',
        href: 'https://github.com/jorgergo',
        current: false,
      },
      {
        key: 'linkedin',
        label: 'in/jorgergo',
        href: 'https://www.linkedin.com/in/jorgergo/',
        current: false,
      },
      {
        key: 'download',
        label: 'cv.pdf',
        href: '/cv.pdf',
        current: false,
        download: 'Jorge-Gonzalez-Ozorno-CV.pdf',
      },
    ]);
  });

  // covers: spec 0014 AC-1
  it.each([
    ['/', ['home']],
    ['/cv', ['cv']],
    ['/404', []],
    ['/styleguide', []],
  ])('marks %s as current: %j', (routePattern, expected) => {
    expect(currentLabels(routePattern)).toEqual(expected);
  });

  // covers: spec 0014 AC-1
  it('gives seven rows with no profiles, the email still before the PDF', () => {
    const rows = commandMenuRows(
      { name: basics.name, email: basics.email },
      '/cv',
    );

    expect(rows.map(({ key }) => key)).toEqual([
      'page',
      'page',
      'page',
      'page',
      'page',
      'email',
      'download',
    ]);
  });

  // covers: spec 0014 AC-1
  it('names the saved PDF from an accented name, on the PDF row alone', () => {
    const rows = commandMenuRows({ ...basics, name: 'Zoë Núñez' }, '/');

    expect(rows.at(-1)?.download).toBe('Zoe-Nunez-CV.pdf');
    expect(rows.filter((row) => row.download !== undefined)).toHaveLength(1);
  });

  // covers: spec 0014 AC-1
  it('keeps its own keys within the w-20 column, with no whitespace', () => {
    // The contact keys are spec 0011's, checked by its NETWORKS case.
    const contactKeys = new Set(
      formatContactRows(basics).map(({ key }) => key),
    );
    const keys = new Set(
      commandMenuRows(basics, '/')
        .map(({ key }) => key)
        .filter((key) => !contactKeys.has(key)),
    );

    expect([...keys]).toEqual(['page', 'download']);
    for (const key of keys) {
      expect(key.length).toBeLessThanOrEqual(8);
      expect(key).not.toMatch(/\s/);
    }
  });
});
