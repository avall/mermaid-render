import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';
import { needsSketch, roundedRectPath, sketchSeed, stickyFill } from '../domain/sketch';

const INK = '#2B2F36';
const STICKY = ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8'] as const;
const MERGE_DOTS = ['#FBCFE8', '#BBF7D0', '#FEF3C7', '#BFDBFE'] as const;
const BASE: Options = { roughness: 1.3, bowing: 1.1, stroke: INK, strokeWidth: 1.8, fillStyle: 'solid' };

type RoughSvg = ReturnType<typeof rough.svg>;
type Redraw = (rc: RoughSvg, el: SVGGraphicsElement, options: Options, index: number) => SVGGElement;

const num = (el: Element, name: string): number => Number.parseFloat(el.getAttribute(name) ?? '0') || 0;

const fillOf = (el: Element): string => {
  const fill = getComputedStyle(el).fill;
  return !fill || fill === 'none' || fill.startsWith('url(') ? 'none' : fill;
};

const points = (el: Element): [number, number][] => {
  const values = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number);
  return values.flatMap((_, i) => (i % 2 === 0 ? [[values[i] ?? 0, values[i + 1] ?? 0] as [number, number]] : []));
};

const box = (rc: RoughSvg, el: Element, options: Options, radius: number): SVGGElement =>
  rc.path(roundedRectPath(num(el, 'x'), num(el, 'y'), num(el, 'width'), num(el, 'height'), radius), options);

/** Selector to redraw function; order matters only for seeds, which follow document order. */
const RULES: readonly (readonly [string, Redraw])[] = [
  ['line.branch', (rc, el, o) => rc.line(num(el, 'x1'), num(el, 'y1'), num(el, 'x2'), num(el, 'y2'), { ...o, strokeWidth: 2.2 })],
  ['path.arrow', (rc, el, o) => rc.path(el.getAttribute('d') ?? '', { ...o, strokeWidth: 2.2 })],
  ['circle.commit:not(.commit-merge)', (rc, el, o) => rc.circle(num(el, 'cx'), num(el, 'cy'), num(el, 'r') * 2, { ...o, fill: fillOf(el) })],
  ['rect.branchLabelBkg', (rc, el, o) => box(rc, el, { ...o, fill: fillOf(el), strokeWidth: 2 }, 6)],
  ['rect.commit-label-bkg', (rc, el, o, i) => box(rc, el, { ...o, fill: stickyFill(i, STICKY), strokeWidth: 1.3 }, 2)],
  ['polygon.tag-label-bkg', (rc, el, o) => rc.polygon(points(el), { ...o, fill: '#FDE68A', strokeWidth: 1.4 })],
  ['path.pieCircle', (rc, el, o) => rc.path(el.getAttribute('d') ?? '', { ...o, fill: el.getAttribute('fill') ?? fillOf(el), strokeWidth: 1.6 })],
  ['circle.pieOuterCircle', (rc, el, o) => rc.circle(num(el, 'cx'), num(el, 'cy'), num(el, 'r') * 2, { ...o, strokeWidth: 2.2 })],
  ['g.legend > rect', (rc, el, o) => box(rc, el, { ...o, fill: fillOf(el), strokeWidth: 1.4 }, 3)],
  // Merge dot: one clean pastel dot inside the commit ring, as on a whiteboard.
  ['circle.commit-merge', (rc, el, o, i) =>
    rc.circle(num(el, 'cx'), num(el, 'cy'), num(el, 'r') * 2, { ...o, fill: stickyFill(i, MERGE_DOTS), roughness: 0.4, strokeWidth: 1.3, disableMultiStroke: true })],
];

/** Whiteboard Sketch for diagrams that ignore `look: handDrawn`: redraws geometry with rough.js. */
export const applySketch = (svg: SVGSVGElement): void => {
  if (!needsSketch(svg.getAttribute('aria-roledescription'))) return;
  const rc = rough.svg(svg);
  RULES.forEach(([selector, redraw], rule) => {
    svg.querySelectorAll<SVGGraphicsElement>(selector).forEach((el, index) => {
      const drawn = redraw(rc, el, { ...BASE, seed: sketchSeed(rule * 1000 + index) }, index);
      drawn.setAttribute('class', `sketch sketch-${selector.replace(/[^a-z-]+/gi, '-')}`);
      const transform = el.getAttribute('transform');
      if (transform) drawn.setAttribute('transform', transform);
      el.replaceWith(drawn);
    });
  });
};
