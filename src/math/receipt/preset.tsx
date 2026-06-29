'use client';

/**
 * ReceiptLab, "complete the receipt totals", multiplicative + additive reasoning grounded
 * in a real bill. The learner reads qty × unit price per line and tap-fills the total items
 * and total cost from a tile tray (with the classic "summed the prices, forgot the quantity"
 * distractors); a correct fill reveals the totals on the receipt itself.
 *
 * Pure composition of existing primitives: <ReceiptScene> (the concrete twin) + the inline
 * slot engine (`useSlotFill` + `Blank` + `SlotTray`). It is also the seed of the percentage
 * family, swap the "total" question for "apply a 20% discount" on the same scene.
 */

import { useState, type ReactNode } from 'react';
import { LabFrame } from '../../kit/frame.js';
import { ReceiptScene, type ReceiptItem } from '../../kit/receipt.js';
import { useSlotFill, Blank, SlotTray, type FillSlot } from '../../kit/slot-fill.js';

export interface ReceiptProps {
  store?: string;
  items?: ReceiptItem[];
  currency?: string;
  /** Which totals to ask for. Default both. */
  ask?: { items?: boolean; cost?: boolean };
  /** Extra wrong tiles (numbers for items, e.g. 18; pass cost ones as "$16"). */
  distractors?: (string | number)[];
  title?: string;
  prompt?: string;
  activity?: string;
}

const DEFAULT_ITEMS: ReceiptItem[] = [
  { qty: 6, name: 'Pineapples', unit: 5 },
  { qty: 3, name: 'Mangoes', unit: 2 },
];

export function ReceiptLab(props: ReceiptProps = {}): ReactNode {
  const {
    store = 'Half Foods', items = DEFAULT_ITEMS, currency = '$',
    ask = { items: true, cost: true }, distractors = [],
    title = 'Complete the receipt totals',
    prompt = 'Each line is the quantity times the price each. Work out the totals.',
    activity = 'receipt-totals',
  } = props;

  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const totalCost = items.reduce((s, it) => s + it.qty * it.unit, 0);
  const sumUnit = items.reduce((s, it) => s + it.unit, 0);
  const money = (n: number): string => `${currency}${Math.round(n * 100) / 100}`;

  const slots: FillSlot[] = [];
  if (ask.items !== false) slots.push({ id: 'items', answer: totalItems });
  if (ask.cost !== false) slots.push({ id: 'cost', answer: money(totalCost) });

  // tiles: the answers + plausible "wrong sum" near-misses (qty-only, price-only, mixed)
  const itemPool = new Set<string | number>([totalItems, totalItems * 2, totalCost]);
  const costPool = new Set<string | number>([money(totalCost), money(sumUnit), money(Math.round(totalCost * 0.5))]);
  const tiles = Array.from(new Set<string | number>([
    ...(ask.items !== false ? itemPool : []),
    ...(ask.cost !== false ? costPool : []),
    ...distractors,
  ]));

  const [revealed, setRevealed] = useState({ items: false, cost: false });
  const fill = useSlotFill(slots, tiles, activity, () => setRevealed({ items: true, cost: true }));

  // reveal each total the moment its own blank is right (nice incremental payoff)
  const itemsDone = revealed.items || (fill.filled.items != null);
  const costDone = revealed.cost || (fill.filled.cost != null);

  const figure = (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ReceiptScene store={store} items={items} currency={currency} revealItems={itemsDone} revealCost={costDone} />
    </div>
  );

  const footer = (
    <div style={{ display: 'grid', gap: 14, justifyItems: 'center', marginTop: 4 }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 16, lineHeight: 1.9, textAlign: 'center' }}>
        {ask.items !== false && <>A total of <Blank fill={fill} id="items" /> items were purchased.{' '}</>}
        {ask.cost !== false && <>The total cost was <Blank fill={fill} id="cost" width={64} />.</>}
      </p>
      <SlotTray fill={fill} />
      {fill.solved && <p role="status" style={{ margin: 0, color: 'var(--stage-good)', fontWeight: 700 }}>✓ Receipt complete.</p>}
    </div>
  );

  return <LabFrame title={title} prompt={prompt} footer={footer}>{figure}</LabFrame>;
}
