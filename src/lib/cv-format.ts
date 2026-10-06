import { PRIVATE_SOURCE, regionName, type Network } from '@/lib/cv-schema';

// Fixed English strings: no locale, time zone, or clock is ever read.
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
const PRESENT = 'Present';
const RANGE_SEPARATOR = ' – ';

// `month` is schema valid YYYY-MM.
export const formatMonth = (month: string): string => {
  const [year = '', monthNumber = ''] = month.split('-');
  const name = MONTHS[Number(monthNumber) - 1] ?? monthNumber;
  return `${name} ${year}`;
};

export const formatDateRange = (start: string, end?: string): string => {
  if (end === undefined)
    return `${formatMonth(start)}${RANGE_SEPARATOR}${PRESENT}`;
  if (end === start) return formatMonth(start);
  return `${formatMonth(start)}${RANGE_SEPARATOR}${formatMonth(end)}`;
};

// YYYY-MM strings order correctly as plain strings.
const compareDesc = (a: string, b: string): number =>
  a === b ? 0 : a < b ? 1 : -1;

// Current entries first, then startDate newest first, then endDate newest
// first; toSorted is stable, so full ties keep file order.
export const sortNewestFirst = <
  T extends {
    readonly startDate: string;
    readonly endDate?: string | undefined;
  },
>(
  items: readonly T[],
): readonly T[] =>
  items.toSorted((a, b) => {
    const currentFirst =
      Number(a.endDate !== undefined) - Number(b.endDate !== undefined);
    if (currentFirst !== 0) return currentFirst;
    const byStart = compareDesc(a.startDate, b.startDate);
    if (byStart !== 0) return byStart;
    return compareDesc(a.endDate ?? '', b.endDate ?? '');
  });

export const sortByDateDesc = <T extends { readonly date: string }>(
  items: readonly T[],
): readonly T[] => items.toSorted((a, b) => compareDesc(a.date, b.date));

export const formatLocation = (location: {
  readonly city: string;
  readonly countryCode: string;
}): string =>
  `${location.city}, ${regionName(location.countryCode) ?? location.countryCode}`;

// One rule per network in NETWORKS. The `satisfies` clause makes a network
// added to the enum without a rule fail `astro check` (spec 0004).
const HANDLE_RULES = {
  GitHub: (username) => `@${username}`,
  LinkedIn: (username) => `in/${username}`,
} satisfies Record<Network, (username: string) => string>;

export const formatProfileHandle = (profile: {
  readonly network: Network;
  readonly username: string;
}): string => HANDLE_RULES[profile.network](profile.username);

// Spec 0005: the CV page helpers. Pure, no clock or locale.

const META_SEPARATOR = ' · ';

// The parser percent encodes a non ASCII path; decodeURI shows it as typed
// (`%C3%A1` → `á`) and keeps reserved escapes such as `%2F`. It throws on a
// malformed escape, so that path stays encoded.
const decodePath = (path: string): string => {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
};

// `https://www.linkedin.com/in/jorgergo/` → `linkedin.com/in/jorgergo`: the
// host without a leading `www.` plus the decoded path without a trailing `/`;
// scheme, port, query, and hash dropped. A string the URL parser rejects (the
// schema never lets one through) comes back unchanged instead of throwing.
export const formatProfilePath = (url: string): string => {
  if (!URL.canParse(url)) return url;
  const { hostname, pathname } = new URL(url);
  return `${hostname.replace(/^www\./, '')}${decodePath(pathname.replace(/\/$/, ''))}`;
};

// The defined, non empty parts joined by a spaced middle dot.
export const joinMeta = (...parts: readonly (string | undefined)[]): string =>
  parts
    .filter((part): part is string => part !== undefined && part !== '')
    .join(META_SEPARATOR);

type Language = {
  readonly language: string;
  readonly fluency: string;
  readonly level?: string | undefined;
};

