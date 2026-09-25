import { describe, expect, it } from 'vitest';
import {
  firstUrl,
  formatDateRange,
  formatLanguage,
  formatLocation,
  formatMonth,
  formatProfileHandle,
  formatProfilePath,
  formatSkillRows,
  groupConsecutive,
  joinMeta,
  sortByDateDesc,
  sortNewestFirst,
  spanOf,
} from '@/lib/cv-format';
import type { Network } from '@/lib/cv-schema';

type Dated = {
  readonly id: string;
  readonly startDate: string;
  readonly endDate?: string;
};

const ids = (items: readonly { readonly id: string }[]): readonly string[] =>
  items.map((item) => item.id);

describe('formatMonth', () => {
  // covers: AC-9
  it('formats a YYYY-MM month as a short English month and year', () => {
    expect(formatMonth('2023-03')).toBe('Mar 2023');
  });

  // covers: AC-9
  it.each([
    ['2024-01', 'Jan 2024'],
    ['2024-06', 'Jun 2024'],
    ['2024-12', 'Dec 2024'],
  ])('formats %s as %s', (month, expected) => {
    expect(formatMonth(month)).toBe(expected);
  });
});

describe('formatDateRange', () => {
  // covers: AC-9
  it('ends an open range with Present', () => {
    expect(formatDateRange('2023-01')).toBe('Jan 2023 – Present');
  });

  // covers: AC-9
  it('joins a closed range with a spaced en dash', () => {
    expect(formatDateRange('2021-01', '2023-03')).toBe('Jan 2021 – Mar 2023');
  });

  // covers: AC-9
  it('collapses a range that starts and ends in the same month', () => {
    expect(formatDateRange('2023-03', '2023-03')).toBe('Mar 2023');
  });

  it('spans years correctly when only the year differs', () => {
    expect(formatDateRange('2022-03', '2023-03')).toBe('Mar 2022 – Mar 2023');
  });
});

