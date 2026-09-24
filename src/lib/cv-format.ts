import { regionName } from '@/lib/cv-schema';

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
