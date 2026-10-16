import dmSansExt from '../assets/fonts/dm-sans-latin-ext.woff2?inline';
import dmSans from '../assets/fonts/dm-sans-latin.woff2?inline';
import jetBrainsMonoExt from '../assets/fonts/jetbrains-mono-latin-ext.woff2?inline';
import jetBrainsMono from '../assets/fonts/jetbrains-mono-latin.woff2?inline';
import patrickHandExt from '../assets/fonts/patrick-hand-latin-ext.woff2?inline';
import patrickHand from '../assets/fonts/patrick-hand-latin.woff2?inline';
import spaceGroteskExt from '../assets/fonts/space-grotesk-latin-ext.woff2?inline';
import spaceGrotesk from '../assets/fonts/space-grotesk-latin.woff2?inline';
import { FONT_SUBSETS, type FontSubset, UNICODE_RANGES } from '../domain/fontSubsets';
import type { Theme } from '../domain/themes';

interface BundledFont {
  readonly family: string;
  readonly weight: string;
  readonly subset: FontSubset;
  readonly dataUrl: string;
}

/** Latin and latin-ext subset fonts (SIL OFL, see assets/fonts/OFL.txt), inlined as data URLs at build time. */
const BUNDLED_FONTS: readonly BundledFont[] = [
  { family: 'DM Sans', weight: '400 700', subset: 'latin', dataUrl: dmSans },
  { family: 'DM Sans', weight: '400 700', subset: 'latin-ext', dataUrl: dmSansExt },
  { family: 'JetBrains Mono', weight: '400 600', subset: 'latin', dataUrl: jetBrainsMono },
  { family: 'JetBrains Mono', weight: '400 600', subset: 'latin-ext', dataUrl: jetBrainsMonoExt },
  { family: 'Patrick Hand', weight: '400', subset: 'latin', dataUrl: patrickHand },
  { family: 'Patrick Hand', weight: '400', subset: 'latin-ext', dataUrl: patrickHandExt },
  { family: 'Space Grotesk', weight: '400 700', subset: 'latin', dataUrl: spaceGrotesk },
  { family: 'Space Grotesk', weight: '400 700', subset: 'latin-ext', dataUrl: spaceGroteskExt },
];

export const BUNDLED_FAMILIES: readonly string[] = [...new Set(BUNDLED_FONTS.map((font) => font.family))];

const faceCss = (font: BundledFont): string =>
  `@font-face { font-family: '${font.family}'; font-style: normal; font-weight: ${font.weight}; font-display: swap; src: url(${font.dataUrl}) format('woff2'); unicode-range: ${UNICODE_RANGES[font.subset]}; }`;

/** `@font-face` rules for the given families and subsets (everything bundled by default). */
export const fontFaceCss = (families: readonly string[] = BUNDLED_FAMILIES, subsets: readonly FontSubset[] = FONT_SUBSETS): string =>
  BUNDLED_FONTS.filter((font) => families.includes(font.family) && subsets.includes(font.subset))
    .map(faceCss)
    .join('\n');

/** Bundled families a theme references in its font variable or CSS. */
export const themeFamilies = (theme: Theme): string[] => {
  const source = `${String(theme.mermaid.themeVariables['fontFamily'])} ${theme.mermaid.themeCSS ?? ''}`;
  return BUNDLED_FAMILIES.filter((family) => source.includes(family));
};

/** Loads the theme faces covering `text` so Mermaid and the legend measure final glyph widths. */
export const themeFontsReady = async (theme: Theme, text: string): Promise<void> => {
  const sample = `Aa${text}`;
  await Promise.all(themeFamilies(theme).map((family) => document.fonts.load(`16px "${family}"`, sample).catch(() => [])));
};

/** Registers the bundled fonts for the page itself, without any network request. */
export const installFonts = (): void => {
  const style = document.createElement('style');
  style.dataset['fonts'] = 'bundled';
  style.textContent = fontFaceCss();
  document.head.append(style);
};
