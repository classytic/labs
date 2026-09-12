'use client';

/** Statement-sorter runtime — adapter: coerce the accounts-with-balances array, then render. */
import type { ReactNode } from 'react';
import { StatementSorterLab } from '../../../commerce/accounting/index.js';
import { asSortAccounts } from '../shared.js';

export default function StatementSorter(a: Record<string, unknown>): ReactNode {
  return (
    <StatementSorterLab
      accounts={asSortAccounts(a.accounts)}
      asOfLabel={a.asOfLabel as string | undefined}
      showClosing={a.showClosing as boolean | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
