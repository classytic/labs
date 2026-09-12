'use client';

/** Graph runtime — adapter: unwrap equations to plain strings, coerce sliders + window. */
import type { ReactNode } from 'react';
import { Grapher } from '../../../math/grapher/index.js';
import { asExprStrings, asParams } from '../shared.js';

export default function Graph(a: Record<string, unknown>): ReactNode {
  const xRange = (a.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
  return (
    <Grapher
      equations={asExprStrings(a.equations)}
      params={asParams(a.params)}
      xRange={xRange}
      yScale={a.yScale === 'log' ? 'log' : 'linear'}
      title={(a.title as string) ?? 'Graph'}
    />
  );
}
