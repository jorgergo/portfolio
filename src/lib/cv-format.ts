import { regionName, type Network } from '@/lib/cv-schema';

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

// `https://www.linkedin.com/in/jorgergo/` → `linkedin.com/in/jorgergo`: the
// host without a leading `www.` plus the path without a trailing `/`; scheme,
// port, query, and hash dropped. A string the URL parser rejects (the schema
// never lets one through) comes back unchanged instead of throwing.
export const formatProfilePath = (url: string): string => {
  if (!URL.canParse(url)) return url;
  const { hostname, pathname } = new URL(url);
  return `${hostname.replace(/^www\./, '')}${pathname.replace(/\/$/, '')}`;
};

// The defined, non empty parts joined by a spaced middle dot.
export const joinMeta = (...parts: readonly (string | undefined)[]): string =>
  parts
    .filter((part): part is string => part !== undefined && part !== '')
    .join(META_SEPARATOR);

// `English (Fluent, C2)`, `Spanish (Native)`.
export const formatLanguage = (language: {
  readonly language: string;
  readonly fluency: string;
  readonly level?: string | undefined;
}): string => {
  const detail = [language.fluency, language.level]
    .filter((part): part is string => part !== undefined)
    .join(', ');
  return `${language.language} (${detail})`;
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