// `English (Fluent, C2)`, `Spanish (Native)`.
export const formatLanguage = (language: Language): string => {
  const detail = [language.fluency, language.level]
    .filter((part): part is string => part !== undefined)
    .join(', ');
  return `${language.language} (${detail})`;
};

// One row of a keyed list: a key and the values shown beside it.
export type KeyedRow = {
  readonly key: string;
  readonly values: readonly string[];
};

type KeywordGroup = {
  readonly name: string;
  readonly keywords: readonly string[];
};

type Interest = {
  readonly name: string;
  readonly keywords?: readonly string[] | undefined;
};

const keywordRow = ({ name, keywords }: KeywordGroup): KeyedRow => ({
  key: name,
  values: keywords,
});

// The CV's Skills & interests rows (spec 0005 AC-8): skills groups, then
// technologies groups, one Languages row, interest groups with keywords, and
// one last Interests row gathering the name only groups, so `{ "name":
// "Chess" }` still shows. A row with no values is dropped, so `{}` gives `[]`.
export const formatSkillRows = ({
  skills = [],
  technologies = [],
  languages = [],
  interests = [],
}: {
  readonly skills?: readonly KeywordGroup[] | undefined;
  readonly technologies?: readonly KeywordGroup[] | undefined;
  readonly languages?: readonly Language[] | undefined;
  readonly interests?: readonly Interest[] | undefined;
}): readonly KeyedRow[] => {
  const hasKeywords = ({ keywords = [] }: Interest): boolean =>
    keywords.length > 0;
  return [
    ...skills.map(keywordRow),
    ...technologies.map(keywordRow),
    { key: 'Languages', values: languages.map(formatLanguage) },
    ...interests
      .filter(hasKeywords)
      .map(({ name, keywords = [] }) => ({ key: name, values: keywords })),
    {
      key: 'Interests',
      values: interests
        .filter((interest) => !hasKeywords(interest))
        .map(({ name }) => name),
    },
  ].filter(({ values }) => values.length > 0);
};

export type Group<T> = {
  readonly key: string;
  readonly items: readonly [T, ...T[]];
};

// Adjacent items with the same key form one group, in input order, each group
// non empty; the same key appearing again later starts a new group. Sort
// first when adjacency should follow date order.
export const groupConsecutive = <T>(
  items: readonly T[],
  key: (item: T) => string,
): readonly Group<T>[] =>
  items.reduce<readonly Group<T>[]>((groups, item) => {
    const itemKey = key(item);
    const last = groups.at(-1);
    return last !== undefined && last.key === itemKey
      ? [...groups.slice(0, -1), { key: itemKey, items: [...last.items, item] }]
      : [...groups, { key: itemKey, items: [item] }];
  }, []);

type Span = {
  readonly startDate: string;
  readonly endDate?: string | undefined;
};

// The earliest start and the latest end of a non empty group of roles; the end
// stays undefined (an open span) when any role is current.
export const spanOf = <T extends Span>(items: readonly [T, ...T[]]): Span => {
  const [first, ...rest] = items;
  const startDate = rest.reduce(
    (earliest, item) => (item.startDate < earliest ? item.startDate : earliest),
    first.startDate,
  );
  const endDate = rest.reduce<string | undefined>(
    (latest, item) =>
      latest === undefined || item.endDate === undefined
        ? undefined
        : item.endDate > latest
          ? item.endDate
          : latest,
    first.endDate,
  );
  return endDate === undefined ? { startDate } : { startDate, endDate };
};

// The first defined url, so a group of roles sorted newest first links to its
// newest role that has one; undefined when none does.
export const firstUrl = <T extends { readonly url?: string | undefined }>(
  items: readonly T[],
): string | undefined => items.find((item) => item.url !== undefined)?.url;

// Spec 0010: the projects helpers. Pure, no clock.

const NOW = 'now';

