'use client';

import type { ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { withAuthoredObjectives, type AuthoredActivity } from '../../kit/activity-authoring.js';
import type { ControlConfig } from '../../kit/frame.js';
import { mechanicsActivity } from './activity-plan.js';

export interface MechanicsActivityProps {
  activity?: string | AuthoredActivity;
  activityId?: string;
  className?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  prompt?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  instruments: ReactNode;
  controls: ReactNode;
  feedback: ReactNode;
  objectives?: string[];
  transport?: ReactNode;
  footer?: ReactNode;
  controlConfig?: ControlConfig;
  canvasLabel?: string;
  inspectorLabel?: string;
}

/** Canonical authored composition for motion, force, energy, and work investigations. */
export function MechanicsActivity({
  activity,
  activityId,
  className,
  eyebrow = 'Mechanics',
  title,
  prompt,
  status,
  figure,
  instruments,
  controls,
  feedback,
  objectives,
  transport,
  footer,
  controlConfig,
}: MechanicsActivityProps): ReactNode {
  const authoredActivity = typeof activity === 'object' ? activity : mechanicsActivity;
  const resolvedId =
    typeof activity === 'string'
      ? activity
      : (activityId ?? className?.replace(/^physics-/, '') ?? 'mechanics-activity');
  return (
    <AuthoredActivityRuntime
      className={className}
      focusLayout="immersive"
      activity={withAuthoredObjectives(authoredActivity, objectives)}
      activityId={resolvedId}
      eyebrow={eyebrow}
      title={title}
      description={prompt}
      status={status}
      evidence={instruments}
      controls={
        <>
          {controls}
          {transport}
        </>
      }
      observation={feedback}
      transcript={footer}
      controlConfig={controlConfig}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
