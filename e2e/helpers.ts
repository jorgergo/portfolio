/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { z } from 'astro/zod';
import cvFile from '@/content/cv.json' with { type: 'json' };
import { parseColorTokens, type ColorRole, type Scheme } from '@/lib/contrast';
import { makeCvSchema } from '@/lib/cv-schema';

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

// Every file the build wrote, relative to dist/ (the site project builds first).
export const distFiles = (): readonly string[] =>
  readdirSync(new URL('../dist/', import.meta.url), {
    recursive: true,
    encoding: 'utf8',
  });

// One built page as text, by its path under dist/.
export const distFile = (name: string): string =>
  readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8');

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
