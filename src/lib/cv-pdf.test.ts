import { describe, expect, it } from 'vitest';
import {
  checkCvPdf,
  CV_PDF_FONTS,
  CV_PDF_MAX_PAGES,
  CV_PDF_PATH,
  cvPdfFileName,
  readPdfFacts,
  type PdfFacts,
} from '@/lib/cv-pdf';

// Spec 0013: the PDF rules, checked on small hand written byte strings in the
// shape Chromium writes them, so no browser and no PDF library is needed.

// One byte per character, as a PDF's dictionaries are.
const bytes = (text: string): Uint8Array =>
  Uint8Array.from(text, (char) => char.charCodeAt(0));

const facts = (...lines: readonly string[]): PdfFacts =>
  readPdfFacts(bytes(lines.join('\n')));

const PAGE =
  '<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R>>';
const PAGES = '<</Type /Pages /Count 2 /Kids [3 0 R 4 0 R]>>';
const font = (name: string): string =>
  `<</Type /Font /Subtype /Type0 /BaseFont /${name} /Encoding /Identity-H>>`;
const TAGS = [
  '<</Type /Catalog /Pages 2 0 R /MarkInfo <</Marked true>>',
  '/StructTreeRoot 12 0 R /Lang (en)>>',
];
// `CV · Ada` as UTF-16BE behind its byte order mark: the middle dot is 00B7.
const HEX_TITLE = '<</Title <FEFF00430056002000B70020004100640061>>>';

// A two page CV as Chromium prints it: three subset fonts, tags, two links.
const cvPdf = (): PdfFacts =>
  facts(
    '%PDF-1.4',
    HEX_TITLE,
    PAGES,
    PAGE,
    PAGE,
    font('AAAAAA+IBMPlexMono-Medium'),
    font('BAAAAA+IBMPlexMono-Regular'),
    font('CAAAAA+IBMPlexSans-Regular'),
    '<</Type /Annot /Subtype /Link /A <</S /URI /URI (mailto:ada@example.com)>>>>',
    '<</Type /Annot /Subtype /Link /A <</S /URI /URI (https://github.com/ada)>>>>',
    ...TAGS,
  );

const good: PdfFacts = {
  pages: 2,
  width: 612,
  height: 792,
  fonts: ['IBMPlexMono-Medium', 'IBMPlexMono-Regular', 'IBMPlexSans-Regular'],
  tagged: true,
  lang: 'en',
  title: 'CV · Ada',
  uris: ['mailto:ada@example.com', 'https://github.com/ada'],
};

const FONTS_MESSAGE =
  'a font file did not load, or the CV holds a character the Plex latin files lack (see FONT_GAPS in src/lib/share-card.ts); see spec 0013';

describe('the CV PDF constants', () => {
  // covers: spec 0013 AC-12
  it('fixes the address, the page cap, and the three Plex faces', () => {
    expect(CV_PDF_PATH).toBe('/cv.pdf');
    expect(CV_PDF_MAX_PAGES).toBe(2);
    expect(CV_PDF_FONTS).toEqual([
      'IBMPlexMono-Regular',
      'IBMPlexMono-Medium',
      'IBMPlexSans-Regular',
    ]);
  });
});

describe('cvPdfFileName', () => {
  // covers: spec 0013 AC-12
  it.each([
    ['Jorge González Ozorno', 'Jorge-Gonzalez-Ozorno-CV.pdf'],
    ["Ana-María O'Neil", 'Ana-Maria-O-Neil-CV.pdf'],
    ['  Zoë  ', 'Zoe-CV.pdf'],
  ])('names the file for %j as %s', (name, expected) => {
    expect(cvPdfFileName(name)).toBe(expected);
  });

  // covers: spec 0013 AC-12
  it('drops a combining mark typed on its own, as it drops a composed accent', () => {
    expect(cvPdfFileName('José')).toBe('Jose-CV.pdf');
    expect(cvPdfFileName('José')).toBe('Jose-CV.pdf');
  });

  // covers: spec 0013 AC-12
  it('turns a letter that does not decompose into a hyphen', () => {
    expect(cvPdfFileName('Søren Weiß')).toBe('S-ren-Wei-CV.pdf');
  });

  // covers: spec 0013 AC-12
  it('keeps digits and joins any run of other characters with one hyphen', () => {
    expect(cvPdfFileName('R2-D2 / C3PO')).toBe('R2-D2-C3PO-CV.pdf');
    expect(cvPdfFileName('Ada   ___   Lovelace')).toBe('Ada-Lovelace-CV.pdf');
  });

  // covers: spec 0013 AC-12
  it.each(['', '   ', '···', '李'])(
    'returns CV.pdf when %j leaves no letter or digit',
    (name) => {
      expect(cvPdfFileName(name)).toBe('CV.pdf');
    },
  );
});

