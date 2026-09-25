// The one module that touches the file system and the native libraries for
// spec 0006: it reads the Plex Mono files, runs Satori, and rasterizes with
// sharp. The layouts it draws come from the pure `share-card.ts`.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { FONT_FAMILY, type CardNode } from '@/lib/share-card';

export type Size = { readonly width: number; readonly height: number };

// Satori reads woff, not woff2 (Fontsource ships both). Resolved through
// Node's package resolution, as astro.config.mjs does for the woff2 files;
// `astro dev` and `astro build` both run from the project root.
const WEIGHTS = [400, 500] as const;

const fontPath = (weight: (typeof WEIGHTS)[number]): string =>
  createRequire(join(process.cwd(), 'package.json')).resolve(
    `@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff`,
  );

const loadFonts = () =>
  Promise.all(
    WEIGHTS.map(async (weight) => ({
      name: FONT_FAMILY,
      weight,
      style: 'normal' as const,
      data: await readFile(fontPath(weight)),
    })),
  );

// Text is drawn as vector paths, so the SVG carries no font file and no text.
export const renderSvg = async (node: CardNode, size: Size): Promise<string> =>
  satori(node, { ...size, fonts: await loadFonts() });

export const renderPng = async (node: CardNode, size: Size): Promise<Buffer> =>
  sharp(Buffer.from(await renderSvg(node, size)))
    .png()
    .toBuffer();
