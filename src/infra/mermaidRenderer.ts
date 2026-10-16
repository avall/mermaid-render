import mermaid, { type MermaidConfig } from 'mermaid';
import type { Theme } from '../domain/themes';
import { enhanceSvg } from './enhance';

export type RenderResult = { readonly ok: true; readonly svg: string } | { readonly ok: false; readonly error: string };

let queue: Promise<unknown> = Promise.resolve();
let counter = 0;

const configFor = (theme: Theme): MermaidConfig => ({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  theme: 'base',
  themeVariables: theme.mermaid.themeVariables,
  themeCSS: theme.mermaid.themeCSS ?? '',
  look: theme.mermaid.look ?? 'classic',
  layout: 'dagre',
  handDrawnSeed: 7,
  fontFamily: String(theme.mermaid.themeVariables['fontFamily']),
  htmlLabels: false,
  flowchart: { htmlLabels: false, curve: 'basis', padding: 14, nodeSpacing: 40, rankSpacing: 56 },
  sequence: { mirrorActors: false },
  gitGraph: { mainBranchName: 'main', rotateCommitLabel: true },
});

const errorMessage = (error: unknown): string => {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/^Error:\s*/, '').trim() || 'Unknown Mermaid error';
};

const renderNow = async (code: string, theme: Theme): Promise<RenderResult> => {
  const id = `mr-${Date.now().toString(36)}-${++counter}`;
  mermaid.initialize(configFor(theme));
  try {
    const { svg } = await mermaid.render(id, code);
    return { ok: true, svg: await enhanceSvg(svg, code, theme) };
  } catch (error) {
    document.getElementById(id)?.remove();
    document.getElementById(`d${id}`)?.remove();
    return { ok: false, error: errorMessage(error) };
  }
};

/** Renders Mermaid code with a theme; calls are serialized because Mermaid config is global. */
export const renderDiagram = (code: string, theme: Theme): Promise<RenderResult> => {
  const job = queue.then(() => renderNow(code, theme));
  queue = job.catch(() => undefined);
  return job;
};
