import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import cvFile from '@/content/cv.json';
import { CV_LIMITS, makeCvSchema, regionName } from '@/lib/cv-schema';

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

const minimalCv = { basics, work: [role], education: [school] } as const;

const withBasics = (patch: Data): Data => ({
  ...minimalCv,
  basics: { ...basics, ...patch },
});

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

  // covers: AC-3
  it.each(['work', 'education'])(
    'fails at %s when it has no entries',
    (section) => {
      expect(issues({ ...minimalCv, [section]: [] })).toEqual([
        expect.stringMatching(`^${section}:`),
      ]);
    },
  );

  // covers: AC-3
  it.each(['work', 'education', 'basics'])(
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
  // covers: AC-7
  it('reads every cap from CV_LIMITS with the values in spec 0002', () => {
    expect(CV_LIMITS).toEqual({
      bio: 160,
      summary: 500,
      entrySummary: 220,
      highlight: 220,
      highlights: 5,
      courses: 8,
    });
  });

  // covers: AC-7
  it.each([
    ['bio', CV_LIMITS.bio],
    ['summary', CV_LIMITS.summary],
  ])('accepts basics.%s at exactly %i characters', (field, cap) => {
    expect(issues(withBasics({ [field]: chars(cap) }))).toEqual([]);
  });

  // covers: AC-7
  it.each([
    ['bio', CV_LIMITS.bio],
    ['summary', CV_LIMITS.summary],
  ])('fails at basics.%s one character past %i', (field, cap) => {
    expect(issues(withBasics({ [field]: chars(cap + 1) }))).toEqual([
      expect.stringMatching(`^basics.${field}:`),
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
