'use client';

/** Circuit-builder runtime — adapter: coerce the series-loop components + battery, then render. */
import type { ReactNode } from 'react';
import { CircuitBuilder, type CircuitBuilderProps } from '../../../circuits/circuit-builder.js';
import { asComponents } from './shared.js';

export default function CircuitBuilderRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <CircuitBuilder
      battery={typeof a.battery === 'number' ? a.battery : 6}
      components={asComponents(a.components)}
      title={(a.title as string) ?? 'Build a circuit'}
      prompt={typeof a.prompt === 'string' ? a.prompt : undefined}
      height={typeof a.height === 'number' ? a.height : undefined}
      activity={a.activity as CircuitBuilderProps['activity']}
    />
  );
}
