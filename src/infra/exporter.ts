import { type ExportFormat, type Size, formatInfo, scaledSize, supportsTransparency } from '../domain/export';
import type { Theme } from '../domain/themes';
import { subsetsFor } from '../domain/fontSubsets';
import { fontFaceCss, themeFamilies } from './fonts';

const SVG_NS = 'http://www.w3.org/2000/svg';
export interface PreparedSvg {
  readonly markup: string;
  readonly size: Size;
}

export interface ExportRequest {
  readonly svg: string;
  readonly theme: Theme;
  readonly format: ExportFormat;
  readonly scale: number;
  readonly transparent: boolean;
  readonly filename: string;
}

const parseSvg = (svg: string): SVGSVGElement => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') throw new Error('Rendered output is not an SVG document');
  return root as unknown as SVGSVGElement;
};

const viewBoxOf = (root: SVGSVGElement): [number, number, number, number] => {
  const values = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (values.length === 4 && values.every(Number.isFinite)) return values as [number, number, number, number];
  return [0, 0, Number.parseFloat(root.getAttribute('width') ?? '400'), Number.parseFloat(root.getAttribute('height') ?? '300')];
};

/** Export size in CSS pixels at 1x, including the theme padding. */
export const exportSize = (svg: string, theme: Theme): Size => {
  const [, , w, h] = viewBoxOf(parseSvg(svg));
  return { width: Math.ceil(w + theme.padding * 2), height: Math.ceil(h + theme.padding * 2) };
};

const labelText = (root: SVGSVGElement): string =>
  Array.from(root.querySelectorAll('text, foreignObject'), (el) => el.textContent ?? '').join('');

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read blob'));
    reader.readAsDataURL(blob);
  });

/** Self-contained SVG: padded viewBox, explicit size, optional background and inlined bundled fonts. */
export const prepareSvg = async (svg: string, theme: Theme, transparent: boolean): Promise<PreparedSvg> => {
  const root = parseSvg(svg);
  const [x, y, w, h] = viewBoxOf(root);
  const pad = theme.padding;
  const size = { width: Math.ceil(w + pad * 2), height: Math.ceil(h + pad * 2) };
  root.setAttribute('viewBox', `${x - pad} ${y - pad} ${size.width} ${size.height}`);
  root.setAttribute('width', String(size.width));
  root.setAttribute('height', String(size.height));
  root.removeAttribute('style');
  const fonts = fontFaceCss(themeFamilies(theme), subsetsFor(labelText(root)));
  if (fonts) {
    const style = root.ownerDocument.createElementNS(SVG_NS, 'style');
    style.textContent = fonts;
    root.insertBefore(style, root.firstChild);
  }
  if (!transparent) {
    const rect = root.ownerDocument.createElementNS(SVG_NS, 'rect');
    Object.entries({ x: x - pad, y: y - pad, width: size.width, height: size.height, fill: theme.background }).forEach(
      ([key, value]) => rect.setAttribute(key, String(value)),
    );
    root.insertBefore(rect, fonts ? root.firstChild?.nextSibling ?? null : root.firstChild);
  }
  return { markup: new XMLSerializer().serializeToString(root), size };
};

const loadImage = (markup: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The diagram could not be rasterized'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });

const rasterize = async (prepared: PreparedSvg, scale: number, mime: string, fill: string | null): Promise<Blob> => {
  const image = await loadImage(prepared.markup);
  const { width, height } = scaledSize(prepared.size, scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available in this browser');
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`Encoding ${mime} failed`))), mime, 0.95),
  );
};

const toPdf = async (prepared: PreparedSvg, scale: number, background: string): Promise<Blob> => {
  const { jsPDF } = await import('jspdf');
  const png = await toDataUrl(await rasterize(prepared, scale, 'image/png', background));
  const { width, height } = prepared.size;
  const pdf = new jsPDF({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'px', format: [width, height], hotfixes: ['px_scaling'] });
  pdf.addImage(png, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
};

/** Builds the export blob for any supported format. */
export const exportBlob = async (request: ExportRequest): Promise<Blob> => {
  const { svg, theme, format, scale } = request;
  const transparent = request.transparent && supportsTransparency(format);
  const prepared = await prepareSvg(svg, theme, transparent);
  const fill = transparent ? null : theme.background;
  switch (format) {
    case 'svg':
      return new Blob([prepared.markup], { type: formatInfo('svg').mime });
    case 'pdf':
      return toPdf(prepared, scale, theme.background);
    case 'png':
    case 'jpg':
    case 'webp':
      return rasterize(prepared, scale, formatInfo(format).mime, fill);
    default: {
      const unreachable: never = format;
      throw new Error(`Unsupported format ${String(unreachable)}`);
    }
  }
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const exportDiagram = async (request: ExportRequest): Promise<void> =>
  downloadBlob(await exportBlob(request), request.filename);
