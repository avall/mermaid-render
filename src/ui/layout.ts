import { THEMES_HASH } from '../domain/route';

type Page = 'editor' | 'themes';

const LOGO = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M4 5.5h5M11 5.5c3 0 3 9 5 9M11 5.5c2.5 0 3.5 4.5 5 4.5" stroke="#2dd4bf" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="4" cy="5.5" r="2.2" fill="#2dd4bf"/><circle cx="16" cy="10" r="1.8" stroke="#f3f7fa" stroke-width="1.4"/>
  <circle cx="16" cy="14.5" r="1.8" stroke="#f3f7fa" stroke-width="1.4"/>
</svg>`;

const current = (page: Page, target: Page): string => (page === target ? ' aria-current="page"' : '');

export const headerHtml = (page: Page): string => `
<header class="site-header">
  <div class="container">
    <a class="brand" href="#/"><span class="brand-mark">${LOGO}</span>Mermaid Render</a>
    <nav class="nav" aria-label="Main">
      <a href="#tool"${current(page, 'editor')}>Editor</a>
      <a href="#templates">Templates</a>
      <a href="${THEMES_HASH}"${current(page, 'themes')}>Themes</a>
      <a class="nav-cta" href="#tool">Open editor</a>
    </nav>
  </div>
</header>`;

export const footerHtml = (): string => `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="#/"><span class="brand-mark">${LOGO}</span>Mermaid Render</a>
        <p style="margin-top:14px;max-width:360px">Local-first Mermaid editor and export tool. Every diagram is rendered in your browser and never leaves it.</p>
      </div>
      <div>
        <h4>Tool</h4>
        <ul><li><a href="#tool">Editor</a></li><li><a href="#templates">Templates</a></li><li><a href="${THEMES_HASH}">Themes</a></li></ul>
      </div>
      <div>
        <h4>Export</h4>
        <ul><li>PNG · SVG · JPG</li><li>WebP · PDF</li><li>1x · 2x · 4x</li></ul>
      </div>
    </div>
    <p class="footer-legal">Not affiliated with Mermaid.js or Mermaid Chart. Diagrams rendered with mermaid (MIT). Nothing is stored or uploaded.</p>
  </div>
</footer>`;

export const mountLayout = (page: Page, mainHtml: string): void => {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app root');
  app.innerHTML = `${headerHtml(page)}<main>${mainHtml}</main>${footerHtml()}`;
};
