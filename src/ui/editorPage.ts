import {
  EXPORT_FORMATS,
  type ExportFormat,
  SCALES,
  buildFilename,
  diagramKind,
  isExportFormat,
  scaledSize,
  supportsTransparency,
} from '../domain/export';
import { editorHash, parseRoute, THEMES_HASH } from '../domain/route';
import { DEFAULT_CODE, TEMPLATES } from '../domain/samples';
import { THEMES, type Theme, type ThemeTier, findTheme } from '../domain/themes';
import { COPY_IMAGE_SUCCESS, copyImageErrorMessage, imageCopySupport } from '../domain/clipboard';
import { exportBlob, exportDiagram, exportSize, prepareSvg } from '../infra/exporter';
import { renderDiagram } from '../infra/mermaidRenderer';
import { $, $$, copyText, debounce, escapeHtml } from './dom';
import { highlightMermaid } from './highlight';
import { mountLayout } from './layout';

interface EditorState {
  code: string;
  theme: Theme;
  tier: ThemeTier;
  transparent: boolean;
  format: ExportFormat;
  scale: number;
  customWidth: number | null;
  zoom: number;
  svg: string | null;
}

const KIND_LABELS: Readonly<Record<string, string>> = {
  flowchart: 'Flowchart',
  sequence: 'Sequence',
  class: 'Class',
  er: 'ERD',
  gantt: 'Gantt',
  state: 'State',
  gitgraph: 'GitGraph',
  pie: 'Pie',
  mindmap: 'Mindmap',
  timeline: 'Timeline',
  diagram: 'Diagram',
};

