'use client';

/** Equation-balance runtime — adapter: coerce accounts/transactions (with the shared defaults), then render. */
import type { ReactNode } from 'react';
import { EquationBalanceLab } from '../../../commerce/accounting/index.js';
import { asAccounts, asTxns } from '../shared.js';

export default function EquationBalance(a: Record<string, unknown>): ReactNode {
  return (
    <EquationBalanceLab
      accounts={asAccounts(a.accounts)}
      transactions={asTxns(a.transactions)}
      freePost={a.freePost as boolean | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
