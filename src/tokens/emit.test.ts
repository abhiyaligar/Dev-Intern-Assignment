import { describe, expect, it } from 'vitest';
import { cssVarName, emitLayer, mergeEmitted, resolveTokenValue } from './emit';
import { GLOBAL_TOKENS } from './global';
import type { TokenLayerDef } from './types';
import { buildSemanticTokens } from './brand';

describe('cssVarName', () => {
  it('maps dot paths to --ev- prefixed names', () => {
    expect(cssVarName('button.radius')).toBe('--ev-button-radius');
    expect(cssVarName('gray.a3')).toBe('--ev-gray-a3');
    expect(cssVarName('color.bg')).toBe('--ev-color-bg');
  });
});

describe('emitLayer', () => {
  const layer: TokenLayerDef = {
    layer: 'component',
    tokens: [
      { path: 'space.3', type: 'dimension', value: 12 },
      { path: 'radius.2', type: 'dimension', value: 4 },
      {
        path: 'status.available',
        type: 'color',
        alias: { layer: 'global', path: 'green.9' },
      },
      {
        path: 'color.bg',
        type: 'color',
        modes: { light: '#ffffff', dark: '#111111' },
      },
    ],
  };

  it('wraps plain dimensions in a scaling calc', () => {
    expect(emitLayer(layer).base['--ev-space-3']).toBe(
      'calc(12px * var(--ev-scaling))',
    );
  });

  it('multiplies radius dimensions by the radius factor too', () => {
    expect(emitLayer(layer).base['--ev-radius-2']).toBe(
      'calc(4px * var(--ev-scaling) * var(--ev-radius-factor))',
    );
  });

  it('emits aliases as var() references in the base bucket', () => {
    expect(emitLayer(layer).base['--ev-status-available']).toBe(
      'var(--ev-green-9)',
    );
  });

  it('splits mode-dependent values into light/dark buckets', () => {
    const emitted = emitLayer(layer);
    expect(emitted.light['--ev-color-bg']).toBe('#ffffff');
    expect(emitted.dark['--ev-color-bg']).toBe('#111111');
    expect(emitted.base['--ev-color-bg']).toBeUndefined();
  });
});

describe('mergeEmitted', () => {
  it('later layers override earlier ones per bucket', () => {
    const a = emitLayer({
      layer: 'global',
      tokens: [{ path: 'x.y', type: 'string', value: 'first' }],
    });
    const b = emitLayer({
      layer: 'semantic',
      tokens: [{ path: 'x.y', type: 'string', value: 'second' }],
    });
    expect(mergeEmitted(a, b).base['--ev-x-y']).toBe('second');
  });
  it('brand layer overrides global primitives for shared token names', () => {
    const semantic = buildSemanticTokens({
      name: 'Sand',
      accentHex: '#e07a3f',
      grayTint: 'sand',
      radius: 'medium',
      scaling: 1,
      fontFamily: 'system-ui',
      panelStyle: 'solid',
    });
    const emitted = mergeEmitted(
      ...[GLOBAL_TOKENS, semantic].map(emitLayer),
    );
    const expected = emitLayer(semantic).light['--ev-gray-11'];
    expect(emitted.light['--ev-gray-11']).toBe(expected);
    expect(emitLayer(GLOBAL_TOKENS).light['--ev-gray-11']).not.toBe(expected);
  });
});


describe('resolveTokenValue', () => {
  
  const global: TokenLayerDef = {
    layer: 'global',
    tokens: [
      {
        path: 'green.9',
        type: 'color',
        modes: { light: '#30a46c', dark: '#33b074' },
      },
    ],
  };
  const semantic: TokenLayerDef = {
    layer: 'semantic',
    tokens: [
      {
        path: 'status.available',
        type: 'color',
        alias: { layer: 'global', path: 'green.9' },
      },
    ],
  };
  const component: TokenLayerDef = {
    layer: 'component',
    tokens: [
      {
        path: 'pin.color',
        type: 'color',
        alias: { layer: 'semantic', path: 'status.available' },
      },
      {
        path: 'cycle.a',
        type: 'color',
        alias: { layer: 'component', path: 'cycle.b' },
      },
      {
        path: 'cycle.b',
        type: 'color',
        alias: { layer: 'component', path: 'cycle.a' },
      },
      {
        path: 'dangling',
        type: 'color',
        alias: { layer: 'global', path: 'nope.1' },
      },
    ],
  };
  const layers = [global, semantic, component];
  const find = (path: string) =>
    component.tokens.find((t) => t.path === path)!;

  it('follows alias chains across layers per mode', () => {
    expect(resolveTokenValue(find('pin.color'), layers, 'light')).toBe(
      '#30a46c',
    );
    expect(resolveTokenValue(find('pin.color'), layers, 'dark')).toBe(
      '#33b074',
    );
  });

  it('throws on cycles and missing targets', () => {
    expect(() => resolveTokenValue(find('cycle.a'), layers, 'light')).toThrow(
      /cycle/i,
    );
    expect(() =>
      resolveTokenValue(find('dangling'), layers, 'light'),
    ).toThrow(/not found/);
  });
});

describe('GLOBAL_TOKENS integrity', () => {
  const byPath = new Map(GLOBAL_TOKENS.tokens.map((t) => [t.path, t]));

  it('has full 12-step light+dark scales for every status hue', () => {
    for (const scale of ['gray', 'green', 'blue', 'amber', 'red']) {
      for (let step = 1; step <= 12; step++) {
        const def = byPath.get(`${scale}.${step}`);
        expect(def, `${scale}.${step}`).toBeDefined();
        expect(String(def!.modes!.light)).toMatch(/^#|^rgb|^color\(/);
        expect(String(def!.modes!.dark)).toMatch(/^#|^rgb|^color\(/);
      }
    }
  });

  it('has gray alpha steps and the core dimension scales', () => {
    expect(byPath.has('gray.a1')).toBe(true);
    expect(byPath.has('gray.a12')).toBe(true);
    expect(byPath.get('space.3')!.value).toBe(12);
    expect(byPath.get('radius.6')!.value).toBe(16);
    expect(byPath.has('font-size.9')).toBe(true);
  });
});
