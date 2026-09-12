'use client';

/** Trig-explorer runtime — adapter: default the drawn functions (sin + cos) if none authored. */
import type { ReactNode } from 'react';
import { TrigExplorer } from '../../../math/trig-explorer.js';
import { resolveFns } from '../shared.js';

export default function TrigExplorerRuntime(a: Record<string, unknown>): ReactNode {
  return <TrigExplorer functions={resolveFns(a.functions)} startDeg={a.startDeg as number | undefined} />;
}
