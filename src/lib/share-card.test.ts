import { describe, expect, it } from 'vitest';
import cvFile from '@/content/cv.json';
import {
  parseColorTokens,
  type ColorRole,
  type ColorScheme,
} from '@/lib/contrast';
import {
  APPLE_ICON,
  cardPalette,
  cardTree,
  FAVICON,
  iconPalette,
  iconTree,
  monogram,
  withDarkFills,
  type CardNode,
  type CardPalette,
} from '@/lib/share-card';
import { cardContent, SHARE_PAGES, type MetaCv } from '@/lib/site-meta';
import css from '@/styles/global.css?raw';

// Spec 0006. The trees are checked as data (no rendering): the words in
// reading order, the colours, and the sizes from the Card design section.
const { light, dark } = parseColorTokens(css);
const cv: MetaCv = cvFile.main;
const site = new URL('https://jorgergo.dev');

const without = (scheme: ColorScheme, role: ColorRole): ColorScheme =>
  Object.fromEntries(Object.entries(scheme).filter(([name]) => name !== role));

const palette: CardPalette = {
  bg: '#000001',
  fg: '#000002',
  muted: '#000003',
  line: '#000004',
  accent: '#000005',
};

// Every text node in document order, with the style of the node holding it.
type TextNode = {
  readonly text: string;
  readonly style: CardNode['props']['style'];
};
const texts = (node: CardNode): readonly TextNode[] => {
  const { children, style } = node.props;
  if (typeof children === 'string') return [{ text: children, style }];
  return (children ?? []).flatMap(texts);
};

const treeFor = (key: (typeof SHARE_PAGES)[number]['key']): CardNode => {
  const content = cardContent(key, cv, site);
  if (content === undefined) throw new Error('cardContent needs site here');
  return cardTree(content, palette);
};

describe('cardPalette', () => {
  // covers: AC-7, AC-10
  it('reads the five card colours from the light tokens', () => {
    expect(cardPalette(light)).toEqual({
      bg: light.bg,
      fg: light.fg,
      muted: light.muted,
      line: light.line,
      accent: light.accent,
    });
  });

  // covers: AC-10
  it.each(['bg', 'fg', 'muted', 'line', 'accent'] as const)(
    'returns undefined when the light %s token is missing',
    (role) => {
      expect(cardPalette(without(light, role))).toBeUndefined();
    },
  );
});

describe('iconPalette', () => {
  // covers: AC-8, AC-10
  it('reads the light and dark bg and fg tokens', () => {
    expect(iconPalette(light, dark)).toEqual({
      lightBg: light.bg,
      lightFg: light.fg,
      darkBg: dark.bg,
      darkFg: dark.fg,
    });
  });

  // covers: AC-10
  it('returns undefined when a dark token is missing', () => {
    expect(iconPalette(light, without(dark, 'fg'))).toBeUndefined();
  });
});

describe('monogram', () => {
  // covers: AC-8, AC-10
  it.each([
    ['Jorge González Ozorno', 'J'],
    ['álvaro', 'Á'],
  ])('takes the first letter of %j, uppercased', (name, letter) => {
    expect(monogram(name)).toBe(letter);
  });

  // covers: AC-10
  it('returns undefined for an empty name', () => {
    expect(monogram('')).toBeUndefined();
  });
});

describe('cardTree', () => {
  // covers: AC-7
  it('draws the CV card as label, name, role, then the footer', () => {
    expect(texts(treeFor('cv')).map(({ text }) => text)).toEqual([
      'CV',
      'Jorge González Ozorno',
      'Full Stack Developer',
      'jorgergo.dev/cv',
      'Toluca, MX',
    ]);
  });

  // covers: AC-7
  it('draws no label on the home card', () => {
    expect(texts(treeFor('home')).map(({ text }) => text)).toEqual([
      'Jorge González Ozorno',
      'Full Stack Developer',
      'jorgergo.dev',
      'Toluca, MX',
    ]);
  });

  // covers: AC-7
  it('sets the balanced sizes and the token colours', () => {
    const [label, name, role] = texts(treeFor('cv'));

    expect(label?.style).toMatchObject({
      fontSize: 28,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: palette.accent,
      marginBottom: 32,
    });
    expect(name?.style).toMatchObject({
      fontSize: 72,
      fontWeight: 500,
      color: palette.fg,
      lineHeight: 1.2,
    });
    expect(role?.style).toMatchObject({
      fontSize: 40,
      color: palette.muted,
      lineHeight: 1.3,
      marginTop: 12,
    });
  });

  // covers: AC-7
  it('pins the footer under a 2px line rule on the bg ground', () => {
    const root = treeFor('cv');
    const { children } = root.props;
    const footer = typeof children === 'string' ? undefined : children?.at(-1);

    expect(root.props.style).toMatchObject({
      justifyContent: 'space-between',
      padding: 80,
      backgroundColor: palette.bg,
    });
    expect(footer?.props.style).toMatchObject({
      justifyContent: 'space-between',
      borderTop: `2px solid ${palette.line}`,
      paddingTop: 24,
      fontSize: 28,
      color: palette.muted,
      lineHeight: 1.3,
    });
  });

  // covers: AC-7
  it('uses only palette colours', () => {
    const colours = JSON.stringify(treeFor('cv')).match(/#[0-9a-f]{6}/gi);

    expect(new Set(colours)).toEqual(new Set(Object.values(palette)));
  });
});

describe('iconTree', () => {
  // covers: AC-8, AC-9
  it.each([
    ['favicon', FAVICON, 6, 26],
    ['Apple icon', APPLE_ICON, 0, 136],
  ] as const)('centres the letter on the %s tile', (_, spec, radius, size) => {
    const tree = iconTree('J', spec, { bg: '#000001', fg: '#000002' });

    expect(tree.props.children).toBe('J');
    expect(tree.props.style).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius,
      backgroundColor: '#000001',
      color: '#000002',
      fontSize: size,
      fontWeight: 500,
    });
  });

  // covers: AC-8, AC-9
  it('sizes the favicon at 32 units and the Apple icon at 180px', () => {
    expect(FAVICON.size).toBe(32);
    expect(APPLE_ICON.size).toBe(180);
  });
});

describe('withDarkFills', () => {
  const svg =
    '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><path fill="#f2ede3" d="M0 0"/><path fill="#2b2722" d="M1 1"/></svg>';
  const swaps = [
    ['#f2ede3', '#1b1916'],
    ['#2b2722', '#e6dfd2'],
  ] as const;
  const style =
    '<style>@media (prefers-color-scheme: dark){[fill="#f2ede3"]{fill:#1b1916}[fill="#2b2722"]{fill:#e6dfd2}}</style>';

  // covers: AC-8, AC-10
  it('inserts one style right after the opening svg tag', () => {
    const out = withDarkFills(svg, swaps);
    const open =
      '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">';

    expect(out).toBe(`${open}${style}${svg.slice(open.length)}`);
    expect(out.match(/<style>/g)).toHaveLength(1);
  });

  // covers: AC-8, AC-10
  it('skips a prolog before the svg tag', () => {
    const prolog = '<?xml version="1.0"?>';

    expect(withDarkFills(`${prolog}${svg}`, swaps)).toBe(
      `${prolog}${withDarkFills(svg, swaps)}`,
    );
  });

  // covers: AC-10
  it('returns the input unchanged when there is no svg tag', () => {
    expect(withDarkFills('<path/>', swaps)).toBe('<path/>');
  });
});
