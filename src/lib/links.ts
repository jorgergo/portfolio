// Whether a link leaves the site: an `http` or `https` URL. Site paths and
// `mailto:` stay put, so they get no arrow (spec 0003 AC-7). `IconLink`,
// `NavRow`, and the command menu rows all ask this one rule.
export const isExternal = (href: string): boolean => /^https?:\/\//.test(href);
