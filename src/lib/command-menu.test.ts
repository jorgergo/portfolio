import { describe, expect, it } from 'vitest';
import {
  COMMAND_MENU_ID,
  formatMatchCount,
  isComposingKey,
  isMenuShortcut,
  nextFocus,
  rowMatches,
  shortcutHint,
} from '@/lib/command-menu';

// Spec 0014: the command menu's client rules, on plain values, so no browser
// is needed. The page tests drive the same rules through the real dialog.

describe('COMMAND_MENU_ID', () => {
  // covers: spec 0014 AC-15
  it('names the dialog command-menu', () => {
    expect(COMMAND_MENU_ID).toBe('command-menu');
  });
});

describe('rowMatches', () => {
  // covers: spec 0014 AC-7, AC-15
  it.each([
    ['github @jorgergo', 'git', true],
    ['github @jorgergo', '@jorg', true],
    ['page cv', 'e c', true],
    ['page cv', 'about', false],
    ['linkedin in/jorgergo', 'in/jorgergo/', false],
  ])('%s against %s gives %s', (text, query, expected) => {
    expect(rowMatches(text, query)).toBe(expected);
  });

  // covers: spec 0014 AC-7, AC-15
  it('ignores case on both sides', () => {
    expect(rowMatches('page CV', 'cv')).toBe(true);
    expect(rowMatches('page cv', 'PAGE')).toBe(true);
  });

  // covers: spec 0014 AC-7, AC-15
  it('trims the query but not the space inside it', () => {
    expect(rowMatches('page cv', '  cv  ')).toBe(true);
    expect(rowMatches('page cv', ' page cv ')).toBe(true);
    expect(rowMatches('page cv', 'page  cv')).toBe(false);
  });

  // covers: spec 0014 AC-7, AC-15
  it('keeps every row for an empty or blank query', () => {
    expect(rowMatches('page cv', '')).toBe(true);
    expect(rowMatches('download cv.pdf', '   ')).toBe(true);
  });
});

describe('formatMatchCount', () => {
  // covers: spec 0014 AC-7, AC-15
  it.each([
    [9, '', ''],
    [9, '  ', ''],
    [0, 'zzz', 'no match'],
    [1, 'git', '1 row'],
    [5, 'page', '5 rows'],
  ])('%i rows for %j reads %j', (count, query, expected) => {
    expect(formatMatchCount(count, query)).toBe(expected);
  });
});

describe('shortcutHint', () => {
  // covers: spec 0014 AC-5, AC-15
  it.each([
    ['MacIntel', 'cmd k'],
    ['iPhone', 'cmd k'],
    ['iPad', 'cmd k'],
    ['Win32', 'ctrl k'],
    ['Linux x86_64', 'ctrl k'],
    ['', 'ctrl k'],
  ])('%j gives %s', (platform, expected) => {
    expect(shortcutHint(platform)).toBe(expected);
  });
});

describe('isComposingKey', () => {
  // covers: spec 0014 AC-5, AC-8, AC-15
  it('is true for isComposing and for keyCode 229', () => {
    expect(isComposingKey({ isComposing: true, keyCode: 75 })).toBe(true);
    expect(isComposingKey({ isComposing: false, keyCode: 229 })).toBe(true);
  });

  // covers: spec 0014 AC-5, AC-8, AC-15
  it('is false for a plain key', () => {
    expect(isComposingKey({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});

describe('isMenuShortcut', () => {
  const press = (
    overrides: Partial<Parameters<typeof isMenuShortcut>[0]>,
  ): Parameters<typeof isMenuShortcut>[0] => ({
    key: 'k',
    code: 'KeyK',
    metaKey: false,
    ctrlKey: true,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    keyCode: 75,
    ...overrides,
  });

  // covers: spec 0014 AC-5, AC-15
  it.each([
    ['Meta+K', press({ metaKey: true, ctrlKey: false })],
    ['Ctrl+K', press({})],
    ['an uppercase K', press({ key: 'K' })],
    ['a Cyrillic к on the K key', press({ key: 'к' })],
  ])('accepts %s', (_name, event) => {
    expect(isMenuShortcut(event)).toBe(true);
  });

  // covers: spec 0014 AC-5, AC-15
  it.each([
    ['K with no modifier', press({ ctrlKey: false })],
    ['Alt', press({ altKey: true })],
    ['Shift', press({ shiftKey: true })],
    ['a key repeat', press({ repeat: true })],
    ['isComposing', press({ isComposing: true })],
    ['keyCode 229', press({ keyCode: 229 })],
    ['another letter', press({ key: 'j', code: 'KeyJ' })],
    ['a Latin t on the K key (Dvorak)', press({ key: 't' })],
  ])('refuses %s', (_name, event) => {
    expect(isMenuShortcut(event)).toBe(false);
  });
});

describe('nextFocus', () => {
  // covers: spec 0014 AC-8, AC-15
  it.each([
    ['↓ from the field goes to the first row', -1, 9, 'ArrowDown', 0],
    ['↓ moves to the next row', 3, 9, 'ArrowDown', 4],
    ['↓ on the last row stays there', 8, 9, 'ArrowDown', 8],
    ['↑ moves to the row before', 4, 9, 'ArrowUp', 3],
    ['↑ from the first row goes to the field', 0, 9, 'ArrowUp', -1],
    ['↑ from the field stays in the field', -1, 9, 'ArrowUp', -1],
    [
      '↓ from the field with no rows stays in the field',
      -1,
      0,
      'ArrowDown',
      -1,
    ],
  ] as const)('%s', (_name, index, count, key, expected) => {
    expect(nextFocus(index, count, key)).toBe(expected);
  });
});
