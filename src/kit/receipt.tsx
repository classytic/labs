'use client';

/**
 * ReceiptScene, a concrete "real-world totals" scene (a shop receipt) for multiplicative
 * + additive reasoning: each line is qty × unit price, and the learner works the totals.
 * It's the textual cousin of <Vessel>/<DotCluster> (a quantity you can SEE), rendered as a
 * themed HTML card rather than SVG because it's all text rows. The total rows show "-" until
 * revealed, so it pairs with the inline slot engine: fill the totals, then they fill in here.
 *
 * Reusable for any "compute the bill" scene: receipts, invoices, scoreboards, order summaries,
 * and it's the seed for the percentage family (a price + discount% → new total).
 */

import type { ReactNode } from 'react';

export interface ReceiptItem {
  qty: number;
  name: string;
  /** unit price. */
  unit: number;
}

export interface ReceiptSceneProps {
  store?: string;
  items: ReceiptItem[];
  currency?: string;
  /** show the computed total-items value (else ", "). */
  revealItems?: boolean;
  /** show the computed total-cost value (else ", "). */
  revealCost?: boolean;
  width?: number;
}

const money = (currency: string, n: number): string => `${currency}${Math.round(n * 100) / 100}`;

export function ReceiptScene({
  store = 'Half Foods',
  items,
  currency = '$',
  revealItems = false,
  revealCost = false,
  width = 260,
}: ReceiptSceneProps): ReactNode {
  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const totalCost = items.reduce((s, it) => s + it.qty * it.unit, 0);
  return (
    <div
      className="not-prose grid gap-2.5 rounded-[14px] border-2 border-[var(--stage-accent)] bg-[color-mix(in_oklab,var(--stage-fg)_4%,var(--stage-bg))] p-4 tabular-nums"
      role="img"
      aria-label={`Receipt from ${store}, ${items.length} line items`}
      style={{ width }}
    >
      <div className="flex items-center gap-2 text-base font-extrabold">
        <span
          aria-hidden
          className="inline-block size-[22px] rounded-full bg-[conic-gradient(var(--stage-good)_0_25%,var(--stage-accent)_0_60%,var(--stage-warn)_0_100%)]"
        />
        {store}
      </div>

      {items.map((it, i) => (
        <div key={i} className="flex items-baseline justify-between gap-3 text-[var(--stage-muted)]">
          <span>
            {it.qty} {it.name}
          </span>
          <span className="whitespace-nowrap">{money(currency, it.unit)} each</span>
        </div>
      ))}

      <div className="my-0.5 border-t border-dashed border-[color-mix(in_oklab,var(--stage-fg)_30%,transparent)]" />

      <div className="flex items-baseline justify-between gap-3 font-bold">
        <span>Total items</span>
        <span className={revealItems ? 'text-[var(--stage-good)]' : 'text-[var(--stage-muted)]'}>
          {revealItems ? totalItems : '-'}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 font-extrabold">
        <span>Total</span>
        <span className={revealCost ? 'text-[var(--stage-good)]' : 'text-[var(--stage-muted)]'}>
          {revealCost ? money(currency, totalCost) : '-'}
        </span>
      </div>
    </div>
  );
}