describe('readPdfFacts', () => {
  // covers: spec 0013 AC-12
  it('reads every fact from a two page PDF', () => {
    expect(cvPdf()).toEqual(good);
  });

  // covers: spec 0013 AC-12
  it('counts /Type /Page and never the /Type /Pages node', () => {
    expect(facts(PAGES).pages).toBe(0);
    expect(facts(PAGES, PAGE).pages).toBe(1);
    expect(facts(PAGES, PAGE, PAGE, PAGE).pages).toBe(3);
  });

  // covers: spec 0013 AC-12
  it('reads the size from the first /MediaBox', () => {
    const a4 = '<</Type /Page /MediaBox [0 0 595.92 842.88]>>';

    expect(facts(a4, PAGE)).toMatchObject({ width: 595.92, height: 842.88 });
  });

  // covers: spec 0013 AC-12
  it('lists each font once, sorted, without its six capital subset prefix', () => {
    const list = facts(
      font('BAAAAA+IBMPlexSans-Regular'),
      font('AAAAAA+IBMPlexMono-Medium'),
      // The descendant font repeats the name, and a system face has no prefix.
      '<</Type /Font /Subtype /CIDFontType2 /BaseFont /AAAAAA+IBMPlexMono-Medium>>',
      font('Helvetica'),
    ).fonts;

    expect(list).toEqual([
      'Helvetica',
      'IBMPlexMono-Medium',
      'IBMPlexSans-Regular',
    ]);
  });

  // covers: spec 0013 AC-12
  it('keeps a plus sign that follows anything but six capitals', () => {
    expect(facts(font('ABC+Plex'), font('abcdef+Plex')).fonts).toEqual([
      'ABC+Plex',
      'abcdef+Plex',
    ]);
  });

  // covers: spec 0013 AC-12
  it.each([
    ['both the mark and the tree', true, TAGS],
    ['the mark alone', false, ['<</MarkInfo <</Marked true>>>>']],
    ['the tree alone', false, ['<</StructTreeRoot 12 0 R>>']],
    ['a false mark', false, ['<</Marked false>> /StructTreeRoot 12 0 R']],
    ['neither', false, [PAGE]],
  ])('with %s, tagged is %s', (_, expected, lines) => {
    expect(facts(...lines).tagged).toBe(expected);
  });

  // covers: spec 0013 AC-12
  it('reads the first /Lang value', () => {
    expect(facts('<</Lang (es-MX)>>', '<</Lang (en)>>').lang).toBe('es-MX');
  });

  // covers: spec 0013 AC-12
  it('decodes a hex title that starts with FEFF as UTF-16BE', () => {
    expect(facts(HEX_TITLE).title).toBe('CV · Ada');
    // Hex digits in either case, and the white space a PDF allows in them.
    expect(facts('<</Title <feff004a006f007300e9>>>').title).toBe('José');
    expect(facts('<</Title <FEFF 0043\n0056>>>').title).toBe('CV');
  });

  // covers: spec 0013 AC-12
  it('reads a literal title and undoes its three escapes', () => {
    expect(facts('<</Title (CV of Ada)>>').title).toBe('CV of Ada');
    expect(facts(String.raw`<</Title (A \(very\) plain \\ CV)>>`).title).toBe(
      String.raw`A (very) plain \ CV`,
    );
  });

  // covers: spec 0013 AC-12
  it('takes the first /Title, the document one', () => {
    expect(facts('<</Title (First)>>', '<</Title (Second)>>').title).toBe(
      'First',
    );
  });

  // covers: spec 0013 AC-12
  it('gives no title for a hex string without the byte order mark', () => {
    expect(facts('<</Title <00430056>>>').title).toBeUndefined();
  });

  // covers: spec 0013 AC-12
  it('lists every /URI in file order, repeats included, with escapes undone', () => {
    const list = facts(
      '<</S /URI /URI (https://b.example/)>>',
      '<</S /URI /URI (mailto:ada@example.com)>>',
      String.raw`<</S /URI /URI (https://a.example/wiki/Ada_\(name\))>>`,
      '<</S /URI /URI (https://b.example/)>>',
    ).uris;

    expect(list).toEqual([
      'https://b.example/',
      'mailto:ada@example.com',
      'https://a.example/wiki/Ada_(name)',
      'https://b.example/',
    ]);
  });

  // covers: spec 0013 AC-12
  it.each([
    ['no bytes', ''],
    ['bytes that are not a PDF', 'hello'],
  ])('gives the empty facts for %s, and never throws', (_, text) => {
    expect(readPdfFacts(bytes(text))).toEqual({
      pages: 0,
      width: undefined,
      height: undefined,
      fonts: [],
      tagged: false,
      lang: undefined,
      title: undefined,
      uris: [],
    });
  });

  // covers: spec 0013 AC-12
  it('reads bytes above ASCII one character each, so compressed data never breaks it', () => {
    const noise = Uint8Array.from({ length: 256 }, (_, index) => index);
    const pdf = Uint8Array.from([...noise, ...bytes(PAGE), ...noise]);

    expect(readPdfFacts(pdf)).toMatchObject({ pages: 1, width: 612 });
  });
});

