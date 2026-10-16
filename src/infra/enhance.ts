import type { Theme } from '../domain/themes';
import { applyEditorialFocus } from './editorialFocus';
import { applySketch } from './sketch';

/** Mounts the SVG off-screen so styles and text metrics resolve, applies the theme enhancement, re-serializes. */
export const enhanceSvg = async (svg: string, code: string, theme: Theme): Promise<string> => {
  if (!theme.enhancement) return svg;
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  if (parsed.nodeName !== 'svg') return svg;
  const root = document.importNode(parsed, true) as unknown as SVGSVGElement;
  host.append(root);
  document.body.append(host);
  try {
    if (theme.enhancement === 'editorial-focus') await applyEditorialFocus(root, code);
    else applySketch(root);
    return new XMLSerializer().serializeToString(root);
  } catch (error) {
    console.warn('Theme enhancement skipped:', error);
    return svg;
  } finally {
    host.remove();
  }
};
