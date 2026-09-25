import { describe, expect, it } from 'vitest';
import { formatRowNumber, SITE_NAV } from '@/lib/site-nav';

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
    const planned = ['about', 'cv', 'portfolio', 'contact'];
    const positions = SITE_NAV.map(({ label }) => planned.indexOf(label));

    expect(positions).not.toContain(-1);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
  });
});