const toolHtml = (): string => `
<section class="hero hero-center">
  <div class="container">
    <span class="pill">Local-first Mermaid export · no signup · no watermark</span>
    <h1>Free Mermaid Editor &amp; Exporter</h1>
    <p class="lead">Paste Mermaid code, preview instantly, and export PNG, SVG, JPG, WebP, or PDF with transparent backgrounds and ten docs-ready styles — all in your browser.</p>
    <div class="actions">
      <a class="btn btn-primary" href="#tool">Convert My Mermaid Diagram — Free</a>
      <a class="btn" href="${THEMES_HASH}">Compare Export Styles</a>
    </div>
    <p class="hero-note">No watermark. No diagram limits. Every style unlocked. · Your code stays local</p>
  </div>
</section>
<section class="container" style="padding-bottom:40px">
  <div class="tool" id="tool">
    <div class="tool-col">
      <div class="code-head">
        <div>
          <div class="tool-label">Paste or edit<br />Mermaid code</div>
          <p class="tool-hint">Replace the sample below, or load another example.</p>
        </div>
        <label class="sr-only" for="templates">Load an example diagram</label>
        <select class="select" id="templates">
          <option value="" disabled selected>Load example</option>
          ${TEMPLATES.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
      <div class="tip-box">
        <span>Tip: click inside the editor and paste your Mermaid code.</span>
        <button class="btn-sm" type="button" id="clear-code">Clear sample</button>
      </div>
      <div class="code-editor">
        <div class="code-gutter" id="gutter" aria-hidden="true"></div>
        <div class="code-area">
          <pre id="highlight" aria-hidden="true"></pre>
          <textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Mermaid code"></textarea>
        </div>
      </div>
    </div>
    <div class="tool-col tool-preview">
      <div class="preview-head">
        <span class="tool-label">Live preview</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          <div class="zoom">
            <button type="button" id="zoom-out" aria-label="Zoom out">−</button>
            <output id="zoom-value">100%</output>
            <button type="button" id="zoom-in" aria-label="Zoom in">+</button>
          </div>
          <span class="chip" id="preview-chip"></span>
        </div>
      </div>
      <div class="preview-frame" id="preview-frame">
        <div class="preview-canvas" id="preview-canvas" role="img" aria-label="Rendered Mermaid preview"></div>
      </div>
      <div class="preview-error" id="preview-error" hidden></div>
    </div>
    <div class="tool-col export-col">
      <div>
        <h2>Render &amp; export</h2>
        <p class="lead-sm">Every style exports free in every format and resolution.</p>
      </div>
      <div><span class="chip" id="kind-chip">Flowchart</span></div>
      <div class="tool-label">Style tier</div>
      <div class="seg seg-2" id="tier">
        <button class="seg-btn" type="button" data-tier="standard">Standard<small>3 everyday styles</small></button>
        <button class="seg-btn" type="button" data-tier="advanced">Advanced <span class="pro-mark">✦</span><small>7 premium styles · unlocked</small></button>
      </div>
      <div class="tool-label">Export style</div>
      <div class="seg seg-2" id="styles"></div>
      <div class="tool-label">Background</div>
      <div class="switch-row">
        <span id="transparent-label">Transparent background</span>
        <button class="switch" type="button" role="switch" id="transparent" aria-checked="false" aria-labelledby="transparent-label"></button>
      </div>
      <p class="tool-hint" id="transparent-hint">Works with every style. Pick a dark style for dark slides.</p>
      <div class="tool-label">Scale</div>
      <div class="seg seg-3" id="scales">
        ${SCALES.map((s) => `<button class="seg-btn center" type="button" data-scale="${s}">${s}x</button>`).join('')}
      </div>
      <label class="width-row">
        <input type="number" id="custom-width" min="16" max="16000" step="1" placeholder="Or exact width, e.g. 1200" aria-label="Custom export width in pixels" />
        <span>px wide</span>
      </label>
      <div class="info-box" id="info"></div>
      <div class="tool-label">Format</div>
      <div class="seg seg-2" id="formats">
        ${EXPORT_FORMATS.map((f) => `<button class="seg-btn center" type="button" data-format="${f}">${f === 'webp' ? 'WebP' : f.toUpperCase()}</button>`).join('')}
      </div>
      <div class="download-row">
        <button class="btn btn-primary download-btn" type="button" id="download">Download PNG</button>
        <button class="btn copy-image-btn download-btn" type="button" id="copy-image" title="Copy a PNG with the current style, scale and background">Copy image</button>
      </div>
      <div class="seg seg-2">
        <button class="seg-btn center" type="button" id="copy-svg">Copy SVG</button>
        <button class="seg-btn center" type="button" id="copy-code">Copy code</button>
      </div>
      <p class="status-line" id="status" role="status"></p>
    </div>
  </div>
</section>
<section class="section">
  <div class="container steps">
    <h2>Paste, Optimize, Export</h2>
    <div class="grid-3">
      <div class="mini-card"><div class="num">1</div><h3>Paste Mermaid Code</h3><p>Drop in a flowchart, sequence diagram, ERD, Gantt chart, class or state diagram.</p></div>
      <div class="mini-card"><div class="num">2</div><h3>Optimize the Export</h3><p>Choose a style, background, and scale while checking the final pixel size.</p></div>
      <div class="mini-card"><div class="num">3</div><h3>Download PNG, SVG, JPG, WebP, or PDF</h3><p>Export a named, crisp asset for docs, slides, blogs, README files, or handoff PDFs.</p></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="container faq">
    <h2>FAQ</h2>
    <details><summary>Is this Mermaid exporter free?</summary><p>Yes. Every style, format and resolution is available without an account, credits or a watermark.</p></details>
    <details><summary>Does my Mermaid code get uploaded?</summary><p>No. Rendering and export run entirely in your browser, and nothing is saved — reload the page and the sample comes back.</p></details>
    <details><summary>Can I export with a transparent background?</summary><p>Yes, for PNG, WebP and SVG. JPG and PDF have no alpha channel, so they always use the style background.</p></details>
    <details><summary>How high can I export?</summary><p>Pick 1x, 2x or 4x, or type an exact pixel width. SVG stays vector at any size.</p></details>
  </div>
</section>`;

const initialState = (): EditorState => {
  const route = parseRoute(window.location.hash, window.location.search);
  const theme = findTheme(route.theme);
  const format = route.format ?? 'png';
  return {
    code: DEFAULT_CODE,
    theme,
    tier: theme.tier,
    transparent: false,
    format: isExportFormat(format) ? format : 'png',
    scale: 2,
    customWidth: null,
    zoom: 1,
    svg: null,
  };
};

const fitNaturalWidth = (svg: SVGSVGElement | null): void => {
  const width = svg?.viewBox.baseVal?.width;
  if (!svg || !width) return;
  svg.style.width = `${width}px`;
  svg.style.maxWidth = '100%';
};

