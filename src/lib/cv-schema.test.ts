import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import cvFile from '@/content/cv.json';
import {
  CV_LIMITS,
  EMAIL_TOKEN,
  makeCvSchema,
  PRIVATE_SOURCE,
  PROJECT_STATUSES,
  regionName,
  splitAtEmail,
} from '@/lib/cv-schema';

// Spec 0002: tests pass a plain string stub for Astro's image() helper.
const schema = makeCvSchema(() => z.string());

type Data = Readonly<Record<string, unknown>>;

// Every issue as "dotted.path: message", the shape the build prints.
const issues = (data: unknown): readonly string[] => {
  const result = schema.safeParse(data);
  return result.success
    ? []
    : result.error.issues.map(
        (issue) => `${issue.path.map(String).join('.')}: ${issue.message}`,
      );
};

const omit = (data: Data, key: string): Data =>
  Object.fromEntries(Object.entries(data).filter(([name]) => name !== key));

const chars = (count: number): string => 'a'.repeat(count);

// A name of `count` characters in three parts, so no part fills a card line.
const nameOf = (count: number): string =>
  `${chars(10)} ${chars(10)} ${chars(count - 22)}`;

const location = { city: 'Monterrey', countryCode: 'MX' } as const;

const basics = {
  name: 'Ada Lovelace',
  label: 'Full Stack Developer',
  bio: 'Builds things.',
  summary: 'Builds web platforms.',
  email: 'ada@example.com',
  location,
} as const;

const role = {
  name: 'Acme',
  position: 'Developer',
  startDate: '2022-01',
  endDate: '2023-06',
  highlights: ['Shipped the thing.'],
} as const;

const school = {
  institution: 'Tec de Monterrey',
  studyType: 'Bachelor',
  area: 'Computer Science',
  startDate: '2018-08',
  endDate: '2022-06',
} as const;

// Three items, the fewest the schema accepts (spec 0009).
const about = {
  intro: 'Hi, I care about...',
  items: ['Code. Small tools.', 'Music. The piano.', 'Sport. Running.'],
  closing: 'Write to me at {email}.',
} as const;

// Building, private code, no url, no cv flag, so the live, cv count, and
// empty CV cases start from a clean base (spec 0010).
const project = {
  name: 'Ledger',
  description: 'Tracks what I spend.',
  startDate: '2024-03',
  status: 'building',
  source: PRIVATE_SOURCE,
  keywords: ['Astro'],
} as const;

const minimalCv = {
  basics,
  about,
  projects: [project],
  work: [role],
  education: [school],
} as const;

const withBasics = (patch: Data): Data => ({
  ...minimalCv,
  basics: { ...basics, ...patch },
});

const withAbout = (patch: Data): Data => ({
  ...minimalCv,
  about: { ...about, ...patch },
});

const withProjects = (projects: readonly Data[]): Data => ({
  ...minimalCv,
  projects,
});

const withProject = (patch: Data): Data =>
  withProjects([{ ...project, ...patch }]);

