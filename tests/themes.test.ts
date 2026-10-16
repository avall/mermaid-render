import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_ID, THEMES, findTheme, themeInitDirective } from '../src/domain/themes';

const HEX = /^#[0-9a-f]{6}$/i;

describe('theme registry', () => {
  it('holds exactly 10 themes with unique ids', () => {
    expect(THEMES).toHaveLength(10);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(10);
  });

  it('splits into 3 standard and 7 advanced themes', () => {
    expect(THEMES.filter((t) => t.tier === 'standard')).toHaveLength(3);
    expect(THEMES.filter((t) => t.tier === 'advanced')).toHaveLength(7);
  });

  it.each(THEMES.map((t) => [t.id, t] as const))('%s has valid colors and base config', (_id, theme) => {
    expect(theme.background).toMatch(HEX);
    expect(theme.mermaid.theme).toBe('base');
    expect(theme.padding).toBeGreaterThan(0);
    const colors = Object.entries(theme.mermaid.themeVariables).filter(([key]) => /color|bkg|background/i.test(key));
    expect(colors.length).toBeGreaterThan(0);
    colors.forEach(([, value]) => expect(value).toMatch(HEX));
  });

  it('only Whiteboard Sketch uses the hand-drawn look', () => {
    expect(THEMES.filter((t) => t.mermaid.look === 'handDrawn').map((t) => t.id)).toEqual(['whiteboard-sketch']);
  });

  it('resolves themes by id and falls back to the default', () => {
    expect(findTheme('blueprint').name).toBe('Blueprint');
    expect(findTheme('nope').id).toBe(DEFAULT_THEME_ID);
    expect(findTheme(null).id).toBe(DEFAULT_THEME_ID);
  });

  it('builds a parseable init directive', () => {
    const directive = themeInitDirective(findTheme('github-dark'));
    expect(directive.startsWith('%%{init: ')).toBe(true);
    const json = directive.slice('%%{init: '.length, directive.lastIndexOf('}%%'));
    expect(JSON.parse(json).themeVariables.primaryBorderColor).toBe('#58A6FF');
  });
});

describe('theme samples', () => {
  it('provides a gallery sample for every theme', async () => {
    const { THEME_SAMPLES, TEMPLATES } = await import('../src/domain/samples');
    THEMES.forEach((t) => expect(THEME_SAMPLES[t.id]).toBeTruthy());
    expect(TEMPLATES.map((t) => t.id)).toEqual(['flowchart', 'sequence', 'class', 'er', 'gantt', 'state']);
  });
});
