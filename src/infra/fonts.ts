import dmSans from '../assets/fonts/dm-sans-latin.woff2?inline';
import jetBrainsMono from '../assets/fonts/jetbrains-mono-latin.woff2?inline';
import patrickHand from '../assets/fonts/patrick-hand-latin.woff2?inline';
import spaceGrotesk from '../assets/fonts/space-grotesk-latin.woff2?inline';

interface BundledFont {
  readonly family: string;
  readonly weight: string;
  readonly dataUrl: string;
}

/** Latin-subset variable fonts (SIL OFL, see assets/fonts/OFL.txt), inlined as data URLs at build time. */
const BUNDLED_FONTS: readonly BundledFont[] = [
  { family: 'DM Sans', weight: '400 700', dataUrl: dmSans },
  { family: 'JetBrains Mono', weight: '400 600', dataUrl: jetBrainsMono },
  { family: 'Patrick Hand', weight: '400', dataUrl: patrickHand },
  { family: 'Space Grotesk', weight: '400 700', dataUrl: spaceGrotesk },
];

export const BUNDLED_FAMILIES: readonly string[] = BUNDLED_FONTS.map((font) => font.family);

const faceCss = (font: BundledFont): string =>
  `@font-face { font-family: '${font.family}'; font-style: normal; font-weight: ${font.weight}; font-display: swap; src: url(${font.dataUrl}) format('woff2'); }`;

/** `@font-face` rules for the given families (all bundled families by default). */
export const fontFaceCss = (families: readonly string[] = BUNDLED_FAMILIES): string =>
  BUNDLED_FONTS.filter((font) => families.includes(font.family)).map(faceCss).join('\n');

/** Registers the bundled fonts for the page itself, without any network request. */
export const installFonts = (): void => {
  const style = document.createElement('style');
  style.dataset['fonts'] = 'bundled';
  style.textContent = fontFaceCss();
  document.head.append(style);
};
