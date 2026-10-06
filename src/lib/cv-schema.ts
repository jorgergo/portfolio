import { z } from 'astro/zod';
import { FONT_SUBSET, missingGlyphs } from '@/lib/share-card';

// Imports astro/zod and the pure card glyph helpers only (never
// astro:content), so Vitest can load it without Astro's Vite plugin. Shape and
// rules: spec 0002, Data model sketch.

// name, label, and city are sized to the share card (spec 0006): a 30
// character name wraps to at most three lines and a 27 character role still
// clears the footer rule; a name part fills one card line at most; the city
// keeps the footer on one row. The about caps (spec 0009) keep the page to a
// few seconds of reading. The project caps (spec 0010) come from the 640px
// column: a name on one line beside the longest meta, a description in about
// two desktop lines, a keyword chip inside the 272px phone column. The email
// cap (spec 0011) keeps the /contact row's address on one line in that 272px
// column, since the label never shrinks: Plex Mono is 10px per glyph in CI,
// so 27 characters is the most that fits. The tagline cap (spec 0008) keeps
// the home tagline on one line in the same column, by the same count. The CV
// takes three projects, and a project three bullets (spec 0013): what fits
// the two Letter pages the build prints.
export const CV_LIMITS = {
  name: 30,
  namePart: 24,
  label: 27,
  city: 24,
  bio: 160,
  summary: 500,
  entrySummary: 220,
  highlight: 220,
  highlights: 5,
  courses: 8,
  aboutIntro: 40,
  aboutItem: 100,
  aboutItemsMin: 3,
  aboutItems: 7,
  aboutClosing: 160,
  projectName: 30,
  projectDescription: 120,
  projectKeyword: 20,
  projectKeywords: 6,
  projects: 8,
  cvProjectsMax: 3,
  projectHighlights: 3,
  email: 27,
  tagline: 27,
} as const;

export const NETWORKS = ['GitHub', 'LinkedIn'] as const;
export type Network = (typeof NETWORKS)[number];

export const FLUENCY_LEVELS = [
  'Native',
  'Fluent',
  'Professional',
  'Conversational',
  'Basic',
] as const;

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const REGION_PATTERN = /^[A-Z]{2}$/;

const regionNames = new Intl.DisplayNames(['en'], {
  type: 'region',
  fallback: 'none',
});

// English region name for an ISO 3166 code, or undefined when unknown.
// Checks the pattern first because of() throws on malformed codes, and
// rejects ZZ because of() names it "Unknown Region".
export const regionName = (code: string): string | undefined =>
  REGION_PATTERN.test(code) && code !== 'ZZ' ? regionNames.of(code) : undefined;

// Where basics.email goes in about.closing (spec 0009), so the sentence stays
// in cv.json while the address keeps its one source.
export const EMAIL_TOKEN = '{email}';

// A project's status words and the source word for code that is not public
// (spec 0010).
export const PROJECT_STATUSES = [
  'live',
  'building',
  'done',
  'archived',
] as const;
export const PRIVATE_SOURCE = 'private';

// The text on each side of the one email marker, or undefined when the
// marker is missing or repeated. The schema refines with it, so the page's
// fallback is unreachable for valid content.
export const splitAtEmail = (
  closing: string,
): { readonly before: string; readonly after: string } | undefined => {
  const at = closing.indexOf(EMAIL_TOKEN);
  return at !== -1 && at === closing.lastIndexOf(EMAIL_TOKEN)
    ? {
        before: closing.slice(0, at),
        after: closing.slice(at + EMAIL_TOKEN.length),
      }
    : undefined;
};

// Trimmed first, so caps count the visible text.
const text = (max?: number) =>
  max === undefined
    ? z.string().trim().min(1)
    : z.string().trim().min(1).max(max);

// Text the share card draws (spec 0006): only characters the card font has,
// so a letter it lacks fails the build instead of drawing an empty box. No
// abort, so a value over its cap reports both problems in one build.
const cardText = (max: number) =>
  text(max).superRefine((value, ctx) => {
    const missing = missingGlyphs(value);
    if (missing.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: `characters outside the card font (${FONT_SUBSET}): ${missing.join(', ')}; see spec 0006`,
      });
    }
  });