describe('sortNewestFirst', () => {
  // covers: AC-10
  it('puts a current role above a closed role that started later', () => {
    const items: readonly Dated[] = [
      { id: 'closed 2023', startDate: '2023-01', endDate: '2024-01' },
      { id: 'current 2020', startDate: '2020-01' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual([
      'current 2020',
      'closed 2023',
    ]);
  });

  // covers: AC-10
  it('orders by start date, newest first', () => {
    const items: readonly Dated[] = [
      { id: '2019', startDate: '2019-05', endDate: '2020-01' },
      { id: '2022', startDate: '2022-02', endDate: '2023-01' },
      { id: '2021', startDate: '2021-11', endDate: '2022-01' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual(['2022', '2021', '2019']);
  });

  // covers: AC-10
  it('orders several current roles by start date, newest first', () => {
    const items: readonly Dated[] = [
      { id: 'older', startDate: '2020-01' },
      { id: 'newer', startDate: '2024-01' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual(['newer', 'older']);
  });

  // covers: AC-10
  it('breaks a start date tie by the later end date first', () => {
    const items: readonly Dated[] = [
      { id: 'ends early', startDate: '2022-01', endDate: '2022-06' },
      { id: 'ends late', startDate: '2022-01', endDate: '2023-06' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual(['ends late', 'ends early']);
  });

  // covers: AC-10
  it('keeps file order when start and end dates both tie', () => {
    const items: readonly Dated[] = [
      { id: 'first', startDate: '2022-01', endDate: '2022-06' },
      { id: 'second', startDate: '2022-01', endDate: '2022-06' },
      { id: 'third', startDate: '2022-01', endDate: '2022-06' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual(['first', 'second', 'third']);
  });

  // covers: AC-10
  it('keeps file order for current roles with the same start', () => {
    const items: readonly Dated[] = [
      { id: 'first', startDate: '2022-01' },
      { id: 'second', startDate: '2022-01' },
    ];

    expect(ids(sortNewestFirst(items))).toEqual(['first', 'second']);
  });

  // covers: AC-10
  it('returns a new array and leaves the input untouched', () => {
    const items: readonly Dated[] = Object.freeze([
      { id: 'old', startDate: '2019-01', endDate: '2020-01' },
      { id: 'new', startDate: '2023-01' },
    ]);

    const sorted = sortNewestFirst(items);

    expect(sorted).not.toBe(items);
    expect(ids(items)).toEqual(['old', 'new']);
  });

  it('returns an empty list for an empty list', () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});

describe('sortByDateDesc', () => {
  type Award = { readonly id: string; readonly date: string };

  // covers: AC-10
  it('orders by date, newest first', () => {
    const items: readonly Award[] = [
      { id: '2021', date: '2021-10' },
      { id: '2024', date: '2024-02' },
      { id: '2022', date: '2022-12' },
    ];

    expect(ids(sortByDateDesc(items))).toEqual(['2024', '2022', '2021']);
  });

  // covers: AC-10
  it('keeps file order when dates tie', () => {
    const items: readonly Award[] = [
      { id: 'first', date: '2023-05' },
      { id: 'second', date: '2023-05' },
    ];

    expect(ids(sortByDateDesc(items))).toEqual(['first', 'second']);
  });

  // covers: AC-10
  it('leaves the input untouched', () => {
    const items: readonly Award[] = Object.freeze([
      { id: 'old', date: '2020-01' },
      { id: 'new', date: '2024-01' },
    ]);

    sortByDateDesc(items);

    expect(ids(items)).toEqual(['old', 'new']);
  });
});

describe('formatLocation', () => {
  // covers: AC-11
  it.each([
    ['Monterrey', 'MX', 'Monterrey, Mexico'],
    ['Toluca', 'MX', 'Toluca, Mexico'],
    ['Austin', 'US', 'Austin, United States'],
  ])('formats %s, %s as %j', (city, countryCode, expected) => {
    expect(formatLocation({ city, countryCode })).toBe(expected);
  });

  // covers: AC-11
  it('falls back to the code when the region is unknown', () => {
    expect(formatLocation({ city: 'Nowhere', countryCode: 'XX' })).toBe(
      'Nowhere, XX',
    );
  });

  it('falls back to the code instead of throwing on a malformed code', () => {
    expect(formatLocation({ city: 'Toluca', countryCode: 'mx' })).toBe(
      'Toluca, mx',
    );
  });
});

describe('formatProfileHandle', () => {
  const cases: readonly (readonly [Network, string, string])[] = [
    ['GitHub', 'jorgergo', '@jorgergo'],
    ['LinkedIn', 'jorgergo', 'in/jorgergo'],
  ];

  // covers: spec 0004 AC-8
  it.each(cases)(
    'formats a %s username %s as %s',
    (network, username, expected) => {
      expect(formatProfileHandle({ network, username })).toBe(expected);
    },
  );

  // covers: spec 0004 AC-8
  it('keeps the username as written, with no lowercasing or trimming', () => {
    expect(
      formatProfileHandle({ network: 'GitHub', username: 'JorgeRGO' }),
    ).toBe('@JorgeRGO');
  });
});

describe('formatProfilePath', () => {
  // covers: spec 0005 AC-9
  it.each([
    ['https://www.linkedin.com/in/jorgergo/', 'linkedin.com/in/jorgergo'],
    ['https://github.com/jorgergo', 'github.com/jorgergo'],
  ])('formats %s as %s', (url, expected) => {
    expect(formatProfilePath(url)).toBe(expected);
  });

  // covers: spec 0005 AC-9
  it('drops the scheme, port, query, and hash', () => {
    expect(
      formatProfilePath('https://www.example.com:8443/a/b/?tab=1#top'),
    ).toBe('example.com/a/b');
  });

  // covers: spec 0005 AC-9
  it('shows a bare host with no trailing slash', () => {
    expect(formatProfilePath('https://example.com/')).toBe('example.com');
  });

  // covers: spec 0005 AC-9
  it.each([
    [
      'https://www.linkedin.com/in/jorge-gonz%C3%A1lez/',
      'linkedin.com/in/jorge-gonzález',
    ],
    [
      'https://www.linkedin.com/in/jorge-gonzález/',
      'linkedin.com/in/jorge-gonzález',
    ],
  ])('decodes a non ASCII path in %s', (url, expected) => {
    expect(formatProfilePath(url)).toBe(expected);
  });

  // covers: spec 0005 AC-9
  it('keeps a reserved escape such as %2F encoded', () => {
    expect(formatProfilePath('https://example.com/a%2Fb')).toBe(
      'example.com/a%2Fb',
    );
  });

  // covers: spec 0005 AC-9
  it('keeps a malformed escape encoded instead of throwing', () => {
    expect(formatProfilePath('https://example.com/%E0%A4%A')).toBe(
      'example.com/%E0%A4%A',
    );
  });

  it('returns a string the URL parser rejects unchanged', () => {
    expect(formatProfilePath('not a url')).toBe('not a url');
  });

  // covers: spec 0005 AC-2
  it('lowercases the host but keeps the handle in the path as typed', () => {
    expect(formatProfilePath('https://GitHub.com/JorgeRGO')).toBe(
      'github.com/JorgeRGO',
    );
  });
});

describe('joinMeta', () => {
  // covers: spec 0005 AC-9
  it('joins two parts with a spaced middle dot', () => {
    expect(joinMeta('Aug 2025 – Present', 'Remote')).toBe(
      'Aug 2025 – Present · Remote',
    );
  });

  // covers: spec 0005 AC-9
  it('skips undefined and empty parts', () => {
    expect(joinMeta('B.S., CS', undefined)).toBe('B.S., CS');
    expect(joinMeta(undefined, 'Toluca, Mexico', '')).toBe('Toluca, Mexico');
  });

  it('returns an empty string when every part is missing', () => {
    expect(joinMeta(undefined, '')).toBe('');
  });

  // covers: spec 0005 AC-8
  it('joins any number of values in the order given, as a keyed row does', () => {
    expect(joinMeta('TypeScript', 'Astro', 'Tailwind CSS', 'Go')).toBe(
      'TypeScript · Astro · Tailwind CSS · Go',
    );
  });
});

describe('formatLanguage', () => {
  // covers: spec 0005 AC-9
  it('shows the fluency and the level in parentheses', () => {
    expect(
      formatLanguage({ language: 'English', fluency: 'Fluent', level: 'C2' }),
    ).toBe('English (Fluent, C2)');
  });

  // covers: spec 0005 AC-9
  it('shows the fluency alone when there is no level', () => {
    expect(formatLanguage({ language: 'Spanish', fluency: 'Native' })).toBe(
      'Spanish (Native)',
    );
  });
});

describe('formatSkillRows', () => {
  // covers: spec 0005 AC-15
  it('gathers the name only interests into one last Interests row', () => {
    expect(
      formatSkillRows({
        interests: [
          { name: 'Sports', keywords: ['Tennis'] },
          { name: 'Chess' },
          { name: 'Go', keywords: [] },
        ],
      }),
    ).toEqual([
      { key: 'Sports', values: ['Tennis'] },
      { key: 'Interests', values: ['Chess', 'Go'] },
    ]);
  });

  // covers: spec 0005 AC-15
  it('gives no Languages row for an empty languages list', () => {
    expect(
      formatSkillRows({
        skills: [{ name: 'Focus', keywords: ['Automation'] }],
        languages: [],
      }),
    ).toEqual([{ key: 'Focus', values: ['Automation'] }]);
  });

  // covers: spec 0005 AC-15
  it('returns no rows when every source is absent', () => {
    expect(formatSkillRows({})).toEqual([]);
  });

  // covers: spec 0005 AC-15
  it('orders skills, technologies, languages, then interests', () => {
    expect(
      formatSkillRows({
        interests: [{ name: 'Chess' }, { name: 'Music', keywords: ['Piano'] }],
        languages: [
          { language: 'Spanish', fluency: 'Native' },
          { language: 'English', fluency: 'Fluent', level: 'C2' },
        ],
        technologies: [{ name: 'Technologies', keywords: ['Astro', 'Go'] }],
        skills: [{ name: 'Additional skills', keywords: ['Automation'] }],
      }),
    ).toEqual([
      { key: 'Additional skills', values: ['Automation'] },
      { key: 'Technologies', values: ['Astro', 'Go'] },
      {
        key: 'Languages',
        values: ['Spanish (Native)', 'English (Fluent, C2)'],
      },
      { key: 'Music', values: ['Piano'] },
      { key: 'Interests', values: ['Chess'] },
    ]);
  });

  // covers: spec 0005 AC-8, AC-15
  it('drops a skills or technologies group with no keywords', () => {
    expect(
      formatSkillRows({
        skills: [{ name: 'Additional skills', keywords: [] }],
        technologies: [
          { name: 'Frontend', keywords: ['Astro'] },
          { name: 'Backend', keywords: [] },
        ],
      }),
    ).toEqual([{ key: 'Frontend', values: ['Astro'] }]);
  });

  // covers: spec 0005 AC-15
  it('keeps several groups of one source in file order', () => {
    expect(
      formatSkillRows({
        technologies: [
          { name: 'Frontend', keywords: ['Astro'] },
          { name: 'Backend', keywords: ['Go'] },
        ],
      }).map(({ key }) => key),
    ).toEqual(['Frontend', 'Backend']);
  });

  // covers: spec 0005 AC-15
  it('takes the whole parsed CV, where an absent source is undefined', () => {
    const cv = {
      basics: { name: 'Jorge González Ozorno' },
      work: [],
      skills: undefined,
      technologies: undefined,
      languages: [{ language: 'Spanish', fluency: 'Native' }],
      interests: undefined,
    };

    expect(formatSkillRows(cv)).toEqual([
      { key: 'Languages', values: ['Spanish (Native)'] },
    ]);
  });

  // covers: spec 0005 AC-15
  it('never mutates the input', () => {
    const interests = Object.freeze([
      Object.freeze({ name: 'Chess' }),
      Object.freeze({ name: 'Music', keywords: Object.freeze(['Piano']) }),
    ]);

    formatSkillRows({ interests });

    expect(interests.map(({ name }) => name)).toEqual(['Chess', 'Music']);
  });
});

describe('groupConsecutive', () => {
  type Role = { readonly name: string; readonly position: string };
  const byName = (role: Role): string => role.name;

  // covers: spec 0005 AC-9
  it('keeps two adjacent roles at one company in one group', () => {
    const roles: readonly Role[] = [
      { name: 'Ford', position: 'Developer' },
      { name: 'Ford', position: 'Engineer' },
      { name: 'Liverpool', position: 'Intern' },
    ];

    expect(groupConsecutive(roles, byName)).toEqual([
      { key: 'Ford', items: [roles[0], roles[1]] },
      { key: 'Liverpool', items: [roles[2]] },
    ]);
  });

  // covers: spec 0005 AC-9
  it('starts a new group when the same key appears again later', () => {
    const roles: readonly Role[] = [
      { name: 'Ford', position: 'Developer' },
      { name: 'Liverpool', position: 'Intern' },
      { name: 'Ford', position: 'Engineer' },
    ];

    expect(groupConsecutive(roles, byName).map(({ key }) => key)).toEqual([
      'Ford',
      'Liverpool',
      'Ford',
    ]);
  });

  // covers: spec 0005 AC-9
  it('returns an empty list for an empty list', () => {
    expect(groupConsecutive([], byName)).toEqual([]);
  });

  // covers: spec 0005 AC-9
  it('keeps three adjacent roles together in input order', () => {
    const roles: readonly Role[] = [
      { name: 'Ford', position: 'Lead' },
      { name: 'Ford', position: 'Developer' },
      { name: 'Ford', position: 'Engineer' },
    ];

    expect(groupConsecutive(roles, byName)).toEqual([
      { key: 'Ford', items: roles },
    ]);
  });

  // covers: spec 0005 AC-5
  it('compares keys exactly, so a company spelled two ways is two groups', () => {
    const roles: readonly Role[] = [
      { name: 'Ford Motor Company', position: 'Developer' },
      { name: 'Ford Motor Co.', position: 'Engineer' },
    ];

    expect(groupConsecutive(roles, byName).map(({ key }) => key)).toEqual([
      'Ford Motor Company',
      'Ford Motor Co.',
    ]);
  });

  // covers: spec 0005 AC-5
  it('after sortNewestFirst, joins roles at one company that the file keeps apart', () => {
    type Job = Role & Omit<Dated, 'id'>;
    const jobs: readonly Job[] = [
      { name: 'Ford', position: 'Developer', startDate: '2025-08' },
      {
        name: 'Liverpool',
        position: 'Intern',
        startDate: '2023-05',
        endDate: '2024-03',
      },
      {
        name: 'Ford',
        position: 'Engineer',
        startDate: '2025-01',
        endDate: '2025-07',
      },
    ];

    const groups = groupConsecutive(sortNewestFirst(jobs), byName);

    expect(
      groups.map(({ key, items }) => [key, items.map((job) => job.position)]),
    ).toEqual([
      ['Ford', ['Developer', 'Engineer']],
      ['Liverpool', ['Intern']],
    ]);
  });

  // covers: spec 0005 AC-9
  it('never mutates the input', () => {
    const roles: readonly Role[] = Object.freeze([
      { name: 'Ford', position: 'Developer' },
      { name: 'Ford', position: 'Engineer' },
    ]);

    const groups = groupConsecutive(roles, byName);

    expect(roles.map(byName)).toEqual(['Ford', 'Ford']);
    expect(groups[0]?.items).not.toBe(roles);
  });
});

describe('spanOf', () => {
  // covers: spec 0005 AC-9
  it('leaves the end open when any role is current', () => {
    expect(
      spanOf([
        { startDate: '2025-08' },
        { startDate: '2025-01', endDate: '2025-07' },
      ]),
    ).toEqual({ startDate: '2025-01' });
  });

  // covers: spec 0005 AC-9
  it('takes the earliest start and the latest end when every role is closed', () => {
    expect(
      spanOf([
        { startDate: '2025-08', endDate: '2026-06' },
        { startDate: '2025-01', endDate: '2025-07' },
      ]),
    ).toEqual({ startDate: '2025-01', endDate: '2026-06' });
  });

  // covers: spec 0005 AC-9
  it('returns a single role as its own span', () => {
    expect(spanOf([{ startDate: '2023-03', endDate: '2023-05' }])).toEqual({
      startDate: '2023-03',
      endDate: '2023-05',
    });
  });

  // covers: spec 0005 AC-9
  it('leaves the end open when a later role in the list is the current one', () => {
    expect(
      spanOf([
        { startDate: '2023-01', endDate: '2023-06' },
        { startDate: '2025-01' },
        { startDate: '2024-01', endDate: '2024-12' },
      ]),
    ).toEqual({ startDate: '2023-01' });
  });

  // covers: spec 0005 AC-9
  it('returns a single current role as an open span', () => {
    const span = spanOf([{ startDate: '2025-08' }]);

    expect(span).toEqual({ startDate: '2025-08' });
    expect(formatDateRange(span.startDate, span.endDate)).toBe(
      'Aug 2025 – Present',
    );
  });

  // covers: spec 0005 AC-9
  it('keeps the latest end even when it belongs to the earlier start', () => {
    expect(
      spanOf([
        { startDate: '2024-01', endDate: '2024-06' },
        { startDate: '2023-01', endDate: '2025-01' },
      ]),
    ).toEqual({ startDate: '2023-01', endDate: '2025-01' });
  });
});

describe('firstUrl', () => {
  type Role = { readonly position: string; readonly url?: string };

  // covers: spec 0005 AC-15
  it('skips a first role with no url and returns the next one', () => {
    expect(
      firstUrl([
        { position: 'Developer' },
        { position: 'Engineer', url: 'https://www.ford.com' },
      ]),
    ).toBe('https://www.ford.com');
  });

  // covers: spec 0005 AC-15
  it('returns the first url when several roles have one', () => {
    expect(
      firstUrl([{ url: 'https://a.example' }, { url: 'https://b.example' }]),
    ).toBe('https://a.example');
  });

  // covers: spec 0005 AC-15
  it('returns undefined when no role has a url', () => {
    const roles: readonly Role[] = [
      { position: 'Developer' },
      { position: 'Engineer' },
    ];

    expect(firstUrl(roles)).toBeUndefined();
    expect(firstUrl([])).toBeUndefined();
  });
});
