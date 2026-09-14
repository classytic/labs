'use client';

import type { ReactNode } from 'react';
import { Chip } from '../../kit/controls.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { withAuthoredObjectives, type AuthoredActivity } from '../../kit/activity-authoring.js';
import { opticsActivity } from './activity-plan.js';

export interface OpticsActivityProps {
  activity?: string | AuthoredActivity;
  activityId: string;
  title: ReactNode;
  prompt?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  evidence: ReactNode;
  controls?: ReactNode;
  observation: ReactNode;
  transcript: ReactNode;
  support?: ReactNode;
  objectives?: string[];
  onReset?: () => void;
  eyebrow?: string;
  focusLayout?: 'compact' | 'standard' | 'immersive';
}

/** Canonical authored composition for geometric-optics investigations. */
export function OpticsActivity({
  activity,
  activityId,
  title,
  prompt,
  status,
  figure,
  evidence,
  controls,
  observation,
  transcript,
  support,
  objectives,
  onReset,
  eyebrow = 'Geometric optics',
  focusLayout = 'immersive',
}: OpticsActivityProps): ReactNode {
  const authoredActivity = typeof activity === 'object' ? activity : opticsActivity;
  const resolvedId = typeof activity === 'string' ? activity : activityId;
  return (
    <AuthoredActivityRuntime
      focusLayout={focusLayout}
      activity={withAuthoredObjectives(authoredActivity, objectives)}
      activityId={resolvedId}
      eyebrow={eyebrow}
      title={title}
      description={prompt}
      status={status}
      evidence={evidence}
      controls={
        <>
          {onReset ? (
            <Chip selected={false} onClick={onReset}>
              Reset
            </Chip>
          ) : null}
          {controls}
        </>
      }
      observation={observation}
      transcript={transcript}
      support={support}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