// The name's parts break where Satori breaks a line: at whitespace other than
// the no break spaces (U+00A0, U+2007, U+202F, U+FEFF), and right after a
// hyphen. Each must fit one card line.
const nameParts = (name: string): readonly string[] =>
  name.split(/[^\S\u00A0\u2007\u202F\uFEFF]+|(?<=-)/).filter(Boolean);

const cardName = cardText(CV_LIMITS.name).superRefine((value, ctx) => {
  nameParts(value)
    .map((part) => Array.from(part).length)
    .filter((length) => length > CV_LIMITS.namePart)
    .forEach((length) => {
      ctx.addIssue({
        code: 'custom',
        message: `a name part holds ${length} characters, over ${CV_LIMITS.namePart} (one card line); see spec 0006`,
      });
    });
});

const month = z
  .string()
  // abort stops the entry's date order rule from comparing a malformed month.
  .regex(MONTH_PATTERN, {
    message: 'expected a month as YYYY-MM (01 to 12)',
    abort: true,
  });

const httpsUrl = z.url({ protocol: /^https$/ });

const countryCode = z
  .string()
  .regex(REGION_PATTERN, {
    message: 'expected an uppercase ISO 3166 two letter code',
    abort: true,
  })
  .refine((code) => regionName(code) !== undefined, {
    message: 'unknown ISO 3166 region code',
  });

const highlights = z.array(text(CV_LIMITS.highlight)).max(CV_LIMITS.highlights);

const endNotBeforeStart = (
  entry: { readonly startDate: string; readonly endDate?: string | undefined },
  ctx: z.RefinementCtx,
): void => {
  if (entry.endDate !== undefined && entry.endDate < entry.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate is before startDate',
    });
  }
};

const profile = z.strictObject({
  network: z.enum(NETWORKS),
  username: text(),
  url: httpsUrl,
});

const profiles = z.array(profile).superRefine((list, ctx) => {
  list.forEach((item, index) => {
    if (list.findIndex((other) => other.network === item.network) < index) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'network'],
        message: 'duplicate network',
      });
    }
  });
});

const work = z
  .strictObject({
    name: text(),
    position: text(),
    url: httpsUrl.optional(),
    location: text().optional(),
    startDate: month,
    endDate: month.optional(),
    summary: text(CV_LIMITS.entrySummary).optional(),
    highlights,
  })
  .superRefine(endNotBeforeStart);

const volunteer = z
  .strictObject({
    organization: text(),
    position: text(),
    url: httpsUrl.optional(),
    location: text().optional(),
    startDate: month,
    endDate: month.optional(),
    summary: text(CV_LIMITS.entrySummary).optional(),
    highlights,
  })
  .superRefine(endNotBeforeStart);

const education = z
  .strictObject({
    institution: text(),
    studyType: text(),
    area: text(),
    url: httpsUrl.optional(),
    location: text().optional(),
    startDate: month,
    endDate: month.optional(),
    score: text().optional(),
    courses: z.array(text()).max(CV_LIMITS.courses).optional(),
  })
  .superRefine(endNotBeforeStart);

const award = z.strictObject({
  title: text(),
  awarder: text(),
  date: month,
  summary: text(CV_LIMITS.entrySummary).optional(),
});

const certificate = z.strictObject({
  name: text(),
  issuer: text(),
  date: month,
  url: httpsUrl.optional(),
});

const keywordGroup = z.strictObject({
  name: text(),
  keywords: z.array(text()).min(1),
});

const language = z.strictObject({
  language: text(),
  fluency: z.enum(FLUENCY_LEVELS),
  level: z.enum(CEFR_LEVELS).optional(),
});

const interest = z.strictObject({
  name: text(),
  keywords: z.array(text()).optional(),
});

