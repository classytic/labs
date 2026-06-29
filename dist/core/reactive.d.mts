//#region src/core/reactive.d.ts
/**
 * Tiny reactive value, the `ValueTracker` / signal at the heart of
 * interactivity. A slider/drag updates a `value()`; anything derived from it
 * recomputes; React components bound via `useValue` repaint. Framework-light
 * (no external dep); the React glue is one hook.
 */
interface SciValue<T> {
  get(): T;
  set(next: T): void;
  /** Functional update. */
  update(fn: (prev: T) => T): void;
  subscribe(fn: (v: T) => void): () => void;
  readonly isSciValue: true;
}
declare function value<T>(initial: T): SciValue<T>;
/** Read-only computed value derived from one or more `SciValue`s. */
declare function derive<T>(deps: ReadonlyArray<SciValue<unknown>>, compute: () => T): SciValue<T>;
/** Subscribe a React component to a `SciValue`; returns its current value. */
declare function useValue<T>(sv: SciValue<T>): T;
/** Create a stable `SciValue` that lives for the component's lifetime. */
declare function useSciValue<T>(initial: T | (() => T)): SciValue<T>;
//#endregion
export { SciValue, derive, useSciValue, useValue, value };