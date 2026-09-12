import { GeoElement } from '../../../geometry/board/index.js';

/** The starting construction (a common-chord figure) shared by the runtime + the builder. */
export const DEFAULT_SCENE: GeoElement[] = [
  { type: 'point', id: 'A', x: 3, y: 0, draggable: true, label: 'A' },
  { type: 'point', id: 'B', x: 6, y: 0, draggable: true, label: 'B' },
  { type: 'circle', id: 'cA', center: 'A', radius: 3 },
  { type: 'circle', id: 'cB', center: 'B', radius: 3 },
  { type: 'intersect', id: 'P', of: ['cA', 'cB'], pick: 0, label: 'P' },
  { type: 'intersect', id: 'Q', of: ['cA', 'cB'], pick: 1, label: 'Q' },
  { type: 'segment', from: 'P', to: 'Q', label: 'chord' },
  { type: 'measure', kind: 'distance', of: ['P', 'Q'], label: '|PQ|' },
];

export const asScene = (raw: unknown): GeoElement[] =>
  Array.isArray(raw) && raw.length ? (raw as GeoElement[]) : DEFAULT_SCENE;
