'use client';

/** Elasticity-revenue runtime — keeps scalar author fields simple while composing the lab's pivot. */
import type { ReactNode } from 'react';
import { ElasticityRevenueLab } from '../../../commerce/economics/index.js';

export default function ElasticityRevenue(a: Record<string, unknown>): ReactNode {
  return (
    <ElasticityRevenueLab
      pivot={{ p: (a.pivotP as number) ?? 5, q: (a.pivotQ as number) ?? 5 }}
      priceMax={a.priceMax as number | undefined}
      qtyMax={a.qtyMax as number | undefined}
      anchorPresets={a.anchorPresets as Array<{ label: string; slope: number }> | undefined}
      height={a.height as number | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
