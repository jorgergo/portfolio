import { describe, expect, it } from 'vitest';
import { CV_LIMITS } from '@/lib/cv-schema';
import {
  cardContent,
  DESCRIPTIONS,
  FOOTER_BUDGET,
  footerLength,
  formatPageTitle,
  formatSectionList,
  pageMeta,
  SHARE_IMAGE,
  SHARE_PAGES,
  sharePage,
  type MetaCv,
  type SharePageKey,
} from '@/lib/site-meta';

// Spec 0006. `cv` holds today's words inline rather than reading cv.json, so a
// content edit needs no test edit (the e2e cases check the real file); a
// second fixture varies the optional sections and the caps.
const group = { name: 'Frontend', keywords: ['Astro'] } as const;

const cv: MetaCv = {
  basics: {
    name: 'Jorge González Ozorno',
    label: 'Full Stack Developer',
    bio: 'Builds internal platforms.',
    location: { city: 'Toluca', countryCode: 'MX' },
  },
  skills: [group],
  technologies: [group],
};
const site = new URL('https://jorgergo.dev');

const fixture: MetaCv = {
  basics: {
    name: 'Ada Lovelace',
    label: 'Analyst',
    bio: 'Writes the first programs.',
    location: { city: 'London', countryCode: 'GB' },
  },
};

const withSections = (patch: Partial<MetaCv>): MetaCv => ({
  ...fixture,
  ...patch,
});

describe('SHARE_PAGES', () => {
  // covers: AC-10
  it('holds unique keys and unique absolute paths with no trailing slash', () => {
    const keys = SHARE_PAGES.map(({ key }) => key);
    const paths = SHARE_PAGES.map(({ path }) => path);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path).toMatch(/^\/([a-z-]+)?$/);
  });

  // covers: AC-5
  it('holds the home and CV rows, the CV row with its label', () => {
    expect(SHARE_PAGES).toEqual([
      { key: 'home', path: '/' },
      { key: 'cv', path: '/cv', label: 'CV' },
    ]);
  });
});

describe('sharePage', () => {
  // covers: AC-6, AC-10
  it('finds a row by its key', () => {
    expect(sharePage('cv')).toEqual({ key: 'cv', path: '/cv', label: 'CV' });
  });

  // covers: AC-6, AC-10
  it.each(['about', '', undefined])(
    'returns undefined for the unknown key %j',
    (key) => {
      expect(sharePage(key)).toBeUndefined();
    },
  );
});

describe('formatPageTitle', () => {
  // covers: AC-3
  it('reads name · label with no page label', () => {
    expect(formatPageTitle(cv.basics)).toBe(
      'Jorge González Ozorno · Full Stack Developer',
    );
  });

  // covers: AC-3
  it.each([
    ['CV', 'CV · Jorge González Ozorno'],
    ['Not found', 'Not found · Jorge González Ozorno'],
  ])('reads page · name for the page label %j', (page, expected) => {
    expect(formatPageTitle(cv.basics, page)).toBe(expected);
  });

  it('stays within 60 characters with a name and role at their caps', () => {
    const basics = {
      name: 'n'.repeat(CV_LIMITS.name),
      label: 'l'.repeat(CV_LIMITS.label),
    };

    expect(formatPageTitle(basics).length).toBeLessThanOrEqual(60);
    expect(formatPageTitle(basics, 'CV').length).toBeLessThanOrEqual(60);
  });
});

describe('formatSectionList', () => {
  // covers: AC-4
  it.each([
    [
      'skills and technologies',
      { skills: [group], technologies: [group] },
      'experience, education, skills, and technologies',
    ],
    ['skills only', { skills: [group] }, 'experience, education, and skills'],
    [
      'technologies only',
      { technologies: [group] },
      'experience, education, and technologies',
    ],
    ['neither', {}, 'experience and education'],
  ])('names the sections with %s', (_, patch, expected) => {
    expect(formatSectionList(withSections(patch))).toBe(expected);
  });

  // covers: AC-4
  it('treats an empty section as absent', () => {
    expect(formatSectionList({ skills: [], technologies: [] })).toBe(
      'experience and education',
    );
  });
});

describe('DESCRIPTIONS', () => {
  // covers: AC-4
  it('describes the home page with the bio', () => {
    expect(DESCRIPTIONS.home(cv)).toBe(cv.basics.bio);
  });

  // covers: AC-4
  it('describes the CV page with the name, the role, and its sections', () => {
    expect(DESCRIPTIONS.cv(cv)).toBe(
      'The CV of Jorge González Ozorno, Full Stack Developer: experience, education, skills, and technologies.',
    );
  });

  // covers: AC-4
  it('drops a section from the CV description when cv.json drops it', () => {
    expect(DESCRIPTIONS.cv(withSections({ skills: [group] }))).toBe(
      'The CV of Ada Lovelace, Analyst: experience, education, and skills.',
    );
    expect(DESCRIPTIONS.cv(fixture)).toBe(
      'The CV of Ada Lovelace, Analyst: experience and education.',
    );
  });

  it('keeps the CV description within 119 characters at the caps', () => {
    const capped: MetaCv = {
      ...fixture,
      basics: {
        ...fixture.basics,
        name: 'n'.repeat(CV_LIMITS.name),
        label: 'l'.repeat(CV_LIMITS.label),
      },
      skills: [group],
      technologies: [group],
    };

    expect(DESCRIPTIONS.cv(capped).length).toBeLessThanOrEqual(119);
  });
});