// The /about page's words (spec 0009). Required, because the page exists. Not
// card text, so the glyph rule does not apply.
const about = z.strictObject({
  intro: text(CV_LIMITS.aboutIntro),
  items: z
    .array(text(CV_LIMITS.aboutItem))
    .min(CV_LIMITS.aboutItemsMin)
    .max(CV_LIMITS.aboutItems),
  closing: text(CV_LIMITS.aboutClosing).refine(
    (value) => splitAtEmail(value) !== undefined,
    {
      message: `closing must hold ${EMAIL_TOKEN} exactly once, where basics.email goes; see spec 0009`,
    },
  ),
});

// Where a project's code lives: an https URL or the word private. A refine
// rather than a union, since a union reports only the URL's own error.
const projectSource = z
  .string()
  .refine(
    (value) => value === PRIVATE_SOURCE || httpsUrl.safeParse(value).success,
    { message: `expected an https URL or "${PRIVATE_SOURCE}"; see spec 0010` },
  );

// The /projects list (spec 0010), also the CV's Projects section through the
// cv flag. Not card text, so the glyph rule does not apply. The bullets show
// on the CV alone (spec 0013), so on a project without the flag they would be
// data that renders nowhere.
const project = z
  .strictObject({
    name: text(CV_LIMITS.projectName),
    description: text(CV_LIMITS.projectDescription),
    startDate: month,
    endDate: month.optional(),
    status: z.enum(PROJECT_STATUSES),
    url: httpsUrl.optional(),
    source: projectSource,
    keywords: z
      .array(text(CV_LIMITS.projectKeyword))
      .min(1)
      .max(CV_LIMITS.projectKeywords),
    cv: z.boolean().optional(),
    highlights: z
      .array(text(CV_LIMITS.highlight))
      .max(CV_LIMITS.projectHighlights)
      .optional(),
  })
  .superRefine(endNotBeforeStart)
  .superRefine((entry, ctx) => {
    if (entry.status === 'live' && entry.url === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message:
          'a live project needs a url, the site a visitor can open; see spec 0010',
      });
    }
    if (entry.highlights !== undefined && entry.cv !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['highlights'],
        message:
          'highlights show only on the CV, so the project must set cv; see spec 0013',
      });
    }
  });

const projects = z
  .array(project)
  .min(1)
  .max(CV_LIMITS.projects)
  .superRefine((list, ctx) => {
    list.forEach((item, index) => {
      if (list.findIndex((other) => other.name === item.name) < index) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'name'],
          message: 'duplicate project name',
        });
      }
    });
    list
      .flatMap((item, index) => (item.cv === true ? [index] : []))
      .slice(CV_LIMITS.cvProjectsMax)
      .forEach((index) => {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'cv'],
          message: `at most ${CV_LIMITS.cvProjectsMax} projects may set cv; see spec 0010`,
        });
      });
  });

// The strict `main` entry schema. `image` is Astro's image() helper in
// content.config.ts and a plain stub such as () => z.string() in tests.
// Never call .readonly() here: Astro rewrites image references in the data.
export const makeCvSchema = <I extends z.ZodType>(image: () => I) =>
  z.strictObject({
    basics: z.strictObject({
      name: cardName,
      label: cardText(CV_LIMITS.label),
      tagline: text(CV_LIMITS.tagline),
      bio: text(CV_LIMITS.bio),
      summary: text(CV_LIMITS.summary),
      email: z.email().max(CV_LIMITS.email),
      location: z.strictObject({
        city: cardText(CV_LIMITS.city),
        countryCode,
      }),
      image: image().optional(),
      profiles: profiles.optional(),
    }),
    about,
    projects,
    work: z.array(work).min(1),
    volunteer: z.array(volunteer).optional(),
    education: z.array(education).min(1),
    awards: z.array(award).optional(),
    certificates: z.array(certificate).optional(),
    skills: z.array(keywordGroup).optional(),
    technologies: z.array(keywordGroup).optional(),
    languages: z.array(language).optional(),
    interests: z.array(interest).optional(),
  });
