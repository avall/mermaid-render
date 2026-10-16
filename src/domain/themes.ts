export type ThemeTier = 'standard' | 'advanced';
export type ThemeVariables = Readonly<Record<string, string | boolean>>;

export interface MermaidThemeConfig {
  readonly theme: 'base';
  readonly themeVariables: ThemeVariables;
  readonly themeCSS?: string;
  readonly look?: 'classic' | 'handDrawn';
}

/** SVG post-processing a theme needs beyond Mermaid config. */
export type ThemeEnhancement = 'editorial-focus' | 'sketch';

export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly tier: ThemeTier;
  readonly bestFor: string;
  readonly description: string;
  readonly background: string;
  readonly dark: boolean;
  readonly padding: number;
  readonly mermaid: MermaidThemeConfig;
  readonly enhancement?: ThemeEnhancement;
  /** Keys copied into the shareable init directive. */
  readonly directiveKeys: readonly string[];
}

interface Palette {
  readonly dark: boolean;
  readonly background: string;
  readonly fill: string;
  readonly border: string;
  readonly text: string;
  readonly line: string;
  readonly secondary: string;
  readonly tertiary: string;
  readonly edgeLabelBackground: string;
  readonly font: string;
  readonly accents: readonly [string, string, string, string];
  readonly branchText: string;
  readonly pie: readonly [string, string, string, string, string, string];
}

const SANS = 'DM Sans, sans-serif';

/** Expands a compact palette into Mermaid base themeVariables for every diagram type we ship. */
const variables = (p: Palette, overrides: ThemeVariables = {}): ThemeVariables => {
  const git = Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      [`git${i}`, p.accents[i % 4] as string],
      [`gitBranchLabel${i}`, p.branchText],
      [`gitInv${i}`, p.background],
    ]).flat(),
  );
  const pie = Object.fromEntries(p.pie.map((color, i) => [`pie${i + 1}`, color]));
  return {
    darkMode: p.dark,
    background: p.background,
    mainBkg: p.fill,
    primaryColor: p.fill,
    primaryTextColor: p.text,
    primaryBorderColor: p.border,
    lineColor: p.line,
    secondaryColor: p.secondary,
    secondaryBorderColor: p.border,
    secondaryTextColor: p.text,
    tertiaryColor: p.tertiary,
    tertiaryBorderColor: p.border,
    tertiaryTextColor: p.text,
    nodeBorder: p.border,
    clusterBkg: p.secondary,
    clusterBorder: p.border,
    titleColor: p.text,
    edgeLabelBackground: p.edgeLabelBackground,
    labelTextColor: p.text,
    textColor: p.text,
    noteBkgColor: p.secondary,
    noteTextColor: p.text,
    noteBorderColor: p.border,
    actorBkg: p.fill,
    actorBorder: p.border,
    actorTextColor: p.text,
    actorLineColor: p.line,
    signalColor: p.line,
    signalTextColor: p.text,
    labelBoxBkgColor: p.fill,
    labelBoxBorderColor: p.border,
    activationBkgColor: p.secondary,
    activationBorderColor: p.border,
    sequenceNumberColor: p.background,
    attributeBackgroundColorOdd: p.fill,
    attributeBackgroundColorEven: p.secondary,
    sectionBkgColor: p.fill,
    altSectionBkgColor: p.secondary,
    taskBkgColor: p.fill,
    taskBorderColor: p.border,
    taskTextColor: p.text,
    taskTextDarkColor: p.text,
    taskTextOutsideColor: p.text,
    activeTaskBkgColor: p.accents[1],
    activeTaskBorderColor: p.border,
    doneTaskBkgColor: p.secondary,
    doneTaskBorderColor: p.line,
    critBkgColor: p.accents[3],
    critBorderColor: p.border,
    gridColor: p.line,
    todayLineColor: p.accents[3],
    commitLabelColor: p.text,
    commitLabelBackground: p.edgeLabelBackground,
    tagLabelColor: p.text,
    tagLabelBackground: p.fill,
    tagLabelBorder: p.border,
    pieStrokeColor: p.border,
    pieOuterStrokeColor: p.border,
    pieTitleTextColor: p.text,
    pieSectionTextColor: p.border,
    pieLegendTextColor: p.text,
    ...git,
    ...pie,
    fontFamily: p.font,
    fontSize: '14px',
    ...overrides,
  };
};

