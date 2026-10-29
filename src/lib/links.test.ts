import { describe, expect, it } from 'vitest';
import { isExternal } from '@/lib/links';

describe('isExternal', () => {
  // covers: spec 0003 AC-7, spec 0015 AC-1
  it.each([
    ['https://github.com/jorgergo', true],
    ['http://example.com', true],
    ['/', false],
    ['/cv', false],
    ['/cv.pdf', false],
    ['/https', false],
    ['mailto:jorgergo@icloud.com', false],
  ])('reads %s as external: %s', (href, expected) => {
    expect(isExternal(href)).toBe(expected);
  });
});
