import { describe, expect, it } from 'vitest';
import { EXPORT_FORMATS, buildFilename, diagramKind, formatInfo, scaledSize, supportsTransparency } from '../src/domain/export';

describe('export helpers', () => {
  it.each([
    ['png', 'image/png', 'png'],
    ['svg', 'image/svg+xml', 'svg'],
    ['jpg', 'image/jpeg', 'jpg'],
    ['webp', 'image/webp', 'webp'],
    ['pdf', 'application/pdf', 'pdf'],
  ] as const)('%s maps to %s / .%s', (format, mime, ext) => {
    expect(formatInfo(format)).toEqual({ mime, extension: ext });
  });

  it('lists the five formats in UI order', () => {
    expect(EXPORT_FORMATS).toEqual(['png', 'svg', 'jpg', 'webp', 'pdf']);
  });

  it.each([
    ['png', true],
    ['svg', true],
    ['webp', true],
    ['jpg', false],
    ['pdf', false],
  ] as const)('%s transparency support is %s', (format, expected) => {
    expect(supportsTransparency(format)).toBe(expected);
  });

  it.each([
    [{ width: 100, height: 50 }, 1, { width: 100, height: 50 }],
    [{ width: 100.4, height: 50.6 }, 2, { width: 201, height: 101 }],
    [{ width: 300, height: 120 }, 4, { width: 1200, height: 480 }],
    [{ width: 0, height: 0 }, 2, { width: 1, height: 1 }],
  ])('scales %o by %d', (size, scale, expected) => {
    expect(scaledSize(size, scale)).toEqual(expected);
  });

  it.each([
    [{ diagram: 'flowchart', theme: 'clean-docs', scale: 2, format: 'png' }, 'mermaid-flowchart-clean-docs-2x.png'],
    [{ diagram: 'Sequence Diagram!', theme: 'GitHub Dark', scale: 4, format: 'webp' }, 'mermaid-sequence-diagram-github-dark-4x.webp'],
    [{ diagram: '', theme: 'blueprint', scale: 1, format: 'svg' }, 'mermaid-diagram-blueprint.svg'],
    [{ diagram: '../../etc', theme: 'aurora-noir', scale: 1, format: 'pdf' }, 'mermaid-etc-aurora-noir-1x.pdf'],
  ] as const)('builds filename for %o', (input, expected) => {
    expect(buildFilename(input)).toBe(expected);
  });
});

describe('diagram kind detection', () => {
  it.each([
    ['flowchart LR\n A-->B', 'flowchart'],
    ['graph TD\n A-->B', 'flowchart'],
    ['%%{init: {}}%%\nsequenceDiagram\n A->>B: hi', 'sequence'],
    ['---\ntitle: x\n---\nclassDiagram', 'class'],
    ['erDiagram', 'er'],
    ['gantt', 'gantt'],
    ['stateDiagram-v2', 'state'],
    ['gitGraph', 'gitgraph'],
    ['pie title Pets', 'pie'],
    ['', 'diagram'],
  ])('detects %j as %s', (code, kind) => {
    expect(diagramKind(code)).toBe(kind);
  });
});
