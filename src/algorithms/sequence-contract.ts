export interface SequenceItem {
  id: string;
  value: number;
  seq: number;
  label?: string;
}
export type SequenceDecision = 'left' | 'right' | 'swap' | 'keep';
export type SequenceEvent =
  | { type: 'sequence-start'; items: SequenceItem[]; message: string }
  | {
      type: 'sequence-compare';
      items: SequenceItem[];
      indices: [number, number];
      decision: SequenceDecision;
      reason: 'choose-child' | 'heap-order' | 'algorithm';
      message: string;
    }
  | {
      type: 'sequence-swap';
      items: SequenceItem[];
      indices: [number, number];
      itemIds: [string, string];
      message: string;
    }
  | { type: 'sequence-write'; items: SequenceItem[]; index: number; itemId: string; message: string }
  | { type: 'sequence-complete'; items: SequenceItem[]; message: string };

export const snapshotItems = (items: readonly SequenceItem[]): SequenceItem[] =>
  items.map((item) => ({ ...item }));
