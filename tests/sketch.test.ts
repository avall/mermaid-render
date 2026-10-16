import { describe, expect, it } from 'vitest';
import { needsSketch, roundedRectPath, sketchSeed, stickyFill } from '../src/domain/sketch';

describe('needsSketch', () => {
  it.each([
    ['gitGraph', true],
    ['pie', true],
    ['flowchart-v2', false],
    ['sequence', false],
    [null, false],
  ])('%s -> %s', (type, expected) => expect(needsSketch(type)).toBe(expected));
});

describe('sketchSeed', () => {
  it('is deterministic, positive and distinct for neighbours', () => {
    const seeds = [0, 1, 2, 3].map(sketchSeed);
    expect(seeds).toEqual([0, 1, 2, 3].map(sketchSeed));
    seeds.forEach((seed) => expect(seed).toBeGreaterThan(0));
    expect(new Set(seeds).size).toBe(4);
  });
});

describe('stickyFill', () => {
  it('cycles through the palette', () => {
    const palette = ['#1', '#2', '#3'] as const;
    expect([0, 1, 2, 3, 4].map((i) => stickyFill(i, palette))).toEqual(['#1', '#2', '#3', '#1', '#2']);
  });
});

describe('roundedRectPath', () => {
  it('draws a closed rounded rectangle', () => {
    expect(roundedRectPath(0, 0, 20, 10, 2)).toBe('M2 0 H18 Q20 0 20 2 V8 Q20 10 18 10 H2 Q0 10 0 8 V2 Q0 0 2 0 Z');
  });

  it('clamps the radius to half the shortest side', () => {
    expect(roundedRectPath(0, 0, 10, 4, 9)).toBe('M2 0 H8 Q10 0 10 2 V2 Q10 4 8 4 H2 Q0 4 0 2 V2 Q0 0 2 0 Z');
  });
});
