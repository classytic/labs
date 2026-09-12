import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => <div data-testid="webgl-canvas">{children}</div>,
  // SceneCameraControls reads camera / gl / invalidate through selectors.
  useThree: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      camera: {},
      gl: { domElement: document.createElement('canvas') },
      invalidate: () => undefined,
    }),
}));
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    target = { set: () => undefined };
    addEventListener(): void {}
    removeEventListener(): void {}
    update(): void {}
    dispose(): void {}
  },
}));

import { ThreeSceneSurface, supportsWebGL } from '../src/three/surface.js';

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      private callback: IntersectionObserverCallback;
      observe(target: Element): void {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect(): void {}
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      root = null;
      rootMargin = '0px';
      thresholds = [0];
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ThreeSceneSurface', () => {
  it('renders the supplied accessible fallback when WebGL is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    render(
      <ThreeSceneSurface label="3D molecule" fallback={<svg aria-label="Projected molecule" />}>
        <span>three scene</span>
      </ThreeSceneSurface>,
    );
    expect(await screen.findByLabelText('Projected molecule')).toBeTruthy();
    expect(screen.queryByTestId('webgl-canvas')).toBeNull();
  });

  it('mounts the opt-in renderer only after a successful capability probe', async () => {
    const loseContext = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          getExtension: () => ({ loseContext }),
        }) as unknown as RenderingContext,
    );
    expect(supportsWebGL()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
    render(
      <ThreeSceneSurface label="3D molecule" fallback={<span>fallback</span>}>
        <span>three scene</span>
      </ThreeSceneSurface>,
    );
    await waitFor(() => expect(screen.getByTestId('webgl-canvas')).toBeTruthy());
    expect(screen.getByLabelText('3D molecule')).toBeTruthy();
  });
});
