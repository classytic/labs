'use client';

/** Receipt-totals runtime — adapter: coerce the line items + fold askItems/askCost into the ask prop. */
import type { ReactNode } from 'react';
import { ReceiptLab, type ReceiptProps } from '../../../math/receipt/index.js';

export default function ReceiptTotals(a: Record<string, unknown>): ReactNode {
  const items = (Array.isArray(a.items) && a.items.length ? a.items : undefined) as
    ReceiptProps['items'] | undefined;
  return (
    <ReceiptLab
      store={a.store as string | undefined}
      currency={a.currency as string | undefined}
      items={items}
      ask={{ items: a.askItems !== false, cost: a.askCost !== false }}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      activity={a.activity as string | undefined}
    />
  );
}
