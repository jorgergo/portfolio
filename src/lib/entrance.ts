// The page entrance (spec 0016). Every block that enters takes its class from
// `enterClass`, never by hand. Tailwind scans source text, so the eight class
// names are written out here, where it finds them; a class built from a
// template string alone would compile to nothing. The `enter-*` utility in
// global.css turns the number into the block's delay, its step times 50ms.
export const ENTER_CLASSES = [
  'enter-0',
  'enter-1',
  'enter-2',
  'enter-3',
  'enter-4',
  'enter-5',
  'enter-6',
  'enter-7',
] as const;

export type EnterClass = (typeof ENTER_CLASSES)[number];

// The class for a block's place in its page's order, counted from 0. Any
// fraction is dropped and the step is held to 0 through 7, so blocks past the
// eighth enter together with it and no page settles later than 950ms. Every
// number gives a real class: NaN reads as step 0.
export const enterClass = (step: number): EnterClass => {
  const last = ENTER_CLASSES.length - 1;
  const index = Math.min(Math.max(Math.trunc(step), 0), last);
  return ENTER_CLASSES[index] ?? ENTER_CLASSES[0];
};
