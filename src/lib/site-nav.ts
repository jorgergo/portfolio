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

// One row of the command menu (spec 0014): a `NavRow` key, its label and
// link, whether it is the page you are on, and the saved file name of the one
// row that downloads.
export type MenuRow = {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
  readonly download?: string | undefined;
};

// Home first, as `SITE_NAV` must not list the page that draws it; then every
// page, every contact row, and the CV PDF. `routePattern` marks the current
// page, so a route outside the menu (`/404`, `/styleguide`) marks none.
export const commandMenuRows = (
  basics: { readonly name: string } & Parameters<typeof formatContactRows>[0],
  routePattern: string,
): readonly MenuRow[] => [
  ...[{ label: 'home', href: '/' }, ...SITE_NAV].map(({ label, href }) => ({
    key: 'page',
    label,
    href,
    current: href === routePattern,
  })),
  ...formatContactRows(basics).map(({ key, label, href }) => ({
    key,
    label,
    href,
    current: false,
  })),
  {
    key: 'download',
    label: CV_PDF_PATH.replace(/^\//, ''),
    href: CV_PDF_PATH,
    current: false,
    download: cvPdfFileName(basics.name),
  },
];