const ROUNDED = '.node rect, .node .label-container { rx: 6px; ry: 6px; }';
const BASE_KEYS = [
  'primaryColor',
  'primaryTextColor',
  'primaryBorderColor',
  'lineColor',
  'secondaryColor',
  'tertiaryColor',
  'edgeLabelBackground',
  'labelTextColor',
  'fontFamily',
] as const;
const DARK_KEYS = ['darkMode', 'background', 'mainBkg', ...BASE_KEYS] as const;

export const THEMES: readonly Theme[] = [
  {
    id: 'clean-docs',
    name: 'Clean Docs',
    label: 'Clean Docs',
    tier: 'standard',
    bestFor: 'Best for documentation.',
    description: 'A crisp white canvas for technical docs and wiki pages.',
    background: '#FFFFFF',
    dark: false,
    padding: 32,
    directiveKeys: BASE_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#FFFFFF',
        fill: '#EAFBF8',
        border: '#2EC4B6',
        text: '#17202A',
        line: '#243447',
        secondary: '#F8FAFC',
        tertiary: '#FFFFFF',
        edgeLabelBackground: '#FFFFFF',
        font: SANS,
        accents: ['#2EC4B6', '#5EEAD4', '#0EA5E9', '#F59E0B'],
        branchText: '#17202A',
        pie: ['#EAFBF8', '#CCF5EE', '#99E9DC', '#5EDACB', '#2EC4B6', '#F8FAFC'],
      }),
      themeCSS: `${ROUNDED} .node rect, .node polygon, .node path.basic { filter: drop-shadow(0 4px 8px rgba(23,32,42,0.08)); stroke-width: 1.6px; }`,
    },
  },
  {
    id: 'github-readme',
    name: 'GitHub README',
    label: 'GitHub README',
    tier: 'standard',
    bestFor: 'Best for README files.',
    description: 'Soft GitHub blues that blend into a repository page.',
    background: '#FFFFFF',
    dark: false,
    padding: 24,
    directiveKeys: BASE_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#FFFFFF',
        fill: '#DDF1FF',
        border: '#0969DA',
        text: '#24292F',
        line: '#57606A',
        secondary: '#F6F8FA',
        tertiary: '#FFFFFF',
        edgeLabelBackground: '#FFFFFF',
        font: SANS,
        accents: ['#54AEFF', '#8C959F', '#AFB8C1', '#4AC26B'],
        branchText: '#24292F',
        pie: ['#DDF1FF', '#B6E3FF', '#80CCFF', '#54AEFF', '#218BFF', '#F6F8FA'],
      }),
      themeCSS: ROUNDED,
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    label: 'GitHub Dark',
    tier: 'standard',
    bestFor: 'Best for dark READMEs, docs, and slides.',
    description: "GitHub's dark palette, free, and readable on dark slides with a transparent background.",
    background: '#0D1117',
    dark: true,
    padding: 24,
    directiveKeys: DARK_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: true,
        background: '#0D1117',
        fill: '#161B22',
        border: '#58A6FF',
        text: '#E6EDF3',
        line: '#8B949E',
        secondary: '#161B22',
        tertiary: '#21262D',
        edgeLabelBackground: '#0D1117',
        font: SANS,
        accents: ['#58A6FF', '#3FB950', '#D29922', '#F778BA'],
        branchText: '#0D1117',
        pie: ['#1F6FEB', '#388BFD', '#58A6FF', '#79C0FF', '#A5D6FF', '#21262D'],
      }),
      themeCSS: ROUNDED,
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    label: 'Editorial',
    tier: 'advanced',
    bestFor: 'Best for blog posts and decks.',
    description: 'One accent on the node that matters, hairline rules, monospace labels, and a generated legend.',
    background: '#FFFFFF',
    dark: false,
    padding: 40,
    directiveKeys: BASE_KEYS,
    enhancement: 'editorial-focus',
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#FFFFFF',
        fill: '#FFFFFF',
        border: '#27272A',
        text: '#18181B',
        line: '#3F3F46',
        secondary: '#F4F4F5',
        tertiary: '#FFFFFF',
        edgeLabelBackground: '#FFFFFF',
        font: SANS,
        accents: ['#F97316', '#52525B', '#A1A1AA', '#18181B'],
        branchText: '#FFFFFF',
        pie: ['#FFEDD5', '#F4F4F5', '#E4E4E7', '#D4D4D8', '#A1A1AA', '#FFFFFF'],
      }),
      themeCSS: `${ROUNDED} .node rect, .node polygon, .node path { stroke-width: 1px; }
        .edgeLabel, .edgeLabel text, .commit-label, .pieLegend text { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
        .node:first-of-type rect { fill: #FFF1E6; stroke: #F97316; }
        .flowchart-link:first-of-type, .edge-thickness-normal:first-of-type { stroke: #F97316; }`,
    },
  },
  {
    id: 'whiteboard-sketch',
    name: 'Whiteboard Sketch',
    label: 'Sketch Paper',
    tier: 'advanced',
    bestFor: 'Best for workshops and architecture notes.',
    description: 'Hand-drawn geometry on warm paper for explainers.',
    background: '#FFFDF6',
    dark: false,
    padding: 32,
    directiveKeys: BASE_KEYS,
    enhancement: 'sketch',
    mermaid: {
      theme: 'base',
      look: 'handDrawn',
      themeVariables: variables(
        {
          dark: false,
          background: '#FFFDF6',
          fill: '#FEF3C7',
          border: '#1F2937',
          text: '#1F2937',
          line: '#374151',
          secondary: '#DCFCE7',
          tertiary: '#DBEAFE',
          edgeLabelBackground: '#FFFDF6',
          font: "'Patrick Hand', cursive",
          accents: ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8'],
          branchText: '#1F2937',
          pie: ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#DDD6FE', '#FED7AA'],
        },
        { fontSize: '16px' },
      ),
      themeCSS: `.node rect, .node path { stroke-width: 1.8px; }
        .arrow { stroke: #2B2F36 !important; stroke-width: 2.4px !important; }
        .commit { stroke: #1F2937 !important; stroke-width: 2px !important; }
        .branch-label rect, .branchLabelBkg { stroke: #1F2937 !important; stroke-width: 2px !important; }
        .commit-label, .tag-label, .branch-label, .branchLabel text, .legend text, .slice, .pieTitleText { font-family: 'Patrick Hand', cursive !important; }
        .commit-label, .tag-label { fill: #1F2937 !important; font-size: 13px; }
        .branch-label, .branchLabel text { font-size: 17px; }`,
    },
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    label: 'Warm Editorial',
    tier: 'advanced',
    bestFor: 'Best for long-form posts.',
    description: 'Amber paper for articles and printed handouts.',
    background: '#FFF8E8',
    dark: false,
    padding: 32,
    directiveKeys: BASE_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#FFF8E8',
        fill: '#FEF0CD',
        border: '#B45309',
        text: '#422006',
        line: '#92400E',
        secondary: '#FFFBEB',
        tertiary: '#FFF8E8',
        edgeLabelBackground: '#FFF8E8',
        font: SANS,
        accents: ['#D97706', '#B45309', '#F59E0B', '#78350F'],
        branchText: '#FFFBEB',
        pie: ['#FEF3C7', '#FFFBEB', '#FDE68A', '#FCD34D', '#FBBF24', '#FFF8E8'],
      }),
      themeCSS: `${ROUNDED} .pieTitleText { font-family: 'Space Grotesk', sans-serif; font-weight: 700; }`,
    },
  },
  {
    id: 'aurora-noir',
    name: 'Aurora Noir',
    label: 'Aurora Noir',
    tier: 'advanced',
    bestFor: 'Best for dark docs and product decks.',
    description: 'An obsidian canvas with a mint aurora glow.',
    background: '#0A0F14',
    dark: true,
    padding: 32,
    directiveKeys: DARK_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: true,
        background: '#0A0F14',
        fill: '#0F1C1F',
        border: '#5EEAD4',
        text: '#E2F5F1',
        line: '#94A3B8',
        secondary: '#111A20',
        tertiary: '#0A0F14',
        edgeLabelBackground: '#0A0F14',
        font: SANS,
        accents: ['#5EEAD4', '#2DD4BF', '#A7F3D0', '#38BDF8'],
        branchText: '#0A0F14',
        pie: ['#134E4A', '#115E59', '#0F766E', '#0D9488', '#14B8A6', '#0F1C1F'],
      }),
      themeCSS: `${ROUNDED} .node rect, .node polygon, .node path { stroke-width: 1.6px; filter: drop-shadow(0 0 6px rgba(94,234,212,0.45)); }`,
    },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    label: 'Blueprint',
    tier: 'advanced',
    bestFor: 'Best for engineering diagrams.',
    description: 'Engineering-blueprint blue with luminous cyan connectors.',
    background: '#0B1A2E',
    dark: true,
    padding: 32,
    directiveKeys: DARK_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: true,
        background: '#0B1A2E',
        fill: '#10284A',
        border: '#3B82F6',
        text: '#DBEAFE',
        line: '#60A5FA',
        secondary: '#0E2240',
        tertiary: '#0B1A2E',
        edgeLabelBackground: '#0B1A2E',
        font: SANS,
        accents: ['#2F7DE1', '#2F7DE1', '#2F7DE1', '#2DD4BF'],
        branchText: '#EFF6FF',
        pie: ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#22D3EE', '#10284A'],
      }),
      themeCSS: `${ROUNDED} .flowchart-link, .edgePath path { stroke: #22D3EE !important; } .arrowheadPath, marker path { fill: #22D3EE !important; stroke: #22D3EE !important; }`,
    },
  },
  {
    id: 'champagne',
    name: 'Champagne',
    label: 'Champagne',
    tier: 'advanced',
    bestFor: 'Best for brand and marketing decks.',
    description: 'Warm ivory with refined rose-gold nodes.',
    background: '#FBF6F0',
    dark: false,
    padding: 32,
    directiveKeys: BASE_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#FBF6F0',
        fill: '#F7E9E0',
        border: '#B9805F',
        text: '#3B2A22',
        line: '#8C5A3C',
        secondary: '#FDF8F3',
        tertiary: '#FFFFFF',
        edgeLabelBackground: '#FBF6F0',
        font: "'Space Grotesk', sans-serif",
        accents: ['#C9967A', '#B9805F', '#E3BFA9', '#8C5A3C'],
        branchText: '#FFFFFF',
        pie: ['#F7E9E0', '#FDF8F3', '#FFFFFF', '#EED8CA', '#E3BFA9', '#FBF6F0'],
      }),
      themeCSS: `${ROUNDED} .pieCircle { filter: drop-shadow(0 6px 10px rgba(59,42,34,0.12)); } .pieOuterCircle { stroke: #3B2A22; }`,
    },
  },
  {
    id: 'emerald-suite',
    name: 'Emerald Suite',
    label: 'Emerald Suite',
    tier: 'advanced',
    bestFor: 'Best for polished presentations.',
    description: 'A fresh sage-and-emerald palette for decks.',
    background: '#F2F7F3',
    dark: false,
    padding: 32,
    directiveKeys: BASE_KEYS,
    mermaid: {
      theme: 'base',
      themeVariables: variables({
        dark: false,
        background: '#F2F7F3',
        fill: '#E3F4E9',
        border: '#3FA372',
        text: '#14352A',
        line: '#2F5D4A',
        secondary: '#F7FBF8',
        tertiary: '#FFFFFF',
        edgeLabelBackground: '#F2F7F3',
        font: SANS,
        accents: ['#34A36B', '#6FC79A', '#A7DDBF', '#0F766E'],
        branchText: '#FFFFFF',
        pie: ['#E3F4E9', '#C6E9D3', '#A7DDBF', '#6FC79A', '#34A36B', '#F7FBF8'],
      }),
      themeCSS: `${ROUNDED} .node rect, .node polygon, .node path { filter: drop-shadow(0 3px 6px rgba(20,53,42,0.10)); }`,
    },
  },
];

export const DEFAULT_THEME_ID = 'clean-docs';

export const findTheme = (id: string | null | undefined): Theme =>
  THEMES.find((t) => t.id === id) ?? (THEMES.find((t) => t.id === DEFAULT_THEME_ID) as Theme);

/** Mermaid `%%{init}%%` directive that reproduces the theme without this tool. */
export const themeInitDirective = (theme: Theme): string => {
  const vars = Object.fromEntries(theme.directiveKeys.map((key) => [key, theme.mermaid.themeVariables[key]]));
  return `%%{init: {"theme": "base", "themeVariables": ${JSON.stringify(vars, null, 2)}}}%%`;
};
