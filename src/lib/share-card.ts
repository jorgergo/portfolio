// Share card and icon layouts for Satori (spec 0006). Pure: words and colours
// in, plain element objects out. `render-image.ts` turns them into files.
import unicode from '@fontsource/ibm-plex-mono/unicode.json' with { type: 'json' };
import type { ColorScheme } from '@/lib/contrast';
import type { CardContent } from '@/lib/site-meta';

// The family name the fonts are registered under in `render-image.ts`.
export const FONT_FAMILY = 'IBM Plex Mono';

// The one Plex Mono subset the cards load, the one the site ships too.
// `render-image.ts` builds the font paths from it and the schema allows only
// the characters it lists, so the two cannot drift; a subset the package
// lacks fails `astro check`.
export const FONT_SUBSET = 'latin' satisfies keyof typeof unicode;

// Code points, both ends included.
export type GlyphRange = readonly [from: number, to: number];

const RANGE = /^U\+([0-9a-f]{1,6})(?:-([0-9a-f]{1,6}))?$/i;

// A CSS `unicode-range` list such as `U+0000-00FF,U+0131` to its ranges; an
// item that is not a plain code point or range is left out.
export const parseUnicodeRange = (list: string): readonly GlyphRange[] =>
  list.split(',').flatMap((item) => {
    const match = RANGE.exec(item.trim());
    if (match === null) return [];
    const [, from = '', to = from] = match;
    return [[Number.parseInt(from, 16), Number.parseInt(to, 16)] as const];
  });

// The characters the card font draws, as the font package itself lists them.
export const CARD_GLYPHS = parseUnicodeRange(unicode[FONT_SUBSET]);

const drawable = (char: string): boolean => {
  const point = char.codePointAt(0) ?? -1;
  return CARD_GLYPHS.some(([from, to]) => point >= from && point <= to);
};

// Each character of the text the card font cannot draw, once, in order.
export const missingGlyphs = (text: string): readonly string[] => [
  ...new Set(Array.from(text).filter((char) => !drawable(char))),
];

export type CardStyle = Readonly<Record<string, string | number>>;

// What Satori receives: a plain object shaped like a React element, so no
// React and no JSX are needed.
export type CardNode = {
  readonly type: 'div';
  readonly props: {
    readonly style: CardStyle;
    readonly children?: string | readonly CardNode[];
  };
};

export const h = (
  style: CardStyle,
  children?: string | readonly CardNode[],
): CardNode => ({
  type: 'div',
  props: children === undefined ? { style } : { style, children },
});

export type CardPalette = {
  readonly bg: string;
  readonly fg: string;
  readonly muted: string;
  readonly line: string;
  readonly accent: string;
};

export type IconPalette = {
  readonly lightBg: string;
  readonly lightFg: string;
  readonly darkBg: string;
  readonly darkFg: string;
};

export type IconSpec = {
  readonly size: number;
  readonly radius: number;
  readonly fontSize: number;
};

// The favicon keeps today's tile shape; the Apple icon is square because iOS
// rounds the corners itself, and opaque because iOS draws transparency black.
export const FAVICON: IconSpec = { size: 32, radius: 6, fontSize: 26 };
export const APPLE_ICON: IconSpec = { size: 180, radius: 0, fontSize: 136 };

// The five card colours from the light scheme, or undefined when any is
// missing. Cards are light only.
export const cardPalette = (light: ColorScheme): CardPalette | undefined => {
  const { bg, fg, muted, line, accent } = light;
  return bg === undefined ||
    fg === undefined ||
    muted === undefined ||
    line === undefined ||
    accent === undefined
    ? undefined
    : { bg, fg, muted, line, accent };
};

// The favicon draws in light and swaps to the dark pair inside its media query.
export const iconPalette = (
  light: ColorScheme,
  dark: ColorScheme,
): IconPalette | undefined =>
  light.bg === undefined ||
  light.fg === undefined ||
  dark.bg === undefined ||
  dark.fg === undefined
    ? undefined
    : {
        lightBg: light.bg,
        lightFg: light.fg,
        darkBg: dark.bg,
        darkFg: dark.fg,
      };

// The first character of the name, uppercased; undefined for an empty name,
// which the schema already forbids. The letter stays as written when its
// uppercase form is not one character the card font draws (`ÿ` gives `Ÿ`,
// outside the subset; `ß` gives `SS`).
export const monogram = (name: string): string | undefined => {
  const first = Array.from(name).at(0);
  if (first === undefined) return undefined;
  const upper = first.toUpperCase();
  return Array.from(upper).length === 1 && missingGlyphs(upper).length === 0
    ? upper
    : first;
};

// The card from the Card design section of spec 0006: a top group (label,
// name, role) and a footer pinned to the bottom edge under a hairline.
export const cardTree = (
  content: CardContent,
  palette: CardPalette,
): CardNode =>
  h(
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: 80,
      backgroundColor: palette.bg,
      fontFamily: FONT_FAMILY,
    },
    [
      h({ display: 'flex', flexDirection: 'column' }, [
        ...(content.label === undefined
          ? []
          : [
              h(
                {
                  fontSize: 28,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: palette.accent,
                  marginBottom: 32,
                },
                content.label,
              ),
            ]),
        h(
          { fontSize: 72, fontWeight: 500, color: palette.fg, lineHeight: 1.2 },
          content.name,
        ),
        h(
          {
            fontSize: 40,
            color: palette.muted,
            lineHeight: 1.3,
            marginTop: 12,
          },
          content.role,
        ),
      ]),
      h(
        {
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `2px solid ${palette.line}`,
          paddingTop: 24,
          fontSize: 28,
          color: palette.muted,
          lineHeight: 1.3,
        },
        [h({}, content.footerStart), h({}, content.footerEnd)],
      ),
    ],
  );

// A tile in the ground colour with the letter centred at weight 500.
export const iconTree = (
  letter: string,
  spec: IconSpec,
  colors: { readonly bg: string; readonly fg: string },
): CardNode =>
  h(
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      borderRadius: spec.radius,
      backgroundColor: colors.bg,
      color: colors.fg,
      fontFamily: FONT_FAMILY,
      fontSize: spec.fontSize,
      fontWeight: 500,
    },
    letter,
  );

// Satori writes every colour exactly as given, so a CSS rule keyed on those
// fill attributes swaps them for the dark pair; a CSS `fill` beats the
// attribute. The one `<style>` goes right after the opening `<svg>` tag.
export const withDarkFills = (
  svg: string,
  swaps: readonly (readonly [from: string, to: string])[],
): string => {
  const open = svg.indexOf('<svg');
  const end = open === -1 ? -1 : svg.indexOf('>', open);
  if (end === -1) return svg;
  const rules = swaps
    .map(([from, to]) => `[fill="${from}"]{fill:${to}}`)
    .join('');
  const style = `<style>@media (prefers-color-scheme: dark){${rules}}</style>`;
  return `${svg.slice(0, end + 1)}${style}${svg.slice(end + 1)}`;
};
