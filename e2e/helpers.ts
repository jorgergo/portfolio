/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { z } from 'astro/zod';
import cvFile from '@/content/cv.json' with { type: 'json' };
import { parseColorTokens, type ColorRole, type Scheme } from '@/lib/contrast';
import { makeCvSchema } from '@/lib/cv-schema';
import astroConfig from '../astro.config.mjs';

// Shared by the page and style guide specs. The expected colours come from the
// same global.css the site ships, so a token change never needs a test edit.
export const tokens = parseColorTokens(
  readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8'),
);

// The fixture parsed through the site's own schema, with the `image` stub the
// Vitest schema tests use, so its type is what the pages read (`profiles` is
// optional here as it is there) and invalid content fails the run up front.
export const cv = makeCvSchema(() => z.string()).parse(cvFile.main);
export const { basics } = cv;

// The `site` every canonical and card URL derives from (spec 0006), read from
// the config, so Go live changes one value and no test. A missing site fails
// the run up front.
export const site = new URL(astroConfig.site ?? '');

// An absolute URL from a page (a canonical, an og:image) with the test
// server's origin in place of the site's, keeping the path and query.
export const toLocal = (url: string, base: string): string => {
  const { pathname, search } = new URL(url);
  return new URL(`${pathname}${search}`, base).href;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// A PNG's size from its IHDR chunk, the first data block of the file: width
// and height as big endian numbers at bytes 16 to 23. Undefined when the bytes
// are not a PNG, so no image library is needed here.
export const pngSize = (
  bytes: Uint8Array,
): { readonly width: number; readonly height: number } | undefined => {
  if (
    bytes.length < 24 ||
    PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)
  )
    return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

// Every file the build wrote, relative to dist/ (the site project builds first).
export const distFiles = (): readonly string[] =>
  readdirSync(new URL('../dist/', import.meta.url), {
    recursive: true,
    encoding: 'utf8',
  });

// One built page as text, by its path under dist/.
export const distFile = (name: string): string =>
  readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8');

export type Header = { readonly name: string; readonly value: string };

// The blocks of a `_headers` file by path (spec 0007): a line starting with `/`
// opens a block, and each indented `Name: value` line under it is one header;
// blank and `#` lines are skipped. smoke.sh reads the file the same way.
export const headerBlocks = (
  text: string,
): Readonly<Record<string, readonly Header[]>> =>
  Object.fromEntries(
    text
      .split(/^(?=\/)/m)
      .filter((chunk) => chunk.startsWith('/'))
      .map((chunk) => {
        const [path = '', ...lines] = chunk.split('\n');
        const headers = lines
          .filter((line) => /^\s+[^\s#]/.test(line))
          .map((line) => {
            const colon = line.indexOf(':');
            return {
              name: line.slice(0, colon).trim(),
              value: line.slice(colon + 1).trim(),
            };
          });
        return [path.trim(), headers];
      }),
  );

// The headers from `expected` that no response line carries: the name in any
// case, the value exactly, as smoke.sh matches them on the live site.
export const missingHeaders = (
  actual: readonly Header[],
  expected: readonly Header[],
): readonly string[] =>
  expected
    .filter(
      ({ name, value }) =>
        !actual.some(
          (line) =>
            line.name.toLowerCase() === name.toLowerCase() &&
            line.value === value,
        ),
    )
    .map(({ name, value }) => `${name}: ${value}`);

// A token as the browser reports it in computed styles: `rgb(r, g, b)`.
export const rgb = (scheme: Scheme, role: ColorRole): string => {
  const hex = tokens[scheme][role] ?? '';
  const channel = (offset: number): number =>
    Number.parseInt(hex.slice(offset, offset + 2), 16);
  return `rgb(${channel(1)}, ${channel(3)}, ${channel(5)})`;
};

// One Tab stop: its position among all elements (unique even when two panels
// hold the same link) and a readable label for failure messages.
export type Stop = { readonly index: number; readonly label: string };

const focusedStop = (page: Page): Promise<Stop | undefined> =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (el === null || el === document.body) return undefined;
    const index = [...document.querySelectorAll('*')].indexOf(el);
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { index, label: `${el.tagName.toLowerCase()} "${text}"` };
  });

// Press Tab from the top of the page until focus leaves the document or comes
// back around, and return every stop in order.
export const tabOrder = async (
  page: Page,
  seen: readonly Stop[] = [],
  limit = 80,
): Promise<readonly Stop[]> => {
  if (limit === 0) return seen;
  await page.keyboard.press('Tab');
  const stop = await focusedStop(page);
  return stop === undefined || seen.some(({ index }) => index === stop.index)
    ? seen
    : tabOrder(page, [...seen, stop], limit - 1);
};

// Every element a keyboard user can reach, in document order.
export const focusables = (page: Page): Promise<readonly Stop[]> =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    return [
      ...document.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ].map((el) => ({
      index: all.indexOf(el),
      label: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').replace(/\s+/g, ' ').trim()}"`,
    }));
  });

// True when the page is wider than the viewport, the 320px failure (AC-5).
export const scrollsSideways = (page: Page): Promise<boolean> =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

// The axe WCAG 2.2 AA rule set, with each violation reduced to its rule id
// and the elements it hit, so a failure reads without a trace.
export const axeViolations = async (
  page: Page,
  exclude: readonly string[] = [],
): Promise<readonly string[]> => {
  const builder = exclude.reduce(
    (axe, selector) => axe.exclude(selector),
    new AxeBuilder({ page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
    ]),
  );
  const { violations } = await builder.analyze();
  return violations.map(
    ({ id, nodes }) =>
      `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
  );
};
