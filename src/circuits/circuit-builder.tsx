'use client';

/**
 * Compatibility entry for the original single-loop builder.
 *
 * The actual runtime is the authorable circuit-network engine. Keeping this
 * adapter preserves existing imports while avoiding a second circuit solver,
 * schematic renderer, animation clock and control layout.
 */

import type { ReactNode } from 'react';
import type { AuthoredActivity } from '../kit/activity-authoring.js';
import { clamp, num } from '../core/util.js';
import { CircuitNetworkLab, type CircuitComponentSpec, type CircuitGoal } from './circuit/preset.js';

export type CircuitComponent = CircuitComponentSpec;

export interface CircuitBuilderProps {
  battery?: number | string;
  components?: CircuitComponent[];
  title?: string;
  height?: number;
  prompt?: string;
  goal?: CircuitGoal;
  activity?: string | AuthoredActivity;
}

const DEFAULT: CircuitComponent[] = [
  { type: 'switch', closed: false, label: 'switch' },
  { type: 'bulb', ohms: 12, label: 'bulb' },
];

export function CircuitBuilder({
  battery,
  components,
  title = 'Build a circuit',
  height = 320,
  prompt = 'Complete the path, tune the source, and explain how the current changes.',
  goal = { kind: 'lightBulb' },
  activity = 'circuit-builder',
}: CircuitBuilderProps = {}): ReactNode {
  const branch = components?.length ? components : DEFAULT;
  return (
    <CircuitNetworkLab
      title={title}
      prompt={prompt}
      emf={clamp(num(battery, 6), 1, 24)}
      emfRange={[1, 24, 1]}
      branches={[branch]}
      goal={goal}
      height={height}
      activity={activity}
    />
  );
}
