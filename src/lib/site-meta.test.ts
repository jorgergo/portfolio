import { describe, expect, it } from 'vitest';
import { formatContactRows } from '@/lib/cv-format';
import { CV_LIMITS } from '@/lib/cv-schema';
import {
  cardContent,
  DESCRIPTIONS,
  FOOTER_BUDGET,
  footerLength,
  formatChannelList,
  formatPageTitle,
  formatSectionList,
  givenName,
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
    profiles: [{ network: 'GitHub' }, { network: 'LinkedIn' }],
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

  // covers: AC-5, spec 0009 AC-2, spec 0010 AC-4, spec 0011 AC-2
  it('holds the home, About, CV, Projects, and Contact rows in menu order, each but home labelled', () => {
    expect(SHARE_PAGES).toEqual([
      { key: 'home', path: '/' },
      { key: 'about', path: '/about', label: 'About' },
      { key: 'cv', path: '/cv', label: 'CV' },
      { key: 'projects', path: '/projects', label: 'Projects' },
      { key: 'contact', path: '/contact', label: 'Contact' },
    ]);
  });
});

describe('sharePage', () => {
  // covers: AC-6, AC-10
  it('finds a row by its key', () => {
    expect(sharePage('cv')).toEqual({ key: 'cv', path: '/cv', label: 'CV' });
  });

  // covers: AC-6, AC-10
  it.each(['missing', '', undefined])(
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
    ['About', 'About · Jorge González Ozorno'],
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

describe('givenName', () => {
  // covers: spec 0009 AC-2
  it.each([
    ['Jorge González Ozorno', 'Jorge'],
    ['Ana', 'Ana'],
    ['  Ana  Ruiz ', 'Ana'],
    ['', ''],
  ])('reads the given name of %j as %j', (name, expected) => {
    expect(givenName(name)).toBe(expected);
  });

  // covers: spec 0009 AC-2
  it.each([
    ['Ana\tRuiz', 'Ana'],
    ['\nAna\nRuiz\n', 'Ana'],
    [' \t\n', ''],
  ])('splits %j at any whitespace, giving %j', (name, expected) => {
    expect(givenName(name)).toBe(expected);
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

describe('formatChannelList', () => {
  // covers: spec 0011 AC-2
  it.each([
    [
      'two profiles',
      [{ network: 'GitHub' }, { network: 'LinkedIn' }],
      'email, GitHub, or LinkedIn',
    ],
    ['one profile', [{ network: 'GitHub' }], 'email or GitHub'],
    ['no profiles', [], 'email'],
    ['profiles missing', undefined, 'email'],
  ])('names the channels with %s', (_, profiles, expected) => {
    expect(formatChannelList({ profiles })).toBe(expected);
  });

  // covers: spec 0011 AC-2 (the description names the channels in row order)
  it('keeps the cv.json order of the profiles after email', () => {
    expect(
      formatChannelList({
        profiles: [{ network: 'LinkedIn' }, { network: 'GitHub' }],
      }),
    ).toBe('email, LinkedIn, or GitHub');
  });

  const github = {
    network: 'GitHub',
    username: 'ada',
    url: 'https://github.com/ada',
  } as const;
  const linkedin = {
    network: 'LinkedIn',
    username: 'ada',
    url: 'https://www.linkedin.com/in/ada/',
  } as const;

  // covers: spec 0011 AC-2, AC-3 (the description and the rows share one
  // order, so changing it in one helper alone fails here)
  it.each([
    ['two profiles', [github, linkedin]],
    ['the profiles reversed', [linkedin, github]],
    ['no profiles', []],
  ] as const)(
    'names the channels in the contact row order with %s',
    (_, profiles) => {
      const keys = formatContactRows({
        email: 'ada@example.com',
        profiles,
      }).map(({ key }) => key);

      expect(formatChannelList({ profiles }).toLowerCase()).toBe(
        new Intl.ListFormat('en', { type: 'disjunction' }).format(keys),
      );
    },
  );
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

  // covers: spec 0009 AC-2
  it('describes the about page with the given name', () => {
    expect(DESCRIPTIONS.about(cv)).toBe(
      'What Jorge cares about, at work and away from it.',
    );
    expect(DESCRIPTIONS.about(fixture)).toBe(
      'What Ada cares about, at work and away from it.',
    );
  });

  // covers: spec 0010 AC-4
  it('describes the projects page with the given name', () => {
    expect(DESCRIPTIONS.projects(cv)).toBe(
      'What Jorge has built, with the stack behind each project and where it stands.',
    );
    expect(DESCRIPTIONS.projects(fixture)).toBe(
      'What Ada has built, with the stack behind each project and where it stands.',
    );
  });

  // covers: spec 0011 AC-2
  it('describes the contact page with the given name and the channels', () => {
    expect(DESCRIPTIONS.contact(cv)).toBe(
      'How to reach Jorge: email, GitHub, or LinkedIn.',
    );
    expect(DESCRIPTIONS.contact(fixture)).toBe('How to reach Ada: email.');
    expect(
      DESCRIPTIONS.contact({
        ...fixture,
        basics: { ...fixture.basics, profiles: [{ network: 'GitHub' }] },
      }),
    ).toBe('How to reach Ada: email or GitHub.');
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

  // covers: spec 0009 AC-1, AC-2
  it('gives the about page its title, description, canonical, image, and alt text', () => {
    expect(pageMeta('about', cv, site)).toEqual({
      title: 'About · Jorge González Ozorno',
      description: 'What Jorge cares about, at work and away from it.',
      share: {
        url: 'https://jorgergo.dev/about',
        siteName: 'Jorge González Ozorno',
        image: {
          url: 'https://jorgergo.dev/og/about.png',
          alt: 'About, Jorge González Ozorno, Full Stack Developer',
          width: 1200,
          height: 630,
        },
      },
    });
  });

  // covers: spec 0010 AC-4
  it('gives the projects page its title, description, canonical, image, and alt text', () => {
    expect(pageMeta('projects', cv, site)).toEqual({
      title: 'Projects · Jorge González Ozorno',
      description:
        'What Jorge has built, with the stack behind each project and where it stands.',
      share: {
        url: 'https://jorgergo.dev/projects',
        siteName: 'Jorge González Ozorno',
        image: {
          url: 'https://jorgergo.dev/og/projects.png',
          alt: 'Projects, Jorge González Ozorno, Full Stack Developer',
          width: 1200,
          height: 630,
        },
      },
    });
  });

  // covers: spec 0011 AC-1, AC-2
  it('gives the contact page its title, description, canonical, image, and alt text', () => {
    expect(pageMeta('contact', cv, site)).toEqual({
      title: 'Contact · Jorge González Ozorno',
      description: 'How to reach Jorge: email, GitHub, or LinkedIn.',
      share: {
        url: 'https://jorgergo.dev/contact',
        siteName: 'Jorge González Ozorno',
        image: {
          url: 'https://jorgergo.dev/og/contact.png',
          alt: 'Contact, Jorge González Ozorno, Full Stack Developer',
          width: 1200,
          height: 630,
        },
      },
    });
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

  // covers: AC-17, spec 0009 AC-2, spec 0010 AC-4, spec 0011 AC-2
  it.each([
    ['home', 22],
    ['about', 28],
    ['cv', 25],
    ['projects', 31],
    ['contact', 30],
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
