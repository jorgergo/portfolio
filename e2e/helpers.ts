/// <reference types="node" />
import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer, request } from 'node:http';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';
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

// Spec 0007 AC-9: smoke.sh, run as the deploy job runs it, but against the
// local wrangler server. The script reads these four files from dist/.
const SMOKE = fileURLToPath(
  new URL('../.github/scripts/smoke.sh', import.meta.url),
);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SMOKE_FILES = ['index.html', 'cv.html', '404.html', '_headers'] as const;
type SmokeFile = (typeof SMOKE_FILES)[number];

export type SmokeRun = {
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
  // The seconds of each pause between attempts, in order.
  readonly pauses: readonly string[];
};

// Runs smoke.sh from `cwd` (the folder whose dist/ it reads, the repo root by
// default). SMOKE_ORIGIN is set only when `origin` is given, so a value in your
// shell never leaks in. `sleep` is a stub in `dir` that records each pause, so
// ten failed attempts take no time.
export const runSmoke = async ({
  args,
  dir,
  cwd = ROOT,
  origin,
}: {
  readonly args: readonly string[];
  readonly dir: string;
  readonly cwd?: string;
  readonly origin?: string;
}): Promise<SmokeRun> => {
  const bin = join(dir, 'bin');
  const log = join(dir, 'pauses.log');
  mkdirSync(bin, { recursive: true });
  rmSync(log, { force: true });
  writeFileSync(
    join(bin, 'sleep'),
    '#!/bin/sh\necho "$1" >>"$SMOKE_PAUSES"\n',
    {
      mode: 0o755,
    },
  );
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name !== 'SMOKE_ORIGIN'),
  );
  const child = spawn('bash', [SMOKE, ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...env,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      SMOKE_PAUSES: log,
      ...(origin === undefined ? {} : { SMOKE_ORIGIN: origin }),
    },
  });
  const [stdout, stderr, code] = await Promise.all([
    text(child.stdout),
    text(child.stderr),
    new Promise<number | null>((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    }),
  ]);
  const pauses = existsSync(log)
    ? readFileSync(log, 'utf8').split('\n').filter(Boolean)
    : [];
  return { code, stdout, stderr, pauses };
};

// A copy of the files smoke.sh reads, at `dir`/dist, with `edits` applied (a
// verify.md break step). Returns `dir`, the folder to run the script from.
export const scratchDist = (
  dir: string,
  edits: Readonly<Partial<Record<SmokeFile, (text: string) => string>>>,
): string => {
  mkdirSync(join(dir, 'dist'), { recursive: true });
  for (const name of SMOKE_FILES) {
    const from = join(ROOT, 'dist', name);
    const to = join(dir, 'dist', name);
    const edit = edits[name];
    if (edit === undefined) copyFileSync(from, to);
    else writeFileSync(to, edit(readFileSync(from, 'utf8')));
  }
  return dir;
};

// What smoke.sh prints when the same check fails on all ten attempts.
export const failedEveryAttempt = (
  mode: string,
  origin: string,
  problem: string,
): string =>
  [
    `smoke ${mode}: ${origin}`,
    ...Array.from(
      { length: 10 },
      (_, index) => `attempt ${index + 1}/10: ${problem}`,
    ),
    '',
  ].join('\n');

const listen = async (
  server: ReturnType<typeof createServer>,
): Promise<number> => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return typeof address === 'object' && address !== null ? address.port : 0;
};

const close = (server: ReturnType<typeof createServer>): Promise<void> =>
  new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });

// A port nothing listens on: the system hands out a free one and the server
// closes at once, so every request to it is refused, like a site that is down.
export const closedPort = async (): Promise<number> => {
  const server = createServer();
  const port = await listen(server);
  await close(server);
  return port;
};

// One response changed the way a bad deploy might serve it.
export type Tamper = {
  readonly path: string;
  readonly status?: number;
  // Lowercase names; each replaces the upstream header of that name.
  readonly headers?: Readonly<Record<string, string>>;
};

// Runs `use` with the origin of a proxy that forwards every request to
// `upstream` unchanged, except the response for `tamper.path`, then closes it.
export const withTamperingProxy = async <T>(
  upstream: string,
  tamper: Tamper,
  use: (origin: string) => Promise<T>,
): Promise<T> => {
  const { host } = new URL(upstream);
  const server = createServer((incoming, outgoing) => {
    const hit = incoming.url === tamper.path;
    const forward = request(
      new URL(incoming.url ?? '/', upstream),
      { method: incoming.method, headers: { ...incoming.headers, host } },
      (answer) => {
        outgoing.writeHead(
          (hit ? tamper.status : undefined) ?? answer.statusCode ?? 502,
          { ...answer.headers, ...(hit ? tamper.headers : {}) },
        );
        answer.pipe(outgoing);
      },
    );
    forward.on('error', () => outgoing.writeHead(502).end());
    incoming.pipe(forward);
  });
  const port = await listen(server);
  try {
    return await use(`http://127.0.0.1:${port}`);
  } finally {
    await close(server);
  }
};
