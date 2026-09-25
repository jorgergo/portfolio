import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import cvFile from '@/content/cv.json';
import { parseColorTokens } from '@/lib/contrast';
import { CV_LIMITS } from '@/lib/cv-schema';
import { renderPng, renderSvg } from '@/lib/render-image';
import {
  APPLE_ICON,
  cardPalette,
  cardTree,
  FAVICON,
  iconPalette,
  iconTree,
  monogram,
  withDarkFills,
} from '@/lib/share-card';
import {
  cardContent,
  SHARE_IMAGE,
  type MetaCv,
  type SharePageKey,
} from '@/lib/site-meta';
import css from '@/styles/global.css?raw';

// Spec 0006 through the real fonts, Satori, and sharp, composed the way the
// three endpoints compose them (the endpoints import astro:content, so Vitest
// cannot call them). These check what the files look like, which the pure
// trees in share-card.test.ts cannot.
const { light, dark } = parseColorTokens(css);
const cv: MetaCv = cvFile.main;
const site = new URL('https://jorgergo.dev');

const cardColours = cardPalette(light);
const iconColours = iconPalette(light, dark);
if (cardColours === undefined || iconColours === undefined) {
  throw new Error('global.css lacks a token the cards and icons need');
}
const letter = monogram(cv.basics.name) ?? '';

type Rgb = readonly [number, number, number];

const hexRgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

type Raster = {
  readonly width: number;
  readonly height: number;
  readonly rgb: (x: number, y: number) => Rgb;
};

const raster = async (png: Buffer): Promise<Raster> => {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: info.width,
    height: info.height,
    rgb: (x, y) => {
      const at = (y * info.width + x) * info.channels;
      return [data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0];
    },
  };
};

// A pixel counts as ink when it differs from the ground by more than the
// faintest anti aliasing, so a glyph's soft edge still counts.
const isInk = (pixel: Rgb, ground: Rgb): boolean =>
  pixel.reduce(
    (sum, channel, index) => sum + Math.abs(channel - (ground[index] ?? 0)),
    0,
  ) > 12;

// The card's content box: 80px of padding on every side of 1200×630.
const PADDING = 80;
const BOX = {
  left: PADDING,
  top: PADDING,
  right: SHARE_IMAGE.width - PADDING,
  bottom: SHARE_IMAGE.height - PADDING,
} as const;

type CardLayout = {
  // Runs of rows holding ink above the rule, top to bottom: one per text line.
  readonly lines: readonly (readonly [top: number, bottom: number])[];
  // The first row the 2px rule fills across the content box.
  readonly ruleTop: number;
  // Ink pixels in the 80px padding, which should stay bare.
  readonly inkInPadding: number;
};

const cardLayout = async (png: Buffer): Promise<CardLayout> => {
  const image = await raster(png);
  const ground = hexRgb(cardColours.bg);
  const ys = Array.from({ length: image.height }, (_, y) => y);
  const xs = Array.from({ length: image.width }, (_, x) => x);
  const inBox = (x: number, y: number): boolean =>
    x >= BOX.left && x < BOX.right && y >= BOX.top && y < BOX.bottom;
  const inkPerRow = ys.map(
    (y) =>
      xs.filter((x) => inBox(x, y) && isInk(image.rgb(x, y), ground)).length,
  );
  // A text row never fills 90% of the box width; the rule fills all of it.
  const ruleTop = inkPerRow.findIndex(
    (count) => count >= 0.9 * (BOX.right - BOX.left),
  );
  const lines = ys
    .slice(0, ruleTop)
    .filter((y) => (inkPerRow[y] ?? 0) > 0)
    .reduce<(readonly [number, number])[]>((runs, y) => {
      const last = runs.at(-1);
      return last !== undefined && last[1] === y - 1
        ? [...runs.slice(0, -1), [last[0], y]]
        : [...runs, [y, y]];
    }, []);
  const inkInPadding = ys
    .flatMap((y) => xs.filter((x) => !inBox(x, y)).map((x) => [x, y] as const))
    .filter(([x, y]) => isInk(image.rgb(x, y), ground)).length;
  return { lines, ruleTop, inkInPadding };
};

const renderCard = (key: SharePageKey, source: MetaCv): Promise<Buffer> => {
  const content = cardContent(key, source, site);
  if (content === undefined) throw new Error('cardContent needs site here');
  return renderPng(cardTree(content, cardColours), SHARE_IMAGE);
};

const withBasics = (name: string, label: string): MetaCv => ({
  ...cv,
  basics: { ...cv.basics, name, label },
});

// The role at its cap, and two names at theirs: the one the bench wraps onto
// two lines, and the worst a 30 character name can do in 24 columns of 72px
// Plex Mono (a 20 letter middle word between two short ones takes three).
const CAPPED_ROLE = 'Senior Full Stack Developer';
const TWO_LINE_NAME = 'Maximiliano Alejandro Ferreira';
const THREE_LINE_NAME = 'Anna Wolfeschlegelsteinha Cruz';