/** Mounts the editor page: code editor, live preview and export panel. */
export const mountEditorPage = (): void => {
  mountLayout('editor', toolHtml());
  const state = initialState();
  const textarea = $<HTMLTextAreaElement>('#code');
  const highlight = $('#highlight');
  const gutter = $('#gutter');
  const canvas = $('#preview-canvas');
  const frame = $('#preview-frame');
  const errorBox = $('#preview-error');
  const status = $('#status');
  let renderToken = 0;

  const setStatus = (text: string): void => {
    status.textContent = text;
  };

  const effectiveScale = (): number => {
    if (!state.customWidth || !state.svg) return state.scale;
    return state.customWidth / exportSize(state.svg, state.theme).width;
  };

  const syncCode = (): void => {
    highlight.innerHTML = `${highlightMermaid(state.code)}\n`;
    const lines = state.code.split('\n').length;
    gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
  };

  const syncInfo = (): void => {
    const kind = diagramKind(state.code);
    const transparent = state.transparent && supportsTransparency(state.format);
    const scale = effectiveScale();
    const filename = buildFilename({ diagram: kind, theme: state.theme.id, scale: Math.round(scale * 100) / 100, format: state.format });
    const size = state.svg ? scaledSize(exportSize(state.svg, state.theme), scale) : null;
    const background = transparent ? 'Transparent' : state.theme.background;
    $('#info').innerHTML = `
      <span>Output: ${escapeHtml(background)} · ${state.theme.padding}px padding</span>
      <span>Size: ${size ? `${size.width} × ${size.height}px` : 'render a valid diagram to calculate'}</span>
      <span>Filename: ${escapeHtml(filename)}</span>`;
    $('#kind-chip').textContent = KIND_LABELS[kind] ?? 'Diagram';
    $('#preview-chip').textContent = `${KIND_LABELS[kind] ?? 'Diagram'} · ${state.theme.name}`;
  };

  const syncControls = (): void => {
    $$('#tier [data-tier]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset['tier'] === state.tier)));
    $('#styles').innerHTML = THEMES.filter((t) => t.tier === state.tier)
      .map((t) => {
        const vars = t.mermaid.themeVariables;
        const swatch = `--sw-node:${String(vars['primaryColor'])};--sw-border:${String(vars['primaryBorderColor'])};background:${t.background}`;
        return `<button class="seg-btn style-btn" type="button" data-theme="${t.id}" aria-pressed="${t.id === state.theme.id}" title="${escapeHtml(t.name)}"><span class="swatch" style="${swatch}"></span><span class="ellipsis">${escapeHtml(t.name)}</span></button>`;
      })
      .join('');
    $$('#scales [data-scale]').forEach((b) =>
      b.setAttribute('aria-pressed', String(!state.customWidth && Number(b.dataset['scale']) === state.scale)),
    );
    $$('#formats [data-format]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset['format'] === state.format)));
    const alpha = supportsTransparency(state.format);
    const toggle = $<HTMLButtonElement>('#transparent');
    toggle.disabled = !alpha;
    toggle.setAttribute('aria-checked', String(state.transparent && alpha));
    $('#transparent-hint').textContent = alpha
      ? 'Works with every style. Pick a dark style for dark slides.'
      : `${state.format.toUpperCase()} has no alpha channel, so the style background is used.`;
    $('#download').textContent = `Download ${state.format === 'webp' ? 'WebP' : state.format.toUpperCase()}`;
    frame.style.background = state.theme.background;
    frame.classList.toggle('transparent', state.transparent && alpha);
    canvas.style.transform = `scale(${state.zoom})`;
    $('#zoom-value').textContent = `${Math.round(state.zoom * 100)}%`;
    syncInfo();
  };

  const render = async (): Promise<void> => {
    const token = ++renderToken;
    const result = await renderDiagram(state.code, state.theme);
    if (token !== renderToken) return;
    if (result.ok) {
      state.svg = result.svg;
      canvas.innerHTML = result.svg;
      fitNaturalWidth(canvas.querySelector('svg'));
      canvas.classList.remove('preview-stale');
      errorBox.hidden = true;
    } else {
      canvas.classList.toggle('preview-stale', state.svg !== null);
      errorBox.hidden = false;
      errorBox.innerHTML = `<strong>Mermaid could not parse this diagram</strong>${escapeHtml(result.error)}`;
    }
    syncInfo();
  };
  const renderSoon = debounce(() => void render(), 300);

  const setTheme = (id: string): void => {
    state.theme = findTheme(id);
    const section = parseRoute(window.location.hash, '').section ?? 'tool';
    window.history.replaceState(null, '', editorHash(section, state.theme.id));
    syncControls();
    void render();
  };

  const setCode = (code: string): void => {
    state.code = code;
    textarea.value = code;
    syncCode();
  };

  textarea.addEventListener('input', () => {
    state.code = textarea.value;
    syncCode();
    renderSoon();
  });
  textarea.addEventListener('scroll', () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
    gutter.scrollTop = textarea.scrollTop;
  });
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    textarea.setRangeText('  ', textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.dispatchEvent(new Event('input'));
  });

  $<HTMLSelectElement>('#templates').addEventListener('change', (event) => {
    const template = TEMPLATES.find((t) => t.id === (event.target as HTMLSelectElement).value);
    if (!template) return;
    setCode(template.code);
    void render();
  });
  $('#clear-code').addEventListener('click', () => {
    setCode('');
    textarea.focus();
    void render();
  });
  $('#tier').addEventListener('click', (event) => {
    const tier = (event.target as HTMLElement).closest<HTMLElement>('[data-tier]')?.dataset['tier'];
    if (tier !== 'standard' && tier !== 'advanced') return;
    state.tier = tier;
    syncControls();
  });
  $('#styles').addEventListener('click', (event) => {
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-theme]')?.dataset['theme'];
    if (id) setTheme(id);
  });
  $('#transparent').addEventListener('click', () => {
    state.transparent = !state.transparent;
    syncControls();
  });
  $('#scales').addEventListener('click', (event) => {
    const scale = Number((event.target as HTMLElement).closest<HTMLElement>('[data-scale]')?.dataset['scale']);
    if (!scale) return;
    state.scale = scale;
    state.customWidth = null;
    $<HTMLInputElement>('#custom-width').value = '';
    syncControls();
  });
  $<HTMLInputElement>('#custom-width').addEventListener('input', (event) => {
    const width = Math.round(Number((event.target as HTMLInputElement).value));
    state.customWidth = width >= 16 && width <= 16000 ? width : null;
    syncControls();
  });
  $('#formats').addEventListener('click', (event) => {
    const format = (event.target as HTMLElement).closest<HTMLElement>('[data-format]')?.dataset['format'] ?? '';
    if (!isExportFormat(format)) return;
    state.format = format;
    syncControls();
  });
  $('#zoom-in').addEventListener('click', () => {
    state.zoom = Math.min(3, state.zoom + 0.25);
    syncControls();
  });
  $('#zoom-out').addEventListener('click', () => {
    state.zoom = Math.max(0.25, state.zoom - 0.25);
    syncControls();
  });

  $<HTMLButtonElement>('#download').addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    if (!state.svg) return setStatus('Fix the diagram before exporting.');
    button.disabled = true;
    setStatus('Preparing export…');
    try {
      const scale = effectiveScale();
      const kind = diagramKind(state.code);
      const filename = buildFilename({ diagram: kind, theme: state.theme.id, scale: Math.round(scale * 100) / 100, format: state.format });
      await exportDiagram({ svg: state.svg, theme: state.theme, format: state.format, scale, transparent: state.transparent, filename });
      setStatus(`Downloaded ${filename}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed');
    } finally {
      button.disabled = false;
    }
  });
  const copyImageButton = $<HTMLButtonElement>('#copy-image');
  const copySupport = imageCopySupport({
    secureContext: window.isSecureContext,
    clipboardWrite: typeof navigator.clipboard?.write === 'function',
    clipboardItem: typeof ClipboardItem === 'function',
  });
  if (!copySupport.supported) {
    copyImageButton.setAttribute('aria-disabled', 'true');
    copyImageButton.title = copySupport.message;
  }
  copyImageButton.addEventListener('click', () => {
    if (!copySupport.supported) return setStatus(copySupport.message);
    if (!state.svg) return setStatus('Fix the diagram before copying.');
    setStatus('Preparing image…');
    const request = { svg: state.svg, theme: state.theme, format: 'png', scale: effectiveScale(), transparent: state.transparent, filename: '' } as const;
    // Safari keeps the user gesture only when the ClipboardItem is built synchronously with a pending blob.
    const item = new ClipboardItem({ 'image/png': exportBlob(request) });
    navigator.clipboard.write([item]).then(
      () => setStatus(COPY_IMAGE_SUCCESS),
      (error: unknown) => setStatus(copyImageErrorMessage(error)),
    );
  });
  $('#copy-svg').addEventListener('click', async () => {
    if (!state.svg) return setStatus('Nothing to copy yet.');
    const transparent = state.transparent && supportsTransparency('svg');
    const { markup } = await prepareSvg(state.svg, state.theme, transparent);
    setStatus((await copyText(markup)) ? 'SVG copied to clipboard' : 'Clipboard is not available');
  });
  $('#copy-code').addEventListener('click', async () => {
    setStatus((await copyText(state.code)) ? 'Code copied to clipboard' : 'Clipboard is not available');
  });

  setCode(state.code);
  syncControls();
  void render();
};
