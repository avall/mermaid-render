import './styles.css';
import { type RoutePage, parseRoute } from './domain/route';
import { installFonts } from './infra/fonts';
import { mountEditorPage } from './ui/editorPage';
import { mountThemesPage } from './ui/themesPage';

const TITLES: Readonly<Record<RoutePage, string>> = {
  editor: 'Mermaid Render — Free Mermaid Editor and Exporter',
  themes: 'Mermaid Themes and Styles — 10 Presets + themeVariables | Mermaid Render',
};

let mounted: RoutePage | null = null;

/** Hash router: one HTML file serves the editor and the themes page, also from file://. */
const navigate = (): void => {
  const route = parseRoute(window.location.hash, window.location.search);
  if (route.page !== mounted) {
    mounted = route.page;
    document.title = TITLES[route.page];
    if (route.page === 'themes') mountThemesPage();
    else mountEditorPage();
    window.scrollTo(0, 0);
  }
  const target = route.section ? document.getElementById(route.section) : null;
  if (target) requestAnimationFrame(() => target.scrollIntoView());
  else if (window.location.hash === '#/') window.scrollTo(0, 0);
};

installFonts();
window.addEventListener('hashchange', navigate);
navigate();
