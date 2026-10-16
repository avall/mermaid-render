import { THEME_SAMPLES } from '../domain/samples';
import { THEMES, type Theme, themeInitDirective } from '../domain/themes';
import { renderDiagram } from '../infra/mermaidRenderer';
import { $, $$, copyText, editorUrl, escapeHtml } from './dom';
import { mountLayout } from './layout';

const STYLING_SAMPLE = `%%{init: {"theme": "base", "themeVariables": {
  "primaryColor": "#ffffff",
  "primaryBorderColor": "#2d3142",
  "primaryTextColor": "#2d3142",
  "lineColor": "#4f5d75",
  "fontFamily": "DM Sans, sans-serif"
}}}%%
flowchart LR
  A[Write] --> B[Preview] --> C[Export]`;

const FAQ: ReadonlyArray<readonly [string, string]> = [
  [
    'How do I change the theme in the Mermaid live editor?',
    'In mermaid.live, open the Configuration panel and pick from the built-in Theme dropdown: default, neutral, dark, forest, or base. In this editor there is nothing to configure — click a style in the export panel and any of the styles on this page applies instantly, with transparent background and 2x–4x export handled at export time.',
  ],
  [
    'How do I make Mermaid diagrams work in dark mode?',
    'Use GitHub Dark, Aurora Noir or Blueprint: with the transparent background turned on, the exported PNG sits on dark slides and dark docs without a white box. Inside plain Mermaid, the built-in dark theme does the same job with a different palette.',
  ],
  [
    'How do I customize Mermaid theme variables?',
    'Add an init directive as the first line of the diagram: %%{init: {"theme": "base", "themeVariables": { ... }}}%% with the variables you want — primaryColor, primaryBorderColor, lineColor, and fontFamily do most of the work. Every style card above expands into exactly this config, so you can copy one and change the colours.',
  ],
  [
    'What themes does Mermaid ship with?',
    'Five built-ins: default, neutral, dark, forest, and base. base is the intended starting point for custom palettes — every style on this page is a set of themeVariables layered on top of it.',
  ],
  [
    'Can a Mermaid theme travel with the diagram?',
    'Yes — that is what the init directive is for. It lives on the first line of the diagram code, so GitHub, docs sites, and mermaid.live render the same styling without any site-level configuration. Layout, padding, and export resolution stay in the renderer, which is what the editor handles.',
  ],
  [
    'Which Mermaid theme should I use for PowerPoint slides?',
    'A light style such as Clean Docs with the transparent background on light decks, so the diagram sits on the slide with no white box. On dark decks, use GitHub Dark or Aurora Noir. Export at 4x (or SVG) so labels stay sharp on projectors.',
  ],
  [
    'Which theme looks best in Word or Google Docs?',
    'Clean Docs on the white background. Document pages are white, so the exported PNG reads like a native figure instead of a pasted screenshot.',
  ],
];

const card = (theme: Theme, index: number): string => `
<article class="theme-card" style="animation-delay:${index * 60}ms">
  <a class="theme-frame${theme.dark ? ' is-dark' : ''}" href="${editorUrl(theme.id)}" style="background:${theme.background};color:${String(theme.mermaid.themeVariables['primaryTextColor'])}" aria-label="Open ${escapeHtml(theme.name)} in the editor">
    <span class="frame-label">${escapeHtml(theme.label)}</span>
    <span class="frame-chip">live render</span>
    <span class="frame-art" data-preview="${theme.id}"><span class="frame-loading">Rendering…</span></span>
  </a>
  <h3>${escapeHtml(theme.name)}${theme.tier === 'advanced' ? '<span class="chip-pro">✦ ADVANCED</span>' : ''}</h3>
  <p class="best">${escapeHtml(theme.bestFor)}</p>
  <p class="desc">${escapeHtml(theme.description)}</p>
  <div class="card-links"><a href="${editorUrl(theme.id)}">Use this style →</a></div>
  <details class="copy-vars">
    <summary>Copy this style as themeVariables</summary>
    <pre>${escapeHtml(themeInitDirective(theme))}</pre>
    <button type="button" data-copy="${theme.id}">Copy directive</button>
  </details>
</article>`;

