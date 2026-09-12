'use client';

/** Journal-poster runtime — adapter: coerce accounts/events (with the shared defaults), then render. */
import type { ReactNode } from 'react';
import { JournalPosterLab } from '../../../commerce/accounting/index.js';
import { asAccounts, asJournalTxns } from '../shared.js';

export default function JournalPoster(a: Record<string, unknown>): ReactNode {
  return (
    <JournalPosterLab
      accounts={asAccounts(a.accounts)}
      transactions={asJournalTxns(a.transactions)}
      showTrialBalance={a.showTrialBalance as boolean | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
