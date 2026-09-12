'use client';

/**
 * WarehouseAllocationLab — the warehouse-rent PRESET of the general <ApportionLab>:
 * a shared rent bill split across departments by floor area. Kept as its own
 * friendly, named lab (so a warehouse lesson reads naturally), but it's just
 * ApportionLab with the pool = rent, basis = floor area, unit = sq ft — proving the
 * primitive generalises. For overhead by machine-hours, cost by headcount or profit
 * by capital, author ApportionLab directly.
 *
 * Authorable (total cost, departments + their areas, currency, unit), predict-first,
 * curriculum-neutral.
 */

import type { ReactNode } from 'react';
import { ApportionLab } from './apportion.js';

export interface Dept {
  name: string;
  sqft: number;
}
export interface WarehouseAllocationProps {
  totalCost?: number;
  departments?: Dept[];
  currency?: string;
  unitLabel?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const DEFAULT_DEPTS: Dept[] = [
  { name: 'Storage', sqft: 4000 },
  { name: 'Packing', sqft: 2000 },
  { name: 'Loading', sqft: 3000 },
  { name: 'Office', sqft: 1000 },
];

export function WarehouseAllocationLab({
  totalCost = 60000,
  departments = DEFAULT_DEPTS,
  currency = '$',
  unitLabel = 'sq ft',
  title = 'Warehouse cost, split by floor space',
  prompt = 'One rent bill, shared across departments by the floor area each takes. Drag the areas and the cost re-apportions: width is area is cost.',
  objectives = [
    'Apportion a shared cost by a basis (floor area)',
    'See each department’s cost = total × its share of the space',
    'Understand the single cost-per-square-foot rate',
  ],
}: WarehouseAllocationProps = {}): ReactNode {
  return (
    <ApportionLab
      total={totalCost}
      parts={departments.map((d) => ({ name: d.name, weight: d.sqft }))}
      poolLabel="rent"
      basisLabel="floor area"
      unitLabel={unitLabel}
      currency={currency}
      maxWeight={8000}
      title={title}
      prompt={prompt}
      objectives={objectives}
      activityId="warehouse-allocation"
    />
  );
}
