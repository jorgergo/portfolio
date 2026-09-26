# 0009. Rationale: about page as a short list of what you care about

The decision record behind [index.md](index.md). `/develop` does not read this file.

## Context

> ⚠️ Premise note: the scope row planned `/about` as `basics.summary` in a paragraph or two, plus a photo if you added one. That summary is already the CV page's Summary section, word for word, so the page would repeat the CV; and design.md's build mandate calls a page with one heading and one paragraph a placeholder, not a page. The right framing is a page that says what the CV cannot: what you care about, in your own voice. The interview took that path, and the photo was dropped.

The site is a home page (a name, a line, a menu) and a Harvard style CV. Recruiters and peers are the audience, the style is extremely minimal, and look and feel is the top priority. The about page is the one place on the site for your voice rather than your record.

Forces on the design:

- **No employer in the intro.** You want to be seen for your role and your craft, not for where you work; spec 0008 already takes Ford off the home page and its description for the same reason.
- **Content in one place.** Profile content lives only in `cv.json` behind a strict schema (spec 0002), and pages read it through `getCv()`.
- **The design system is fixed.** Six colour tokens, Plex Mono as the default face with Plex Sans only inside the CV's `Prose`, eleven components, no arbitrary values, a hashed CSP that forbids inline styles and scripts (specs 0001, 0003).
- **Metadata and cards are generated.** A page with a share card adds one `SHARE_PAGES` row and one `DESCRIPTIONS` rule (spec 0006).
- **The menu lists only live pages.** `SITE_NAV` gains a row only when the page exists (spec 0004, carried by 0008), and spec 0008's home redesign waits for About and Contact to ship.
- **You chose a reference.** Midway through, you pasted fbold.dev's about text (a greeting, "I care about...", arrow lines, a closing line with an email) and asked for something that simple.

## Options considered

### Option 1: An "I care about" list from `cv.json`

A heading, one intro line, three to seven lines each opened by a muted `›` (a topic, then one fact), and a closing sentence with the email as a link. The words live in a new `about` block in `cv.json`.

**Pros**:
- Matches the reference you chose and reads in seconds.
- Says something the CV does not, without repeating its summary.
- Every word is validated by the schema; a copy edit is one file.
- Uses only existing tokens and components.

**Cons**:
- Needs new copy, which I drafted and you must own.
- A hidden span marker costs Safari's list announcement.
- Adds a non CV block to a file named `cv.json`.

### Option 2: The CV summary as the page (the scope row's plan)

`basics.summary` in a paragraph or two under an `about` heading, with a photo if one is added.

**Pros**:
- No new content and no schema change; ships in an hour.

**Cons**:
- Repeats the CV's Summary section word for word.
- A heading and a paragraph is a placeholder by design.md's own rule.
- The summary names Ford, which you no longer want in an intro.

### Option 3: A short first person story in paragraphs

Three or four paragraphs: what you do now, how you got here, what you care about, life outside work.

**Pros**:
- The most personal; room for a real story.

**Cons**:
- More text than you want; you asked for "as minimal as possible".
- Needs a story you have not written, so it would ship thin or late.
- Paragraphs in Plex Sans would break the 75 character line (80 per line) and widen the `Prose` rule; in Plex Mono they read heavier than a list.

### Option 4: The Claude Design draft's frame as drawn

The draft's three short paragraphs: the first in `fg`, the other two in `muted`, no closing link.

**Pros**:
- Already drawn, close in spirit to Option 1.

**Cons**:
- Its copy is invented ("I like small tools, plain text and systems that stay simple as they grow").
- Muted body text measures Lc 67 light and 55 dark, below APCA's Lc 75 for body text, and turns meta text into body text.
- No way on from the page but the footer.

## Rationale