describe('checkCvPdf', () => {
  // covers: spec 0013 AC-12
  it('passes a tagged PDF of one or two pages with exactly the three fonts', () => {
    expect(checkCvPdf(good)).toBeUndefined();
    expect(checkCvPdf({ ...good, pages: 1 })).toBeUndefined();
  });

  // covers: spec 0013 AC-12
  it('passes the fonts in any order, and repeated', () => {
    const fonts = [...CV_PDF_FONTS, ...CV_PDF_FONTS].toReversed();

    expect(checkCvPdf({ ...good, fonts })).toBeUndefined();
  });

  // covers: spec 0013 AC-12
  it('fails a PDF with no pages', () => {
    expect(checkCvPdf({ ...good, pages: 0 })).toBe(
      'cv.pdf has no pages; see spec 0013',
    );
  });

  // covers: spec 0013 AC-12
  it('fails a third page, naming the count and the cap', () => {
    expect(checkCvPdf({ ...good, pages: 3 })).toBe(
      'cv.pdf has 3 pages, over the cap of 2; shorten src/content/cv.json; see spec 0013',
    );
  });

  // covers: spec 0013 AC-12
  it('fails a missing font, listing what it found and what it expected', () => {
    const fonts = ['IBMPlexMono-Regular', 'IBMPlexMono-Medium'];

    expect(checkCvPdf({ ...good, fonts })).toBe(
      `cv.pdf embeds IBMPlexMono-Medium, IBMPlexMono-Regular, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular; ${FONTS_MESSAGE}`,
    );
  });

  // covers: spec 0013 AC-12
  it('fails a fourth font, such as a system face drawn for a missing letter', () => {
    const fonts = [...good.fonts, 'Menlo-Regular'];

    expect(checkCvPdf({ ...good, fonts })).toBe(
      `cv.pdf embeds IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular, Menlo-Regular, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular; ${FONTS_MESSAGE}`,
    );
  });

  // covers: spec 0013 AC-12
  it('fails a swapped font of the same count', () => {
    const fonts = [
      'IBMPlexMono-Medium',
      'IBMPlexMono-Regular',
      'IBMPlexSans-Medium',
    ];

    expect(checkCvPdf({ ...good, fonts })).toBe(
      `cv.pdf embeds IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Medium, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular; ${FONTS_MESSAGE}`,
    );
  });

  // covers: spec 0013 AC-12
  it('says no fonts when none is embedded', () => {
    expect(checkCvPdf({ ...good, fonts: [] })).toBe(
      `cv.pdf embeds no fonts, expected IBMPlexMono-Medium, IBMPlexMono-Regular, IBMPlexSans-Regular; ${FONTS_MESSAGE}`,
    );
  });

  // covers: spec 0013 AC-12
  it('fails a PDF that is not tagged', () => {
    expect(checkCvPdf({ ...good, tagged: false })).toBe(
      'cv.pdf is not tagged; see spec 0013',
    );
  });

  // covers: spec 0013 AC-12
  it('returns the first problem only: pages, then fonts, then tags', () => {
    const bad = { ...good, pages: 3, fonts: [], tagged: false };

    expect(checkCvPdf(bad)).toMatch(/^cv\.pdf has 3 pages/);
    expect(checkCvPdf({ ...bad, pages: 2 })).toMatch(
      /^cv\.pdf embeds no fonts/,
    );
    expect(checkCvPdf({ ...bad, pages: 0 })).toBe(
      'cv.pdf has no pages; see spec 0013',
    );
  });

  // covers: spec 0013 AC-12
  it('checks neither the size, the language, the title, nor the links', () => {
    const bare = {
      ...good,
      width: undefined,
      height: undefined,
      lang: undefined,
      title: undefined,
      uris: [],
    };

    expect(checkCvPdf(bare)).toBeUndefined();
  });
});
