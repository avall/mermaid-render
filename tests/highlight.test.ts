import { describe, expect, it } from 'vitest';
import { highlightMermaid } from '../src/ui/highlight';

describe('highlightMermaid', () => {
  it('wraps keywords, labels and arrows', () => {
    const html = highlightMermaid('flowchart LR\n  A(Write) --> B');
    expect(html).toContain('<span class="tok-kw">flowchart</span>');
    expect(html).toContain('<span class="tok-str">(Write)</span>');
    expect(html).toContain('<span class="tok-arrow">--&gt;</span>');
  });

  it('escapes HTML in user code', () => {
    expect(highlightMermaid('A["<img onerror=x>"]')).not.toContain('<img');
  });

  it('marks comment lines', () => {
    expect(highlightMermaid('%% note')).toBe('<span class="tok-comment">%% note</span>');
  });
});