const withRole = (patch: Data): Data => ({
  ...minimalCv,
  work: [{ ...role, ...patch }],
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

describe('makeCvSchema: valid content', () => {
  // covers: AC-13
  it('accepts the committed cv.json main entry', () => {
    expect(issues(cvFile.main)).toEqual([]);
  });

  // covers: AC-3
  it('accepts a CV with only the required sections', () => {
    expect(issues(minimalCv)).toEqual([]);
  });

  // covers: AC-3
  it('accepts every optional section when filled in', () => {
    const full = {
      ...minimalCv,
      basics: { ...basics, profiles: [github, linkedin] },
      volunteer: [{ ...omit(role, 'name'), organization: 'Food Bank' }],
      awards: [{ title: 'Winner', awarder: 'Hackathon', date: '2021-10' }],
      certificates: [{ name: 'EF SET', issuer: 'EF', date: '2024-02' }],
      skills: [{ name: 'Leadership', keywords: ['Mentoring'] }],
      technologies: [{ name: 'Frontend', keywords: ['Astro'] }],
      languages: [
        { language: 'Spanish', fluency: 'Native' },
        { language: 'English', fluency: 'Professional', level: 'C1' },
      ],
      interests: [{ name: 'Running' }, { name: 'Music', keywords: ['Jazz'] }],
    };

    expect(issues(full)).toEqual([]);
  });

  it('trims text, so the parsed value has no surrounding spaces', () => {
    const parsed = schema.parse(withBasics({ name: '  Ada Lovelace  ' }));

    expect(parsed.basics.name).toBe('Ada Lovelace');
  });
});

describe('makeCvSchema: required fields', () => {
  // covers: AC-3
  it.each(['name', 'label', 'bio', 'summary', 'email', 'location'])(
    'fails at basics.%s when it is missing',
    (field) => {
      const data = { ...minimalCv, basics: omit(basics, field) };

      expect(issues(data)).toEqual([
        expect.stringMatching(`^basics.${field}:`),
      ]);
    },
  );

  // covers: AC-3
  it.each(['city', 'countryCode'])(
    'fails at basics.location.%s when it is missing',
    (field) => {
      const data = withBasics({ location: omit(location, field) });

      expect(issues(data)).toEqual([
        expect.stringMatching(`^basics.location.${field}:`),
      ]);
    },
  );

  // covers: AC-3, spec 0010 AC-1
  it.each(['work', 'education', 'projects'])(
    'fails at %s when it has no entries',
    (section) => {
      expect(issues({ ...minimalCv, [section]: [] })).toEqual([
        expect.stringMatching(`^${section}:`),
      ]);
    },
  );

  // covers: AC-3, spec 0010 AC-1
  it.each(['work', 'education', 'basics', 'about', 'projects'])(
    'fails at %s when the section is left out',
    (section) => {
      expect(issues(omit(minimalCv, section))).toEqual([
        expect.stringMatching(`^${section}:`),
      ]);
    },
  );

  it('treats a whitespace only value as missing', () => {
    expect(issues(withBasics({ name: '   ' }))).toEqual([
      expect.stringMatching(/^basics\.name:/),
    ]);
  });
});

describe('makeCvSchema: unknown keys', () => {
  // covers: AC-4
  it('rejects a typo such as higlights inside a role', () => {
    expect(issues(withRole({ higlights: ['Typo.'] }))).toEqual([
      'work.0: Unrecognized key: "higlights"',
    ]);
  });

  // covers: AC-4
  it('rejects a $schema key inside the main entry', () => {
    expect(issues({ ...minimalCv, $schema: './cv.schema.json' })).toEqual([
      ': Unrecognized key: "$schema"',
    ]);
  });

  // covers: AC-4
  it('rejects unknown keys in nested objects such as basics.location', () => {
    expect(
      issues(withBasics({ location: { ...location, street: 'Main St 1' } })),
    ).toEqual(['basics.location: Unrecognized key: "street"']);
  });

  it('has no phone field, so a phone number cannot be published', () => {
    expect(issues(withBasics({ phone: '+52 55 0000 0000' }))).toEqual([
      'basics: Unrecognized key: "phone"',
    ]);
  });
});

describe('makeCvSchema: formats', () => {
  // covers: AC-5
  it.each(['2023-13', '2023-1', '2023-00', '23-01', '2023/01', ''])(
    'rejects the month %j with the YYYY-MM message',
    (month) => {
      expect(issues(withRole({ startDate: month }))).toEqual([
        'work.0.startDate: expected a month as YYYY-MM (01 to 12)',
      ]);
    },
  );

  // covers: AC-5
  it('checks the month format on single dates such as award.date', () => {
    const data = {
      ...minimalCv,
      awards: [{ title: 'Winner', awarder: 'Hackathon', date: '2021-1' }],
    };

    expect(issues(data)).toEqual([
      'awards.0.date: expected a month as YYYY-MM (01 to 12)',
    ]);
  });

  // covers: AC-5
  it('rejects an invalid email', () => {
    expect(issues(withBasics({ email: 'ada.example.com' }))).toEqual([
      expect.stringMatching(/^basics\.email:/),
    ]);
  });

  // covers: AC-5
  it.each(['http://github.com/ada', 'ftp://github.com/ada', 'github.com/ada'])(
    'rejects the profile url %j because it is not https',
    (url) => {
      const data = withBasics({ profiles: [{ ...github, url }] });

      expect(issues(data)).toEqual([
        expect.stringMatching(/^basics\.profiles\.0\.url:/),
      ]);
    },
  );

  // covers: AC-5
  it('rejects a non https url on an entry', () => {
    expect(issues(withRole({ url: 'http://acme.example' }))).toEqual([
      expect.stringMatching(/^work\.0\.url:/),
    ]);
  });

  // covers: AC-5
  it.each([
    ['XX', 'unknown ISO 3166 region code'],
    ['ZZ', 'unknown ISO 3166 region code'],
    ['mx', 'expected an uppercase ISO 3166 two letter code'],
    ['MXX', 'expected an uppercase ISO 3166 two letter code'],
    ['', 'expected an uppercase ISO 3166 two letter code'],
  ])(
    'rejects the country code %j with one clear error and no throw',
    (countryCode, message) => {
      const data = withBasics({ location: { ...location, countryCode } });

      expect(issues(data)).toEqual([`basics.location.countryCode: ${message}`]);
    },
  );

  // covers: AC-5
  it('rejects a network other than GitHub or LinkedIn', () => {
    const data = withBasics({ profiles: [{ ...github, network: 'X' }] });

    expect(issues(data)).toEqual([
      expect.stringMatching(/^basics\.profiles\.0\.network:/),
    ]);
  });

  // covers: AC-5
  it('rejects a fluency outside the fixed list', () => {
    const data = {
      ...minimalCv,
      languages: [{ language: 'English', fluency: 'Expert' }],
    };

    expect(issues(data)).toEqual([
      expect.stringMatching(/^languages\.0\.fluency:/),
    ]);
  });

  // covers: AC-5
  it('rejects a level outside A1 to C2', () => {
    const data = {
      ...minimalCv,
      languages: [{ language: 'English', fluency: 'Fluent', level: 'D1' }],
    };

    expect(issues(data)).toEqual([
      expect.stringMatching(/^languages\.0\.level:/),
    ]);
  });

  // covers: AC-5
  it.each(['skills', 'technologies'])(
    'rejects a %s group with no keywords',
    (section) => {
      const data = {
        ...minimalCv,
        [section]: [{ name: 'Empty', keywords: [] }],
      };

      expect(issues(data)).toEqual([
        expect.stringMatching(`^${section}.0.keywords:`),
      ]);
    },
  );
});

describe('makeCvSchema: date order', () => {
  const swapped = { startDate: '2023-05', endDate: '2022-01' } as const;

  // covers: AC-6
  it('fails at work.N.endDate when the end is before the start', () => {
    expect(issues(withRole(swapped))).toEqual([
      'work.0.endDate: endDate is before startDate',
    ]);
  });

  // covers: AC-6
  it('fails at volunteer.N.endDate when the end is before the start', () => {
    const volunteer = {
      organization: 'Food Bank',
      position: 'Volunteer',
      highlights: [],
      ...swapped,
    };

    expect(issues({ ...minimalCv, volunteer: [volunteer] })).toEqual([
      'volunteer.0.endDate: endDate is before startDate',
    ]);
  });

  // covers: AC-6
  it('fails at education.N.endDate when the end is before the start', () => {
    const data = { ...minimalCv, education: [{ ...school, ...swapped }] };

    expect(issues(data)).toEqual([
      'education.0.endDate: endDate is before startDate',
    ]);
  });

  // covers: AC-6
  it('points at the right entry index', () => {
    const data = { ...minimalCv, work: [role, { ...role, ...swapped }] };

    expect(issues(data)).toEqual([
      'work.1.endDate: endDate is before startDate',
    ]);
  });

  it('accepts a role that starts and ends in the same month', () => {
    expect(
      issues(withRole({ startDate: '2023-03', endDate: '2023-03' })),
    ).toEqual([]);
  });

  it('accepts a current role with no end date', () => {
    expect(issues({ ...minimalCv, work: [omit(role, 'endDate')] })).toEqual([]);
  });

  // Review 2026-09-24: a malformed start must not add a second, misleading
  // date order error on a correct endDate.
  it('reports only the malformed start when the end is also earlier', () => {
    expect(
      issues(withRole({ startDate: '2023-13', endDate: '2022-01' })),
    ).toEqual(['work.0.startDate: expected a month as YYYY-MM (01 to 12)']);
  });
});

describe('makeCvSchema: caps', () => {
  // covers: AC-7, spec 0006 AC-2, spec 0010 AC-1
  it('reads every cap from CV_LIMITS with the values in specs 0002, 0006, 0009, and 0010', () => {
    expect(CV_LIMITS).toEqual({
      name: 30,
      namePart: 24,
      label: 27,
      city: 24,
      bio: 160,
      summary: 500,
      entrySummary: 220,
      highlight: 220,
      highlights: 5,
      courses: 8,
      aboutIntro: 40,
      aboutItem: 100,
      aboutItemsMin: 3,
      aboutItems: 7,
      aboutClosing: 160,
      projectName: 30,
      projectDescription: 120,
      projectKeyword: 20,
      projectKeywords: 6,
      projects: 8,
      cvProjectsMax: 2,
    });
  });

  // covers: AC-7, spec 0006 AC-2
  it.each([
    ['name', CV_LIMITS.name, nameOf],
    ['label', CV_LIMITS.label, chars],
    ['bio', CV_LIMITS.bio, chars],
    ['summary', CV_LIMITS.summary, chars],
  ])('accepts basics.%s at exactly %i characters', (field, cap, make) => {
    expect(issues(withBasics({ [field]: make(cap) }))).toEqual([]);
  });

  // covers: AC-7, spec 0006 AC-2
  it.each([
    ['name', CV_LIMITS.name, nameOf],
    ['label', CV_LIMITS.label, chars],
    ['bio', CV_LIMITS.bio, chars],
    ['summary', CV_LIMITS.summary, chars],
  ])('fails at basics.%s one character past %i', (field, cap, make) => {
    expect(issues(withBasics({ [field]: make(cap + 1) }))).toEqual([
      expect.stringMatching(`^basics.${field}:`),
    ]);
  });

  // covers: spec 0006 AC-17
  it('accepts basics.location.city at exactly 24 characters and fails at 25', () => {
    const withCity = (city: string): Data =>
      withBasics({ location: { ...location, city } });

    expect(issues(withCity(chars(CV_LIMITS.city)))).toEqual([]);
    expect(issues(withCity(chars(CV_LIMITS.city + 1)))).toEqual([
      expect.stringMatching(/^basics\.location\.city:/),
    ]);
  });

  it('counts the cap after trimming surrounding spaces', () => {
    expect(issues(withBasics({ bio: `  ${chars(CV_LIMITS.bio)}  ` }))).toEqual(
      [],
    );
  });

  // covers: AC-7
  it('accepts exactly 5 highlights and fails at a sixth', () => {
    const five = Array.from({ length: CV_LIMITS.highlights }, () => 'Did it.');

    expect(issues(withRole({ highlights: five }))).toEqual([]);
    expect(issues(withRole({ highlights: [...five, 'One more.'] }))).toEqual([
      expect.stringMatching(/^work\.0\.highlights:/),
    ]);
  });

  // covers: AC-7
  it('accepts a 220 character highlight and fails at 221', () => {
    const cap = CV_LIMITS.highlight;

    expect(issues(withRole({ highlights: [chars(cap)] }))).toEqual([]);
    expect(issues(withRole({ highlights: [chars(cap + 1)] }))).toEqual([
      expect.stringMatching(/^work\.0\.highlights\.0:/),
    ]);
  });

  // covers: AC-7
  it('accepts a 220 character entry summary and fails at 221', () => {
    const cap = CV_LIMITS.entrySummary;

    expect(issues(withRole({ summary: chars(cap) }))).toEqual([]);
    expect(issues(withRole({ summary: chars(cap + 1) }))).toEqual([
      expect.stringMatching(/^work\.0\.summary:/),
    ]);
  });

  // covers: AC-7
  it('caps award summaries at the entry summary limit too', () => {
    const award = { title: 'Winner', awarder: 'Hackathon', date: '2021-10' };
    const data = {
      ...minimalCv,
      awards: [{ ...award, summary: chars(CV_LIMITS.entrySummary + 1) }],
    };

    expect(issues(data)).toEqual([
      expect.stringMatching(/^awards\.0\.summary:/),
    ]);
  });

  // covers: AC-7
  it('accepts 8 courses and fails at a ninth', () => {
    const eight = Array.from({ length: CV_LIMITS.courses }, (_, i) => `C${i}`);
    const withCourses = (courses: readonly string[]): Data => ({
      ...minimalCv,
      education: [{ ...school, courses }],
    });

    expect(issues(withCourses(eight))).toEqual([]);
    expect(issues(withCourses([...eight, 'C8']))).toEqual([
      expect.stringMatching(/^education\.0\.courses:/),
    ]);
  });
});

describe('makeCvSchema: profiles', () => {
  // covers: AC-8
  it('fails at the second profile when a network repeats', () => {
    const data = withBasics({
      profiles: [github, { ...github, username: 'b' }],
    });

    expect(issues(data)).toEqual([
      'basics.profiles.1.network: duplicate network',
    ]);
  });

  // covers: AC-8
  it('flags only the later duplicate, not the first occurrence', () => {
    const data = withBasics({ profiles: [github, linkedin, github] });

    expect(issues(data)).toEqual([
      'basics.profiles.2.network: duplicate network',
    ]);
  });

  it('accepts one profile per network', () => {
    expect(issues(withBasics({ profiles: [github, linkedin] }))).toEqual([]);
  });
});

describe('makeCvSchema: image', () => {
  // covers: AC-12
  it('leaves image undefined when it is absent', () => {
    expect(schema.parse(minimalCv).basics.image).toBeUndefined();
  });

  // covers: AC-12
  it('passes basics.image through the image helper it was given', () => {
    const parsed = schema.parse(withBasics({ image: '../assets/avatar.jpg' }));

    expect(parsed.basics.image).toBe('../assets/avatar.jpg');
  });
});

describe('regionName', () => {
  // covers: AC-11
  it.each([
    ['MX', 'Mexico'],
    ['US', 'United States'],
    ['ES', 'Spain'],
  ])('names %s as %s in English', (code, name) => {
    expect(regionName(code)).toBe(name);
  });

  it.each(['XX', 'ZZ'])(
    'returns undefined for the well formed but unknown code %s',
    (code) => {
      expect(regionName(code)).toBeUndefined();
    },
  );

  // Review 2026-09-24: of() throws a RangeError on these; the helper must not.
  it.each(['mx', 'MXX', '', 'M1', '419'])(
    'returns undefined instead of throwing for the malformed code %j',
    (code) => {
      expect(regionName(code)).toBeUndefined();
    },
  );
});

describe('makeCvSchema: card text (spec 0006)', () => {
  const outside = (characters: string): string =>
    `characters outside the card font (latin): ${characters}; see spec 0006`;

  const withCity = (city: string): Data =>
    withBasics({ location: { ...location, city } });

  // covers: spec 0006 AC-15
  it('fails a name with letters the card font lacks, naming each once', () => {
    expect(issues(withBasics({ name: 'Łukasz Żółkiewski' }))).toEqual([
      `basics.name: ${outside('Ł, Ż, ł')}`,
    ]);
  });

  // covers: spec 0006 AC-15
  it.each(['Seán O’Brien', 'Zoë'])(
    'accepts the name %j, whose letters the card font draws',
    (name) => {
      expect(issues(withBasics({ name }))).toEqual([]);
    },
  );

  // covers: spec 0006 AC-15
  it('fails a role with letters the card font lacks', () => {
    expect(issues(withBasics({ label: 'Разработчик' }))).toEqual([
      `basics.label: ${outside('Р, а, з, р, б, о, т, ч, и, к')}`,
    ]);
  });

  // covers: spec 0006 AC-15
  it('fails a Cyrillic city', () => {
    expect(issues(withCity('Москва'))).toEqual([
      `basics.location.city: ${outside('М, о, с, к, в, а')}`,
    ]);
  });

  // covers: spec 0006 AC-15
  it('reports both problems when a name is over its cap and holds a missing letter', () => {
    const name = `Łukasz ${chars(CV_LIMITS.namePart)}`;

    expect(name).toHaveLength(CV_LIMITS.name + 1);
    expect(issues(withBasics({ name }))).toEqual([
      expect.stringMatching(/^basics\.name: Too big/),
      `basics.name: ${outside('Ł')}`,
    ]);
  });

  // covers: spec 0006 AC-15
  it('fails a name whose hyphen is U+2010, which the card draws as an empty box', () => {
    // The package's latin range lists U+2000-206F, but the woff files have no
    // glyph for U+2010 (a 2026-09-25 probe of their cmap and a rendered card).
    expect(issues(withBasics({ name: 'Jean\u2010Luc Picard' }))).toEqual([
      `basics.name: ${outside('\u2010')}`,
    ]);
  });

  // covers: spec 0006 AC-15, AC-16
  it('reports the cap, a missing letter, and a long part together in one build', () => {
    const name = `Ł${chars(CV_LIMITS.namePart)} Lee Cruz`;

    expect(issues(withBasics({ name }))).toEqual([
      expect.stringMatching(/^basics\.name: Too big/),
      `basics.name: ${outside('Ł')}`,
      'basics.name: a name part holds 25 characters, over 24 (one card line); see spec 0006',
    ]);
  });

  // covers: spec 0006 AC-16
  it('accepts a name part of exactly 24 characters', () => {
    expect(issues(withBasics({ name: `Ada ${chars(24)}` }))).toEqual([]);
  });

  // covers: spec 0006 AC-16
  it('fails a name part of 25 characters, giving its length', () => {
    expect(issues(withBasics({ name: `Ada ${chars(25)}` }))).toEqual([
      'basics.name: a name part holds 25 characters, over 24 (one card line); see spec 0006',
    ]);
  });

  // covers: spec 0006 AC-16
  it('splits a part right after a hyphen, where the card breaks the line', () => {
    const name = 'Wolfeschlegel-Steinhausenberg';

    expect(name).toHaveLength(29);
    expect(issues(withBasics({ name }))).toEqual([]);
  });

  // covers: spec 0006 AC-16
  it('keeps the hyphen with the part before it', () => {
    // The hyphen stays on the line, so 24 letters plus it need 25 columns.
    expect(issues(withBasics({ name: `${chars(24)}-Lee` }))).toEqual([
      expect.stringMatching(/^basics\.name: a name part holds 25 characters/),
    ]);
  });

  // covers: spec 0006 AC-16
  it('counts no empty part at a doubled or trailing hyphen', () => {
    expect(issues(withBasics({ name: 'Ada--Lee-' }))).toEqual([]);
  });

  // covers: spec 0006 AC-16
  it('fails a long run joined by a no break space, where the card cannot break the line', () => {
    // Satori never breaks at U+00A0, so these 28 characters draw as one line
    // and run past the right padding.
    expect(issues(withBasics({ name: `Ana\u00A0${chars(24)}` }))).toEqual([
      expect.stringMatching(/^basics\.name: /),
    ]);
  });

  // covers: spec 0006 AC-16
  it('counts a separately typed accent as its own character, with no normalizing', () => {
    // e plus U+0308 is two code points; composed, it would be one ë.
    expect(issues(withBasics({ name: `Ada ${chars(23)}e\u0308` }))).toEqual([
      'basics.name: a name part holds 25 characters, over 24 (one card line); see spec 0006',
    ]);
  });
});

describe('makeCvSchema: about (spec 0009)', () => {
  const tokenMissing =
    'about.closing: closing must hold {email} exactly once, where basics.email goes; see spec 0009';

  const lines = (count: number): readonly string[] =>
    Array.from({ length: count }, (_, i) => `Line ${i}.`);

  // covers: spec 0009 AC-3
  it.each(['intro', 'items', 'closing'])(
    'fails at about.%s when it is missing',
    (field) => {
      expect(issues({ ...minimalCv, about: omit(about, field) })).toEqual([
        expect.stringMatching(`^about.${field}:`),
      ]);
    },
  );

  // covers: spec 0009 AC-3
  it('rejects an unknown key inside about, such as a photo', () => {
    expect(issues(withAbout({ photo: 'me.jpg' }))).toEqual([
      'about: Unrecognized key: "photo"',
    ]);
  });

  // covers: spec 0009 AC-3
  it.each(['', '   '])('fails an intro of %j as too small', (intro) => {
    expect(issues(withAbout({ intro }))).toEqual([
      expect.stringMatching(/^about\.intro: Too small/),
    ]);
  });

  // covers: spec 0009 AC-3
  it.each(['', '   '])('fails an item of %j at its index', (item) => {
    expect(issues(withAbout({ items: ['Code.', item, 'Sport.'] }))).toEqual([
      expect.stringMatching(/^about\.items\.1: Too small/),
    ]);
  });

  // covers: spec 0009 AC-3
  it.each(['', '   '])(
    'fails a closing of %j as too small and as missing the marker',
    (closing) => {
      expect(issues(withAbout({ closing }))).toEqual([
        expect.stringMatching(/^about\.closing: Too small/),
        tokenMissing,
      ]);
    },
  );

  // covers: spec 0009 AC-3
  it('accepts 3 and 7 items, and fails at 2 and at 8', () => {
    const withItems = (count: number): Data =>
      withAbout({ items: lines(count) });

    expect(issues(withItems(CV_LIMITS.aboutItemsMin))).toEqual([]);
    expect(issues(withItems(CV_LIMITS.aboutItems))).toEqual([]);
    expect(issues(withItems(CV_LIMITS.aboutItemsMin - 1))).toEqual([
      expect.stringMatching(/^about\.items: Too small/),
    ]);
    expect(issues(withItems(CV_LIMITS.aboutItems + 1))).toEqual([
      expect.stringMatching(/^about\.items: Too big/),
    ]);
  });

  // covers: spec 0009 AC-3
  it('accepts a 40 character intro and fails at 41', () => {
    const cap = CV_LIMITS.aboutIntro;

    expect(issues(withAbout({ intro: chars(cap) }))).toEqual([]);
    expect(issues(withAbout({ intro: chars(cap + 1) }))).toEqual([
      expect.stringMatching(/^about\.intro: Too big/),
    ]);
  });

  // covers: spec 0009 AC-3
  it('accepts a 100 character item and fails at 101', () => {
    const cap = CV_LIMITS.aboutItem;
    const withFirst = (item: string): Data =>
      withAbout({ items: [item, ...lines(2)] });

    expect(issues(withFirst(chars(cap)))).toEqual([]);
    expect(issues(withFirst(chars(cap + 1)))).toEqual([
      expect.stringMatching(/^about\.items\.0: Too big/),
    ]);
  });

  // covers: spec 0009 AC-3
  it('accepts a 160 character closing and fails at 161 with the cap alone', () => {
    // The marker counts its own 7 characters. Every fixture holds it, since
    // zod runs the marker rule even after a failed cap.
    const cap = CV_LIMITS.aboutClosing;
    const closingOf = (count: number): string =>
      `${EMAIL_TOKEN}${chars(count - EMAIL_TOKEN.length)}`;

    expect(closingOf(cap)).toHaveLength(cap);
    expect(issues(withAbout({ closing: closingOf(cap) }))).toEqual([]);
    expect(issues(withAbout({ closing: closingOf(cap + 1) }))).toEqual([
      expect.stringMatching(/^about\.closing: Too big/),
    ]);
  });

  // covers: spec 0009 AC-3
  it.each([
    ['no marker', 'Write to me any time.'],
    ['two markers', 'Write to {email} or {email}.'],
    ['a misspelt marker', 'Write to {Email}.'],
  ])('fails a closing with %s, naming spec 0009', (_, closing) => {
    expect(issues(withAbout({ closing }))).toEqual([tokenMissing]);
  });
});

describe('makeCvSchema: projects (spec 0010)', () => {
  const liveNeedsUrl =
    'projects.0.url: a live project needs a url, the site a visitor can open; see spec 0010';

  const sourceMessage = `expected an https URL or "${PRIVATE_SOURCE}"; see spec 0010`;

  // `count` projects with distinct names, each patched the same way.
  const named = (count: number, patch: Data = {}): readonly Data[] =>
    Array.from({ length: count }, (_, i) => ({
      ...project,
      name: `Project ${i}`,
      ...patch,
    }));

  const words = (count: number): readonly string[] =>
    Array.from({ length: count }, (_, i) => `Tool ${i}`);

  // covers: spec 0010 AC-1
  it('accepts a finished live project with a url, public code, and the cv flag', () => {
    const data = withProject({
      status: 'live',
      url: 'https://ledger.example',
      source: 'https://github.com/ada/ledger',
      endDate: '2024-09',
      cv: true,
    });

    expect(issues(data)).toEqual([]);
  });

  // covers: spec 0010 AC-1
  it.each(['name', 'description', 'startDate', 'status', 'source', 'keywords'])(
    'fails at projects.0.%s when it is missing',
    (field) => {
      expect(issues(withProjects([omit(project, field)]))).toEqual([
        expect.stringMatching(`^projects.0.${field}:`),
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it('rejects an unknown key inside a project, such as a role', () => {
    expect(issues(withProject({ role: 'Lead' }))).toEqual([
      'projects.0: Unrecognized key: "role"',
    ]);
  });

  // covers: spec 0010 AC-1
  it.each([
    ['name', ''],
    ['name', '   '],
    ['description', ''],
    ['description', '   '],
  ])('fails a project %s of %j as too small', (field, value) => {
    expect(issues(withProject({ [field]: value }))).toEqual([
      expect.stringMatching(`^projects.0.${field}: Too small`),
    ]);
  });

  // covers: spec 0010 AC-1
  it.each(['', '   '])('fails a keyword of %j at its index', (keyword) => {
    expect(issues(withProject({ keywords: ['Astro', keyword] }))).toEqual([
      expect.stringMatching(/^projects\.0\.keywords\.1: Too small/),
    ]);
  });

  // covers: spec 0010 AC-1
  it.each([
    ['name', CV_LIMITS.projectName],
    ['description', CV_LIMITS.projectDescription],
  ])(
    'accepts a project %s at exactly %i characters and fails one past it',
    (field, cap) => {
      expect(issues(withProject({ [field]: chars(cap) }))).toEqual([]);
      expect(issues(withProject({ [field]: chars(cap + 1) }))).toEqual([
        expect.stringMatching(`^projects.0.${field}: Too big`),
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it('accepts a 20 character keyword and fails at 21', () => {
    const cap = CV_LIMITS.projectKeyword;

    expect(issues(withProject({ keywords: [chars(cap)] }))).toEqual([]);
    expect(issues(withProject({ keywords: [chars(cap + 1)] }))).toEqual([
      expect.stringMatching(/^projects\.0\.keywords\.0: Too big/),
    ]);
  });

  // covers: spec 0010 AC-1
  it('accepts 1 and 6 keywords, and fails at 0 and at 7', () => {
    const cap = CV_LIMITS.projectKeywords;

    expect(issues(withProject({ keywords: words(1) }))).toEqual([]);
    expect(issues(withProject({ keywords: words(cap) }))).toEqual([]);
    expect(issues(withProject({ keywords: [] }))).toEqual([
      expect.stringMatching(/^projects\.0\.keywords: Too small/),
    ]);
    expect(issues(withProject({ keywords: words(cap + 1) }))).toEqual([
      expect.stringMatching(/^projects\.0\.keywords: Too big/),
    ]);
  });

  // covers: spec 0010 AC-1
  it('accepts 8 projects and fails at a ninth', () => {
    expect(issues(withProjects(named(CV_LIMITS.projects)))).toEqual([]);
    expect(issues(withProjects(named(CV_LIMITS.projects + 1)))).toEqual([
      expect.stringMatching(/^projects: Too big/),
    ]);
  });

  // covers: spec 0010 AC-1
  it.each(PROJECT_STATUSES)('accepts the status %s', (status) => {
    const data = withProject({ status, url: 'https://ledger.example' });

    expect(issues(data)).toEqual([]);
  });

  // covers: spec 0010 AC-1
  it.each(['paused', 'Live', ''])(
    'rejects the status %j, outside the four words',
    (status) => {
      expect(issues(withProject({ status }))).toEqual([
        expect.stringMatching(/^projects\.0\.status:/),
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it.each(['http://ledger.example', 'ledger.example'])(
    'rejects the url %j because it is not https',
    (url) => {
      expect(issues(withProject({ url }))).toEqual([
        expect.stringMatching(/^projects\.0\.url:/),
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it.each([
    'http://github.com/ada/ledger',
    'github.com/ada/ledger',
    'Private',
    'public',
    '',
  ])('rejects the source %j, neither an https URL nor private', (source) => {
    expect(issues(withProject({ source }))).toEqual([
      `projects.0.source: ${sourceMessage}`,
    ]);
  });

  // covers: spec 0010 AC-1
  it('rejects a malformed start month', () => {
    expect(issues(withProject({ startDate: '2024-3' }))).toEqual([
      'projects.0.startDate: expected a month as YYYY-MM (01 to 12)',
    ]);
  });

  // covers: spec 0010 AC-1
  it('fails at projects.N.endDate when the end is before the start', () => {
    expect(issues(withProject({ endDate: '2024-02' }))).toEqual([
      'projects.0.endDate: endDate is before startDate',
    ]);
  });

  // covers: spec 0010 AC-1
  it('fails a live project with no url, naming spec 0010', () => {
    expect(issues(withProject({ status: 'live' }))).toEqual([liveNeedsUrl]);
  });

  // covers: spec 0010 AC-1
  it('fails a live project with no url even when its code is public', () => {
    const data = withProject({
      status: 'live',
      source: 'https://github.com/ada/ledger',
    });

    expect(issues(data)).toEqual([liveNeedsUrl]);
  });

  // covers: spec 0010 AC-1
  it('fails at the later project when a name repeats', () => {
    expect(issues(withProjects([project, project]))).toEqual([
      'projects.1.name: duplicate project name',
    ]);
  });

  // covers: spec 0010 AC-1
  it('compares names after trimming, so surrounding spaces still repeat', () => {
    const spaced = { ...project, name: `  ${project.name} ` };

    expect(issues(withProjects([project, spaced]))).toEqual([
      'projects.1.name: duplicate project name',
    ]);
  });

  it('compares names exactly, so a change of case is a new name', () => {
    const lower = { ...project, name: project.name.toLowerCase() };

    expect(issues(withProjects([project, lower]))).toEqual([]);
  });

  // covers: spec 0010 AC-1
  it('accepts two projects on the CV and fails at the third and each after it', () => {
    const max = CV_LIMITS.cvProjectsMax;
    const message = `at most ${max} projects may set cv; see spec 0010`;

    expect(issues(withProjects(named(max, { cv: true })))).toEqual([]);
    expect(issues(withProjects(named(max + 2, { cv: true })))).toEqual([
      `projects.2.cv: ${message}`,
      `projects.3.cv: ${message}`,
    ]);
  });

  it('counts only cv true, so cv false means the same as leaving it out', () => {
    const list = [
      ...named(CV_LIMITS.cvProjectsMax, { cv: true }),
      { ...project, name: 'Off', cv: false },
    ];

    expect(issues(withProjects(list))).toEqual([]);
  });

  // covers: spec 0010 AC-1
  it('names the four status words and the private source word', () => {
    expect(PROJECT_STATUSES).toEqual(['live', 'building', 'done', 'archived']);
    expect(PRIVATE_SOURCE).toBe('private');
  });

  // covers: spec 0010 AC-1
  it.each(['2024-13', '2024-3', '24-09'])(
    'rejects the end month %j with the YYYY-MM message',
    (endDate) => {
      expect(issues(withProject({ endDate }))).toEqual([
        'projects.0.endDate: expected a month as YYYY-MM (01 to 12)',
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it.each(['yes', 'true', 1])(
    'rejects a cv flag of %j, not a boolean',
    (cv) => {
      expect(issues(withProject({ cv }))).toEqual([
        expect.stringMatching(/^projects\.0\.cv:/),
      ]);
    },
  );

  // covers: spec 0010 AC-1
  it('fails every later repeat of a name, never the first', () => {
    expect(issues(withProjects([project, project, project]))).toEqual([
      'projects.1.name: duplicate project name',
      'projects.2.name: duplicate project name',
    ]);
  });

  // covers: spec 0010 AC-1
  it('accepts a live project whose url is public while its code stays private', () => {
    const data = withProject({
      status: 'live',
      url: 'https://ledger.example',
      source: PRIVATE_SOURCE,
    });

    expect(issues(data)).toEqual([]);
  });
});

describe('splitAtEmail', () => {
  // covers: spec 0009 AC-3
  it.each([
    ['{email} is where I read.', '', ' is where I read.'],
    ['Write to {email} any time.', 'Write to ', ' any time.'],
    ['Write to {email}', 'Write to ', ''],
  ])('splits %j at its one marker', (closing, before, after) => {
    expect(splitAtEmail(closing)).toEqual({ before, after });
  });

  // covers: spec 0009 AC-3
  it('returns two empty sides for the marker alone', () => {
    expect(splitAtEmail(EMAIL_TOKEN)).toEqual({ before: '', after: '' });
  });

  // covers: spec 0009 AC-3
  it.each([
    'Write to me any time.',
    'Write to {email} or {email}.',
    '{email}{email}',
  ])('returns undefined for %j, which holds no marker or two', (closing) => {
    expect(splitAtEmail(closing)).toBeUndefined();
  });

  // covers: spec 0009 AC-3
  it.each([
    'Write to {Email} any time.',
    'Write to { email } any time.',
    'Write to {email any time.',
    'Write to email any time.',
  ])(
    'returns undefined for %j, since only {email} exactly is the marker',
    (closing) => {
      expect(splitAtEmail(closing)).toBeUndefined();
    },
  );
});