Option 1 is the only one that meets all the forces at once. It gives the page a job the CV cannot do (your interests and your voice), it stays inside the minimalism you asked for (one line per topic, as in your reference), and it keeps every word in `cv.json` behind limits, so the page cannot quietly break or grow. Option 2 fails the build mandate and the no employer rule; Option 3 fails minimalism and waits on writing; Option 4 carries invented words and a contrast shortfall.

Within Option 1, the smaller calls follow the evidence. Plex Mono sets 62 characters per line in the 592px column, inside the usual 45 to 75 range, where Plex Sans sets 80; and mono keeps the page on the site's main surface without widening the `Prose` rule. Every line is `fg` because only `fg` clears APCA's body text target in both schemes. The `›` marker is the one arrow like glyph the shipped Plex Mono file draws; the reference's `→` is missing from it and would fall back to a different face on each operating system. The 20px marker column repeats the CV's bullet indent exactly, and the 8px gap separates wrapped lines clearly (17.6px between lines against 9.6px of leading inside one).

The closing sentence keeps your words whole in `cv.json` with an `{email}` marker, so the address has one source (`basics.email`) and the grammar stays in your hands. The description uses your wording, "What Jorge cares about, at work and away from it.", with the first name derived from `basics.name`, the same way the CV description derives name and role.

## Evidence

### Measurements (2026-09-26)

Characters per line at 16px, averaged over your real `basics.summary` with fontTools on the shipped `latin` 400 files:

| Face | Average advance | Per 592px line | Per 272px line (320px phone) |
|---|---|---|---|
| Plex Mono | 9.6px | 62 | 28 |
| Plex Sans | 7.37px | 80 | 37 |

Contrast on `bg`, from the site's own `contrastRatio` and `apcaContrast` in `src/lib/contrast.ts`:

| Pair | WCAG ratio | APCA Lc |
|---|---|---|
| light `fg` | 12.71 | 91 |
| light `muted` | 4.64 | 67 |
| dark `fg` | 13.24 | 86 |
| dark `muted` | 7.61 | 55 |

Glyph coverage of `ibm-plex-mono-latin-400-normal.woff` (and the sans file, identical here): `←` `U+2190` missing, `→` `U+2192` missing, `↑` `U+2191` present, `↓` `U+2193` present, `›` `U+203A` present, `·` and `…` present. So the footer's existing `← home` arrow already renders in the fallback face.

Line wraps of the accepted copy beside a 20px marker column: at desktop (572px of text) 59 characters per row on Mac and 57 in Linux CI, and the websites, automation, sport, and finance lines wrap to two rows; at 320px (252px of text) 25 or 26 characters per row, and the lines take one to five rows. The longest line is 90 characters, under the 100 cap. The closing renders 75 characters and wraps once at desktop, with the address on its own row.

Lengths against the caps: intro 30 of 40, closing 63 of 160 (raw, with `{email}`), description 49, card footer 28 of 60, title `About · Jorge González Ozorno` 29.

### The references

- **fbold.dev** (pasted by you): "Hi, I'm Fred, I care about..." then four arrow lines, each a topic and a "one day I will" aspiration, then one sentence inviting work by contact form or email. You kept the greeting, the list, and the closing, and chose a fact per line instead of an aspiration.
- **Claude Design draft** (`Portfolio.dc.html`, "Minimalist Developer Portfolio"): an `about` h1 at 18px weight 500, three short paragraphs 24px apart with `text-wrap: pretty`, the first in `fg` and two in `muted`, no closing link. It set the heading, the spacing, and the pretty wrapping; its copy and its greys were not kept.

### How the copy was built

Each line pairs a topic you picked with a fact from `cv.json` or from your own words: websites (the full stack skill line), automation (release automation at work, the UiPath robots at your internship), teaching and docs (your documentation and mentoring skill line), sport (basketball captain 2013 to 2018, plus boxing, tennis, weightlifting, and CrossFit), music (guitar), superheroes and anime ("they give me hope", your words), finance and markets (a recent interest, your words). No line names an employer.
