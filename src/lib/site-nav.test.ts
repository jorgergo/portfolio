import { describe, expect, it } from 'vitest';
import { commandMenuGroups, formatRowNumber, SITE_NAV } from '@/lib/site-nav';

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

describe('commandMenuGroups', () => {
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

  const allRows = (
    groups: ReturnType<typeof commandMenuGroups>,
  ): ReturnType<typeof commandMenuGroups>[number]['rows'] =>
    groups.flatMap(({ rows }) => rows);

  const currentNames = (routePattern: string): readonly string[] =>
    allRows(commandMenuGroups(basics, routePattern))
      .filter(({ current }) => current)
      .map(({ name }) => name);

  // covers: spec 0015 AC-1
  it("gives today's three groups: the pages, the contacts, the PDF", () => {
    const page = (name: string, href: string, current = false) => ({
      name,
      detail: '',
      href,
      current,
      external: false,
    });

    expect(commandMenuGroups(basics, '/about')).toEqual([
      {
        heading: 'pages',
        rows: [
          page('home', '/'),
          page('about', '/about', true),
          page('cv', '/cv'),
          page('projects', '/projects'),
          page('contact', '/contact'),
        ],
      },
      {
        heading: 'contact',
        rows: [
          {
            name: 'email',
            detail: 'jorgergo@icloud.com',
            href: 'mailto:jorgergo@icloud.com',
            current: false,
            external: false,
          },
          {
            name: 'github',
            detail: '@jorgergo',
            href: 'https://github.com/jorgergo',
            current: false,
            external: true,
          },
          {
            name: 'linkedin',
            detail: 'in/jorgergo',
            href: 'https://www.linkedin.com/in/jorgergo/',
            current: false,
            external: true,
          },
        ],
      },
      {
        heading: 'file',
        rows: [
          {
            name: 'cv.pdf',
            detail: 'download',
            href: '/cv.pdf',
            current: false,
            external: false,
            download: 'Jorge-Gonzalez-Ozorno-CV.pdf',
          },
        ],
      },
    ]);
  });

  // covers: spec 0015 AC-1
  it.each([
    ['/', ['home']],
    ['/cv', ['cv']],
    ['/404', []],
    ['/styleguide', []],
  ])('marks %s as current: %j', (routePattern, expected) => {
    expect(currentNames(routePattern)).toEqual(expected);
  });

  // covers: spec 0015 AC-1
  it('keeps the email row alone in contact with no profiles: seven rows', () => {
    const groups = commandMenuGroups(
      { name: basics.name, email: basics.email },
      '/cv',
    );

    expect(groups.map(({ heading }) => heading)).toEqual([
      'pages',
      'contact',
      'file',
    ]);
    expect(groups[1]?.rows.map(({ name }) => name)).toEqual(['email']);
    expect(allRows(groups)).toHaveLength(7);
  });

  // covers: spec 0015 AC-1
  it('names the saved PDF from an accented name, on the PDF row alone', () => {
    const rows = allRows(
      commandMenuGroups({ ...basics, name: 'Zoë Núñez' }, '/'),
    );

    expect(rows.at(-1)?.download).toBe('Zoe-Nunez-CV.pdf');
    expect(rows.filter((row) => row.download !== undefined)).toHaveLength(1);
  });

  // covers: spec 0015 AC-1
  it('marks the two profile rows external, and no other row', () => {
    const external = allRows(commandMenuGroups(basics, '/'))
      .filter((row) => row.external)
      .map(({ name }) => name);

    expect(external).toEqual(['github', 'linkedin']);
  });
});
