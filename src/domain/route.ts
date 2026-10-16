export type RoutePage = 'editor' | 'themes';
export type EditorSection = 'tool' | 'templates';

export interface Route {
  readonly page: RoutePage;
  readonly section: EditorSection | null;
  readonly theme: string | null;
  readonly format: string | null;
}

const SECTIONS: readonly EditorSection[] = ['tool', 'templates'];

const isSection = (value: string): value is EditorSection => SECTIONS.includes(value as EditorSection);

/** Parses `#/themes`, `#tool?theme=id` style hashes; `?theme=` in the search string is a fallback. */
export const parseRoute = (hash: string, search: string): Route => {
  const raw = hash.replace(/^#/, '');
  const queryAt = raw.indexOf('?');
  const path = queryAt === -1 ? raw : raw.slice(0, queryAt);
  const hashParams = new URLSearchParams(queryAt === -1 ? '' : raw.slice(queryAt + 1));
  const searchParams = new URLSearchParams(search);
  const param = (key: string): string | null => hashParams.get(key) ?? searchParams.get(key);
  const page: RoutePage = path.replace(/\/+$/, '') === '/themes' ? 'themes' : 'editor';
  return {
    page,
    section: page === 'editor' && isSection(path) ? path : null,
    theme: param('theme'),
    format: param('format'),
  };
};

/** Relative editor hash that works on file:// and on any static host. */
export const editorHash = (section: EditorSection, themeId: string): string =>
  `#${section}?${new URLSearchParams({ theme: themeId }).toString()}`;

export const THEMES_HASH = '#/themes';
