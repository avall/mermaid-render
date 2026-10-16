export const EXPORT_FORMATS = ['png', 'svg', 'jpg', 'webp', 'pdf'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const SCALES = [1, 2, 4] as const;
export type Scale = (typeof SCALES)[number];

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface FormatInfo {
  readonly mime: string;
  readonly extension: string;
}

const FORMAT_INFO: Record<ExportFormat, FormatInfo> = {
  png: { mime: 'image/png', extension: 'png' },
  svg: { mime: 'image/svg+xml', extension: 'svg' },
  jpg: { mime: 'image/jpeg', extension: 'jpg' },
  webp: { mime: 'image/webp', extension: 'webp' },
  pdf: { mime: 'application/pdf', extension: 'pdf' },
};

const TRANSPARENT_FORMATS: ReadonlySet<ExportFormat> = new Set(['png', 'svg', 'webp']);

export const formatInfo = (format: ExportFormat): FormatInfo => FORMAT_INFO[format];

export const supportsTransparency = (format: ExportFormat): boolean => TRANSPARENT_FORMATS.has(format);

export const isExportFormat = (value: string): value is ExportFormat =>
  (EXPORT_FORMATS as readonly string[]).includes(value);

/** Pixel size of a raster export; never smaller than 1px per side. */
export const scaledSize = (size: Size, scale: number): Size => ({
  width: Math.max(1, Math.round(size.width * scale)),
  height: Math.max(1, Math.round(size.height * scale)),
});

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface FilenameInput {
  readonly diagram: string;
  readonly theme: string;
  readonly scale: number;
  readonly format: ExportFormat;
}

/** Safe download name like `mermaid-flowchart-clean-docs-2x.png`; vector SVG omits the scale. */
export const buildFilename = ({ diagram, theme, scale, format }: FilenameInput): string => {
  const parts = ['mermaid', slug(diagram) || 'diagram', slug(theme) || 'theme'];
  if (format !== 'svg') parts.push(`${scale}x`);
  return `${parts.join('-')}.${formatInfo(format).extension}`;
};

const KIND_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(flowchart|graph)\b/, 'flowchart'],
  [/^sequenceDiagram\b/, 'sequence'],
  [/^classDiagram\b/, 'class'],
  [/^erDiagram\b/, 'er'],
  [/^gantt\b/, 'gantt'],
  [/^stateDiagram\b/, 'state'],
  [/^gitGraph\b/, 'gitgraph'],
  [/^pie\b/, 'pie'],
  [/^mindmap\b/, 'mindmap'],
  [/^timeline\b/, 'timeline'],
];

/** Detects the diagram keyword, skipping front matter, directives and comments. */
export const diagramKind = (code: string): string => {
  const body = code.replace(/^---[\s\S]*?---/, '');
  const line = body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l !== '' && !l.startsWith('%%'));
  if (!line) return 'diagram';
  return KIND_PATTERNS.find(([pattern]) => pattern.test(line))?.[1] ?? 'diagram';
};
