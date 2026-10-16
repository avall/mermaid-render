export interface GraphNode {
  readonly id: string;
  readonly shape: string;
  readonly classes: readonly string[];
}

export interface GraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

export interface FlowGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export type LegendKind = 'focal' | 'shape' | 'main' | 'branch';

export interface LegendItem {
  readonly kind: LegendKind;
  readonly label: string;
  readonly shape?: string;
}

/** Class name that marks a node as focal (`class X focal`). */
export const FOCAL_CLASS = 'focal';

const SHAPE_LABELS: readonly (readonly [string, string])[] = [
  ['cylinder', 'Store (cylinder)'],
  ['square', 'Step (rectangle)'],
  ['round', 'Step (rounded)'],
  ['stadium', 'Terminal (stadium)'],
  ['diamond', 'Decision (diamond)'],
  ['circle', 'Event (circle)'],
  ['doublecircle', 'Event (double circle)'],
  ['hexagon', 'Preparation (hexagon)'],
  ['subroutine', 'Subroutine'],
  ['lean_right', 'Input / output (parallelogram)'],
  ['lean_left', 'Input / output (parallelogram)'],
  ['trapezoid', 'Manual step (trapezoid)'],
  ['inv_trapezoid', 'Manual step (trapezoid)'],
  ['odd', 'Flag (asymmetric)'],
];

const shapeLabel = (shape: string): string =>
  SHAPE_LABELS.find(([key]) => key === shape)?.[1] ?? shape.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const shapeRank = (shape: string): number => {
  const index = SHAPE_LABELS.findIndex(([key]) => key === shape);
  return index === -1 ? SHAPE_LABELS.length : index;
};

/** Reads a `%% focal: <id>` comment from Mermaid source. */
export const focalDirective = (code: string): string | undefined =>
  /^\s*%%\s*focal\s*:\s*([^\s]+)\s*$/im.exec(code)?.[1];

const outgoing = (graph: FlowGraph, id: string): readonly GraphEdge[] => graph.edges.filter((e) => e.from === id);

const roots = (graph: FlowGraph): string[] => {
  const targets = new Set(graph.edges.map((e) => e.to));
  const found = graph.nodes.map((n) => n.id).filter((id) => !targets.has(id));
  return found.length > 0 ? found : graph.nodes.slice(0, 1).map((n) => n.id);
};

/** Breadth-first walk from the roots; returns visit order and the edge used to reach each node. */
const walk = (graph: FlowGraph): { order: string[]; via: Map<string, GraphEdge> } => {
  const order = roots(graph);
  const seen = new Set(order);
  const via = new Map<string, GraphEdge>();
  for (let i = 0; i < order.length; i++) {
    for (const edge of outgoing(graph, order[i] ?? '')) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      via.set(edge.to, edge);
      order.push(edge.to);
    }
  }
  return { order, via };
};

const highestDegree = (graph: FlowGraph): string | undefined => {
  const degree = (id: string): number => graph.edges.filter((e) => e.from === id || e.to === id).length;
  return graph.nodes.reduce<GraphNode | undefined>((best, n) => (!best || degree(n.id) > degree(best.id) ? n : best), undefined)?.id;
};

/** Explicit id, then `focal` class, then first branching node from the roots, then highest degree. */
export const selectFocal = (graph: FlowGraph, explicit?: string): string | undefined => {
  if (explicit && graph.nodes.some((n) => n.id === explicit)) return explicit;
  const marked = graph.nodes.find((n) => n.classes.includes(FOCAL_CLASS));
  if (marked) return marked.id;
  return walk(graph).order.find((id) => outgoing(graph, id).length >= 2) ?? highestDegree(graph);
};

/** Edge ids on the shortest path from a root to the focal node. */
export const mainPath = (graph: FlowGraph, focal: string | undefined): string[] => {
  if (!focal) return [];
  const { via } = walk(graph);
  const path: string[] = [];
  for (let edge = via.get(focal); edge; edge = via.get(edge.from)) path.unshift(edge.id);
  return path;
};

/** Legend entries for what the diagram actually contains. */
export const legendItems = (graph: FlowGraph, focal: string | undefined, path: readonly string[]): LegendItem[] => {
  if (!focal || graph.nodes.length === 0) return [];
  const shapes = [...new Set(graph.nodes.filter((n) => n.id !== focal).map((n) => n.shape))].sort((a, b) => shapeRank(a) - shapeRank(b));
  const labels = new Set<string>();
  const shapeItems = shapes
    .map((shape): LegendItem => ({ kind: 'shape', label: shapeLabel(shape), shape }))
    .filter((item) => !labels.has(item.label) && labels.add(item.label));
  const onPath = new Set(path);
  return [
    { kind: 'focal', label: 'Focal' },
    ...shapeItems,
    ...(onPath.size > 0 ? [{ kind: 'main', label: 'Main path' } as const] : []),
    ...(graph.edges.some((e) => !onPath.has(e.id)) ? [{ kind: 'branch', label: 'Branch' } as const] : []),
  ];
};
