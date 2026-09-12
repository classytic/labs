/**
 * Pure runtime coercers for the math labs (no React, no cms-ui) — a raw MDX attribute can arrive
 * missing, as a JSON string, or as a {expr}/{tex} object, so the runtime adapters read arrays
 * through these before handing them to the engine components. Kept light so runtime chunks stay small.
 */
import type { GraphParam } from '../../math/index.js';

export type { GraphParam };

/** trig-explorer: the drawn functions, defaulting to sin + cos. */
export const resolveFns = (raw: unknown): ('sin' | 'cos')[] =>
  Array.isArray(raw) && raw.length ? (raw as ('sin' | 'cos')[]) : ['sin', 'cos'];

/** graph / interactive-problem: equations as plain expression strings (unwrap {expr} objects). */
export const asExprStrings = (raw: unknown): string[] => {
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw))
    return raw.map((e) => (typeof e === 'string' ? e : String((e as { expr?: string })?.expr ?? '')));
  return ['sin(x)'];
};

export const asParams = (raw: unknown): GraphParam[] => (Array.isArray(raw) ? (raw as GraphParam[]) : []);

/** derivation: steps as {tex, note}, unwrapping bare-string steps; falls back to Pythagoras. */
export const asSteps = (raw: unknown): Array<{ tex: string; note?: string }> => {
  if (!Array.isArray(raw)) return [{ tex: 'a^2 + b^2 = c^2' }];
  const out = raw
    .map((s) => (typeof s === 'string' ? { tex: s } : (s as { tex?: string; note?: string })))
    .filter((s): s is { tex: string; note?: string } => !!s && typeof s.tex === 'string');
  return out.length ? out : [{ tex: 'a^2 + b^2 = c^2' }];
};
