/**
 * The two measurements every vector database makes, and the vocabulary the lab ships with.
 *
 * Kept free of React so the arithmetic can be tested directly. The analogy in particular is worth
 * pinning: if the default vocabulary ever drifts so that king − man + woman stops landing on
 * queen, the lab still renders and silently teaches the wrong thing.
 */

export type EmbeddingMetric = 'cosine' | 'euclidean';

export interface EmbeddingItem {
  label: string;
  x: number;
  y: number;
  group?: string;
}

/**
 * Four clusters in four directions from the origin, so cosine and distance agree about grouping,
 * and four people words forming an EXACT parallelogram so the analogy has one clear answer.
 */
export const DEFAULT_EMBEDDING_ITEMS: EmbeddingItem[] = [
  { label: 'man', x: 2.0, y: 1.0, group: 'people' },
  { label: 'woman', x: 2.0, y: 2.6, group: 'people' },
  { label: 'king', x: 3.6, y: 1.0, group: 'people' },
  { label: 'queen', x: 3.6, y: 2.6, group: 'people' },
  { label: 'dog', x: -3.2, y: 1.8, group: 'animals' },
  { label: 'cat', x: -3.6, y: 2.4, group: 'animals' },
  { label: 'horse', x: -2.6, y: 2.9, group: 'animals' },
  { label: 'car', x: -1.0, y: -2.8, group: 'vehicles' },
  { label: 'bus', x: -0.4, y: -3.3, group: 'vehicles' },
  { label: 'train', x: -1.7, y: -3.4, group: 'vehicles' },
  { label: 'rice', x: 3.0, y: -2.6, group: 'food' },
  { label: 'bread', x: 3.6, y: -2.2, group: 'food' },
];

/** Direction only. Production ranks by this because a longer text should not be a farther text. */
export const cosine = (a: EmbeddingItem, b: EmbeddingItem): number => {
  const dot = a.x * b.x + a.y * b.y;
  const mag = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  return mag === 0 ? 0 : dot / mag;
};

/** Position. What the picture actually shows, which is why the lab reports both. */
export const euclidean = (a: EmbeddingItem, b: EmbeddingItem): number => Math.hypot(a.x - b.x, a.y - b.y);

export interface Ranked {
  item: EmbeddingItem;
  cos: number;
  dist: number;
}

/** Higher is better for cosine and lower is better for distance, so the sort has to know which. */
export function rankBy(
  items: readonly EmbeddingItem[],
  target: EmbeddingItem,
  metric: EmbeddingMetric,
  exclude: readonly string[] = [],
): Ranked[] {
  return items
    .filter((item) => !exclude.includes(item.label))
    .map((item) => ({ item, cos: cosine(item, target), dist: euclidean(item, target) }))
    .sort((a, b) => (metric === 'cosine' ? b.cos - a.cos : a.dist - b.dist));
}

/**
 * a − b + c as a point. The three inputs are excluded from the answer by convention: without
 * that, the nearest point to "king − man + woman" is often one of king, man or woman.
 */
export function analogyTarget(
  items: readonly EmbeddingItem[],
  a: string,
  b: string,
  c: string,
): { target: EmbeddingItem; exclude: string[] } | null {
  const find = (label: string) => items.find((item) => item.label === label);
  const from = find(a);
  const minus = find(b);
  const plus = find(c);
  if (!from || !minus || !plus) return null;
  return {
    target: { label: `${a} − ${b} + ${c}`, x: from.x - minus.x + plus.x, y: from.y - minus.y + plus.y },
    exclude: [a, b, c],
  };
}
