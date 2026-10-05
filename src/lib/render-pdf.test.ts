import { existsSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type LaunchOptions } from '@playwright/test';
import type { AstroIntegration } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CV_PDF_FONTS,
  CV_PDF_MAX_PAGES,
  CV_PDF_PATH,
  readPdfFacts,
} from '@/lib/cv-pdf';
import { cvPdf } from '@/lib/render-pdf';

// Spec 0013: the build step through real headless Chromium, run the way
// `astro build` runs it, against a small build folder each test writes: a
// page in the three Plex faces /cv prints with, and the files it asks for.
// Chromium must be installed, as the build itself needs it
// (`pnpm exec playwright install chromium`).

type BuildDone = NonNullable<AstroIntegration['hooks']['astro:build:done']>;
type Logger = Parameters<BuildDone>[0]['logger'];

// The made up origin the hook serves the build folder under (AC-13).
const ORIGIN = 'http://cv.localhost';

// The three faces, as the files the build copies (astro.config.mjs), saved
// in the build folder under these names.
const FACES = [
  ['mono-400.woff2', 'mono', 400],
  ['mono-500.woff2', 'mono', 500],
  ['sans-400.woff2', 'sans', 400],
] as const;

// A 1×1 PNG, for the requests a page makes besides its fonts.
const DOT = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

