import { describe, expect, it } from 'vitest';
import { editorHash, parseRoute } from '../src/domain/route';

describe('hash route parsing', () => {
  it.each([
    ['', '', { page: 'editor', section: null, theme: null, format: null }],
    ['#/', '', { page: 'editor', section: null, theme: null, format: null }],
    ['#tool', '', { page: 'editor', section: 'tool', theme: null, format: null }],
    ['#templates', '', { page: 'editor', section: 'templates', theme: null, format: null }],
    ['#/themes', '', { page: 'themes', section: null, theme: null, format: null }],
    ['#/themes/', '', { page: 'themes', section: null, theme: null, format: null }],
    ['#tool?theme=github-dark', '', { page: 'editor', section: 'tool', theme: 'github-dark', format: null }],
    ['#tool?theme=blueprint&format=svg', '', { page: 'editor', section: 'tool', theme: 'blueprint', format: 'svg' }],
    ['#tool', '?theme=champagne', { page: 'editor', section: 'tool', theme: 'champagne', format: null }],
    ['#tool?theme=aurora-noir', '?theme=champagne', { page: 'editor', section: 'tool', theme: 'aurora-noir', format: null }],
    ['#unknown', '', { page: 'editor', section: null, theme: null, format: null }],
  ] as const)('parses hash %j with search %j', (hash, search, expected) => {
    expect(parseRoute(hash, search)).toEqual(expected);
  });
});

describe('editor hash building', () => {
  it('builds a relative hash with the theme preselected', () => {
    expect(editorHash('tool', 'warm-editorial')).toBe('#tool?theme=warm-editorial');
  });

  it('round-trips through the parser', () => {
    expect(parseRoute(editorHash('templates', 'emerald-suite'), '')).toEqual({
      page: 'editor',
      section: 'templates',
      theme: 'emerald-suite',
      format: null,
    });
  });

  it('encodes unsafe theme ids', () => {
    expect(editorHash('tool', 'a b&c')).toBe('#tool?theme=a+b%26c');
  });
});
