// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import type { BrandDefinition } from '../tokens/brand';
import { ThemeProvider } from './ThemeProvider';
import type { ThemeContextValue } from './ThemeProvider';
import { useTheme } from './useTheme';

const voltBrand: BrandDefinition = {
  name: 'Volt Custom',
  accentHex: '#00c16a',
  grayTint: 'sand',
  radius: 'large',
  scaling: 1,
  fontFamily: 'system-ui',
  panelStyle: 'translucent',
};

const atlasBrand: BrandDefinition = {
  name: 'Atlas Default',
  accentHex: '#ff6a00',
  grayTint: 'slate',
  radius: 'medium',
  scaling: 1,
  fontFamily: 'system-ui',
  panelStyle: 'solid',
};

let captured: ThemeContextValue | undefined;

function Probe() {
  captured = useTheme();
  return null;
}

describe('ThemeProvider per-library state', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('remounts with a new storage key instead of leaking persisted theme', async () => {
    localStorage.setItem(
      'prism-ui-theme:volt',
      JSON.stringify({ brand: voltBrand, appearance: 'dark' }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <React.StrictMode>
          <ThemeProvider
            storageKey="prism-ui-theme:volt"
            defaultPreset={atlasBrand}
          >
            <Probe />
          </ThemeProvider>
        </React.StrictMode>,
      );
    });

    expect(captured?.brand.accentHex).toBe(voltBrand.accentHex);
    expect(captured?.appearance).toBe('dark');

    await act(async () => {
      root.render(
        <React.StrictMode>
          <ThemeProvider
            key="atlas"
            storageKey="prism-ui-theme:atlas"
            defaultPreset={atlasBrand}
          >
            <Probe />
          </ThemeProvider>
        </React.StrictMode>,
      );
    });

    expect(captured?.brand.accentHex).toBe(atlasBrand.accentHex);
    expect(captured?.appearance).toBe('light');

    const atlasSaved = localStorage.getItem('prism-ui-theme:atlas') ?? '';
    expect(atlasSaved).not.toContain(voltBrand.accentHex.toLowerCase());
    expect(localStorage.getItem('prism-ui-theme:volt')).toContain(
      JSON.stringify(voltBrand.accentHex),
    );

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});