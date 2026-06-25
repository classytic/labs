'use client';

/**
 * Animation boilerplate, factored out of every timed lab.
 *
 * Before, each lab hand-rolled: a reduced-motion ref, a throwaway `tick` state,
 * and a `useFrameLoop` that bumped the tick every frame to force a re-render.
 * These two hooks collapse all of that to one line each.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameLoop, type FrameInfo } from '@classytic/stage';

/**
 * prefers-reduced-motion, read once at mount. The value is read synchronously, so
 * for labs whose FIRST render visibly depends on it (and that hydrate from SSR)
 * prefer {@link useReducedMotionDeferred} to avoid a hydration mismatch.
 */
export function useReducedMotion(): boolean {
  const ref = useRef<boolean | undefined>(undefined);
  if (ref.current === undefined) {
    ref.current = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return ref.current;
}

/**
 * Hydration-safe prefers-reduced-motion: returns `false` on the server AND the first
 * client render (so SSR markup matches), then flips to the real value after mount.
 * Use this in SSR'd labs that gate their first paint on the reduced-motion flag.
 */
export function useReducedMotionDeferred(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  return reduce;
}

/**
 * Run `step` once per animation frame while `running`, then re-render. Replaces the
 * per-lab `const [, setTick] = useState(0)` + `setTick(t => (t + 1) & 0xffff)` dance:
 * integrate into your refs inside `step`, and the view repaints automatically.
 */
export function useFrameTick(running: boolean, step?: (f: FrameInfo) => void): () => void {
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => (t + 1) & 0xffff), []);
  useFrameLoop(
    (f) => { step?.(f); bump(); },
    { running },
  );
  return bump;   // call it to repaint a one-off static frame (e.g. the reduced-motion path)
}
