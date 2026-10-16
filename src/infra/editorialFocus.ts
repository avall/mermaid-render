import mermaid from 'mermaid';
import { type FlowGraph, type LegendItem, focalDirective, legendItems, mainPath, selectFocal } from '../domain/focal';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ACCENT = '#F97316';
const ACCENT_FILL = '#FFF1E6';
const NODE_FILL = '#FFFFFF';
const NODE_STROKE = '#27272A';
const BRANCH = '#3F3F46';
const MUTED = '#71717A';
const SHAPE_SELECTOR = ':scope > rect, :scope > path, :scope > polygon, :scope > circle, :scope > ellipse, :scope > g > path';

interface FlowVertex {
  readonly id: string;
  readonly type?: string;
  readonly classes?: readonly string[];
  readonly domId?: string;
}

interface FlowEdge {
  readonly id?: string;
  readonly start: string;
  readonly end: string;
}

interface FlowDb {
  getVertices(): Map<string, FlowVertex>;
  getEdges(): FlowEdge[];
}

interface FlowModel {
  readonly graph: FlowGraph;
  readonly domIds: ReadonlyMap<string, string>;
}

const isFlowDb = (db: unknown): db is FlowDb =>
  typeof (db as FlowDb | null)?.getVertices === 'function' && typeof (db as FlowDb | null)?.getEdges === 'function';

/** Parses flowchart source into a plain graph, or null for any other diagram type. */
const readFlowModel = async (code: string): Promise<FlowModel | null> => {
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(code);
  if (!diagram.type.startsWith('flowchart') || !isFlowDb(diagram.db)) return null;
  const vertices = [...diagram.db.getVertices().values()];
  const graph: FlowGraph = {
    nodes: vertices.map((v) => ({ id: v.id, shape: v.type ?? 'square', classes: v.classes ?? [] })),
    edges: diagram.db.getEdges().map((e, i) => ({ id: e.id ?? `L_${e.start}_${e.end}_${i}`, from: e.start, to: e.end })),
  };
  return { graph, domIds: new Map(vertices.map((v) => [v.id, v.domId ?? v.id])) };
};

const make = <K extends keyof SVGElementTagNameMap>(svg: SVGSVGElement, tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] => {
  const el = svg.ownerDocument.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
};

const paint = (el: SVGElement, fill: string | null, stroke: string): void => {
  if (fill) el.style.fill = fill;
  el.style.stroke = stroke;
};

/** Recolours the arrow marker of a main-path edge with a cloned accent marker. */
const accentMarker = (svg: SVGSVGElement, path: SVGElement): void => {
  const ref = /#([^)"']+)/.exec(path.getAttribute('marker-end') ?? '')?.[1];
  const marker = ref ? svg.querySelector(`[id="${CSS.escape(ref)}"]`) : null;
  if (!ref || !marker) return;
  const cloneId = `${ref}-focal`;
  if (!svg.querySelector(`[id="${CSS.escape(cloneId)}"]`)) {
    const clone = marker.cloneNode(true) as SVGElement;
    clone.id = cloneId;
    clone.querySelectorAll<SVGElement>('path, polygon').forEach((el) => paint(el, ACCENT, ACCENT));
    marker.after(clone);
  }
  path.setAttribute('marker-end', `url(#${cloneId})`);
};

const styleGraph = (svg: SVGSVGElement, model: FlowModel, focal: string, path: readonly string[]): void => {
  model.graph.nodes.forEach((node) => {
    const el = svg.querySelector(`[id="${CSS.escape(`${svg.id}-${model.domIds.get(node.id) ?? node.id}`)}"]`);
    el?.querySelectorAll<SVGElement>(SHAPE_SELECTOR).forEach((shape) => {
      if (node.id === focal) paint(shape, ACCENT_FILL, ACCENT);
      else if (!shape.style.fill) paint(shape, NODE_FILL, NODE_STROKE);
    });
  });
  const main = new Set(path);
  svg.querySelectorAll<SVGElement>('path[data-edge="true"]').forEach((edge) => {
    if (main.has(edge.dataset['id'] ?? '')) {
      paint(edge, null, ACCENT);
      accentMarker(svg, edge);
    } else if (!edge.style.stroke) {
      paint(edge, null, BRANCH);
    }
  });
};

