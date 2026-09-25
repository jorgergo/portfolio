// The home page menu (spec 0004). Site structure, not CV content, so it lives
// in code: each page spec adds its own row, and a row whose page does not
// answer 200 fails the page test. Planned order once every page exists:
// about → /about, cv → /cv, portfolio → /portfolio, contact → /contact.
export const SITE_NAV: readonly {
  readonly label: string;
  readonly href: string;
}[] = [{ label: 'cv', href: '/cv' }];

// A row's number comes from its position, never stored: 0 gives `01`, 9 gives
// `10`, so the menu renumbers itself as pages ship.
export const formatRowNumber = (index: number): string =>
  String(index + 1).padStart(2, '0');
