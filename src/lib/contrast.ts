// Colour maths and token parsing for spec 0003. Everything here is pure: the
// caller passes the CSS text in (`global.css?raw`), nothing reads the file system.

export const COLOR_ROLES = [
  'bg',
  'fg',
  'muted',
  'line',
  'accent',
  'accent-warm',
] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

export const SCHEMES = ['light', 'dark', 'print'] as const;
export type Scheme = (typeof SCHEMES)[number];

// A role is missing when the CSS does not define it; callers report that,
// nothing here throws.
export type ColorScheme = Readonly<Partial<Record<ColorRole, string>>>;
export type ColorTokens = Readonly<Record<Scheme, ColorScheme>>;

export type ContrastPair = {
  readonly name: string;
  readonly fg: ColorRole;
  readonly bg: ColorRole;
  readonly minRatio: number;
  readonly minLc?: number;
};

// The pairs AC-2 checks in every scheme, the single place the thresholds live.
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { name: 'body: fg on bg', fg: 'fg', bg: 'bg', minRatio: 4.5 },
  {
    name: 'meta: muted on bg',
    fg: 'muted',
    bg: 'bg',
    minRatio: 4.5,
    minLc: 55,
  },
  {
    name: 'label: accent on bg',
    fg: 'accent',
    bg: 'bg',
    minRatio: 4.5,
    minLc: 55,
  },
  {
    name: 'hover: accent-warm on bg',
    fg: 'accent-warm',
    bg: 'bg',
    minRatio: 4.5,
    minLc: 55,
  },
  { name: 'selection: bg on accent', fg: 'bg', bg: 'accent', minRatio: 4.5 },
  { name: 'focus ring: accent on bg', fg: 'accent', bg: 'bg', minRatio: 3 },
  { name: 'button border: muted on bg', fg: 'muted', bg: 'bg', minRatio: 3 },
];

// Six digit hex (`#rrggbb`) to channels in 0 to 1.
const channels = (hex: string): readonly [number, number, number] => {
  const digits = hex.startsWith('#') ? hex.slice(1) : hex;
  const at = (offset: number): number =>
    Number.parseInt(digits.slice(offset, offset + 2), 16) / 255;
  return [at(0), at(2), at(4)];
};

// WCAG 2.2 relative luminance (piecewise sRGB transfer).
const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = channels(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
};

// WCAG 2.2 contrast ratio, 1 to 21, in either order. Both functions below take
// six digit hex only, the form parseColorTokens returns; `#fff`, a named colour,
// or `rgb()` gives NaN.
export const contrastRatio = (fg: string, bg: string): number => {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
};

// APCA 0.0.98G (the W3 candidate method). Positive for dark text on a light
// ground, negative for light text on a dark ground; |Lc| is the strength.
const APCA = {
  trc: 2.4,
  red: 0.2126729,
  green: 0.7151522,
  blue: 0.072175,
  normBg: 0.56,
  normText: 0.57,
  revText: 0.62,
  revBg: 0.65,
  blackThreshold: 0.022,
  blackClamp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  offsetBoW: 0.027,
  offsetWoB: 0.027,
  lowClip: 0.1,
  deltaYMin: 0.0005,
} as const;

const apcaLuminance = (hex: string): number => {
  const [r, g, b] = channels(hex);
  return (
    APCA.red * r ** APCA.trc +
    APCA.green * g ** APCA.trc +
    APCA.blue * b ** APCA.trc
  );
};

const softClampBlack = (y: number): number =>
  y > APCA.blackThreshold
    ? y
    : y + (APCA.blackThreshold - y) ** APCA.blackClamp;

export const apcaContrast = (text: string, bg: string): number => {
  const yText = softClampBlack(apcaLuminance(text));
  const yBg = softClampBlack(apcaLuminance(bg));
  if (Math.abs(yBg - yText) < APCA.deltaYMin) return 0;
  if (yBg > yText) {
    const sapc = (yBg ** APCA.normBg - yText ** APCA.normText) * APCA.scaleBoW;
    return sapc < APCA.lowClip ? 0 : (sapc - APCA.offsetBoW) * 100;
  }
  const sapc = (yBg ** APCA.revBg - yText ** APCA.revText) * APCA.scaleWoB;
  return sapc > -APCA.lowClip ? 0 : (sapc + APCA.offsetWoB) * 100;
};

// Token parsing. Comments go first, then every `@theme { ... }` block and every
// `@media print { ... }` block is cut out by brace depth, so nested blocks and
// Prettier's line wrapping do not matter. Tailwind merges theme blocks and the
// cascade lets a later print rule win, so the last declaration of a role wins.
// Only six digit hex values count: when the last declaration holds anything
// else, the role reads as missing rather than keeping an older value.
const stripComments = (css: string): string =>
  css.replace(/\/\*[\s\S]*?\*\//g, '');

// The body of the block whose `{` ends just before `start`.
const bodyFrom = (css: string, start: number): string => {
  let depth = 1;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i);
    }
  }
  return '';
};

// Every block the header opens, in source order.
const blockBodies = (css: string, header: RegExp): readonly string[] =>
  [...css.matchAll(header)].map((match) =>
    bodyFrom(css, match.index + match[0].length),
  );

const THEME_HEADER = /@theme\s*\{/g;
const PRINT_HEADER = /@media\s+print\s*\{/g;
const COLOR_DECLARATION = /--color-([a-z][a-z0-9-]*)\s*:\s*([^;{}]*)/gi;
const LIGHT_DARK_VALUE =
  /^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/i;
const HEX_VALUE = /^(#[0-9a-f]{6})$/i;

const isColorRole = (name: string): name is ColorRole =>
  (COLOR_ROLES as readonly string[]).includes(name);

// A role and its hex in one scheme; undefined when the value is not hex.
type Entry = readonly [ColorRole, string | undefined];

const entriesIn = (
  bodies: readonly string[],
  value: RegExp,
  valueIndex: number,
): readonly Entry[] =>
  bodies.flatMap((body) =>
    [...body.matchAll(COLOR_DECLARATION)].flatMap((match) => {
      const role = match[1] ?? '';
      const hex = value.exec((match[2] ?? '').trim())?.[valueIndex];
      return isColorRole(role) ? [[role, hex] as const] : [];
    }),
  );

const toScheme = (entries: readonly Entry[]): ColorScheme =>
  Object.fromEntries(
    COLOR_ROLES.flatMap((role) => {
      const hex = entries.findLast(([name]) => name === role)?.[1];
      return hex === undefined ? [] : [[role, hex.toLowerCase()] as const];
    }),
  );

export const parseColorTokens = (css: string): ColorTokens => {
  const clean = stripComments(css);
  const theme = blockBodies(clean, THEME_HEADER);
  const print = blockBodies(clean, PRINT_HEADER);
  return {
    light: toScheme(entriesIn(theme, LIGHT_DARK_VALUE, 1)),
    dark: toScheme(entriesIn(theme, LIGHT_DARK_VALUE, 2)),
    print: toScheme(entriesIn(print, HEX_VALUE, 1)),
  };
};
