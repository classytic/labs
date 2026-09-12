'use client';

/** Triangle-trig runtime — adapter: default the draggable set + pass the authored ask through. */
import type { ReactNode } from 'react';
import { TriangleTrig, type TriangleTrigProps } from '../../../math/triangle-trig/index.js';
import { type ProblemAsk } from '../../../math/interactive/index.js';

export default function TriangleTrigRuntime(a: Record<string, unknown>): ReactNode {
  const p = a as Partial<TriangleTrigProps>;
  const drive = (Array.isArray(p.drive) ? p.drive : ['angle']) as ('angle' | 'leg')[];
  return <TriangleTrig {...p} drive={drive} ask={a.ask as unknown as ProblemAsk} />;
}