const pageHtml = (): string => {
  const standard = THEMES.filter((t) => t.tier === 'standard');
  const advanced = THEMES.filter((t) => t.tier === 'advanced');
  return `
<section class="hero">
  <div class="container">
    <span class="pill">Mermaid themes and styles</span>
    <h1>Every Mermaid theme, and when to use it</h1>
    <p class="lead">Mermaid's default palette is built for a preview pane, not for the page your diagram ends up on. These presets restyle the same diagram for README files, dark docs, decks and long-form posts — pick the destination and export.</p>
    <div class="actions">
      <a class="btn btn-primary" href="#tool">Open the editor</a>
      <a class="btn" href="${editorUrl('editorial')}">Editorial: diagram design</a>
      <a class="btn" href="${editorUrl('whiteboard-sketch')}">Whiteboard Sketch</a>
    </div>
  </div>
</section>
<section class="section section-dark">
  <div class="container">
    <h2>Standard styles</h2>
    <p class="sub">Free, no signup, no watermark. Every format and every resolution.</p>
    <div class="grid-3">${standard.map(card).join('')}</div>
  </div>
</section>
<section class="section section-dark" style="padding-top:8px">
  <div class="container">
    <h2>Advanced styles <span class="pro-mark" style="font-size:18px">✦</span></h2>
    <p class="sub">Seven hand-tuned presets for posts, workshops and decks — all unlocked, every format and every resolution.</p>
    <div class="grid-3">${advanced.map((t, i) => card(t, i + 3)).join('')}</div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="panel">
      <h2 style="font-size:28px">Styling Mermaid yourself</h2>
      <p class="sub">Every preset here is a set of Mermaid <span class="inline-code">themeVariables</span>. If you would rather keep the styling in your own file, put an init directive on the first line — it travels with the diagram, so GitHub and your docs site render it the same way.</p>
      <pre class="code-block">${escapeHtml(STYLING_SAMPLE)}</pre>
      <div class="grid-3" style="margin-top:0">
        <div class="mini-card"><h3>Why the defaults look busy</h3><p>Mermaid ships a multi-hue palette so every node type is distinguishable in a preview pane. On a page it competes with your text: several saturated fills, thick strokes and a colour per shape.</p></div>
        <div class="mini-card"><h3>What these presets change</h3><p>One accent at most, hairline borders instead of heavy strokes, and a type ramp where labels and edge captions differ in size and weight rather than colour.</p></div>
        <div class="mini-card"><h3>Where an init directive falls short</h3><p>It cannot change layout, canvas padding, or export resolution — those live in the renderer. That is the part this tool does for you at export time.</p></div>
      </div>
    </div>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="panel">
      <h2 style="font-size:28px">Which style for which destination</h2>
      <div class="grid-3">
        <div class="mini-card"><h3>Docs, wikis and README files</h3><p>Clean Docs or GitHub README, when the diagram should disappear into the page around it.</p></div>
        <div class="mini-card"><h3>A blog post or a slide</h3><p>Editorial. It accents the node your diagram is about and drops everything else to ink and hairlines — the difference between a diagram and a figure.</p></div>
        <div class="mini-card"><h3>Workshops and architecture notes</h3><p>Whiteboard Sketch, when the diagram is part of a story rather than a spec.</p></div>
        <div class="mini-card"><h3>Dark documentation</h3><p>GitHub Dark when the page already looks like GitHub in dark mode. Aurora Noir for a mint glow on obsidian, or Blueprint for engineering blue with cyan connectors.</p></div>
        <div class="mini-card"><h3>Any background at all</h3><p>Turn on Transparent background with any style. It drops the canvas and keeps the style, so use a light style on light slides and a dark one, such as GitHub Dark, on dark slides.</p></div>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="container faq">
    <h2>Mermaid theme FAQ</h2>
    ${FAQ.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}
  </div>
</section>`;
};

const renderPreviews = async (): Promise<void> => {
  for (const theme of THEMES) {
    const target = $(`[data-preview="${theme.id}"]`);
    const result = await renderDiagram(THEME_SAMPLES[theme.id] ?? '', theme);
    if (result.ok) {
      target.innerHTML = result.svg;
      target.querySelector('svg')?.removeAttribute('style');
    } else {
      target.textContent = 'Preview unavailable';
    }
  }
};

/** Mounts the themes gallery with live previews rendered by our own theme engine. */
export const mountThemesPage = (): void => {
  mountLayout('themes', pageHtml());
  $$<HTMLButtonElement>('[data-copy]').forEach((button) =>
    button.addEventListener('click', async () => {
      const theme = THEMES.find((t) => t.id === button.dataset['copy']);
      if (!theme) return;
      button.textContent = (await copyText(themeInitDirective(theme))) ? 'Copied' : 'Copy failed';
    }),
  );
  void renderPreviews();
};
