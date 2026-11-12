import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENTER_CLASSES, enterClass } from '@/lib/entrance';

describe('ENTER_CLASSES', () => {
  // covers: spec 0016 AC-4
  it('holds the eight class names, step 0 to step 7, in order', () => {
    expect(ENTER_CLASSES).toHaveLength(8);
    ENTER_CLASSES.forEach((name, step) => {
      expect(name).toBe(`enter-${String(step)}`);
    });
  });
});

describe('enterClass', () => {
  // covers: spec 0016 AC-4
  it.each([
    [0, 'enter-0'],
    [1, 'enter-1'],
    [7, 'enter-7'],
    [8, 'enter-7'],
    [20, 'enter-7'],
    [-1, 'enter-0'],
    [2.5, 'enter-2'],
    [Number.NaN, 'enter-0'],
  ])('gives step %s the class %s', (step, expected) => {
    expect(enterClass(step)).toBe(expected);
  });

  // covers: spec 0016 AC-4
  it('gives every step a class from ENTER_CLASSES', () => {
    for (const step of [-3, 0, 3.9, 6, 7, 12, Number.POSITIVE_INFINITY]) {
      expect(ENTER_CLASSES).toContain(enterClass(step));
    }
  });
});

describe('the source under src/', () => {
  const SRC = new URL('../', import.meta.url);
  // This module and its test are the only files that may name a step.
  const OWN = /^lib\/entrance(\.test)?\.ts$/;

  // A class written by hand skips the cap in enterClass, so every block takes
  // its class from the helper. `enter-[…]` counts too: Tailwind builds
  // nothing for it, so the block would silently stay still.
  // covers: spec 0016 AC-4
  it('writes no enter class by hand outside entrance.ts', () => {
    const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .map((file) => file.replaceAll('\\', '/'))
      .filter((file) => /\.(astro|ts|tsx|js|mjs)$/.test(file))
      .filter((file) => !OWN.test(file));

    const byHand = files.filter((file) =>
      /\benter-(?:\d|\[)/.test(readFileSync(new URL(file, SRC), 'utf8')),
    );

    expect(files).toContain('pages/index.astro');
    expect(byHand).toEqual([]);
  });
});