// `month` is schema valid YYYY-MM.
const yearOf = (month: string): string => month.slice(0, 4);

// Years only: `2026 – now` while ongoing, whatever year the build runs in;
// `2024` when both months share a year; `2022 – 2023` otherwise.
export const formatYearSpan = (start: string, end?: string): string => {
  if (end === undefined) return `${yearOf(start)}${RANGE_SEPARATOR}${NOW}`;
  if (yearOf(end) === yearOf(start)) return yearOf(start);
  return `${yearOf(start)}${RANGE_SEPARATOR}${yearOf(end)}`;
};

// Where a project links: its site, else its public code, else nowhere.
export const projectHref = (project: {
  readonly url?: string | undefined;
  readonly source: string;
}): string | undefined =>
  project.url ??
  (project.source === PRIVATE_SOURCE ? undefined : project.source);

// startDate newest first with endDate ignored, so a project keeps its place
// when it ends (sortNewestFirst would move it below every open entry);
// toSorted is stable, so ties keep file order.
export const sortByStart = <T extends { readonly startDate: string }>(
  items: readonly T[],
): readonly T[] =>
  items.toSorted((a, b) => compareDesc(a.startDate, b.startDate));

// The projects flagged for the CV, in the /projects order.
export const cvProjects = <
  T extends {
    readonly cv?: boolean | undefined;
    readonly startDate: string;
  },
>(
  projects: readonly T[],
): readonly T[] =>
  sortByStart(projects.filter((project) => project.cv === true));

// Spec 0013: the CV's contact line. Pure.

// One link of the CV's contact line. `paperOnly` marks the item that shows in
// print alone: the site's own address, which a visitor already on the site
// has no use for. `separator` says where the dot after the item shows:
// `always`, on `paper` alone, or `none`.
export type CvContact = {
  readonly href: string;
  readonly text: string;
  readonly paperOnly: boolean;
  readonly separator: 'always' | 'paper' | 'none';
};

// The email, then the site when `site` is set (paper only), then one item per
// profile in cv.json order. The last item has no dot. An item followed only
// by paper only items shows its dot on paper alone, so a CV with no profiles
// never ends its screen line with a dot.
export const formatCvContacts = (
  basics: {
    readonly email: string;
    readonly profiles?: readonly { readonly url: string }[] | undefined;
  },
  site: URL | undefined,
): readonly CvContact[] => {
  const items = [
    { href: `mailto:${basics.email}`, text: basics.email, paperOnly: false },
    ...(site === undefined
      ? []
      : [
          {
            href: site.href,
            text: formatProfilePath(site.href),
            paperOnly: true,
          },
        ]),
    ...(basics.profiles ?? []).map(({ url }) => ({
      href: url,
      text: formatProfilePath(url),
      paperOnly: false,
    })),
  ];
  return items.map((item, index) => {
    const rest = items.slice(index + 1);
    const separator: CvContact['separator'] =
      rest.length === 0
        ? 'none'
        : rest.every(({ paperOnly }) => paperOnly)
          ? 'paper'
          : 'always';
    return { ...item, separator };
  });
};

// Spec 0011: the contact page rows. Pure.

// One contact channel: a lower case key, where it links, and what it shows.
export type ContactRow = {
  readonly key: string;
  readonly href: string;
  readonly label: string;
};

// The email row first, so the page always offers a way to write, then one row
// per profile in cv.json order; a missing or empty list gives the email alone.
export const formatContactRows = ({
  email,
  profiles = [],
}: {
  readonly email: string;
  readonly profiles?:
    | readonly {
        readonly network: Network;
        readonly username: string;
        readonly url: string;
      }[]
    | undefined;
}): readonly ContactRow[] => [
  { key: 'email', href: `mailto:${email}`, label: email },
  ...profiles.map((profile) => ({
    key: profile.network.toLowerCase(),
    href: profile.url,
    label: formatProfileHandle(profile),
  })),
];
