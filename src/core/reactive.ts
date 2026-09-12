/**
 * Tiny reactive value, the `ValueTracker` / signal at the heart of
 * interactivity. A slider/drag updates a `value()`; anything derived from it
 * recomputes; React components bound via `useValue` repaint. Framework-light
 * (no external dep); the React glue is one hook.
 */

import { useEffect, useReducer, useRef } from 'react';

export interface SciValue<T> {
  get(): T;
  set(next: T): void;
  /** Functional update. */
  update(fn: (prev: T) => T): void;
  subscribe(fn: (v: T) => void): () => void;
  readonly isSciValue: true;
}

export function value<T>(initial: T): SciValue<T> {
  let current = initial;
  const subs = new Set<(v: T) => void>();
  const sv: SciValue<T> = {
    isSciValue: true,
    get: () => current,
    set: (next) => {
      if (Object.is(next, current)) return;
      current = next;
      for (const fn of subs) fn(current);
    },
    update: (fn) => sv.set(fn(current)),
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
  return sv;
}

/** Read-only computed value derived from one or more `SciValue`s. */
export function derive<T>(deps: ReadonlyArray<SciValue<unknown>>, compute: () => T): SciValue<T> {
  const out = value(compute());
  for (const dep of deps) dep.subscribe(() => out.set(compute()));
  return out;
}

/** Subscribe a React component to a `SciValue`; returns its current value. */
export function useValue<T>(sv: SciValue<T>): T {
  const [, force] = useReducer((c: number) => c + 1, 0);
  const ref = useRef(sv);
  ref.current = sv;
  useEffect(() => sv.subscribe(() => force()), [sv]);
  return sv.get();
}

/** Create a stable `SciValue` that lives for the component's lifetime. */
export function useSciValue<T>(initial: T | (() => T)): SciValue<T> {
  const ref = useRef<SciValue<T> | null>(null);
  if (ref.current === null) {
    ref.current = value(typeof initial === 'function' ? (initial as () => T)() : initial);
  }
  return ref.current;
}
