/** Shared coercer for the circuit-builder series loop — a missing/empty array falls back to a
 *  starter switch + bulb. Used by both the runtime and the authoring editor. */
import type { CircuitComponent } from '../../../circuits/circuit-builder.js';

export type { CircuitComponent };

export const asComponents = (raw: unknown): CircuitComponent[] => {
  if (!Array.isArray(raw) || !raw.length)
    return [
      { type: 'switch', closed: false, label: 'switch' },
      { type: 'bulb', ohms: 12, label: 'bulb' },
    ];
  return raw as CircuitComponent[];
};
