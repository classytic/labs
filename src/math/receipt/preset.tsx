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
import { Activity } from '../../kit/activity.js';
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
    store = 'Half Foods',
    items = DEFAULT_ITEMS,
    currency = '$',
    ask = { items: true, cost: true },
    distractors = [],
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
  const costPool = new Set<string | number>([
    money(totalCost),
    money(sumUnit),
    money(Math.round(totalCost * 0.5)),
  ]);
  const tiles = Array.from(
    new Set<string | number>([
      ...(ask.items !== false ? itemPool : []),
      ...(ask.cost !== false ? costPool : []),
      ...distractors,
    ]),
  );

  const [revealed, setRevealed] = useState({ items: false, cost: false });
  const fill = useSlotFill(slots, tiles, activity, () => setRevealed({ items: true, cost: true }));

  // reveal each total the moment its own blank is right (nice incremental payoff)
  const itemsDone = revealed.items || fill.filled.items != null;
  const costDone = revealed.cost || fill.filled.cost != null;

  const figure = (
    <div className="lab-centered-scene">
      <ReceiptScene
        store={store}
        items={items}
        currency={currency}
        revealItems={itemsDone}
        revealCost={costDone}
      />
    </div>
  );

  const footer = (
    <div className="lab-result-stack">
      <p className="lab-fill-prompt">
        {ask.items !== false && (
          <>
            A total of <Blank fill={fill} id="items" /> items were purchased.{' '}
          </>
        )}
        {ask.cost !== false && (
          <>
            The total cost was <Blank fill={fill} id="cost" width={64} />.
          </>
        )}
      </p>
      <SlotTray fill={fill} />
      {fill.solved && (
        <p role="status" className="lab-solved-message">
          ✓ Receipt complete.
        </p>
      )}
    </div>
  );

  return (
    <Activity.Root className="math-receipt-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Multiplicative reasoning" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{fill.solved ? 'Receipt complete' : 'Complete the totals'}</strong>
        <span>{items.length} line items</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Receipt totals model">{figure}</Activity.Canvas>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          Each line total multiplies quantity by unit price; the receipt totals then add those line results.
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Receipt total answers">
        {footer}
      </section>
      <Activity.LiveRegion>
        {fill.solved
          ? `Receipt complete: ${totalItems} items cost ${money(totalCost)}.`
          : 'Choose values for the receipt totals.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{fill.solved ? 'All totals correct' : 'Fill the receipt blanks'}</strong>
          <span>{slots.length} totals</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
