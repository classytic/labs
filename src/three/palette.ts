'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface ScenePalette {
  accent: string;
  secondary: string;
  foreground: string;
  background: string;
  warning: string;
}

export const DEFAULT_SCENE_PALETTE: ScenePalette = {
  accent: '#2878ff',
  secondary: '#00a765',
  foreground: '#172033',
  background: '#ffffff',
  warning: '#d88700',
};

function cssColor(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  if (!value || typeof document === 'undefined') return fallback;
  // Three.js does not consistently parse CSS Color 4 values such as oklch().
  // Let the browser resolve any var()/oklch()/color-mix() token, then hand
  // Three a plain sRGB value it supports on every renderer.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return fallback;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = 'rgb(1 2 3)';
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const data = context.getImageData(0, 0, 1, 1).data;
  const red = data[0] ?? 0,
    green = data[1] ?? 0,
    blue = data[2] ?? 0,
    alpha = data[3] ?? 0;
  if (alpha === 0 || (red === 1 && green === 2 && blue === 3)) return fallback;
  // Hand Three a hex literal. Its Color.setStyle() only parses comma-separated
  // `rgb(r, g, b)` / hex / names — the modern `rgb(r g b / a)` form fails silently and
  // leaves every material WHITE, which is exactly what made the 3D scenes read as grey.
  const hex = (channel: number): string => channel.toString(16).padStart(2, '0');
  return `#${hex(red)}${hex(green)}${hex(blue)}`;
}

/** Keeps WebGL material colours aligned with the host's Stage/shadcn tokens. */
export function useScenePalette(hostRef: RefObject<HTMLElement | null>): ScenePalette {
  const [palette, setPalette] = useState(DEFAULT_SCENE_PALETTE);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = (): void => {
      const styles = getComputedStyle(host);
      setPalette({
        accent: cssColor(styles, '--stage-accent', DEFAULT_SCENE_PALETTE.accent),
        secondary: cssColor(styles, '--stage-accent-2', DEFAULT_SCENE_PALETTE.secondary),
        foreground: cssColor(styles, '--stage-fg', DEFAULT_SCENE_PALETTE.foreground),
        background: cssColor(styles, '--stage-bg', DEFAULT_SCENE_PALETTE.background),
        warning: cssColor(styles, '--stage-warn', DEFAULT_SCENE_PALETTE.warning),
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });
    if (document.body)
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    const scheme = typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-color-scheme: dark)');
    scheme?.addEventListener('change', update);
    return () => {
      observer.disconnect();
      scheme?.removeEventListener('change', update);
    };
  }, [hostRef]);
  return palette;
}
