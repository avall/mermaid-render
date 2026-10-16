import { describe, expect, it } from 'vitest';
import { type FlowGraph, focalDirective, legendItems, mainPath, selectFocal } from '../src/domain/focal';

const edge = (from: string, to: string) => ({ id: `L_${from}_${to}_0`, from, to });
const node = (id: string, shape = 'square', classes: readonly string[] = []) => ({ id, shape, classes });

const API_GATEWAY: FlowGraph = {
  nodes: [
    node('client'), node('gw'), node('auth'), node('rate'), node('users'), node('orders'), node('billing'),
    node('udb', 'cylinder'), node('odb', 'cylinder'), node('pay'), node('obs'),
  ],
  edges: [
    edge('client', 'gw'), edge('gw', 'auth'), edge('gw', 'rate'), edge('auth', 'users'), edge('auth', 'orders'),
    edge('auth', 'billing'), edge('users', 'udb'), edge('orders', 'odb'), edge('billing', 'pay'), edge('rate', 'obs'),
  ],
};

describe('focalDirective', () => {
  it.each([
    ['flowchart LR\n  %% focal: gw\n  a --> gw', 'gw'],
    ['flowchart LR\n%%focal:auth-1', 'auth-1'],
    ['flowchart LR\n  a --> b', undefined],
    ['flowchart LR\n  %% something else', undefined],
  ])('reads %j', (code, expected) => expect(focalDirective(code)).toBe(expected));
});

describe('selectFocal', () => {
  it('picks the first branching node reached from the roots', () => {
    expect(selectFocal(API_GATEWAY)).toBe('gw');
  });

  it('honours an explicit node id over the heuristic', () => {
    expect(selectFocal(API_GATEWAY, 'auth')).toBe('auth');
  });

  it('ignores an explicit id that is not in the graph', () => {
    expect(selectFocal(API_GATEWAY, 'missing')).toBe('gw');
  });

  it('honours a node with the focal class', () => {
    const graph = { ...API_GATEWAY, nodes: API_GATEWAY.nodes.map((n) => (n.id === 'billing' ? node('billing', 'square', ['focal']) : n)) };
    expect(selectFocal(graph)).toBe('billing');
  });

  it('falls back to the highest-degree node when nothing branches', () => {
    const chain: FlowGraph = { nodes: [node('a'), node('b'), node('c')], edges: [edge('a', 'b'), edge('b', 'c')] };
    expect(selectFocal(chain)).toBe('b');
  });

  it('walks cycles without roots from the first node', () => {
    const cycle: FlowGraph = {
      nodes: [node('a'), node('b'), node('c'), node('d')],
      edges: [edge('a', 'b'), edge('b', 'c'), edge('b', 'd'), edge('c', 'a')],
    };
    expect(selectFocal(cycle)).toBe('b');
  });

  it('returns undefined for an empty graph', () => {
    expect(selectFocal({ nodes: [], edges: [] })).toBeUndefined();
  });
});

describe('mainPath', () => {
  it('returns the edges of the shortest path from a root to the focal node', () => {
    expect(mainPath(API_GATEWAY, 'gw')).toEqual(['L_client_gw_0']);
    expect(mainPath(API_GATEWAY, 'odb')).toEqual(['L_client_gw_0', 'L_gw_auth_0', 'L_auth_orders_0', 'L_orders_odb_0']);
  });

  it('is empty when the focal node is a root', () => {
    expect(mainPath(API_GATEWAY, 'client')).toEqual([]);
  });

  it('prefers the shortest of several routes', () => {
    const graph: FlowGraph = {
      nodes: [node('a'), node('b'), node('c'), node('d')],
      edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'd'), edge('a', 'd')],
    };
    expect(mainPath(graph, 'd')).toEqual(['L_a_d_0']);
  });
});

describe('legendItems', () => {
  it('lists focal, present shapes, main path and branch for the gateway sample', () => {
    expect(legendItems(API_GATEWAY, 'gw', ['L_client_gw_0']).map((i) => i.label)).toEqual([
      'Focal', 'Store (cylinder)', 'Step (rectangle)', 'Main path', 'Branch',
    ]);
  });

  it('omits shapes, main path and branch entries that are absent', () => {
    const graph: FlowGraph = { nodes: [node('a', 'diamond'), node('b', 'diamond')], edges: [edge('a', 'b')] };
    expect(legendItems(graph, 'b', ['L_a_b_0']).map((i) => i.label)).toEqual(['Focal', 'Decision (diamond)', 'Main path']);
  });

  it('labels unknown shapes from their name', () => {
    const graph: FlowGraph = { nodes: [node('a'), node('b', 'lean_right')], edges: [edge('a', 'b')] };
    expect(legendItems(graph, 'a', []).map((i) => i.label)).toEqual(['Focal', 'Input / output (parallelogram)', 'Branch']);
  });

  it('is empty without a focal node or nodes', () => {
    expect(legendItems({ nodes: [], edges: [] }, undefined, [])).toEqual([]);
  });
});
