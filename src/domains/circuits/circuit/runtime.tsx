'use client';

/** Circuit runtime — a single-loop puzzle authored as battery + switch + bulb, rendered through
 *  the general CircuitNetworkLab branches[][] API with a "light the bulb" goal. */
import type { ReactNode } from 'react';
import { CircuitNetworkLab, type CircuitComponentSpec } from '../../../circuits/circuit/index.js';

export default function Circuit(a: Record<string, unknown>): ReactNode {
  const emf = typeof a.emf === 'number' ? a.emf : 6;
  const bulbOhms = typeof a.bulbOhms === 'number' ? a.bulbOhms : 6;
  const withSwitch = a.withSwitch === undefined ? true : !!a.withSwitch;
  const chain: CircuitComponentSpec[] = withSwitch
    ? [
        { type: 'switch', closed: false },
        { type: 'bulb', ohms: bulbOhms },
      ]
    : [{ type: 'bulb', ohms: bulbOhms }];
  return (
    <CircuitNetworkLab
      emf={emf}
      branches={[chain]}
      goal={{ kind: 'lightBulb' }}
      controlId={a.controlId as string | undefined}
      height={a.height as number | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      activity={a.activity as Parameters<typeof CircuitNetworkLab>[0]['activity']}
    />
  );
}
