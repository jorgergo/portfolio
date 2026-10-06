// The one module that launches a browser (spec 0013). After every build it
// opens the built /cv in headless Chromium, prints it with the page's own
// print styles, checks the bytes with the pure rules in `cv-pdf.ts`, and
// writes cv.pdf beside the pages. A third page, a font that did not load, or
// a missing Chromium throws here and fails the build with nothing written.
// astro.config.mjs loads this file outside Vite, so it imports `cv-pdf.ts` by
// relative path with its extension, never through the `@/` alias, and uses
// erasable TypeScript only.
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { checkCvPdf, CV_PDF_PATH, readPdfFacts } from './cv-pdf.ts';

// A made up origin. Every request to it is answered from the build folder and
// a request to any other origin is aborted, so the print needs no server and
// no port, and never touches the network.
const ORIGIN = 'http://cv.localhost';
const PAGE = '/cv';

// A request path decoded, or undefined when one of its escapes is broken
// (such as `%E0%A4%A`), which `decodeURIComponent` throws on. Left to throw
// inside the route handler, it would leave the request unanswered and the
// print waiting until Playwright gives up.
const decodePath = (pathname: string): string | undefined => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
};

// The built file a request path names, or undefined when there is none. A
// path with no extension is a page: build.format is 'file', so /cv is cv.html.
// A decoded path could climb out with `../`, so a file outside the build
// folder counts as missing: the hook reads files under dist/ only, and a path
// that does not decode counts as missing too.
const builtFile = (pathname: string, dir: URL): string | undefined => {
  const path = decodePath(pathname);
  if (path === undefined) return undefined;
  const file = fileURLToPath(
    new URL(`.${extname(path) === '' ? `${path}.html` : path}`, dir),
  );
  return file.startsWith(fileURLToPath(dir)) && existsSync(file)
    ? file
    : undefined;
};

export const cvPdf = (): AstroIntegration => ({
  name: 'cv-pdf',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      // Imported here, so `astro dev`, `astro check`, and the tests that load
      // the config never load Playwright.
      const { chromium } = await import('@playwright/test');
      // Without the flag, Linux breaks lines a little differently from
      // macOS, and the file CI ships would not be the one you see locally.
      const browser = await chromium
        .launch({ args: ['--font-render-hinting=none'] })
        .catch((cause: unknown) => {
          throw new Error(
            'cv.pdf needs Chromium: run `pnpm exec playwright install chromium` (on Linux add --with-deps); see spec 0013',
            { cause },
          );
        });
      try {
        const page = await browser.newPage();
        await page.route('**/*', (route) => {
          const url = new URL(route.request().url());
          if (url.origin !== ORIGIN) return route.abort();
          const path = builtFile(url.pathname, dir);
          // Playwright sets the content type from the file's extension.
          return path === undefined
            ? route.fulfill({ status: 404 })
            : route.fulfill({ path });
        });
        const response = await page.goto(`${ORIGIN}${PAGE}`);
        if (response?.status() !== 200) {
          throw new Error('cv.pdf: dist/cv.html did not load; see spec 0013');
        }
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        // Tags give the PDF its language, headings, lists, and links for
        // assistive tech. No outline: two pages need no bookmarks.
        const pdf = await page.pdf({ format: 'Letter', tagged: true });
        const facts = readPdfFacts(pdf);
        const problem = checkCvPdf(facts);
        if (problem !== undefined) throw new Error(problem);
        await writeFile(new URL(CV_PDF_PATH.slice(1), dir), pdf);
        logger.info(
          `cv.pdf: ${facts.pages} pages, ${Math.round(pdf.length / 1024)} kB`,
        );
      } finally {
        await browser.close();
      }
    },
  },
});
