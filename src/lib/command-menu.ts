// Specs 0014 and 0015: the command menu's client rules. Pure, and this module
// imports nothing, so the script `CommandMenu.astro` bundles carries no content
// code (no schema, no Zod). The rows themselves come from `commandMenuGroups`
// in `site-nav.ts` at build time.

// The dialog's id, shared by the dialog, both buttons that open it, and the
// script that finds it.
export const COMMAND_MENU_ID = 'command-menu';

// A row stays when its text holds the query, ignoring case and the space
// around the query; an empty query keeps every row.
export const rowMatches = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.trim().toLowerCase());

// What the live region reads after a keystroke: the count and the name of the
// row Enter opens (`target`), or nothing for an empty query, so opening the
// menu announces no count.
export const formatMatchCount = (
  count: number,
  query: string,
  target: string,
): string => {
  if (query.trim() === '') return '';
  if (count === 0) return 'no match';
  const rows = count === 1 ? '1 row' : `${String(count)} rows`;
  return `${rows}, enter opens ${target}`;
};

// The footer hint: Apple platforms name the Command key, every other one Ctrl.
export const shortcutHint = (platform: string): 'cmd k' | 'ctrl k' =>
  /^(Mac|iPhone|iPad|iPod)/.test(platform) ? 'cmd k' : 'ctrl k';

// True while an input method is composing text. Safari reports the key that
// ends a composition with `isComposing` false and `keyCode` 229, so both count.
export const isComposingKey = (
  event: Pick<KeyboardEvent, 'isComposing' | 'keyCode'>,
): boolean => event.isComposing || event.keyCode === 229;

const LATIN_LETTER = /^[a-z]$/i;

// Cmd+K or Ctrl+K, with either modifier on every platform. The letter follows
// the layout (`key`), so Dvorak keeps its own `k`; a layout whose K key types
// no Latin letter (Cyrillic, Greek) falls back to the physical key (`code`).
export const isMenuShortcut = (
  event: Pick<
    KeyboardEvent,
    | 'key'
    | 'code'
    | 'metaKey'
    | 'ctrlKey'
    | 'altKey'
    | 'shiftKey'
    | 'repeat'
    | 'isComposing'
    | 'keyCode'
  >,
): boolean => {
  if (!(event.metaKey || event.ctrlKey)) return false;
  if (event.altKey || event.shiftKey || event.repeat) return false;
  if (isComposingKey(event)) return false;
  return LATIN_LETTER.test(event.key)
    ? event.key.toLowerCase() === 'k'
    : event.code === 'KeyK';
};

// Where an arrow key moves focus among `count` visible rows, from `index`,
// where `-1` is the filter field; `selected` is the selected row, `-1` for
// none. From the field, ↓ goes to the row after the selected one (so the
// first row when none is) and ↑ stays. From a row, ↓ goes to the next and
// stops at the last, and ↑ goes to the one before, the first row's ↑ coming
// back to the field.
export const nextFocus = (
  index: number,
  selected: number,
  count: number,
  key: 'ArrowDown' | 'ArrowUp',
): number =>
  key === 'ArrowDown'
    ? Math.min((index === -1 ? selected : index) + 1, count - 1)
    : Math.max(index - 1, -1);