describe('renderSvg: the favicon', () => {
  const favicon = (): Promise<string> =>
    renderSvg(
      iconTree(letter, FAVICON, {
        bg: iconColours.lightBg,
        fg: iconColours.lightFg,
      }),
      { width: FAVICON.size, height: FAVICON.size },
    );

  // covers: AC-8
  it('draws a 32 unit tile', async () => {
    expect(await favicon()).toMatch(
      /^<svg width="32" height="32" viewBox="0 0 32 32"/,
    );
  });

  // covers: AC-8
  it('draws the letter as paths, with no text element and no font file', async () => {
    const svg = await favicon();

    expect(svg).toContain('<path');
    expect(svg).not.toMatch(/<text|@font-face|<image|data:/);
  });

  // covers: AC-8
  it('paints each shape in a light token exactly as written, so the dark rule can key on them', async () => {
    // Satori's overflow mask carries its own white fill; a mask is never
    // painted, so only the shapes outside it matter.
    const painted = (await favicon()).replace(/<mask[^>]*>.*?<\/mask>/g, '');
    const fills = painted.match(/fill="[^"]*"/g) ?? [];

    expect(new Set(fills)).toEqual(
      new Set([
        `fill="${iconColours.lightBg}"`,
        `fill="${iconColours.lightFg}"`,
      ]),
    );
  });

  // covers: AC-8
  it('takes the dark switch right after the opening svg tag', async () => {
    const svg = withDarkFills(await favicon(), [
      [iconColours.lightBg, iconColours.darkBg],
      [iconColours.lightFg, iconColours.darkFg],
    ]);

    expect(svg).toMatch(
      /^<svg [^>]*><style>@media \(prefers-color-scheme: dark\)\{/,
    );
  });
});

describe('renderPng: the Apple touch icon', () => {
  const appleIcon = (): Promise<Buffer> =>
    renderPng(
      iconTree(letter, APPLE_ICON, {
        bg: iconColours.lightBg,
        fg: iconColours.lightFg,
      }),
      { width: APPLE_ICON.size, height: APPLE_ICON.size },
    );

  // covers: AC-9
  it('is a 180×180 PNG', async () => {
    const { format, width, height } = await sharp(await appleIcon()).metadata();

    expect({ format, width, height }).toEqual({
      format: 'png',
      width: 180,
      height: 180,
    });
  });

  // covers: AC-9
  it('is opaque, since iOS draws transparency black', async () => {
    expect((await sharp(await appleIcon()).stats()).isOpaque).toBe(true);
  });

  // covers: AC-9
  it('keeps square corners in the light bg, since iOS rounds them itself', async () => {
    const image = await raster(await appleIcon());
    const last = APPLE_ICON.size - 1;

    for (const [x, y] of [
      [0, 0],
      [last, 0],
      [0, last],
      [last, last],
    ] as const) {
      expect(image.rgb(x, y)).toEqual(hexRgb(iconColours.lightBg));
    }
  });

  // covers: AC-9
  it('draws the letter in the light fg', async () => {
    const image = await raster(await appleIcon());
    const fg = hexRgb(iconColours.lightFg);
    const middle = Array.from({ length: APPLE_ICON.size }, (_, x) =>
      image.rgb(x, APPLE_ICON.size / 2),
    );

    expect(middle).toContainEqual(fg);
  });
});

describe('renderPng: the share cards', () => {
  // covers: AC-6, AC-7
  it('draws today’s CV card inside the padding: label, name, role, then the rule', async () => {
    const { lines, inkInPadding } = await cardLayout(
      await renderCard('cv', cv),
    );

    expect(lines).toHaveLength(3);
    expect(inkInPadding).toBe(0);
  });

  // covers: AC-7
  it('draws today’s home card with no label: name and role above the rule', async () => {
    const { lines, inkInPadding } = await cardLayout(
      await renderCard('home', cv),
    );

    expect(lines).toHaveLength(2);
    expect(inkInPadding).toBe(0);
  });

  // covers: AC-2, AC-7
  it.each([
    ['two', TWO_LINE_NAME, 2],
    ['three', THREE_LINE_NAME, 3],
  ])(
    'keeps the role above the rule when a name at the cap wraps to %s lines',
    async (_, name, nameLines) => {
      expect(name).toHaveLength(CV_LIMITS.name);
      expect(CAPPED_ROLE).toHaveLength(CV_LIMITS.label);
      const today = await cardLayout(await renderCard('cv', cv));

      const capped = await cardLayout(
        await renderCard('cv', withBasics(name, CAPPED_ROLE)),
      );
      const roleBottom = capped.lines.at(-1)?.[1] ?? Infinity;

      // The label, each line of the name, then the role.
      expect(capped.lines).toHaveLength(1 + nameLines + 1);
      expect(capped.ruleTop - roleBottom).toBeGreaterThan(1);
      expect(capped.ruleTop).toBe(today.ruleTop);
      expect(capped.inkInPadding).toBe(0);
    },
  );
});
