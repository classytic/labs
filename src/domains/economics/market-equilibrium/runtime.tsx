'use client';

/** Market-equilibrium runtime — adapter: reshape the flat authored params into the lab's
 *  nested demand/supply/shiftControls props. */
import type { ReactNode } from 'react';
import { MarketEquilibriumLab } from '../../../commerce/economics/index.js';

export default function MarketEquilibrium(a: Record<string, unknown>): ReactNode {
  return (
    <MarketEquilibriumLab
      demand={{ intercept: (a.demandIntercept as number) ?? 9, slope: (a.demandSlope as number) ?? 0.8 }}
      supply={{ intercept: (a.supplyIntercept as number) ?? 1, slope: (a.supplySlope as number) ?? 0.7 }}
      shiftControls={{
        demand: a.shiftDemand as boolean | undefined,
        supply: a.shiftSupply as boolean | undefined,
      }}
      goodLabel={a.goodLabel as string | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
