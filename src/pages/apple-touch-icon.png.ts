import type { APIRoute } from 'astro';
import { parseColorTokens } from '@/lib/contrast';
import { getCv } from '@/lib/cv';
import { renderPng } from '@/lib/render-image';
import { APPLE_ICON, iconPalette, iconTree, monogram } from '@/lib/share-card';
import css from '@/styles/global.css?raw';

// Spec 0006: the favicon's letter on a square, opaque 180px tile for iOS home
// screens, light only. A missing token or an empty name throws, failing
// `pnpm build`.
export const GET: APIRoute = async () => {
  const { light, dark } = parseColorTokens(css);
  const colors = iconPalette(light, dark);
  if (colors === undefined) {
    throw new Error(
      'global.css lacks a light or dark bg or fg token; see spec 0006',
    );
  }
  const letter = monogram((await getCv()).basics.name);
  if (letter === undefined) {
    throw new Error(
      'basics.name in cv.json is empty, so the icon has no letter; see spec 0006',
    );
  }
  const png = await renderPng(
    iconTree(letter, APPLE_ICON, { bg: colors.lightBg, fg: colors.lightFg }),
    { width: APPLE_ICON.size, height: APPLE_ICON.size },
  );
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
