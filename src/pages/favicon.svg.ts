import type { APIRoute } from 'astro';
import { parseColorTokens } from '@/lib/contrast';
import { getCv } from '@/lib/cv';
import { renderSvg } from '@/lib/render-image';
import {
  FAVICON,
  iconPalette,
  iconTree,
  monogram,
  withDarkFills,
} from '@/lib/share-card';
import css from '@/styles/global.css?raw';

// Spec 0006: the first letter of the name on the light tile, drawn as paths,
// switching to the dark tokens inside the SVG's own media query. A missing
// token or an empty name throws, failing `pnpm build`.
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
      'basics.name in cv.json is empty, so the favicon has no letter; see spec 0006',
    );
  }
  const svg = await renderSvg(
    iconTree(letter, FAVICON, { bg: colors.lightBg, fg: colors.lightFg }),
    { width: FAVICON.size, height: FAVICON.size },
  );
  const body = withDarkFills(svg, [
    [colors.lightBg, colors.darkBg],
    [colors.lightFg, colors.darkFg],
  ]);
  return new Response(body, { headers: { 'Content-Type': 'image/svg+xml' } });
};
