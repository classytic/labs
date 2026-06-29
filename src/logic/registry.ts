/**
 * Gate registry — the single extension point. Register a GateDef once and the gate
 * becomes placeable (palette), evaluable (eval), and drawable (glyph).
 */

import type { GateDef } from './contract.js';

const REGISTRY = new Map<string, GateDef>();

export function registerGate(def: GateDef): void {
  REGISTRY.set(def.kind, def);
}

export function getGate(kind: string): GateDef | undefined {
  return REGISTRY.get(kind);
}

/** Every registered gate (drives a builder palette). */
export function listGates(): GateDef[] {
  return [...REGISTRY.values()];
}
