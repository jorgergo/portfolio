import type { APIRoute, GetStaticPaths } from 'astro';
import { parseColorTokens } from '@/lib/contrast';
import { getCv } from '@/lib/cv';
import { renderPng } from '@/lib/render-image';
import { cardPalette, cardTree } from '@/lib/share-card';
import {
  cardContent,
  FOOTER_BUDGET,
  footerLength,
  SHARE_IMAGE,
  SHARE_PAGES,
  sharePage,
} from '@/lib/site-meta';
import css from '@/styles/global.css?raw';

// Spec 0006: one 1200×630 card per SHARE_PAGES row, drawn on every build from
// cv.json, the light tokens, and `site`. A missing piece throws, so
// `pnpm build` fails loudly instead of skipping a file with no body.
export const getStaticPaths = (() =>
  SHARE_PAGES.map(({ key }) => ({
    params: { page: key },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  const page = sharePage(params.page);
  if (page === undefined) {
    throw new Error(
      `No SHARE_PAGES row for /og/${params.page ?? ''}.png; see spec 0006`,
    );
  }
  const content = cardContent(page.key, await getCv(), site);
  if (content === undefined) {
    throw new Error(
      'astro.config.mjs sets no site, so the card has no URL; see spec 0006',
    );
  }
  // The schema caps the city; the host and path come from `site` and the
  // row, which only this check sees.
  const footer = footerLength(content);
  if (footer > FOOTER_BUDGET) {
    throw new Error(
      `the ${page.key} card footer holds ${footer} characters, over ${FOOTER_BUDGET}; shorten basics.location.city, the site host, or the page path; see spec 0006`,
    );
  }
  const palette = cardPalette(parseColorTokens(css).light);
  if (palette === undefined) {
    throw new Error(
      'global.css lacks a light bg, fg, muted, line, or accent token; see spec 0006',
    );
  }
  const png = await renderPng(cardTree(content, palette), SHARE_IMAGE);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': SHARE_IMAGE.type },
  });
};
