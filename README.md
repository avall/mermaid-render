# mermaid-render

Client-only Mermaid editor and exporter with 10 export themes. No backend, no sign-in, no network calls and no diagram storage: everything runs in the browser.

## Features

- Live preview with starter templates (flowchart, sequence, class, ER, Gantt, state).
- 10 themes: Clean Docs, GitHub README, GitHub Dark, Editorial, Whiteboard Sketch, Warm Editorial, Aurora Noir, Blueprint, Champagne, Emerald Suite.
- Export to PNG, SVG, JPG, WebP and PDF at 1x/2x/4x, with optional transparent background.

## Development

```sh
npm install
npm run dev        # dev server
npm test           # unit tests
npm run typecheck
npm run build      # single self-contained dist/index.html
```

The build is one HTML file that works from `file://` or any static host. Pushing to `main` deploys it to GitHub Pages through `.github/workflows/deploy.yml`.

Fonts are bundled under `src/assets/fonts/` (SIL Open Font License).
