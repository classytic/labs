'use client';

import type { ReactNode } from 'react';
import { FundamentalTheoremExplorer } from '../../../math/fundamental-theorem/index.js';

export default function FundamentalTheoremRuntime(attributes: Record<string, unknown>): ReactNode {
  const equation =
    typeof attributes.equation === 'string' && attributes.equation.trim()
      ? attributes.equation
      : '0.5*x^2 - 1';
  const xRange = (attributes.xRange as [number, number] | undefined) ?? [-3, 4];
  return (
    <FundamentalTheoremExplorer
      equation={equation}
      xRange={xRange}
      anchor={attributes.anchor as number | undefined}
      startX={attributes.startX as number | undefined}
      title={(attributes.title as string) ?? 'Area becomes a new function'}
    />
  );
}