const textWidth = (text: SVGTextElement): number => {
  try {
    return text.getComputedTextLength() || (text.textContent ?? '').length * 6.4;
  } catch {
    return (text.textContent ?? '').length * 6.4;
  }
};

/** Swatch glyph for a legend entry, drawn in a 22x12 box at (x, y). */
const swatch = (svg: SVGSVGElement, item: LegendItem, x: number, y: number): SVGElement => {
  const box = { x, y, width: 18, height: 12, rx: 3, 'stroke-width': 1 };
  switch (item.kind) {
    case 'focal':
      return make(svg, 'rect', { ...box, fill: ACCENT_FILL, stroke: ACCENT });
    case 'shape':
      if (item.shape === 'diamond') return make(svg, 'polygon', { points: `${x + 9},${y - 1} ${x + 18},${y + 6} ${x + 9},${y + 13} ${x},${y + 6}`, fill: NODE_FILL, stroke: NODE_STROKE });
      if (item.shape === 'circle' || item.shape === 'doublecircle') return make(svg, 'circle', { cx: x + 9, cy: y + 6, r: 6.5, fill: NODE_FILL, stroke: NODE_STROKE });
      return make(svg, 'rect', { ...box, rx: item.shape === 'cylinder' ? 4 : item.shape === 'round' || item.shape === 'stadium' ? 6 : 2, fill: item.shape === 'cylinder' ? '#F4F4F5' : NODE_FILL, stroke: NODE_STROKE });
    case 'main':
    case 'branch': {
      const color = item.kind === 'main' ? ACCENT : BRANCH;
      const g = make(svg, 'g', {});
      g.append(
        make(svg, 'line', { x1: x, y1: y + 6, x2: x + 16, y2: y + 6, stroke: color, 'stroke-width': 1.4 }),
        make(svg, 'polygon', { points: `${x + 16},${y + 2.5} ${x + 22},${y + 6} ${x + 16},${y + 9.5}`, fill: color }),
      );
      return g;
    }
    default: {
      const unreachable: never = item.kind;
      throw new Error(`Unknown legend kind ${String(unreachable)}`);
    }
  }
};

/** Draws a ruled legend row under the diagram and grows the viewBox to include it. */
const drawLegend = (svg: SVGSVGElement, items: readonly LegendItem[]): void => {
  const [x, y, w, h] = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number) as [number, number, number, number];
  if (![x, y, w, h].every(Number.isFinite) || items.length === 0) return;
  const top = y + h + 24;
  const row = top + 22;
  const legend = make(svg, 'g', { class: 'mr-legend' });
  svg.append(legend);
  const label = make(svg, 'text', { x, y: row + 10, fill: MUTED, style: "font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:1.6px" });
  label.textContent = 'LEGEND';
  legend.append(label);
  let cursor = x + textWidth(label) + 40;
  items.forEach((item) => {
    const glyph = swatch(svg, item, cursor, row);
    const text = make(svg, 'text', { x: cursor + 28, y: row + 10, fill: '#52525B', style: "font-family:'DM Sans',sans-serif;font-size:11px" });
    text.textContent = item.label;
    legend.append(glyph, text);
    cursor += 28 + textWidth(text) + 26;
  });
  const width = Math.max(w, cursor - 26 - x);
  legend.prepend(make(svg, 'line', { x1: x, y1: top, x2: x + width, y2: top, stroke: '#E4E4E7', 'stroke-width': 1 }));
  const height = row + 18 - y;
  svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  if (svg.style.maxWidth) svg.style.maxWidth = `${width}px`;
};

/** Editorial theme: accent the focal node and its main path, then add a generated legend. */
export const applyEditorialFocus = async (svg: SVGSVGElement, code: string): Promise<void> => {
  const model = await readFlowModel(code);
  if (!model) return;
  const focal = selectFocal(model.graph, focalDirective(code));
  if (!focal) return;
  const path = mainPath(model.graph, focal);
  styleGraph(svg, model, focal, path);
  drawLegend(svg, legendItems(model.graph, focal, path));
};
