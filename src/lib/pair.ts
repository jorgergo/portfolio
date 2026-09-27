// The Harvard pair (left text, right meta) that `CvEntry` and the `/projects`
// rows share, written once so the two pages cannot drift apart (specs 0005
// and 0010). Below `xs` (480px) the right value drops under the left text,
// left aligned; from 480px the pair shares one line, baseline aligned, the
// right value at the column's right edge. Tailwind scans `src/`, so these
// classes compile like any in markup.
export const PAIR =
  'flex flex-col gap-x-4 xs:flex-row xs:items-baseline xs:justify-between';
