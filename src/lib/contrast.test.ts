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

  // covers: AC-2
  it('gives 1:1, the floor, when the two colours are the same', () => {
    expect(contrastRatio('#71695c', '#71695c')).toBe(1);
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

  // covers: AC-2 (Tailwind merges @theme blocks and the cascade lets the
  // later print rule win, so the parser must too)
  it('reads every block and lets the last declaration win', () => {
    const sample = `
      @theme { --color-bg: light-dark(#f2ede3, #1b1916); --color-muted: light-dark(#71695c, #b2aa9a); }
      @layer base {
        @media print { :root { --color-bg: #ffffff; --color-muted: #4a4540; } }
      }
      @theme { --color-muted: light-dark(#8d8576, #6b655b); }
      @media print { :root { --color-muted: #9a958c; } }
    `;
    expect(parseColorTokens(sample)).toEqual({
      light: { bg: '#f2ede3', muted: '#8d8576' },
      dark: { bg: '#1b1916', muted: '#6b655b' },
      print: { bg: '#ffffff', muted: '#9a958c' },
    });
  });

  // covers: AC-2
  it('reads the print tokens below a print block without colours', () => {
    const sample = `
      @media print { .cv { break-inside: avoid; } }
      @theme { --color-bg: light-dark(#f2ede3, #1b1916); }
      @media print { :root { --color-bg: #ffffff; } }
    `;
    expect(parseColorTokens(sample).print).toEqual({ bg: '#ffffff' });
  });

  // covers: AC-2 (an override the parser cannot read must not leave the old
  // value behind: the role reads as missing, and the test says so)
  it('drops a role whose last declaration is not a hex value', () => {
    const sample = `
      @theme { --color-muted: light-dark(#71695c, #b2aa9a); }
      @theme { --color-muted: var(--color-fg); }
      @media print { :root { --color-muted: #4a4540; } }
      @media print { :root { --color-muted: var(--color-fg); } }
    `;
    expect(parseColorTokens(sample)).toEqual({
      light: {},
      dark: {},
      print: {},
    });
  });

  // covers: AC-2 (only six digit hex counts, so a shorthand value cannot
  // slip past the contrast test as a NaN ratio)
  it('reads a shorthand hex value as missing', () => {
    const sample = `
      @theme { --color-bg: light-dark(#fff, #1b1916); }
      @media print { :root { --color-bg: #fff; } }
    `;
    expect(parseColorTokens(sample)).toEqual({
      light: {},
      dark: {},
      print: {},
    });
  });

  // covers: AC-1 (the six roles are the whole palette)
  it('ignores colour variables that are not one of the six roles', () => {
    const sample = `
      @theme {
        --color-bg: light-dark(#f2ede3, #1b1916);
        --color-brand: light-dark(#ff0000, #00ff00);
      }
      @media print { :root { --color-brand: #0000ff; } }
    `;
    expect(parseColorTokens(sample)).toEqual({
      light: { bg: '#f2ede3' },
      dark: { bg: '#1b1916' },
      print: {},
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
  // covers: AC-2 (the floors are the contract: lowering one must fail here,
  // not quietly pass the token test below)
  it('holds the spec 0003 floors for every pair', () => {
    expect(
      CONTRAST_PAIRS.map(({ fg, bg, minRatio, minLc }) => ({
        fg,
        bg,
        minRatio,
        minLc,
      })),
    ).toEqual([
      { fg: 'fg', bg: 'bg', minRatio: 4.5, minLc: undefined },
      { fg: 'muted', bg: 'bg', minRatio: 4.5, minLc: 55 },
      { fg: 'accent', bg: 'bg', minRatio: 4.5, minLc: 55 },
      { fg: 'accent-warm', bg: 'bg', minRatio: 4.5, minLc: 55 },
      { fg: 'bg', bg: 'accent', minRatio: 4.5, minLc: undefined },
      { fg: 'accent', bg: 'bg', minRatio: 3, minLc: undefined },
      { fg: 'muted', bg: 'bg', minRatio: 3, minLc: undefined },
    ]);
  });

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
