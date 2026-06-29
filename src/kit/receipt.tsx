'use client';

/**
 * ReceiptScene, a concrete "real-world totals" scene (a shop receipt) for multiplicative
 * + additive reasoning: each line is qty × unit price, and the learner works the totals.
 * It's the textual cousin of <Vessel>/<DotCluster> (a quantity you can SEE), rendered as a
 * themed HTML card rather than SVG because it's all text rows. The total rows show "—" until
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
  /** show the computed total-items value (else "—"). */
  revealItems?: boolean;
  /** show the computed total-cost value (else "—"). */
  revealCost?: boolean;
  width?: number;
}

const money = (currency: string, n: number): string => `${currency}${Math.round(n * 100) / 100}`;

export function ReceiptScene({
  store = 'Half Foods', items, currency = '$', revealItems = false, revealCost = false, width = 260,
}: ReceiptSceneProps): ReactNode {
  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const totalCost = items.reduce((s, it) => s + it.qty * it.unit, 0);
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' };
  const muted = 'var(--stage-muted)';

  return (
    <div
      className="not-prose"
      role="img"
      aria-label={`Receipt from ${store}, ${items.length} line items`}
      style={{
        width, padding: 16, borderRadius: 14, border: '2px solid var(--stage-accent)',
        background: 'color-mix(in oklab, var(--stage-fg) 4%, var(--stage-bg))',
        display: 'grid', gap: 10, fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}>
        <span aria-hidden style={{ width: 22, height: 22, borderRadius: '50%', background: 'conic-gradient(var(--stage-good) 0 25%, var(--stage-accent) 0 60%, var(--stage-warn) 0 100%)', display: 'inline-block' }} />
        {store}
      </div>

      {items.map((it, i) => (
        <div key={i} style={{ ...row, color: muted }}>
          <span>{it.qty} {it.name}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{money(currency, it.unit)} each</span>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed color-mix(in oklab, var(--stage-fg) 30%, transparent)', margin: '2px 0' }} />

      <div style={{ ...row, fontWeight: 700 }}>
        <span>Total items</span>
        <span style={{ color: revealItems ? 'var(--stage-good)' : muted }}>{revealItems ? totalItems : '—'}</span>
      </div>
      <div style={{ ...row, fontWeight: 800 }}>
        <span>Total</span>
        <span style={{ color: revealCost ? 'var(--stage-good)' : muted }}>{revealCost ? money(currency, totalCost) : '—'}</span>
      </div>
    </div>
  );
}
