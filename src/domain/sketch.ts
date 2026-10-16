const SKETCH_DIAGRAMS: ReadonlySet<string> = new Set(['gitGraph', 'pie']);

/** Diagram types whose renderer ignores Mermaid's hand-drawn look. */
export const needsSketch = (diagramType: string | null | undefined): boolean => SKETCH_DIAGRAMS.has(diagramType ?? '');

/** Stable rough.js seed per element so every render and export draws the same strokes. */
export const sketchSeed = (index: number): number => ((index + 1) * 2654435761) % 2147483647 || 1;

export const stickyFill = (index: number, palette: readonly string[]): string => palette[index % palette.length] ?? '#FDE68A';

const round = (value: number): number => Math.round(value * 100) / 100;

/** SVG path for a rounded rectangle; the radius is clamped to half the shortest side. */
export const roundedRectPath = (x: number, y: number, w: number, h: number, r: number): string => {
  const k = Math.min(r, w / 2, h / 2);
  const [x0, y0, x1, y1] = [x, y, x + w, y + h].map(round) as [number, number, number, number];
  const [l, t, rr, b] = [x + k, y + k, x + w - k, y + h - k].map(round) as [number, number, number, number];
  return `M${l} ${y0} H${rr} Q${x1} ${y0} ${x1} ${t} V${b} Q${x1} ${y1} ${rr} ${y1} H${l} Q${x0} ${y1} ${x0} ${b} V${t} Q${x0} ${y0} ${l} ${y0} Z`;
};