// A page that draws text in each face: Mono 500 for the name, Sans 400 for
// the body, Mono 400 for the address, as /cv does. Each page after the
// first starts at a `.sheet`.
const html = (body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CV · Ada Lovelace</title>
    <style>
      @font-face { font-family: Mono; font-weight: 400; src: url(/mono-400.woff2); }
      @font-face { font-family: Mono; font-weight: 500; src: url(/mono-500.woff2); }
      @font-face { font-family: Sans; font-weight: 400; src: url(/sans-400.woff2); }
      body { font-family: Sans; font-weight: 400; }
      h1 { font-family: Mono; font-weight: 500; }
      code { font-family: Mono; font-weight: 400; }
      .sheet { break-before: page; }
    </style>
  </head>
  <body>
    <h1>Ada Lovelace</h1>
    <p>Engineer. <code>ada@example.com</code></p>
    ${body}
  </body>
</html>
`;

const plexFile = (family: string, weight: number): string =>
  createRequire(join(process.cwd(), 'package.json')).resolve(
    `@fontsource/ibm-plex-${family}/files/ibm-plex-${family}-latin-${String(weight)}-normal.woff2`,
  );

// A logger that drops everything but what the test hands it for `info`.
const logger = (info: (message: string) => void = () => undefined): Logger => {
  const self: Logger = {
    options: { destination: { write: () => undefined }, level: 'info' },
    label: 'cv-pdf',
    fork: () => self,
    info,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    flush: () => undefined,
    close: () => undefined,
  };
  return self;
};

const buildDone = (): BuildDone => {
  const hook = cvPdf().hooks['astro:build:done'];
  if (hook === undefined) throw new Error('cvPdf has no astro:build:done hook');
  return hook;
};

// What the hook throws, or undefined when it resolves.
const failureOf = (run: Promise<void> | void): Promise<unknown> =>
  Promise.resolve(run).then(
    () => undefined,
    (error: unknown) => error,
  );

// Watches the real Chromium the hook launches: what it was launched with,
// the browser (to see that it closed), and every response and failed request
// of the page it prints, by URL.
type Watch = {
  readonly launches: LaunchOptions[];
  readonly browsers: Browser[];
  readonly statuses: Map<string, number>;
  readonly failures: Map<string, string>;
};

const watchChromium = (): Watch => {
  const watch: Watch = {
    launches: [],
    browsers: [],
    statuses: new Map(),
    failures: new Map(),
  };
  const launch = chromium.launch.bind(chromium);
  vi.spyOn(chromium, 'launch').mockImplementation(async (options) => {
    const browser = await launch(options);
    const newPage = browser.newPage.bind(browser);
    vi.spyOn(browser, 'newPage').mockImplementation(async (pageOptions) => {
      const page = await newPage(pageOptions);
      page.on('response', (response) =>
        watch.statuses.set(response.url(), response.status()),
      );
      page.on('requestfailed', (request) =>
        watch.failures.set(request.url(), request.failure()?.errorText ?? ''),
      );
      return page;
    });
    watch.launches.push(options ?? {});
    watch.browsers.push(browser);
    return browser;
  });
  return watch;
};

describe('cvPdf', () => {
  // Each test gets `root/dist/` as the build folder, with the three faces in
  // it; `root/` itself stands for the project around it.
  let root = '';
  let dist = '';
  let dir = new URL('file:///');
  const output = (): URL => new URL(CV_PDF_PATH.slice(1), dir);
  const writeCv = (body = ''): Promise<void> =>
    writeFile(join(dist, 'cv.html'), html(body));
  const run = (info?: (message: string) => void): Promise<void> | void =>
    buildDone()({ pages: [], dir, assets: new Map(), logger: logger(info) });

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'cv-pdf-'));
    dist = join(root, 'dist');
    dir = pathToFileURL(`${dist}/`);
    await mkdir(dist);
    await Promise.all(
      FACES.map(([name, family, weight]) =>
        copyFile(plexFile(family, weight), join(dist, name)),
      ),
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(root, { recursive: true, force: true });
  });

  // covers: spec 0013 AC-13
  it('is the cv-pdf integration, with the one hook astro:build:done', () => {
    const integration = cvPdf();

    expect(integration.name).toBe('cv-pdf');
    expect(Object.keys(integration.hooks)).toEqual(['astro:build:done']);
  });

  // covers: spec 0013 AC-13
  it('loads Playwright only when the hook runs, so astro dev and astro check never do', async () => {
    const loaded = vi.fn();
    vi.resetModules();
    vi.doMock('@playwright/test', () => {
      loaded();
      return {};
    });
    try {
      const fresh = await import('@/lib/render-pdf');
      const hook = fresh.cvPdf().hooks['astro:build:done'];

      expect(loaded).not.toHaveBeenCalled();
      // The stand in has no chromium, so the hook stops right after loading it.
      await failureOf(
        hook?.({ pages: [], dir, assets: new Map(), logger: logger() }),
      );
      expect(loaded).toHaveBeenCalledOnce();
    } finally {
      vi.doUnmock('@playwright/test');
      vi.resetModules();
    }
  });

  // covers: spec 0013 AC-13, AC-14
  it('prints /cv from the build folder to cv.pdf beside it: Letter, tagged, in the three Plex faces, with the page language and title', async () => {
    await writeCv();

    await run();
    const bytes = await readFile(output());
    const facts = readPdfFacts(bytes);

    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(facts).toMatchObject({
      pages: 1,
      width: 612,
      height: 792,
      fonts: CV_PDF_FONTS.toSorted(),
      tagged: true,
      lang: 'en',
      title: 'CV · Ada Lovelace',
    });
  });

  // covers: spec 0013 AC-13
  it('logs the page count and the size in whole kB, once', async () => {
    await writeCv('<p class="sheet">Page two.</p>');
    const info = vi.fn<(message: string) => void>();

    await run(info);
    const { length } = await readFile(output());

    expect(info.mock.calls).toEqual([
      [`cv.pdf: 2 pages, ${String(Math.round(length / 1024))} kB`],
    ]);
  });

  // covers: spec 0013 AC-13
  it('launches Chromium once with font hinting off, and closes it after writing the file', async () => {
    await writeCv();
    const watch = watchChromium();

    await run();

    expect(watch.launches).toEqual([{ args: ['--font-render-hinting=none'] }]);
    expect(watch.browsers).toHaveLength(1);
    expect(watch.browsers[0]?.isConnected()).toBe(false);
    expect(existsSync(output())).toBe(true);
  });

  // covers: spec 0013 AC-13
  it('answers from the build folder: a page by its .html file, a file by its decoded path, anything missing with 404', async () => {
    await writeCv(
      '<img alt="" src="/dot.png"><img alt="" src="/a%20b.png"><img alt="" src="/none.png">',
    );
    await writeFile(join(dist, 'dot.png'), DOT);
    await writeFile(join(dist, 'a b.png'), DOT);
    const watch = watchChromium();

    await run();

    expect(Object.fromEntries(watch.statuses)).toEqual({
      [`${ORIGIN}/cv`]: 200,
      [`${ORIGIN}/mono-400.woff2`]: 200,
      [`${ORIGIN}/mono-500.woff2`]: 200,
      [`${ORIGIN}/sans-400.woff2`]: 200,
      [`${ORIGIN}/dot.png`]: 200,
      [`${ORIGIN}/a%20b.png`]: 200,
      [`${ORIGIN}/none.png`]: 404,
    });
    expect(watch.failures.size).toBe(0);
  });

  // covers: spec 0013 AC-13
  it('answers 404 to a path that climbs out of the build folder, though the file is there', async () => {
    await writeCv('<img alt="" src="/..%2Fsecret.png">');
    await writeFile(join(root, 'secret.png'), DOT);
    const watch = watchChromium();

    await run();

    expect(existsSync(join(root, 'secret.png'))).toBe(true);
    expect(watch.statuses.get(`${ORIGIN}/..%2Fsecret.png`)).toBe(404);
  });

  // covers: spec 0013 AC-13
  it('aborts every request to another origin, so the print never touches the network', async () => {
    await writeCv(
      '<img alt="" src="https://example.com/dot.png"><img alt="" src="http://127.0.0.1:9/dot.png">',
    );
    const watch = watchChromium();

    await run();

    expect(Object.fromEntries(watch.failures)).toEqual({
      'https://example.com/dot.png': 'net::ERR_FAILED',
      'http://127.0.0.1:9/dot.png': 'net::ERR_FAILED',
    });
    expect(
      [...watch.statuses.keys()].filter((url) => !url.startsWith(ORIGIN)),
    ).toEqual([]);
    // The page still prints; a stray link in content never fails the build.
    expect(existsSync(output())).toBe(true);
  });

  // covers: spec 0013 AC-15
  it('fails with the Chromium message, the launch error as its cause, and writes nothing, when Chromium cannot launch', async () => {
    await writeCv();
    const cause = new Error("browserType.launch: Executable doesn't exist");
    vi.spyOn(chromium, 'launch').mockRejectedValue(cause);

    const error = await failureOf(run());

    expect(error).toBeInstanceOf(Error);
    expect(error).toHaveProperty(
      'message',
      'cv.pdf needs Chromium: run `pnpm exec playwright install chromium` (on Linux add --with-deps); see spec 0013',
    );
    expect(error).toHaveProperty('cause', cause);
    expect(existsSync(output())).toBe(false);
  });

  // covers: spec 0013 AC-15
  it('fails when /cv does not answer 200 from the build folder, writes nothing, and closes the browser', async () => {
    const watch = watchChromium();

    const error = await failureOf(run());

    expect(error).toHaveProperty(
      'message',
      'cv.pdf: dist/cv.html did not load; see spec 0013',
    );
    expect(watch.statuses.get(`${ORIGIN}/cv`)).toBe(404);
    expect(watch.browsers[0]?.isConnected()).toBe(false);
    expect(existsSync(output())).toBe(false);
  });

  // covers: spec 0013 AC-15
  it('fails a page over the cap with the page message, writes nothing, and closes the browser', async () => {
    const over = CV_PDF_MAX_PAGES + 1;
    await writeCv(
      Array.from(
        { length: over - 1 },
        (_, index) => `<p class="sheet">Page ${String(index + 2)}.</p>`,
      ).join(''),
    );
    const watch = watchChromium();

    const error = await failureOf(run());

    expect(error).toHaveProperty(
      'message',
      `cv.pdf has ${String(over)} pages, over the cap of ${String(CV_PDF_MAX_PAGES)}; shorten src/content/cv.json; see spec 0013`,
    );
    expect(watch.browsers[0]?.isConnected()).toBe(false);
    expect(existsSync(output())).toBe(false);
  });

  // covers: spec 0013 AC-15
  it('fails with the font message, and writes nothing, when a face file does not load', async () => {
    await writeCv();
    await unlink(join(dist, 'mono-500.woff2'));
    const watch = watchChromium();

    const head = 'cv.pdf embeds ';
    const tail = `, expected ${CV_PDF_FONTS.toSorted().join(', ')}; a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013`;

    const error = await failureOf(run());
    const message = error instanceof Error ? error.message : '';
    // The face Chromium draws the name in instead is the system's
    // (Times-Roman on macOS), so only the Plex part of the list is fixed.
    const plex = message
      .slice(head.length, -tail.length)
      .split(', ')
      .filter((font) => font.startsWith('IBMPlex'));

    expect(watch.statuses.get(`${ORIGIN}/mono-500.woff2`)).toBe(404);
    expect(message.startsWith(head)).toBe(true);
    expect(message.endsWith(tail)).toBe(true);
    expect(plex).toEqual(['IBMPlexMono-Regular', 'IBMPlexSans-Regular']);
    expect(existsSync(output())).toBe(false);
  });
});
