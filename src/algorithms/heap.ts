import {
  snapshotItems,
  type SequenceDecision,
  type SequenceEvent,
  type SequenceItem,
} from './sequence-contract.js';

export type HeapKind = 'min' | 'max';
export type HeapOperation = 'build' | 'insert' | 'extract';
export type HeapEvent =
  | SequenceEvent
  | { type: 'heap-append'; items: SequenceItem[]; index: number; itemId: string; message: string }
  | { type: 'heap-remove-root'; items: SequenceItem[]; removed: SequenceItem; message: string }
  | { type: 'heap-move-last'; items: SequenceItem[]; from: number; to: 0; itemId: string; message: string };
export interface HeapTrace {
  kind: HeapKind;
  operation: HeapOperation;
  events: HeapEvent[];
  result: SequenceItem[];
  removed?: SequenceItem;
}

export const heapItems = (values: readonly number[]): SequenceItem[] =>
  values
    .filter(Number.isFinite)
    .slice(0, 31)
    .map((value, index) => ({
      id: `item-${index}-${Math.trunc(value)}`,
      value: Math.trunc(value),
      seq: index,
    }));
const outranks = (a: SequenceItem, b: SequenceItem, kind: HeapKind): boolean =>
  a.value === b.value ? a.seq < b.seq : kind === 'min' ? a.value < b.value : a.value > b.value;
const decisionFor = (yes: boolean): SequenceDecision => (yes ? 'swap' : 'keep');

function swap(items: SequenceItem[], a: number, b: number, events: HeapEvent[], message: string) {
  const ids: [string, string] = [items[a]!.id, items[b]!.id];
  [items[a], items[b]] = [items[b]!, items[a]!];
  events.push({ type: 'sequence-swap', items: snapshotItems(items), indices: [a, b], itemIds: ids, message });
}

function siftDown(items: SequenceItem[], start: number, kind: HeapKind, events: HeapEvent[]) {
  let parent = start;
  while (true) {
    const left = parent * 2 + 1;
    if (left >= items.length) return;
    const right = left + 1;
    let chosen = left;
    if (right < items.length) {
      const chooseRight = outranks(items[right]!, items[left]!, kind);
      events.push({
        type: 'sequence-compare',
        items: snapshotItems(items),
        indices: [left, right],
        decision: chooseRight ? 'right' : 'left',
        reason: 'choose-child',
        message: `Compare children ${items[left]!.value} and ${items[right]!.value}; choose the ${chooseRight ? 'right' : 'left'} child.`,
      });
      if (chooseRight) chosen = right;
    }
    const shouldSwap = outranks(items[chosen]!, items[parent]!, kind);
    events.push({
      type: 'sequence-compare',
      items: snapshotItems(items),
      indices: [parent, chosen],
      decision: decisionFor(shouldSwap),
      reason: 'heap-order',
      message: `Compare parent ${items[parent]!.value} with child ${items[chosen]!.value}.`,
    });
    if (!shouldSwap) return;
    swap(
      items,
      parent,
      chosen,
      events,
      `Swap ${items[parent]!.value} with ${items[chosen]!.value}; the stronger priority moves upward.`,
    );
    parent = chosen;
  }
}

function heapify(
  values: readonly number[],
  kind: HeapKind,
  withTrace: boolean,
): { items: SequenceItem[]; events: HeapEvent[] } {
  const items = heapItems(values);
  const events: HeapEvent[] = withTrace
    ? [
        {
          type: 'sequence-start',
          items: snapshotItems(items),
          message: `Start with the unsorted array and build a ${kind}-heap bottom-up.`,
        },
      ]
    : [];
  for (let parent = Math.floor(items.length / 2) - 1; parent >= 0; parent--)
    siftDown(items, parent, kind, events);
  return { items, events };
}

export function buildHeap(values: readonly number[], kind: HeapKind = 'min'): HeapTrace {
  const { items, events } = heapify(values, kind, true);
  events.push({
    type: 'sequence-complete',
    items: snapshotItems(items),
    message: `${kind}-heap complete; every parent has priority over its children.`,
  });
  return { kind, operation: 'build', events, result: items };
}

export function insertHeap(values: readonly number[], value: number, kind: HeapKind = 'min'): HeapTrace {
  const { items } = heapify(values, kind, false);
  const events: HeapEvent[] = [
    { type: 'sequence-start', items: snapshotItems(items), message: `Start with a valid ${kind}-heap.` },
  ];
  let id = `inserted-${Math.trunc(value)}`;
  let suffix = 2;
  while (items.some((item) => item.id === id)) id = `inserted-${Math.trunc(value)}-${suffix++}`;
  items.push({ id, value: Math.trunc(value), seq: Math.max(-1, ...items.map((item) => item.seq)) + 1 });
  let child = items.length - 1;
  events.push({
    type: 'heap-append',
    items: snapshotItems(items),
    index: child,
    itemId: id,
    message: `Append ${Math.trunc(value)} at the next open leaf.`,
  });
  while (child > 0) {
    const parent = Math.floor((child - 1) / 2);
    const shouldSwap = outranks(items[child]!, items[parent]!, kind);
    events.push({
      type: 'sequence-compare',
      items: snapshotItems(items),
      indices: [parent, child],
      decision: decisionFor(shouldSwap),
      reason: 'heap-order',
      message: `Compare new child ${items[child]!.value} with parent ${items[parent]!.value}.`,
    });
    if (!shouldSwap) break;
    swap(
      items,
      parent,
      child,
      events,
      `Swap upward; ${items[child]!.value} yields priority to ${items[parent]!.value}.`,
    );
    child = parent;
  }
  events.push({
    type: 'sequence-complete',
    items: snapshotItems(items),
    message: `Insertion complete in O(log n) levels.`,
  });
  return { kind, operation: 'insert', events, result: items };
}

export function extractHeap(values: readonly number[], kind: HeapKind = 'min'): HeapTrace {
  const { items } = heapify(values, kind, false);
  const events: HeapEvent[] = [
    {
      type: 'sequence-start',
      items: snapshotItems(items),
      message: `The ${kind === 'min' ? 'smallest' : 'largest'} item is at the root.`,
    },
  ];
  const removed = items[0];
  if (!removed) {
    events.push({ type: 'sequence-complete', items: [], message: 'The heap is empty.' });
    return { kind, operation: 'extract', events, result: [] };
  }
  events.push({
    type: 'heap-remove-root',
    items: snapshotItems(items),
    removed: { ...removed },
    message: `Remove root ${removed.value}.`,
  });
  const last = items.pop()!;
  if (items.length) {
    items[0] = last;
    events.push({
      type: 'heap-move-last',
      items: snapshotItems(items),
      from: items.length,
      to: 0,
      itemId: last.id,
      message: `Move last item ${last.value} to the root, then repair downward.`,
    });
    siftDown(items, 0, kind, events);
  }
  events.push({
    type: 'sequence-complete',
    items: snapshotItems(items),
    message: `Extraction complete; the ${kind}-heap invariant is restored.`,
  });
  return { kind, operation: 'extract', events, result: items, removed };
}

export function isHeap(items: readonly SequenceItem[], kind: HeapKind): boolean {
  return items.every(
    (item, index) => index === 0 || !outranks(item, items[Math.floor((index - 1) / 2)]!, kind),
  );
}
