// The pure rules for the CV's PDF (spec 0013): its address, its caps, the file
// name a download suggests, and the facts the build reads back from the
// printed bytes. The browser lives in `render-pdf.ts`, as Satori and sharp
// live in `render-image.ts`. This module imports nothing and uses erasable
// TypeScript only (types and `as const`), because astro.config.mjs loads it
// through `render-pdf.ts`, outside Vite. A check returns a message or
// undefined; only the build hook throws.

// Fixed, so `_headers`, smoke.sh, and the tests never follow a name change;
// the person's name rides on the link's `download` attribute instead.
export const CV_PDF_PATH = '/cv.pdf';

export const CV_PDF_MAX_PAGES = 2;

// The three faces /cv loads (Mono 400, Mono 500, Sans 400), under the names
// Chromium embeds them by. A font file that fails to load prints in a system
// face without complaint, so the build checks these by name.
export const CV_PDF_FONTS = [
  'IBMPlexMono-Regular',
  'IBMPlexMono-Medium',
  'IBMPlexSans-Regular',
] as const;

// `Jorge González Ozorno` → `Jorge-Gonzalez-Ozorno-CV.pdf`. NFD splits an
// accented letter into its base and a combining mark, the marks are dropped,
// and every other run outside A to Z, a to z, and 0 to 9 becomes one hyphen,
// with none left at either end. A letter that does not decompose, such as ø
// or ß, becomes a hyphen too. A name with no letter or digit gives `CV.pdf`.
export const cvPdfFileName = (name: string): string => {
  const stem = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return stem === '' ? 'CV.pdf' : `${stem}-CV.pdf`;
};

// What the build and the tests read from a PDF's bytes. A value that is not
// there is 0, undefined, false, or an empty list; nothing here throws.
export type PdfFacts = {
  readonly pages: number;
  // The first page's size in points (Letter is 612 by 792).
  readonly width: number | undefined;
  readonly height: number | undefined;
  // Embedded font names, sorted, each once, subset prefix removed.
  readonly fonts: readonly string[];
  readonly tagged: boolean;
  readonly lang: string | undefined;
  readonly title: string | undefined;
  // Every link target, in file order.
  readonly uris: readonly string[];
};

// The inside of a PDF literal string, `(…)`: any escaped character, or any
// character but a backslash and the closing parenthesis.
const LITERAL = String.raw`\(((?:\\[\s\S]|[^\\)])*)\)`;

// The three escapes Chromium writes inside a literal string, undone.
const unescapeLiteral = (text: string): string =>
  text.replace(/\\([\\()])/g, '$1');

// Chromium writes a text string with a character outside ASCII as hex: the
// byte order mark FEFF, then one UTF-16BE code unit per four digits.
const decodeUtf16Hex = (hex: string): string | undefined => {
  const digits = hex.replace(/\s/g, '').toUpperCase();
  return digits.startsWith('FEFF')
    ? (digits.slice(4).match(/.{4}/g) ?? [])
        .map((unit) => String.fromCharCode(Number.parseInt(unit, 16)))
        .join('')
    : undefined;
};

// The first /Title is the document's, since the PDF is printed with no
// outline (an outline item carries a /Title of its own).
const readTitle = (text: string): string | undefined => {
  const [, hex, literal] =
    new RegExp(String.raw`/Title\s*(?:<([0-9A-Fa-f\s]*)>|${LITERAL})`).exec(
      text,
    ) ?? [];
  if (hex !== undefined) return decodeUtf16Hex(hex);
  return literal === undefined ? undefined : unescapeLiteral(literal);
};

const numberOf = (text: string | undefined): number | undefined =>
  text === undefined ? undefined : Number(text);

// Reads Chromium's PDF as text: it writes every dictionary uncompressed, so
// the page tree, the fonts, the tags, and the links can be found by name with
// no PDF library. Latin 1 keeps one character per byte.
export const readPdfFacts = (bytes: Uint8Array): PdfFacts => {
  const text = new TextDecoder('latin1').decode(bytes);
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
  const fonts = [...text.matchAll(/\/BaseFont\s*\/([^\s/<>[\]()]+)/g)].map(
    ([, name = '']) => name.replace(/^[A-Z]{6}\+/, ''),
  );
  return {
    // /Type /Page, and not the /Type /Pages node above the pages.
    pages: (text.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length,
    width: numberOf(box?.[1]),
    height: numberOf(box?.[2]),
    fonts: [...new Set(fonts)].toSorted(),
    tagged:
      /\/Marked\s+true/.test(text) &&
      /\/StructTreeRoot\s+\d+\s+\d+\s+R/.test(text),
    lang: new RegExp(String.raw`/Lang\s*${LITERAL}`).exec(text)?.[1],
    title: readTitle(text),
    uris: [
      ...text.matchAll(new RegExp(String.raw`/URI\s*${LITERAL}`, 'g')),
    ].map(([, uri = '']) => unescapeLiteral(uri)),
  };
};

// The first problem with the printed CV, or undefined when it may ship.
export const checkCvPdf = (facts: PdfFacts): string | undefined => {
  if (facts.pages === 0) return 'cv.pdf has no pages; see spec 0013';
  if (facts.pages > CV_PDF_MAX_PAGES)
    return `cv.pdf has ${facts.pages} pages, over the cap of ${CV_PDF_MAX_PAGES}; shorten src/content/cv.json; see spec 0013`;
  const expected: readonly string[] = CV_PDF_FONTS.toSorted();
  const fonts = [...new Set(facts.fonts)].toSorted();
  if (
    fonts.length !== expected.length ||
    fonts.some((font, index) => font !== expected[index])
  )
    return `cv.pdf embeds ${fonts.join(', ') || 'no fonts'}, expected ${expected.join(', ')}; a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013`;
  if (!facts.tagged) return 'cv.pdf is not tagged; see spec 0013';
  return undefined;
};
