/**
 * Part registry — the single extension point. Register a PartDef once and the
 * component becomes placeable (palette), solvable (netlist), and drawable (glyph).
 */

import type { PartDef, PartKind } from './contract.js';

const REGISTRY = new Map<PartKind, PartDef>();

export function registerPart(def: PartDef): void {
  REGISTRY.set(def.kind, def);
}

export function getPart(kind: PartKind): PartDef | undefined {
  return REGISTRY.get(kind);
}

/** Every registered part (drives the builder palette). */
export function listParts(): PartDef[] {
  return [...REGISTRY.values()];
}
