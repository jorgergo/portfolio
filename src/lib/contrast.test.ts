import { describe, expect, it } from 'vitest';
import {
  apcaContrast,
  COLOR_ROLES,
  CONTRAST_PAIRS,
  contrastRatio,
  parseColorTokens,
  SCHEMES,
} from '@/lib/contrast';
import css from '@/styles/global.css?raw';

const tokens = parseColorTokens(css);

describe('contrastRatio', () => {
  // covers: AC-2
  it('gives 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  // covers: AC-2
  it('gives 3.545:1 for #888888 on #ffffff in either order', () => {
    expect(contrastRatio('#888888', '#ffffff')).toBeCloseTo(3.545, 3);
    expect(contrastRatio('#ffffff', '#888888')).toBeCloseTo(3.545, 3);
  });
});

describe('apcaContrast', () => {
  // covers: AC-2 (the APCA 0.0.98G reference fixtures)
  it.each([
    ['#888888', '#ffffff', 63.06],
    ['#ffffff', '#888888', -68.54],
    ['#000000', '#aaaaaa', 58.15],
    ['#aaaaaa', '#000000', -56.24],
  ])('%s on %s gives Lc %s', (text, bg, lc) => {
    expect(apcaContrast(text, bg)).toBeCloseTo(lc, 1);
  });

  // covers: AC-2
  it('gives 0 when the two colours are the same', () => {
    expect(apcaContrast('#71695c', '#71695c')).toBe(0);
  });
});

describe('parseColorTokens', () => {
  // covers: AC-2
  it('reads both halves of light-dark() and the print overrides', () => {
    const sample = `
      /* --color-bg: light-dark(#000000, #000000) inside a comment is ignored */
      @theme inline { --font-mono: var(--font-plex-mono); }
      @theme {
        --color-bg: light-dark(#F2EDE3, #1b1916);
        --color-line: var(--not-a-hex);
        --color-fg: light-dark(
          #2b2722,
          #e6dfd2
        );
      }
      @layer base {
        @media (prefers-contrast: more) { :root { --color-muted: var(--color-fg); } }
        @media print {
          :root { color-scheme: light; --color-bg: #ffffff; }
          @page { margin: 18mm; }
        }
      }
    `;
    expect(parseColorTokens(sample)).toEqual({
      light: { bg: '#f2ede3', fg: '#2b2722' },
      dark: { bg: '#1b1916', fg: '#e6dfd2' },
      print: { bg: '#ffffff' },
    });
  });

  // covers: AC-2
  it('returns empty schemes when the blocks are absent', () => {
    expect(parseColorTokens('body { color: red; }')).toEqual({
      light: {},
      dark: {},
      print: {},
    });
  });

  // covers: AC-2
  it.each(SCHEMES)('global.css defines every colour role for %s', (scheme) => {
    const missing = COLOR_ROLES.filter(
      (role) => tokens[scheme][role] === undefined,
    );
    expect(
      missing,
      `missing token(s) in ${scheme}: ${missing.join(', ')}`,
    ).toEqual([]);
  });
});

describe('CONTRAST_PAIRS', () => {
  const cases = SCHEMES.flatMap((scheme) =>
    CONTRAST_PAIRS.map(
      (pair) => [`${pair.name} (${scheme})`, scheme, pair] as const,
    ),
  );

  // covers: AC-2
  it.each(cases)('%s meets its floor', (label, scheme, pair) => {
    const fg = tokens[scheme][pair.fg];
    const bg = tokens[scheme][pair.bg];
    expect(fg, `${label}: missing token ${pair.fg}`).toBeDefined();
    expect(bg, `${label}: missing token ${pair.bg}`).toBeDefined();
    if (fg === undefined || bg === undefined) return;

    const ratio = contrastRatio(fg, bg);
    expect(
      ratio,
      `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${pair.minRatio}:1`,
    ).toBeGreaterThanOrEqual(pair.minRatio);

    if (pair.minLc !== undefined) {
      const lc = Math.abs(apcaContrast(fg, bg));
      expect(
        lc,
        `${label}: ${fg} on ${bg} is Lc ${lc.toFixed(1)}, needs ${pair.minLc}`,
      ).toBeGreaterThanOrEqual(pair.minLc);
    }
  });
});
