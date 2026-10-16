export const FONT_SUBSETS = ['latin', 'latin-ext'] as const;
export type FontSubset = (typeof FONT_SUBSETS)[number];

/** CSS `unicode-range` values of the Google Fonts subsets bundled in assets/fonts. */
export const UNICODE_RANGES: Readonly<Record<FontSubset, string>> = {
  latin:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext':
    'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

/** Parses a CSS `unicode-range` list into inclusive code point intervals; malformed entries are skipped. */
export const parseUnicodeRange = (value: string): [number, number][] =>
  value.split(',').flatMap((entry) => {
    const match = /^\s*U\+([0-9A-F]{1,6})(?:-([0-9A-F]{1,6}))?\s*$/i.exec(entry);
    if (!match?.[1]) return [];
    const start = Number.parseInt(match[1], 16);
    return [[start, match[2] ? Number.parseInt(match[2], 16) : start] as [number, number]];
  });

const LATIN_EXT = parseUnicodeRange(UNICODE_RANGES['latin-ext']);
const LATIN = parseUnicodeRange(UNICODE_RANGES.latin);
const inRanges = (ranges: readonly [number, number][], code: number): boolean => ranges.some(([a, b]) => code >= a && code <= b);

/** Subsets to embed for `text`: latin always, latin-ext only when a glyph needs it and latin lacks it. */
export const subsetsFor = (text: string): FontSubset[] => {
  const needsExt = Array.from(text).some((char) => {
    const code = char.codePointAt(0) ?? 0;
    return !inRanges(LATIN, code) && inRanges(LATIN_EXT, code);
  });
  return needsExt ? ['latin', 'latin-ext'] : ['latin'];
};