describe('pageMeta', () => {
  const metas = SHARE_PAGES.map(({ key }) => pageMeta(key, cv, site));

  // covers: AC-3, AC-4
  it('gives every row its own title and description', () => {
    const titles = metas.map(({ title }) => title);
    const descriptions = metas.map(({ description }) => description);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  // covers: AC-1, AC-5
  it('gives the home page its canonical, image, and alt text', () => {
    expect(pageMeta('home', cv, site)).toEqual({
      title: 'Jorge González Ozorno · Full Stack Developer',
      description: cv.basics.bio,
      share: {
        url: 'https://jorgergo.dev/',
        siteName: 'Jorge González Ozorno',
        image: {
          url: 'https://jorgergo.dev/og/home.png',
          alt: 'Jorge González Ozorno, Full Stack Developer',
          width: 1200,
          height: 630,
        },
      },
    });
  });

  // covers: AC-1, AC-5
  it('gives the CV page its canonical, image, and alt text', () => {
    const { title, share } = pageMeta('cv', cv, site);

    expect(title).toBe('CV · Jorge González Ozorno');
    expect(share?.url).toBe('https://jorgergo.dev/cv');
    expect(share?.image.url).toBe('https://jorgergo.dev/og/cv.png');
    expect(share?.image.alt).toBe(
      'CV, Jorge González Ozorno, Full Stack Developer',
    );
  });

  // covers: AC-1, AC-5
  it('builds every URL from site, so a new domain moves them all', () => {
    const other = new URL('https://example.com');

    expect(pageMeta('cv', cv, other).share?.url).toBe('https://example.com/cv');
    expect(pageMeta('cv', cv, other).share?.image.url).toBe(
      'https://example.com/og/cv.png',
    );
  });

  // covers: AC-5
  it('never puts .html in a canonical', () => {
    for (const { share } of metas) expect(share?.url).not.toMatch(/\.html$/);
  });

  // covers: AC-5, AC-10
  it('keeps the title and description but drops the share tags without site', () => {
    expect(pageMeta('cv', cv, undefined)).toEqual({
      title: 'CV · Jorge González Ozorno',
      description: DESCRIPTIONS.cv(cv),
      share: undefined,
    });
  });

  // covers: AC-6
  it('declares the card size the endpoint draws', () => {
    expect(SHARE_IMAGE).toEqual({
      type: 'image/png',
      width: 1200,
      height: 630,
    });
  });
});

describe('cardContent', () => {
  // covers: AC-7
  it('gives the home card no label and a bare host in the footer', () => {
    expect(cardContent('home', cv, site)).toEqual({
      label: undefined,
      name: 'Jorge González Ozorno',
      role: 'Full Stack Developer',
      footerStart: 'jorgergo.dev',
      footerEnd: 'Toluca, MX',
    });
  });

  // covers: AC-7
  it('gives the CV card its label and the host with the path', () => {
    expect(cardContent('cv', cv, site)).toEqual({
      label: 'CV',
      name: 'Jorge González Ozorno',
      role: 'Full Stack Developer',
      footerStart: 'jorgergo.dev/cv',
      footerEnd: 'Toluca, MX',
    });
  });

  // covers: AC-7
  it('reads the words from the CV it is given', () => {
    expect(cardContent('cv', fixture, site)).toMatchObject({
      name: 'Ada Lovelace',
      role: 'Analyst',
      footerEnd: 'London, GB',
    });
  });

  // covers: AC-10
  it('returns undefined without site', () => {
    expect(cardContent('cv', cv, undefined)).toBeUndefined();
  });
});

describe('footerLength', () => {
  const footerOf = (key: SharePageKey, source: MetaCv): number => {
    const content = cardContent(key, source, site);
    if (content === undefined) throw new Error('cardContent needs site here');
    return footerLength(content);
  };

  // covers: AC-17
  it.each([
    ['home', 22],
    ['cv', 25],
  ] as const)(
    'counts today’s %s card footer as %i characters',
    (key, length) => {
      expect(footerOf(key, cv)).toBe(length);
    },
  );

  // covers: AC-17
  it('counts code points, so a letter outside the Basic Multilingual Plane counts once', () => {
    const content = { name: 'A', role: 'B', footerStart: 'a\u{10428}' };

    expect(footerLength({ ...content, footerEnd: 'b' })).toBe(3);
  });

  // covers: AC-17
  it('keeps every card within the budget with the city at its cap', () => {
    const longCity: MetaCv = {
      ...cv,
      basics: {
        ...cv.basics,
        location: { city: 'a'.repeat(CV_LIMITS.city), countryCode: 'MX' },
      },
    };

    expect(FOOTER_BUDGET).toBe(60);
    for (const { key } of SHARE_PAGES) {
      expect(footerOf(key, longCity)).toBeLessThanOrEqual(FOOTER_BUDGET);
    }
  });
});
