'use client';

/**
 * Ramp-forces runtime — adapter: the authored `controls` maps to the lab's `controlConfig`.
 *
 * Everything else is forwarded verbatim. It used to pass six props and drop `frictionKinetic`,
 * `appliedN`, `g`, `objectives` and `activity`, all of which the schema accepts and the lab
 * understands. Three lessons authored `frictionKinetic={0.4}` and `g={9.8}`, described that
 * scenario in their prose, and rendered a lab still on its defaults. Nothing reported it: the
 * schema was satisfied, the lab was correct, and only the seam between them was wrong.
 */
import type { ReactNode } from 'react';
import { RampForcesLab } from '../../../physics/ramp-forces/index.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';

export default function RampForces(a: Record<string, unknown>): ReactNode {
  return (
    <RampForcesLab
      angleDeg={a.angleDeg as number | undefined}
      mass={a.mass as number | undefined}
      friction={a.friction as number | undefined}
      frictionKinetic={a.frictionKinetic as number | undefined}
      appliedN={a.appliedN as number | undefined}
      g={a.g as number | undefined}
      showComponents={a.showComponents as boolean | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
      activity={a.activity as string | AuthoredActivity | undefined}
      controlConfig={a.controls as { hide?: string[]; lock?: string[] } | undefined}
    />
  );
}
