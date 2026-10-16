import { escapeHtml } from './dom';

const TOKEN =
  /(\b(?:flowchart|graph|sequenceDiagram|classDiagram|erDiagram|gantt|stateDiagram-v2|stateDiagram|gitGraph|pie|mindmap|timeline|participant|actor|subgraph|end|loop|alt|else|opt|par|note|title|section|dateFormat|class|state|commit|branch|checkout|merge|LR|RL|TD|TB|BT)\b)|(\[[^\]\n]*\]|\([^)\n]*\)|\{[^}\n]*\}|"[^"\n]*")|((?:<?[-=.]+[->xo]+|-->>|->>)+)/g;

const highlightLine = (line: string): string => {
  if (line.trim().startsWith('%%')) return `<span class="tok-comment">${escapeHtml(line)}</span>`;
  let html = '';
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    const css = match[1] ? 'tok-kw' : match[2] ? 'tok-str' : 'tok-arrow';
    html += `${escapeHtml(line.slice(last, index))}<span class="${css}">${escapeHtml(match[0])}</span>`;
    last = index + match[0].length;
  }
  return html + escapeHtml(line.slice(last));
};

/** Lightweight Mermaid syntax colouring for the code overlay; output is HTML-escaped. */
export const highlightMermaid = (code: string): string => code.split('\n').map(highlightLine).join('\n');
