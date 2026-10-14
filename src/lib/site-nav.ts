import { formatContactRows } from '@/lib/cv-format';
import { CV_PDF_PATH, cvPdfFileName } from '@/lib/cv-pdf';

// The home page menu (spec 0004). Site structure, not CV content, so it lives
// in code: each page spec adds its own row, and a row whose page does not
// answer 200 fails the page test. Planned order once every page exists:
// about → /about, cv → /cv, projects → /projects, contact → /contact.
export const SITE_NAV: readonly {
  readonly label: string;
  readonly href: string;
}[] = [
  { label: 'about', href: '/about' },
  { label: 'cv', href: '/cv' },
  { label: 'projects', href: '/projects' },
  { label: 'contact', href: '/contact' },
];

// A row's number comes from its position, never stored: 0 gives `01`, 9 gives
// `10`, so the menu renumbers itself as pages ship.
export const formatRowNumber = (index: number): string =>
  String(index + 1).padStart(2, '0');

// One row of the command menu (spec 0015): its name on the left, its detail
// on the right (`''` for a page), its link, whether it is the page you are on,
// whether it leaves the site, and the saved file name of the one row that
// downloads.
export type MenuRow = {
  readonly name: string;
  readonly detail: string;
  readonly href: string;
  readonly current: boolean;
  readonly external: boolean;
  readonly download?: string | undefined;
};

// One titled group of command menu rows, never empty.
export type MenuGroup = {
  readonly heading: 'pages' | 'contact' | 'file';
  readonly rows: readonly MenuRow[];
};

const isExternal = (href: string): boolean => /^https?:\/\//.test(href);

// Home first, as `SITE_NAV` must not list the page that draws it, then every
// page; the contact rows, each key as its name and its label as its detail;
// then the CV PDF. `routePattern` marks the current page, so a route outside
// the menu (`/404`, `/styleguide`) marks none. A group with no rows is left
// out.
export const commandMenuGroups = (
  basics: { readonly name: string } & Parameters<typeof formatContactRows>[0],
  routePattern: string,
): readonly MenuGroup[] => {
  const groups: readonly MenuGroup[] = [
    {
      heading: 'pages',
      rows: [{ label: 'home', href: '/' }, ...SITE_NAV].map(
        ({ label, href }) => ({
          name: label,
          detail: '',
          href,
          current: href === routePattern,
          external: isExternal(href),
        }),
      ),
    },
    {
      heading: 'contact',
      rows: formatContactRows(basics).map(({ key, label, href }) => ({
        name: key,
        detail: label,
        href,
        current: false,
        external: isExternal(href),
      })),
    },
    {
      heading: 'file',
      rows: [
        {
          name: CV_PDF_PATH.replace(/^\//, ''),
          detail: 'download',
          href: CV_PDF_PATH,
          current: false,
          external: false,
          download: cvPdfFileName(basics.name),
        },
      ],
    },
  ];
  return groups.filter(({ rows }) => rows.length > 0);
};
