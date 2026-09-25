// Page titles, descriptions, and share tags (spec 0006). Pure: pages pass the
// CV and `Astro.site` in, nothing here reads the file system or the request.

// One row per page that gets a canonical, share tags, and a card. The key
// names the card file and the description rule, the path gives the canonical,
// and the label is both the title prefix and the card label. A new page's
// spec adds its row here and its rule to DESCRIPTIONS.
export type SharePage = {
  readonly key: string;
  readonly path: string;
  readonly label?: string;
};

export const SHARE_PAGES = [
  { key: 'home', path: '/' },
  { key: 'cv', path: '/cv', label: 'CV' },
] as const satisfies readonly SharePage[];

export type SharePageKey = (typeof SHARE_PAGES)[number]['key'];

// What the share tags always say; the card endpoint draws at this size too.
export const SHARE_IMAGE = {
  type: 'image/png',
  width: 1200,
  height: 630,
} as const;
export const OG_TYPE = 'website';
export const TWITTER_CARD = 'summary_large_image';

export type ShareImage = {
  readonly url: string;
  readonly alt: string;
  readonly width: typeof SHARE_IMAGE.width;
  readonly height: typeof SHARE_IMAGE.height;
};

export type ShareMeta = {
  readonly url: string;
  readonly siteName: string;
  readonly image: ShareImage;
};

export type PageMeta = {
  readonly title: string;
  readonly description: string;
  readonly share: ShareMeta | undefined;
};

export type CardContent = {
  readonly label?: string | undefined;
  readonly name: string;
  readonly role: string;
  readonly footerStart: string;
  readonly footerEnd: string;
};

// The parts of the CV these rules read, so tests pass plain objects.
export type MetaCv = {
  readonly basics: {
    readonly name: string;
    readonly label: string;
    readonly bio: string;
    readonly location: { readonly city: string; readonly countryCode: string };
  };
  readonly skills?: readonly unknown[] | undefined;
  readonly technologies?: readonly unknown[] | undefined;
};

// A row whose key is known to be one of SHARE_PAGES, so a looked up row can
// feed pageMeta and cardContent.
export type ShareRow = SharePage & { readonly key: SharePageKey };

// A route param to its row; an unknown or missing key gives undefined.
export const sharePage = (key: string | undefined): ShareRow | undefined =>
  SHARE_PAGES.find((row) => row.key === key);

// `name · label` for the home page, `page · name` for every other page.
export const formatPageTitle = (
  basics: { readonly name: string; readonly label: string },
  page?: string,
): string =>
  page === undefined
    ? `${basics.name} · ${basics.label}`
    : `${page} · ${basics.name}`;

// English, with a serial comma: `a and b`, `a, b, and c`.
const LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

// The CV sections a description names: experience and education always (the
// schema requires both), skills and technologies when they have an entry.
export const formatSectionList = ({
  skills = [],
  technologies = [],
}: Pick<MetaCv, 'skills' | 'technologies'>): string =>
  LIST.format([
    'experience',
    'education',
    ...(skills.length > 0 ? ['skills'] : []),
    ...(technologies.length > 0 ? ['technologies'] : []),
  ]);

// One description rule per row. The `satisfies` clause makes a row added to
// SHARE_PAGES without a rule fail `astro check`.
export const DESCRIPTIONS = {
  home: ({ basics }) => basics.bio,
  cv: (cv) =>
    `The CV of ${cv.basics.name}, ${cv.basics.label}: ${formatSectionList(cv)}.`,
} as const satisfies Record<SharePageKey, (cv: MetaCv) => string>;

// The card's words in reading order, which are also its alt text.
const cardWords = (
  page: SharePage,
  basics: MetaCv['basics'],
): readonly string[] => [
  ...(page.label === undefined ? [] : [page.label]),
  basics.name,
  basics.label,
];

// What a page spreads into BaseLayout. The canonical comes from the row's
// path, never from `Astro.url`, which reads `/cv.html` during the build.
// Without `site` the page still gets its title and description, and no share
// tags.
export const pageMeta = (
  key: SharePageKey,
  cv: MetaCv,
  site: URL | undefined,
): PageMeta => {
  const page = sharePage(key);
  return {
    title: formatPageTitle(cv.basics, page?.label),
    description: DESCRIPTIONS[key](cv),
    share:
      page === undefined || site === undefined
        ? undefined
        : {
            url: new URL(page.path, site).href,
            siteName: cv.basics.name,
            image: {
              url: new URL(`/og/${page.key}.png`, site).href,
              alt: cardWords(page, cv.basics).join(', '),
              width: SHARE_IMAGE.width,
              height: SHARE_IMAGE.height,
            },
          },
  };
};

// The most characters the card footer's two sides hold together: 61 columns
// of 16.8px (28px Plex Mono) fit the 1040px row, and one stays free, so at
// least 32px separates the sides.
export const FOOTER_BUDGET = 60;

// The characters of the footer's two sides, for the card endpoint to compare
// with FOOTER_BUDGET.
export const footerLength = (content: CardContent): number =>
  Array.from(content.footerStart).length + Array.from(content.footerEnd).length;

// The words on a page's card. The footer names the host, plus the path unless
// it is `/`, and the city in the short form SiteFooter prints.
export const cardContent = (
  key: SharePageKey,
  cv: MetaCv,
  site: URL | undefined,
): CardContent | undefined => {
  const page = sharePage(key);
  if (page === undefined || site === undefined) return undefined;
  const { name, label, location } = cv.basics;
  return {
    label: page.label,
    name,
    role: label,
    footerStart: page.path === '/' ? site.host : `${site.host}${page.path}`,
    footerEnd: `${location.city}, ${location.countryCode}`,
  };
};
