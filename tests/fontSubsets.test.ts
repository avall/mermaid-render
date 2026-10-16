import { describe, expect, it } from 'vitest';
import { FONT_SUBSETS, UNICODE_RANGES, parseUnicodeRange, subsetsFor } from '../src/domain/fontSubsets';

describe('parseUnicodeRange', () => {
  it('reads single code points and ranges', () => {
    expect(parseUnicodeRange('U+0000-00FF, U+0131, U+2000-206F')).toEqual([
      [0x0, 0xff],
      [0x131, 0x131],
      [0x2000, 0x206f],
    ]);
  });

  it('ignores malformed entries', () => expect(parseUnicodeRange('U+00ZZ, , U+0041')).toEqual([[0x41, 0x41]]));
});

describe('subsetsFor', () => {
  it.each([
    ['', ['latin']],
    ['Client --> API Gateway', ['latin']],
    ['Café über naïve', ['latin']],
    ['€ “quotes” — dash', ['latin']],
    ['Łódź', ['latin', 'latin-ext']],
    ['Ősz', ['latin', 'latin-ext']],
    ['Ğ', ['latin', 'latin-ext']],
    ['ẞ', ['latin', 'latin-ext']],
    ['日本語', ['latin']],
  ])('%j -> %j', (text, expected) => expect(subsetsFor(text)).toEqual(expected));
});

describe('UNICODE_RANGES', () => {
  it('declares a range for every subset', () =>
    FONT_SUBSETS.forEach((subset) => expect(parseUnicodeRange(UNICODE_RANGES[subset]).length).toBeGreaterThan(0)));
});
